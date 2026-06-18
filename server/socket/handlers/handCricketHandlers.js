import {
  chooseHandCricketDecision,
  chooseHandCricketToss,
  joinHandCricketTeam,
  requestHandCricketTeamChange,
  selectHandCricketTeamPlayer,
  submitHandCricketNumber
} from "../../services/games/handCricketService.js";

export function registerHandCricketHandlers(socket, context, timers) {
  socket.on("hand-cricket-choose-toss", (payload, callback) => {
    try {
      const room = chooseHandCricketToss({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        choice: payload?.choice
      });

      context.emitRoomUpdate(room);
      timers.scheduleHandCricketMove(room);
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("hand-cricket-join-team", (payload, callback) => {
    try {
      const room = joinHandCricketTeam({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        team: payload?.team
      });

      context.emitRoomUpdate(room);
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("hand-cricket-pick-number", (payload, callback) => {
    try {
      const room = submitHandCricketNumber({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        number: payload?.number
      });
      const roomState = context.serializeRoomForSocket(room, socket);

      if (!context.emitGameEndedIfNeeded(room)) {
        context.emitRoomUpdate(room);
        timers.scheduleHandCricketMove(room);
      } else {
        timers.cancelHandCricketMove(room.roomCode);
      }

      context.callbackSuccess(callback, {
        room: roomState
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("hand-cricket-choose-decision", (payload, callback) => {
    try {
      const room = chooseHandCricketDecision({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        decision: payload?.decision
      });

      context.emitRoomUpdate(room);
      timers.scheduleHandCricketMove(room);
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
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

      context.emitRoomUpdate(room);
      timers.scheduleHandCricketMove(room);
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("hand-cricket-request-change", (payload, callback) => {
    try {
      const room = requestHandCricketTeamChange({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });

      context.emitRoomUpdate(room);
      timers.scheduleHandCricketMove(room);
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
