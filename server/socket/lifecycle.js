import {
  markPlayerDisconnected,
  removePlayer
} from "../services/roomService.js";

export function createRoomLifecycle(context, timers) {
  function leaveCurrentRoom(socket, { broadcastActiveRooms = true } = {}) {
    const result = removePlayer(socket.id);

    if (!result) {
      return null;
    }

    const roomCode = result.roomCode || result.room?.roomCode;
    socket.data.roomCode = null;
    socket.data.playerId = null;
    socket.leave(roomCode);
    timers.cancelDisconnectCleanup(roomCode, result.player?.playerId);

    if (result.deleted) {
      timers.cancelGameTimers(result.roomCode);
      if (broadcastActiveRooms) {
        context.emitActiveRooms();
      }
      return result;
    }

    context.emitRoomEvent(result.room, "player-left", {
      player: result.player
    });
    context.emitRoomUpdate(result.room);
    timers.scheduleBotTurn(result.room);
    timers.scheduleTimeoutDrivenGames(result.room);

    if (broadcastActiveRooms) {
      context.emitActiveRooms();
    }

    return result;
  }

  function handleDisconnect(socket) {
    const result = markPlayerDisconnected(socket.id);

    if (!result) {
      return;
    }

    timers.scheduleDisconnectCleanup(result.room.roomCode, result.player.playerId);
    context.emitRoomUpdate(result.room);
    timers.scheduleTimeoutDrivenGames(result.room);
  }

  return {
    handleDisconnect,
    leaveCurrentRoom
  };
}
