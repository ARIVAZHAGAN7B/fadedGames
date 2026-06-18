import {
  submitSpyWordClue,
  submitSpyWordGuess,
  submitSpyWordVote
} from "../../services/games/spyWordService.js";

export function registerSpyWordHandlers(socket, context) {
  socket.on("spy-word-submit-clue", (payload, callback) => {
    try {
      const result = submitSpyWordClue({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        clue: payload?.clue
      });

      context.emitRoomUpdate(result.room);
      context.callbackSuccess(callback, {
        clue: result.clue,
        room: context.serializeRoomForSocket(result.room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("spy-word-vote", (payload, callback) => {
    try {
      const result = submitSpyWordVote({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        suspectPlayerId: payload?.suspectPlayerId
      });

      if (!context.emitGameEndedIfNeeded(result.room)) {
        context.emitRoomUpdate(result.room);
      }

      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(result.room, socket),
        vote: result.vote
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("spy-word-submit-guess", (payload, callback) => {
    try {
      const result = submitSpyWordGuess({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        guess: payload?.guess
      });

      context.emitGameEndedIfNeeded(result.room);
      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(result.room, socket),
        spyGuess: result.spyGuess
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
