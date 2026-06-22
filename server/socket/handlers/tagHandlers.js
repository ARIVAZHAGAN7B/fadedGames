import { submitTagInput, tickTagRoom } from "../../services/games/tagService.js";

export function registerTagHandlers(socket, context) {
  socket.on("tag-input", (payload, callback) => {
    try {
      const room = submitTagInput({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        input: payload?.input
      });
      const result = tickTagRoom({ roomCode: room.roomCode });
      const updatedRoom = result.room;

      if (!context.emitGameEndedIfNeeded(updatedRoom)) {
        context.emitRoomUpdate(updatedRoom);
      }

      if (typeof callback === "function") {
        context.callbackSuccess(callback, {
          room: context.serializeRoomForSocket(updatedRoom, socket)
        });
      }
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
