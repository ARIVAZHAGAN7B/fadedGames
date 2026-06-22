import {
  callNumber,
  claimBingo
} from "../../services/games/bingoService.js";

function publicWinner(winner) {
  if (!winner || typeof winner !== "object") {
    return winner;
  }

  const { socketId, ...safeWinner } = winner;
  return safeWinner;
}

export function registerBingoHandlers(socket, context, timers) {
  socket.on("call-number", (payload, callback) => {
    try {
      const result = callNumber({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        number: payload?.number
      });
      const roomState = context.emitNumberCalled(result);
      timers.scheduleBotTurn(result.room);

      context.callbackSuccess(callback, {
        room: roomState
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("bingo-claimed", (payload, callback) => {
    try {
      const result = claimBingo({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });
      const roomState = context.serializeRoomForSocket(result.room, socket);

      if (!result.valid) {
        context.callbackSuccess(callback, {
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

      context.emitRoomEvent(result.room, "game-ended", {
        winner: result.winner
      });
      timers.cancelBotTurn(result.room.roomCode);
      context.emitActiveRooms();

      context.callbackSuccess(callback, {
        completedLines: result.completedLines,
        winner: publicWinner(result.winner),
        room: roomState,
        valid: true
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
