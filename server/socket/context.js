import { listActiveRooms, serializeRoom } from "../services/roomService.js";

const ACTIVE_ROOMS_BROADCAST_DELAY_MS = Number(
  process.env.ACTIVE_ROOMS_BROADCAST_DELAY_MS || 75
);

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
  let activeRoomsCache = [];
  let activeRoomsDirty = true;
  let activeRoomsBroadcastTimer = null;

  function getActiveRooms() {
    if (activeRoomsDirty) {
      activeRoomsCache = listActiveRooms();
      activeRoomsDirty = false;
    }

    return activeRoomsCache;
  }

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

  function emitActiveRoomsNow() {
    activeRoomsBroadcastTimer = null;
    io.volatile.emit("active-rooms", {
      rooms: getActiveRooms()
    });
  }

  function emitActiveRooms() {
    activeRoomsDirty = true;

    if (activeRoomsBroadcastTimer) {
      return;
    }

    if (ACTIVE_ROOMS_BROADCAST_DELAY_MS <= 0) {
      emitActiveRoomsNow();
      return;
    }

    activeRoomsBroadcastTimer = setTimeout(emitActiveRoomsNow, ACTIVE_ROOMS_BROADCAST_DELAY_MS);
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

    return roomState;
  }

  function sendInitialActiveRooms(socket) {
    socket.emit("active-rooms", {
      rooms: getActiveRooms()
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
    getActiveRooms,
    sendInitialActiveRooms,
    serializeRoom,
    serializeRoomForSocket
  };
}
