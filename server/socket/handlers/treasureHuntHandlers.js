import { selectTreasureHuntCell } from "../../services/games/treasureHuntService.js";

export function registerTreasureHuntHandlers(socket, context, timers) {
  socket.on("treasure-hunt:select-cell", (payload, callback) => {
    try {
      const result = selectTreasureHuntCell({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        row: payload?.row,
        col: payload?.col
      });

      const ended = context.emitGameEndedIfNeeded(result.room);

      context.emitRoomEvent(result.room, "treasure-hunt:cell-revealed", {
        cellType: result.cellType,
        message: result.message,
        player: result.player
      });

      if (!ended) {
        context.emitRoomUpdate(result.room);
        timers.scheduleTreasureHuntTimer(result.room);
        timers.scheduleTreasureHuntBotTurn(result.room);
      } else {
        timers.cancelTreasureHuntTimer(result.room.roomCode);
        timers.cancelTreasureHuntBotTurn(result.room.roomCode);
        context.emitActiveRooms();
      }

      context.callbackSuccess(callback, {
        room: context.serializeRoomForSocket(result.room, socket)
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
