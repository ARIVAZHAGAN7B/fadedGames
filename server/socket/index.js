import {
  addBot,
  callNumber,
  callBotNumber,
  claimBingo,
  cleanupDisconnectedPlayer,
  createRoom,
  chooseHandCricketDecision,
  chooseHandCricketToss,
  joinHandCricketTeam,
  joinRoom,
  listActiveRooms,
  markPlayerDisconnected,
  removePlayer,
  resumeSession,
  restartGame,
  resolveHandCricketMoveTimeout,
  resolveHandCricketReveal,
  serializeRoom,
  setPlayerBoard,
  startGame,
  submitHandCricketNumber,
  submitTagInput,
  tickTagRoom,
  updateRoomSettings
} from "../roomManager/index.js";

const DISCONNECT_GRACE_MS = 60_000;
const BOT_TURN_DELAY_MS = 900;
const disconnectTimers = new Map();
const botTurnTimers = new Map();
const handCricketMoveTimers = new Map();
const tagRoomLoops = new Map();

function timerKey(roomCode, playerId) {
  return `${roomCode}:${playerId}`;
}

function cancelDisconnectCleanup(roomCode, playerId) {
  const key = timerKey(roomCode, playerId);
  const timer = disconnectTimers.get(key);

  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

function scheduleDisconnectCleanup(io, roomCode, playerId) {
  cancelDisconnectCleanup(roomCode, playerId);

  const key = timerKey(roomCode, playerId);
  const timer = setTimeout(() => {
    disconnectTimers.delete(key);
    const result = cleanupDisconnectedPlayer({ roomCode, playerId });

    if (result && !result.deleted) {
      io.to(result.room.roomCode).emit("player-left", {
        player: result.player,
        room: serializeRoom(result.room)
      });
      emitRoomUpdate(io, result.room);
      emitActiveRooms(io);
    } else if (result?.deleted) {
      cancelBotTurn(roomCode);
      cancelHandCricketMove(roomCode);
      cancelTagLoop(roomCode);
      emitActiveRooms(io);
    }
  }, DISCONNECT_GRACE_MS);

  disconnectTimers.set(key, timer);
}

function callbackSuccess(callback, payload) {
  if (typeof callback === "function") {
    callback({ ok: true, ...payload });
  }
}

function callbackError(socket, callback, error) {
  const message = error instanceof Error ? error.message : "Something went wrong.";

  if (typeof callback === "function") {
    callback({ ok: false, error: message });
  } else {
    socket.emit("action-error", { error: message });
  }
}

function emitRoomUpdate(io, room) {
  io.to(room.roomCode).emit("room-updated", {
    room: serializeRoom(room)
  });
}

function emitActiveRooms(io) {
  io.emit("active-rooms", {
    rooms: listActiveRooms()
  });
}

function emitGameEndedIfNeeded(io, room) {
  if (!room.gameEnded) {
    return false;
  }

  io.to(room.roomCode).emit("game-ended", {
    winner: room.winner,
    room: serializeRoom(room)
  });
  emitActiveRooms(io);

  return true;
}

function cancelBotTurn(roomCode) {
  const timer = botTurnTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    botTurnTimers.delete(roomCode);
  }
}

function cancelHandCricketMove(roomCode) {
  const timer = handCricketMoveTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    handCricketMoveTimers.delete(roomCode);
  }
}

function cancelTagLoop(roomCode) {
  const loop = tagRoomLoops.get(roomCode);

  if (loop) {
    clearInterval(loop);
    tagRoomLoops.delete(roomCode);
  }
}

function scheduleTagLoop(io, room) {
  if (room.gameType !== "tag" || !room.gameStarted || room.gameEnded) {
    cancelTagLoop(room.roomCode);
    return;
  }

  if (tagRoomLoops.has(room.roomCode)) {
    return;
  }

  const roomCode = room.roomCode;
  const loop = setInterval(() => {
    try {
      const result = tickTagRoom({ roomCode });
      const roomState = serializeRoom(result.room);

      io.to(roomCode).emit("room-updated", {
        room: roomState
      });

      if (!result.active || result.room.gameEnded) {
        cancelTagLoop(roomCode);

        if (result.room.gameEnded) {
          io.to(roomCode).emit("game-ended", {
            winner: result.room.winner,
            room: roomState
          });
          emitActiveRooms(io);
        }
      }
    } catch {
      cancelTagLoop(roomCode);
    }
  }, 50);

  tagRoomLoops.set(roomCode, loop);
}

function emitNumberCalled(io, result) {
  const roomState = serializeRoom(result.room);

  io.to(result.room.roomCode).emit("number-called", {
    number: result.number,
    calledBy: result.calledBy,
    room: roomState
  });
  io.to(result.room.roomCode).emit("next-turn", {
    room: roomState
  });

  return roomState;
}

function scheduleHandCricketMove(io, room) {
  cancelHandCricketMove(room.roomCode);

  const state = room.handCricket;

  if (
    room.gameType !== "hand-cricket" ||
    !room.gameStarted ||
    room.gameEnded ||
    !state
  ) {
    return;
  }

  const roomCode = room.roomCode;
  const moveId = state.moveId;
  const isReveal = state.phase === "ball-reveal";
  const deadlineAt = isReveal ? state.revealDeadlineAt : state.moveDeadlineAt;

  if ((state.phase !== "innings" && !isReveal) || !deadlineAt) {
    return;
  }

  const delay = Math.max(0, deadlineAt - Date.now()) + 25;
  const timer = setTimeout(() => {
    handCricketMoveTimers.delete(roomCode);

    try {
      const result = isReveal
        ? resolveHandCricketReveal({ roomCode, moveId })
        : resolveHandCricketMoveTimeout({ roomCode, moveId });

      if (!result.changed) {
        scheduleHandCricketMove(io, result.room);
        return;
      }

      if (!emitGameEndedIfNeeded(io, result.room)) {
        emitRoomUpdate(io, result.room);
        scheduleHandCricketMove(io, result.room);
      } else {
        cancelHandCricketMove(roomCode);
      }
    } catch {
      cancelHandCricketMove(roomCode);
    }
  }, delay);

  handCricketMoveTimers.set(roomCode, timer);
}

function scheduleBotTurn(io, room) {
  cancelBotTurn(room.roomCode);

  if (!room.gameStarted || room.gameEnded) {
    return;
  }

  const currentPlayer = room.players[room.currentTurn];

  if (!currentPlayer?.isBot) {
    return;
  }

  const roomCode = room.roomCode;
  const playerId = currentPlayer.playerId;
  const timer = setTimeout(() => {
    botTurnTimers.delete(roomCode);

    try {
      const result = callBotNumber({ roomCode, playerId });
      emitNumberCalled(io, result);
      scheduleBotTurn(io, result.room);
    } catch {
      cancelBotTurn(roomCode);
    }
  }, BOT_TURN_DELAY_MS);

  botTurnTimers.set(roomCode, timer);
}

function leaveCurrentRoom(io, socket, { broadcastActiveRooms = true } = {}) {
  const result = removePlayer(socket.id);

  if (!result) {
    return null;
  }

  socket.data.roomCode = null;
  socket.data.playerId = null;
  socket.leave(result.roomCode || result.room?.roomCode);
  cancelDisconnectCleanup(result.roomCode || result.room?.roomCode, result.player?.playerId);

  if (result.deleted) {
    cancelBotTurn(result.roomCode);
    cancelHandCricketMove(result.roomCode);
    cancelTagLoop(result.roomCode);
    if (broadcastActiveRooms) {
      emitActiveRooms(io);
    }
    return result;
  }

  if (!result.deleted) {
    const payload = {
      player: result.player,
      room: serializeRoom(result.room)
    };

    io.to(result.room.roomCode).emit("player-left", payload);
    emitRoomUpdate(io, result.room);
    scheduleBotTurn(io, result.room);
  }

  if (broadcastActiveRooms) {
    emitActiveRooms(io);
  }

  return result;
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.emit("active-rooms", {
      rooms: listActiveRooms()
    });

    socket.on("list-active-rooms", (_payload, callback) => {
      callbackSuccess(callback, {
        rooms: listActiveRooms()
      });
    });

    socket.on("create-room", (payload, callback) => {
      try {
        leaveCurrentRoom(io, socket);

        const { room, player } = createRoom({
          socketId: socket.id,
          nickname: payload?.nickname,
          roomName: payload?.roomName,
          maxPlayers: payload?.maxPlayers,
          gameType: payload?.gameType,
          handCricketMode: payload?.handCricketMode,
          handCricketTeamSize: payload?.handCricketTeamSize,
          tagMapId: payload?.tagMapId,
          tagRoundSeconds: payload?.tagRoundSeconds
        });

        socket.data.roomCode = room.roomCode;
        socket.data.playerId = player.playerId;
        socket.join(room.roomCode);

        callbackSuccess(callback, {
          roomCode: room.roomCode,
          player,
          room: serializeRoom(room)
        });
        emitActiveRooms(io);
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("join-room", (payload, callback) => {
      try {
        leaveCurrentRoom(io, socket);

        const { room, player } = joinRoom({
          socketId: socket.id,
          nickname: payload?.nickname,
          roomCode: payload?.roomCode
        });

        socket.data.roomCode = room.roomCode;
        socket.data.playerId = player.playerId;
        socket.join(room.roomCode);

        const roomState = serializeRoom(room);
        socket.to(room.roomCode).emit("player-joined", {
          player,
          room: roomState
        });
        emitRoomUpdate(io, room);

        callbackSuccess(callback, {
          roomCode: room.roomCode,
          player,
          room: roomState
        });
        emitActiveRooms(io);
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("resume-session", (payload, callback) => {
      try {
        const { room, player, board } = resumeSession({
          socketId: socket.id,
          roomCode: payload?.roomCode,
          playerId: payload?.playerId
        });

        socket.data.roomCode = room.roomCode;
        socket.data.playerId = player.playerId;
        socket.join(room.roomCode);
        cancelDisconnectCleanup(room.roomCode, player.playerId);

        emitRoomUpdate(io, room);
        scheduleHandCricketMove(io, room);
        scheduleTagLoop(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          roomCode: room.roomCode,
          player,
          board,
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("add-bot", (payload, callback) => {
      try {
        const { room, player } = addBot({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode
        });
        const roomState = serializeRoom(room);

        io.to(room.roomCode).emit("player-joined", {
          player,
          room: roomState
        });
        emitRoomUpdate(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          player,
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("set-board", (payload, callback) => {
      try {
        const room = setPlayerBoard({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          board: payload?.board
        });

        emitRoomUpdate(io, room);
        emitActiveRooms(io);
        callbackSuccess(callback, {
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("update-room-settings", (payload, callback) => {
      try {
        const room = updateRoomSettings({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          roomName: payload?.roomName,
          maxPlayers: payload?.maxPlayers,
          handCricketTeamSize: payload?.handCricketTeamSize,
          tagMapId: payload?.tagMapId,
          tagRoundSeconds: payload?.tagRoundSeconds
        });

        emitRoomUpdate(io, room);
        emitActiveRooms(io);
        callbackSuccess(callback, {
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("hand-cricket-choose-toss", (payload, callback) => {
      try {
        const room = chooseHandCricketToss({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          choice: payload?.choice
        });

        emitRoomUpdate(io, room);
        callbackSuccess(callback, {
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("hand-cricket-join-team", (payload, callback) => {
      try {
        const room = joinHandCricketTeam({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          team: payload?.team
        });

        emitRoomUpdate(io, room);
        callbackSuccess(callback, {
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("hand-cricket-pick-number", (payload, callback) => {
      try {
        const room = submitHandCricketNumber({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          number: payload?.number
        });
        const roomState = serializeRoom(room);

        if (!emitGameEndedIfNeeded(io, room)) {
          emitRoomUpdate(io, room);
          scheduleHandCricketMove(io, room);
        } else {
          cancelHandCricketMove(room.roomCode);
        }

        callbackSuccess(callback, {
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("hand-cricket-choose-decision", (payload, callback) => {
      try {
        const room = chooseHandCricketDecision({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          decision: payload?.decision
        });

        emitRoomUpdate(io, room);
        scheduleHandCricketMove(io, room);
        callbackSuccess(callback, {
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("start-game", (payload, callback) => {
      try {
        const room = startGame({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode
        });

        io.to(room.roomCode).emit("start-game", {
          room: serializeRoom(room)
        });
        scheduleBotTurn(io, room);
        scheduleHandCricketMove(io, room);
        scheduleTagLoop(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          room: serializeRoom(room)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("call-number", (payload, callback) => {
      try {
        const result = callNumber({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          number: payload?.number
        });
        const roomState = emitNumberCalled(io, result);
        scheduleBotTurn(io, result.room);

        callbackSuccess(callback, {
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("tag-input", (payload, callback) => {
      try {
        const room = submitTagInput({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          input: payload?.input
        });

        if (typeof callback === "function") {
          callbackSuccess(callback, {
            room: serializeRoom(room)
          });
        }
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("bingo-claimed", (payload, callback) => {
      try {
        const result = claimBingo({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode
        });
        const roomState = serializeRoom(result.room);

        if (!result.valid) {
          callbackSuccess(callback, {
            completedLines: result.completedLines,
            room: roomState,
            valid: false
          });
          socket.emit("bingo-rejected", {
            completedLines: result.completedLines,
            room: roomState
          });
          return;
        }

        io.to(result.room.roomCode).emit("game-ended", {
          winner: result.winner,
          room: roomState
        });
        cancelBotTurn(result.room.roomCode);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          completedLines: result.completedLines,
          winner: result.winner,
          room: roomState,
          valid: true
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("restart-game", (payload, callback) => {
      try {
        const room = restartGame({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode
        });
        const roomState = serializeRoom(room);

        cancelBotTurn(room.roomCode);
        cancelHandCricketMove(room.roomCode);
        cancelTagLoop(room.roomCode);
        io.to(room.roomCode).emit("room-restarted", {
          room: roomState
        });
        emitRoomUpdate(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("leave-room", (_payload, callback) => {
      try {
        leaveCurrentRoom(io, socket);
        callbackSuccess(callback, {});
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("disconnect", () => {
      const result = markPlayerDisconnected(socket.id);

      if (result) {
        scheduleDisconnectCleanup(io, result.room.roomCode, result.player.playerId);
        emitRoomUpdate(io, result.room);
      }
    });
  });
}
