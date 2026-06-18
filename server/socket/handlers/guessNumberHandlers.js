import {
  setGuessNumberSecret,
  submitGuessNumberGuess
} from "../../services/games/guessNumberService.js";

export function registerGuessNumberHandlers(socket, context) {
  socket.on("guess-number-set-secret", (payload, callback) => {
    try {
      const room = setGuessNumberSecret({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        number: payload?.number
      });
      context.emitRoomUpdate(room);

      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("guess-number-submit-guess", (payload, callback) => {
    try {
      const result = submitGuessNumberGuess({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        number: payload?.number
      });
      const roomState = context.serializeRoomForSocket(result.room, socket);

      if (!context.emitGameEndedIfNeeded(result.room)) {
        context.emitRoomUpdate(result.room);
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
