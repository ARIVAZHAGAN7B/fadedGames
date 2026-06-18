import { submitTagInput } from "../../services/games/tagService.js";

export function registerTagHandlers(socket, context) {
  socket.on("tag-input", (payload, callback) => {
    try {
      const room = submitTagInput({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        input: payload?.input
      });

      if (typeof callback === "function") {
        context.callbackSuccess(callback, {
          room: context.serializeRoomForSocket(room, socket)
        });
      }
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
