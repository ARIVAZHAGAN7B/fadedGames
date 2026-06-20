import {
  getRoomChatMessages,
  sendRoomChatMessage
} from "../../services/roomService.js";

export function registerChatHandlers(socket, context) {
  socket.on("match-chat:history", (payload, callback) => {
    try {
      const result = getRoomChatMessages({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode
      });

      context.callbackSuccess(callback, {
        roomCode: result.room.roomCode,
        messages: result.messages
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });

  socket.on("match-chat:send", (payload, callback) => {
    try {
      const result = sendRoomChatMessage({
        socketId: socket.id,
        roomCode: payload?.roomCode || socket.data.roomCode,
        text: payload?.text
      });

      context.io.to(result.room.roomCode).emit("match-chat:message", {
        roomCode: result.room.roomCode,
        message: result.message
      });

      context.callbackSuccess(callback, {
        message: result.message
      });
    } catch (error) {
      context.callbackError(socket, callback, error);
    }
  });
}
