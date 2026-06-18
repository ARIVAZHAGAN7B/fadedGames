import {
  setWordGuessSecret,
  submitWordGuessGuess
} from "../../services/games/wordGuessService.js";

export function registerWordGuessHandlers(socket, context, timers) {
  socket.on("word-guess-set-secret", (payload, callback) => {
    try {
      const room = setWordGuessSecret({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        word: payload?.word
      });
      context.emitRoomUpdate(room);
      timers.scheduleWordGuessTimer(room);

      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("word-guess-submit-guess", (payload, callback) => {
    try {
      const result = submitWordGuessGuess({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        word: payload?.word
      });
      const roomState = context.serializeRoomForSocket(result.room, socket);

      if (!context.emitGameEndedIfNeeded(result.room)) {
        context.emitRoomUpdate(result.room);
        timers.scheduleWordGuessTimer(result.room);
      } else {
        timers.cancelWordGuessTimer(result.room.roomCode);
      }

      context.callbackSuccess(callback, {
        guess: result.guess,
        room: roomState
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
