import { listActiveRooms, serializeRoom } from "../services/roomService.js";

export function callbackSuccess(callback, payload) {
  if (typeof callback === "function") {
    callback({ ok: true, ...payload });
  }
}

export function callbackError(socket, callback, error) {
  const message = error instanceof Error ? error.message : "Something went wrong.";

  if (typeof callback === "function") {
    callback({ ok: false, error: message });
  } else {
    socket.emit("action-error", { error: message });
  }
}

export function createSocketContext(io) {
  function serializeRoomForSocket(room, socket) {
    return serializeRoom(room, socket?.data?.playerId || null);
  }

  function emitRoomEvent(room, event, payload = {}) {
    for (const player of room.players) {
      if (!player.socketId) {
        continue;
      }

      io.to(player.socketId).emit(event, {
        ...payload,
        room: serializeRoom(room, player.playerId)
      });
    }
  }

  function emitRoomUpdate(room) {
    emitRoomEvent(room, "room-updated");
  }

  function emitActiveRooms() {
    io.emit("active-rooms", {
      rooms: listActiveRooms()
    });
  }

  function emitGameEndedIfNeeded(room) {
    if (!room.gameEnded) {
      return false;
    }

    emitRoomEvent(room, "game-ended", {
      winner: room.winner
    });
    emitActiveRooms();

    return true;
  }

  function emitNumberCalled(result) {
    const roomState = serializeRoom(result.room);

    io.to(result.room.roomCode).emit("number-called", {
      number: result.number,
      calledBy: result.calledBy,
      room: roomState
    });
    io.to(result.room.roomCode).emit("next-turn", {
      room: roomState
    });

    return roomState;
  }

  function sendInitialActiveRooms(socket) {
    socket.emit("active-rooms", {
      rooms: listActiveRooms()
    });
  }

  return {
    io,
    callbackError,
    callbackSuccess,
    emitActiveRooms,
    emitGameEndedIfNeeded,
    emitNumberCalled,
    emitRoomEvent,
    emitRoomUpdate,
    sendInitialActiveRooms,
    serializeRoom,
    serializeRoomForSocket
  };
}
