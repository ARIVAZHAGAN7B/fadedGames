import {
  addBot,
  callNumber,
  callBotNumber,
  claimBoost,
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
  requestHandCricketTeamChange,
  resumeSession,
  restartGame,
  resolveHandCricketCountdown,
  resolveHandCricketDecisionTimeout,
  resolveHandCricketMoveTimeout,
  resolveHandCricketReveal,
  resolveHandCricketTeamSelectionTimeout,
  resolveHandCricketTossTimeout,
  resolveBoostRoundTimeout,
  resolveRajaRaniReveal,
  resolveRajaRaniTurnsTimer,
  resolveWordGuessTimeout,
  selectTreasureHuntCell,
  serializeRoom,
  selectHandCricketTeamPlayer,
  setGuessNumberSecret,
  setPlayerBoard,
  setWordGuessSecret,
  submitBoostBotSelections,
  submitBoostSelection,
  startGame,
  submitHandCricketNumber,
  submitGuessNumberGuess,
  submitRajaRaniGuess,
  submitRajaRaniTurnsSelection,
  submitSpyWordClue,
  submitSpyWordGuess,
  submitSpyWordVote,
  submitTagInput,
  submitWordGuessGuess,
  tickTagRoom,
  updateRoomSettings
} from "../roomManager/index.js";

const DISCONNECT_GRACE_MS = 60_000;
const BOT_TURN_DELAY_MS = 900;
const BOOST_BOT_DELAY_MS = 900;
const TAG_LOOP_INTERVAL_MS = 1000 / 60;
const disconnectTimers = new Map();
const botTurnTimers = new Map();
const handCricketMoveTimers = new Map();
const tagRoomLoops = new Map();
const wordGuessTimers = new Map();
const boostRoundTimers = new Map();
const boostBotTimers = new Map();
const rajaRaniRevealTimers = new Map();
const rajaRaniTurnsTimers = new Map();

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
      emitRoomEvent(io, result.room, "player-left", {
        player: result.player
      });
      emitRoomUpdate(io, result.room);
      scheduleWordGuessTimer(io, result.room);
      scheduleBoostRound(io, result.room);
      scheduleBoostBotTurn(io, result.room);
      scheduleRajaRaniReveal(io, result.room);
      scheduleRajaRaniTurnsTimer(io, result.room);
      emitActiveRooms(io);
    } else if (result?.deleted) {
      cancelBotTurn(roomCode);
      cancelHandCricketMove(roomCode);
      cancelTagLoop(roomCode);
      cancelWordGuessTimer(roomCode);
      cancelBoostRound(roomCode);
      cancelBoostBotTurn(roomCode);
      cancelRajaRaniReveal(roomCode);
      cancelRajaRaniTurnsTimer(roomCode);
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

function serializeRoomForSocket(room, socket) {
  return serializeRoom(room, socket?.data?.playerId || null);
}

function emitRoomEvent(io, room, event, payload = {}) {
  for (const player of room.players) {
    if (!player.socketId) {
      continue;
    }

    io.to(player.socketId).emit(event, {
      ...payload,
      room: serializeRoom(room, player.playerId)
    });
  }
}

function emitRoomUpdate(io, room) {
  emitRoomEvent(io, room, "room-updated");
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

  emitRoomEvent(io, room, "game-ended", {
    winner: room.winner,
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

function cancelWordGuessTimer(roomCode) {
  const timer = wordGuessTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    wordGuessTimers.delete(roomCode);
  }
}

function cancelBoostRound(roomCode) {
  const timer = boostRoundTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    boostRoundTimers.delete(roomCode);
  }
}

function cancelBoostBotTurn(roomCode) {
  const timer = boostBotTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    boostBotTimers.delete(roomCode);
  }
}

function cancelRajaRaniReveal(roomCode) {
  const timer = rajaRaniRevealTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    rajaRaniRevealTimers.delete(roomCode);
  }
}

function cancelRajaRaniTurnsTimer(roomCode) {
  const timer = rajaRaniTurnsTimers.get(roomCode);

  if (timer) {
    clearTimeout(timer);
    rajaRaniTurnsTimers.delete(roomCode);
  }
}

function scheduleWordGuessTimer(io, room) {
  cancelWordGuessTimer(room.roomCode);

  const state = room.wordGuess;

  if (
    room.gameType !== "word-guess" ||
    !room.gameStarted ||
    room.gameEnded ||
    !state
  ) {
    return;
  }

  const deadlineAt =
    state.phase === "locked"
      ? state.lockDeadlineAt
      : state.phase === "guessing"
        ? state.roundDeadlineAt
        : null;

  if (!deadlineAt) {
    return;
  }

  const roomCode = room.roomCode;
  const moveId = state.moveId;
  const delay = Math.max(0, deadlineAt - Date.now()) + 25;
  const timer = setTimeout(() => {
    wordGuessTimers.delete(roomCode);

    try {
      const result = resolveWordGuessTimeout({ roomCode, moveId });

      if (!result.changed) {
        scheduleWordGuessTimer(io, result.room);
        return;
      }

      if (!emitGameEndedIfNeeded(io, result.room)) {
        emitRoomUpdate(io, result.room);
        scheduleWordGuessTimer(io, result.room);
      } else {
        cancelWordGuessTimer(roomCode);
      }
    } catch {
      cancelWordGuessTimer(roomCode);
    }
  }, delay);

  wordGuessTimers.set(roomCode, timer);
}

function scheduleBoostRound(io, room) {
  cancelBoostRound(room.roomCode);

  const state = room.boost;

  if (
    room.gameType !== "boost" ||
    !room.gameStarted ||
    room.gameEnded ||
    !state
  ) {
    cancelBoostBotTurn(room.roomCode);
    return;
  }

  const deadlineAt =
    state.phase === "selecting"
      ? state.selectDeadlineAt
      : null;

  if (!deadlineAt) {
    return;
  }

  const roomCode = room.roomCode;
  const moveId = state.moveId;
  const delay = Math.max(0, deadlineAt - Date.now()) + 25;
  const timer = setTimeout(() => {
    boostRoundTimers.delete(roomCode);

    try {
      const result = resolveBoostRoundTimeout({ roomCode, moveId });

      if (!result.changed) {
        scheduleBoostRound(io, result.room);
        scheduleBoostBotTurn(io, result.room);
        return;
      }

      if (!emitGameEndedIfNeeded(io, result.room)) {
        emitRoomUpdate(io, result.room);
        scheduleBoostRound(io, result.room);
        scheduleBoostBotTurn(io, result.room);
      } else {
        cancelBoostRound(roomCode);
        cancelBoostBotTurn(roomCode);
      }
    } catch {
      cancelBoostRound(roomCode);
      cancelBoostBotTurn(roomCode);
    }
  }, delay);

  boostRoundTimers.set(roomCode, timer);
}

function scheduleBoostBotTurn(io, room) {
  cancelBoostBotTurn(room.roomCode);

  const state = room.boost;

  if (
    room.gameType !== "boost" ||
    !room.gameStarted ||
    room.gameEnded ||
    state?.phase !== "selecting"
  ) {
    return;
  }

  const activePlayer = room.players[state.currentTurnIndex] || null;

  if (!activePlayer?.isBot) {
    return;
  }

  const roomCode = room.roomCode;
  const timer = setTimeout(() => {
    boostBotTimers.delete(roomCode);

    try {
      const result = submitBoostBotSelections({ roomCode });

      if (result.selectedCount > 0) {
        if (!emitGameEndedIfNeeded(io, result.room)) {
          emitRoomUpdate(io, result.room);
          scheduleBoostRound(io, result.room);
          scheduleBoostBotTurn(io, result.room);
        } else {
          cancelBoostRound(roomCode);
        }
      }
    } catch {
      cancelBoostBotTurn(roomCode);
    }
  }, BOOST_BOT_DELAY_MS);

  boostBotTimers.set(roomCode, timer);
}

function scheduleRajaRaniReveal(io, room) {
  cancelRajaRaniReveal(room.roomCode);

  const state = room.rajaRani;

  if (
    room.gameType !== "raja-rani" ||
    !room.gameStarted ||
    room.gameEnded ||
    state?.phase !== "reveal" ||
    !state.revealDeadlineAt
  ) {
    return;
  }

  const roomCode = room.roomCode;
  const moveId = state.moveId;
  const delay = Math.max(0, state.revealDeadlineAt - Date.now()) + 25;
  const timer = setTimeout(() => {
    rajaRaniRevealTimers.delete(roomCode);

    try {
      const result = resolveRajaRaniReveal({ roomCode, moveId });

      if (!result.changed) {
        scheduleRajaRaniReveal(io, result.room);
        return;
      }

      if (!emitGameEndedIfNeeded(io, result.room)) {
        emitRoomUpdate(io, result.room);
        scheduleRajaRaniReveal(io, result.room);
      } else {
        cancelRajaRaniReveal(roomCode);
      }
    } catch {
      cancelRajaRaniReveal(roomCode);
    }
  }, delay);

  rajaRaniRevealTimers.set(roomCode, timer);
}

function scheduleRajaRaniTurnsTimer(io, room) {
  cancelRajaRaniTurnsTimer(room.roomCode);

  const state = room.rajaRaniTurns;

  if (
    room.gameType !== "raja-rani-turns" ||
    !room.gameStarted ||
    room.gameEnded ||
    !state
  ) {
    return;
  }

  const deadlineAt =
    state.phase === "turn"
      ? state.turnDeadlineAt
      : state.phase === "reveal"
        ? state.revealDeadlineAt
        : null;

  if (!deadlineAt) {
    return;
  }

  const roomCode = room.roomCode;
  const moveId = state.moveId;
  const delay = Math.max(0, deadlineAt - Date.now()) + 25;
  const timer = setTimeout(() => {
    rajaRaniTurnsTimers.delete(roomCode);

    try {
      const result = resolveRajaRaniTurnsTimer({ roomCode, moveId });

      if (!result.changed) {
        scheduleRajaRaniTurnsTimer(io, result.room);
        return;
      }

      if (!emitGameEndedIfNeeded(io, result.room)) {
        emitRoomUpdate(io, result.room);
        scheduleRajaRaniTurnsTimer(io, result.room);
      } else {
        cancelRajaRaniTurnsTimer(roomCode);
      }
    } catch {
      cancelRajaRaniTurnsTimer(roomCode);
    }
  }, delay);

  rajaRaniTurnsTimers.set(roomCode, timer);
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
  }, TAG_LOOP_INTERVAL_MS);

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
  const isToss = state.phase === "toss-throw";
  const isDecision = state.phase === "decision";
  const isSelection = state.phase === "player-selection";
  const isCountdown = state.phase === "countdown";
  const isReveal = state.phase === "ball-reveal";
  const deadlineAt = isToss
    ? state.tossDeadlineAt
    : isDecision
      ? state.decisionDeadlineAt
      : isSelection
        ? state.teamSelectionDeadlineAt
        : isCountdown
          ? state.countdownDeadlineAt
          : isReveal
            ? state.revealDeadlineAt
            : state.moveDeadlineAt;

  if (
    state.phase !== "innings" &&
    !isReveal &&
    !isCountdown &&
    !isToss &&
    !isDecision &&
    !isSelection
  ) {
    return;
  }

  if (!deadlineAt) {
    return;
  }

  const delay = Math.max(0, deadlineAt - Date.now()) + 25;
  const timer = setTimeout(() => {
    handCricketMoveTimers.delete(roomCode);

    try {
      const result = isCountdown
        ? resolveHandCricketCountdown({ roomCode, moveId })
        : isReveal
          ? resolveHandCricketReveal({ roomCode, moveId })
          : isToss
            ? resolveHandCricketTossTimeout({ roomCode, moveId })
            : isDecision
              ? resolveHandCricketDecisionTimeout({ roomCode, moveId })
              : isSelection
                ? resolveHandCricketTeamSelectionTimeout({ roomCode, moveId })
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
    cancelWordGuessTimer(result.roomCode);
    cancelBoostRound(result.roomCode);
    cancelBoostBotTurn(result.roomCode);
    cancelRajaRaniReveal(result.roomCode);
    cancelRajaRaniTurnsTimer(result.roomCode);
    if (broadcastActiveRooms) {
      emitActiveRooms(io);
    }
    return result;
  }

  if (!result.deleted) {
    emitRoomEvent(io, result.room, "player-left", {
      player: result.player
    });
    emitRoomUpdate(io, result.room);
    scheduleBotTurn(io, result.room);
    scheduleWordGuessTimer(io, result.room);
    scheduleBoostRound(io, result.room);
    scheduleBoostBotTurn(io, result.room);
    scheduleRajaRaniReveal(io, result.room);
    scheduleRajaRaniTurnsTimer(io, result.room);
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
          tagRoundSeconds: payload?.tagRoundSeconds,
          spyWordDifficulty: payload?.spyWordDifficulty,
          boostCategoryLabels: payload?.boostCategoryLabels
        });

        socket.data.roomCode = room.roomCode;
        socket.data.playerId = player.playerId;
        socket.join(room.roomCode);

        callbackSuccess(callback, {
          roomCode: room.roomCode,
          player,
          room: serializeRoomForSocket(room, socket)
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

        emitRoomEvent(io, room, "player-joined", {
          player
        });
        emitRoomUpdate(io, room);

        callbackSuccess(callback, {
          roomCode: room.roomCode,
          player,
          room: serializeRoomForSocket(room, socket)
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
        scheduleWordGuessTimer(io, room);
        scheduleBoostRound(io, room);
        scheduleBoostBotTurn(io, room);
        scheduleRajaRaniReveal(io, room);
        scheduleRajaRaniTurnsTimer(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          roomCode: room.roomCode,
          player,
          board,
          room: serializeRoomForSocket(room, socket)
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
        emitRoomEvent(io, room, "player-joined", {
          player
        });
        emitRoomUpdate(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          player,
          room: serializeRoomForSocket(room, socket)
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
          room: serializeRoomForSocket(room, socket)
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
          tagRoundSeconds: payload?.tagRoundSeconds,
          spyWordDifficulty: payload?.spyWordDifficulty,
          boostCategoryLabels: payload?.boostCategoryLabels
        });

        emitRoomUpdate(io, room);
        emitActiveRooms(io);
        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
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
        scheduleHandCricketMove(io, room);
        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
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
          room: serializeRoomForSocket(room, socket)
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
        const roomState = serializeRoomForSocket(room, socket);

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
          room: serializeRoomForSocket(room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("hand-cricket-select-player", (payload, callback) => {
      try {
        const room = selectHandCricketTeamPlayer({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          playerId: payload?.playerId,
          ready: payload?.ready
        });

        emitRoomUpdate(io, room);
        scheduleHandCricketMove(io, room);
        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("hand-cricket-request-change", (payload, callback) => {
      try {
        const room = requestHandCricketTeamChange({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode
        });

        emitRoomUpdate(io, room);
        scheduleHandCricketMove(io, room);
        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
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

        emitRoomEvent(io, room, "start-game");
        scheduleBotTurn(io, room);
        scheduleHandCricketMove(io, room);
        scheduleTagLoop(io, room);
        scheduleWordGuessTimer(io, room);
        scheduleBoostRound(io, room);
        scheduleBoostBotTurn(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
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

    socket.on("boost-select-card", (payload, callback) => {
      try {
        const room = submitBoostSelection({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          cardId: payload?.cardId
        });

        if (!emitGameEndedIfNeeded(io, room)) {
          emitRoomUpdate(io, room);
          scheduleBoostRound(io, room);
          scheduleBoostBotTurn(io, room);
        } else {
          cancelBoostRound(room.roomCode);
          cancelBoostBotTurn(room.roomCode);
        }

        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("boost-claim", (payload, callback) => {
      try {
        const result = claimBoost({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode
        });

        if (result.valid) {
          emitRoomEvent(io, result.room, "game-ended", {
            winner: result.winner
          });
          cancelBoostRound(result.room.roomCode);
          cancelBoostBotTurn(result.room.roomCode);
          emitActiveRooms(io);
        } else {
          emitRoomUpdate(io, result.room);
        }

        callbackSuccess(callback, {
          cooldownMs: result.cooldownMs,
          room: serializeRoomForSocket(result.room, socket),
          valid: result.valid,
          winner: result.winner
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("raja-rani-guess", (payload, callback) => {
      try {
        const result = submitRajaRaniGuess({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          suspectPlayerId: payload?.suspectPlayerId
        });

        emitRoomUpdate(io, result.room);
        scheduleRajaRaniReveal(io, result.room);

        callbackSuccess(callback, {
          guess: result.guess,
          room: serializeRoomForSocket(result.room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("raja-rani-turns-select", (payload, callback) => {
      try {
        const result = submitRajaRaniTurnsSelection({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          suspectPlayerId: payload?.suspectPlayerId
        });

        if (!emitGameEndedIfNeeded(io, result.room)) {
          emitRoomUpdate(io, result.room);
          scheduleRajaRaniTurnsTimer(io, result.room);
        } else {
          cancelRajaRaniTurnsTimer(result.room.roomCode);
        }

        callbackSuccess(callback, {
          action: result.action,
          room: serializeRoomForSocket(result.room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("guess-number-set-secret", (payload, callback) => {
      try {
        const room = setGuessNumberSecret({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          number: payload?.number
        });
        emitRoomUpdate(io, room);

        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("guess-number-submit-guess", (payload, callback) => {
      try {
        const result = submitGuessNumberGuess({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          number: payload?.number
        });
        const roomState = serializeRoomForSocket(result.room, socket);

        if (!emitGameEndedIfNeeded(io, result.room)) {
          emitRoomUpdate(io, result.room);
        }

        callbackSuccess(callback, {
          guess: result.guess,
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("word-guess-set-secret", (payload, callback) => {
      try {
        const room = setWordGuessSecret({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          word: payload?.word
        });
        emitRoomUpdate(io, room);
        scheduleWordGuessTimer(io, room);

        callbackSuccess(callback, {
          room: serializeRoomForSocket(room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("word-guess-submit-guess", (payload, callback) => {
      try {
        const result = submitWordGuessGuess({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          word: payload?.word
        });
        const roomState = serializeRoomForSocket(result.room, socket);

        if (!emitGameEndedIfNeeded(io, result.room)) {
          emitRoomUpdate(io, result.room);
          scheduleWordGuessTimer(io, result.room);
        } else {
          cancelWordGuessTimer(result.room.roomCode);
        }

        callbackSuccess(callback, {
          guess: result.guess,
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("spy-word-submit-clue", (payload, callback) => {
      try {
        const result = submitSpyWordClue({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          clue: payload?.clue
        });

        emitRoomUpdate(io, result.room);
        callbackSuccess(callback, {
          clue: result.clue,
          room: serializeRoomForSocket(result.room, socket)
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("spy-word-vote", (payload, callback) => {
      try {
        const result = submitSpyWordVote({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          suspectPlayerId: payload?.suspectPlayerId
        });

        if (!emitGameEndedIfNeeded(io, result.room)) {
          emitRoomUpdate(io, result.room);
        }

        callbackSuccess(callback, {
          room: serializeRoomForSocket(result.room, socket),
          vote: result.vote
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("spy-word-submit-guess", (payload, callback) => {
      try {
        const result = submitSpyWordGuess({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          guess: payload?.guess
        });

        emitGameEndedIfNeeded(io, result.room);
        callbackSuccess(callback, {
          room: serializeRoomForSocket(result.room, socket),
          spyGuess: result.spyGuess
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
            room: serializeRoomForSocket(room, socket)
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
        const roomState = serializeRoomForSocket(result.room, socket);

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

        emitRoomEvent(io, result.room, "game-ended", {
          winner: result.winner,
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
        const roomState = serializeRoomForSocket(room, socket);

        cancelBotTurn(room.roomCode);
        cancelHandCricketMove(room.roomCode);
        cancelTagLoop(room.roomCode);
        cancelWordGuessTimer(room.roomCode);
        cancelBoostRound(room.roomCode);
        cancelBoostBotTurn(room.roomCode);
        cancelRajaRaniReveal(room.roomCode);
        cancelRajaRaniTurnsTimer(room.roomCode);
        emitRoomEvent(io, room, "room-restarted");
        emitRoomUpdate(io, room);
        emitActiveRooms(io);

        callbackSuccess(callback, {
          room: roomState
        });
      } catch (error) {
        callbackError(socket, callback, error);
      }
    });

    socket.on("treasure-hunt:select-cell", (payload, callback) => {
      try {
        const result = selectTreasureHuntCell({
          socketId: socket.id,
          roomCode: payload?.roomCode || socket.data.roomCode,
          row: payload?.row,
          col: payload?.col
        });

        if (!emitGameEndedIfNeeded(io, result.room)) {
          emitRoomUpdate(io, result.room);
          emitRoomEvent(io, result.room, "treasure-hunt:state-update", result.room.treasureHunt);
          emitRoomEvent(io, result.room, "treasure-hunt:cell-revealed", {
            cellType: result.cellType,
            message: result.message
          });
        } else {
          emitActiveRooms(io);
        }

        callbackSuccess(callback, {
          room: serializeRoomForSocket(result.room, socket)
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
        scheduleWordGuessTimer(io, result.room);
        scheduleBoostRound(io, result.room);
        scheduleBoostBotTurn(io, result.room);
        scheduleRajaRaniReveal(io, result.room);
        scheduleRajaRaniTurnsTimer(io, result.room);
      }
    });
  });
}
