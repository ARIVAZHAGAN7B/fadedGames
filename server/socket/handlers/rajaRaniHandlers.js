import {
  submitRajaRaniGuess,
  submitRajaRaniCardPick,
  submitRajaRaniTurnsCardPick,
  submitRajaRaniTurnsSelection
} from "../../services/games/rajaRaniService.js";

export function registerRajaRaniHandlers(socket, context, timers) {
  const handleThirudanPolicePickCard = (payload, callback) => {
    try {
      const result = submitRajaRaniCardPick({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        cardId: payload?.cardId
      });

      context.emitRoomUpdate(result.room);
      context.callbackSuccess(callback, {
        pick: result.pick,
        room: context.serializeRoomForSocket(result.room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  };

  const handleThirudanPoliceGuess = (payload, callback) => {
    try {
      const result = submitRajaRaniGuess({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        suspectPlayerId: payload?.suspectPlayerId
      });

      context.emitRoomUpdate(result.room);
      timers.scheduleRajaRaniReveal(result.room);

      context.callbackSuccess(callback, {
        guess: result.guess,
        room: context.serializeRoomForSocket(result.room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  };

  socket.on("thirudan-police-pick-card", handleThirudanPolicePickCard);
  socket.on("raja-rani-pick-card", handleThirudanPolicePickCard);
  socket.on("thirudan-police-guess", handleThirudanPoliceGuess);
  socket.on("raja-rani-guess", handleThirudanPoliceGuess);

  socket.on("raja-rani-turns-pick-card", (payload, callback) => {
    try {
      const result = submitRajaRaniTurnsCardPick({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        cardId: payload?.cardId
      });

      context.emitRoomUpdate(result.room);
      timers.scheduleRajaRaniTurnsTimer(result.room);
      context.callbackSuccess(callback, {
        pick: result.pick,
        room: context.serializeRoomForSocket(result.room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("raja-rani-turns-select", (payload, callback) => {
    try {
      const result = submitRajaRaniTurnsSelection({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        suspectPlayerId: payload?.suspectPlayerId
      });

      if (!context.emitGameEndedIfNeeded(result.room)) {
        context.emitRoomUpdate(result.room);
        timers.scheduleRajaRaniTurnsTimer(result.room);
      } else {
        timers.cancelRajaRaniTurnsTimer(result.room.roomCode);
      }

      context.callbackSuccess(callback, {
        action: result.action,
        room: context.serializeRoomForSocket(result.room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
