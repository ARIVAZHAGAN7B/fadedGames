import {
  addBot,
  createRoom,
  joinRoom,
  restartGame,
  resumeSession,
  setPlayerBoard,
  startGame,
  updateRoomSettings
} from "../../services/roomService.js";

export function registerRoomHandlers(socket, context, timers, lifecycle) {
  socket.on("list-active-rooms", (_payload, callback) => {
    context.callbackSuccess(callback, {
      rooms: context.getActiveRooms()
    });
  });

  socket.on("create-room", (payload, callback) => {
    try {
      lifecycle.leaveCurrentRoom(socket);

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

      context.callbackSuccess(callback, {
        roomCode: room.roomCode,
        player,
        room: context.serializeRoomForSocket(room, socket)
      });
      context.emitActiveRooms();
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("join-room", (payload, callback) => {
    try {
      lifecycle.leaveCurrentRoom(socket);

      const { room, player } = joinRoom({
        socketId: socket.id,
        nickname: payload?.nickname,
        roomCode: payload?.roomCode
      });

      socket.data.roomCode = room.roomCode;
      socket.data.playerId = player.playerId;
      socket.join(room.roomCode);

      context.emitRoomEvent(room, "player-joined", {
        player
      });
      context.emitRoomUpdate(room);

      context.callbackSuccess(callback, {
        roomCode: room.roomCode,
        player,
        room: context.serializeRoomForSocket(room, socket)
      });
      context.emitActiveRooms();
    } catch (error) {
      context.callbackError(socket, callback, error);
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
      timers.cancelDisconnectCleanup(room.roomCode, player.playerId);

      context.emitRoomUpdate(room);
      timers.scheduleHandCricketMove(room);
      timers.scheduleTagLoop(room);
      timers.scheduleTimeoutDrivenGames(room);
      context.emitActiveRooms();

      context.callbackSuccess(callback, {
        roomCode: room.roomCode,
        player,
        board,
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("add-bot", (payload, callback) => {
    try {
      const { room, player } = addBot({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });
      context.emitRoomEvent(room, "player-joined", {
        player
      });
      context.emitRoomUpdate(room);
      context.emitActiveRooms();

      context.callbackSuccess(callback, {
        player,
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("set-board", (payload, callback) => {
    try {
      const room = setPlayerBoard({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        board: payload?.board
      });

      context.emitRoomUpdate(room);
      context.emitActiveRooms();
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
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

      context.emitRoomUpdate(room);
      context.emitActiveRooms();
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("start-game", (payload, callback) => {
    try {
      const room = startGame({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });

      context.emitRoomEvent(room, "start-game");
      timers.scheduleGameStart(room);
      context.emitActiveRooms();

      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("restart-game", (payload, callback) => {
    try {
      const room = restartGame({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });
      const roomState = context.serializeRoomForSocket(room, socket);

      timers.cancelGameTimers(room.roomCode);
      context.emitRoomEvent(room, "room-restarted");
      context.emitRoomUpdate(room);
      context.emitActiveRooms();

      context.callbackSuccess(callback, {
        room: roomState
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("leave-room", (_payload, callback) => {
    try {
      lifecycle.leaveCurrentRoom(socket);
      context.callbackSuccess(callback, {});
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("disconnect", () => {
    lifecycle.handleDisconnect(socket);
  });
}
