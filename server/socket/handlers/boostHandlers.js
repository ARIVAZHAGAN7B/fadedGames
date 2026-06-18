import {
  claimBoost,
  submitBoostSelection
} from "../../services/games/boostService.js";

export function registerBoostHandlers(socket, context, timers) {
  socket.on("boost-select-card", (payload, callback) => {
    try {
      const room = submitBoostSelection({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        cardId: payload?.cardId
      });

      if (!context.emitGameEndedIfNeeded(room)) {
        context.emitRoomUpdate(room);
        timers.scheduleBoostRound(room);
        timers.scheduleBoostBotTurn(room);
      } else {
        timers.cancelBoostRound(room.roomCode);
        timers.cancelBoostBotTurn(room.roomCode);
      }

      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("boost-claim", (payload, callback) => {
    try {
      const result = claimBoost({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });

      if (result.valid) {
        context.emitRoomEvent(result.room, "game-ended", {
          winner: result.winner
        });
        timers.cancelBoostRound(result.room.roomCode);
        timers.cancelBoostBotTurn(result.room.roomCode);
        context.emitActiveRooms();
      } else {
        context.emitRoomUpdate(result.room);
      }

      context.callbackSuccess(callback, {
        cooldownMs: result.cooldownMs,
        room: context.serializeRoomForSocket(result.room, socket),
        valid: result.valid,
        winner: result.winner
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
