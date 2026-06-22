import { createSocketContext } from "./context.js";
import { createRoomLifecycle } from "./lifecycle.js";
import { createSocketTimers } from "./timers.js";
import { registerBingoHandlers } from "./handlers/bingoHandlers.js";
import { registerBoostHandlers } from "./handlers/boostHandlers.js";
import { registerChatHandlers } from "./handlers/chatHandlers.js";
import { registerGuessNumberHandlers } from "./handlers/guessNumberHandlers.js";
import { registerHandCricketHandlers } from "./handlers/handCricketHandlers.js";
import { registerRajaRaniHandlers } from "./handlers/rajaRaniHandlers.js";
import { registerRoomHandlers } from "./handlers/roomHandlers.js";
import { registerSpyWordHandlers } from "./handlers/spyWordHandlers.js";
import { registerTagHandlers } from "./handlers/tagHandlers.js";
import { registerTreasureHuntHandlers } from "./handlers/treasureHuntHandlers.js";
import { registerWordGuessHandlers } from "./handlers/wordGuessHandlers.js";
import { createSocketRateLimiter } from "../security/rateLimit.js";

const socketHandlerRegistrars = [
  registerRoomHandlers,
  registerChatHandlers,
  registerBingoHandlers,
  registerHandCricketHandlers,
  registerBoostHandlers,
  registerRajaRaniHandlers,
  registerGuessNumberHandlers,
  registerWordGuessHandlers,
  registerSpyWordHandlers,
  registerTagHandlers,
  registerTreasureHuntHandlers
];

export function registerSocketHandlers(io) {
  const context = createSocketContext(io);
  const rateLimitSocket = createSocketRateLimiter();
  const timers = createSocketTimers(context);
  const lifecycle = createRoomLifecycle(context, timers);

  io.on("connection", (socket) => {
    rateLimitSocket(socket, context);
    context.sendInitialActiveRooms(socket);

    for (const registerHandlers of socketHandlerRegistrars) {
      registerHandlers(socket, context, timers, lifecycle);
    }
  });
}
