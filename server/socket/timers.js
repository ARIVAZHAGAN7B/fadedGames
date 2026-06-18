import { cleanupDisconnectedPlayer } from "../services/roomService.js";
import { callBotNumber } from "../services/games/bingoService.js";
import {
  resolveBoostRoundTimeout,
  submitBoostBotSelections
} from "../services/games/boostService.js";
import {
  resolveHandCricketCountdown,
  resolveHandCricketDecisionTimeout,
  resolveHandCricketMoveTimeout,
  resolveHandCricketReveal,
  resolveHandCricketTeamSelectionTimeout,
  resolveHandCricketTossTimeout
} from "../services/games/handCricketService.js";
import {
  resolveRajaRaniReveal,
  resolveRajaRaniTurnsTimer
} from "../services/games/rajaRaniService.js";
import { tickTagRoom } from "../services/games/tagService.js";
import { resolveTreasureHuntTimeout } from "../services/games/treasureHuntService.js";
import { resolveWordGuessTimeout } from "../services/games/wordGuessService.js";

const DISCONNECT_GRACE_MS = 60_000;
const BOT_TURN_DELAY_MS = 900;
const BOOST_BOT_DELAY_MS = 900;
const TAG_LOOP_INTERVAL_MS = 1000 / 30;

function timerKey(roomCode, playerId) {
  return `${roomCode}:${playerId}`;
}

export function createSocketTimers(context) {
  const disconnectTimers = new Map();
  const botTurnTimers = new Map();
  const handCricketMoveTimers = new Map();
  const tagRoomLoops = new Map();
  const wordGuessTimers = new Map();
  const boostRoundTimers = new Map();
  const boostBotTimers = new Map();
  const rajaRaniRevealTimers = new Map();
  const rajaRaniTurnsTimers = new Map();
  const treasureHuntTimers = new Map();

  function cancelDisconnectCleanup(roomCode, playerId) {
    const key = timerKey(roomCode, playerId);
    const timer = disconnectTimers.get(key);

    if (timer) {
      clearTimeout(timer);
      disconnectTimers.delete(key);
    }
  }

  function cancelBotTurn(roomCode) {
    const timer = botTurnTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      botTurnTimers.delete(roomCode);
    }
  }

  function cancelHandCricketMove(roomCode) {
    const timer = handCricketMoveTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      handCricketMoveTimers.delete(roomCode);
    }
  }

  function cancelTagLoop(roomCode) {
    const loop = tagRoomLoops.get(roomCode);

    if (loop) {
      clearInterval(loop);
      tagRoomLoops.delete(roomCode);
    }
  }

  function cancelWordGuessTimer(roomCode) {
    const timer = wordGuessTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      wordGuessTimers.delete(roomCode);
    }
  }

  function cancelBoostRound(roomCode) {
    const timer = boostRoundTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      boostRoundTimers.delete(roomCode);
    }
  }

  function cancelBoostBotTurn(roomCode) {
    const timer = boostBotTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      boostBotTimers.delete(roomCode);
    }
  }

  function cancelRajaRaniReveal(roomCode) {
    const timer = rajaRaniRevealTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      rajaRaniRevealTimers.delete(roomCode);
    }
  }

  function cancelRajaRaniTurnsTimer(roomCode) {
    const timer = rajaRaniTurnsTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      rajaRaniTurnsTimers.delete(roomCode);
    }
  }

  function cancelTreasureHuntTimer(roomCode) {
    const timer = treasureHuntTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      treasureHuntTimers.delete(roomCode);
    }
  }

  function cancelGameTimers(roomCode) {
    cancelBotTurn(roomCode);
    cancelHandCricketMove(roomCode);
    cancelTagLoop(roomCode);
    cancelWordGuessTimer(roomCode);
    cancelBoostRound(roomCode);
    cancelBoostBotTurn(roomCode);
    cancelRajaRaniReveal(roomCode);
    cancelRajaRaniTurnsTimer(roomCode);
    cancelTreasureHuntTimer(roomCode);
  }

  function scheduleWordGuessTimer(room) {
    cancelWordGuessTimer(room.roomCode);

    const state = room.wordGuess;

    if (
      room.gameType !== "word-guess" ||
      !room.gameStarted ||
      room.gameEnded ||
      !state
    ) {
      return;
    }

    const deadlineAt =
      state.phase === "locked"
        ? state.lockDeadlineAt
        : state.phase === "guessing"
          ? state.roundDeadlineAt
          : null;

    if (!deadlineAt) {
      return;
    }

    const roomCode = room.roomCode;
    const moveId = state.moveId;
    const delay = Math.max(0, deadlineAt - Date.now()) + 25;
    const timer = setTimeout(() => {
      wordGuessTimers.delete(roomCode);

      try {
        const result = resolveWordGuessTimeout({ roomCode, moveId });

        if (!result.changed) {
          scheduleWordGuessTimer(result.room);
          return;
        }

        if (!context.emitGameEndedIfNeeded(result.room)) {
          context.emitRoomUpdate(result.room);
          scheduleWordGuessTimer(result.room);
        } else {
          cancelWordGuessTimer(roomCode);
        }
      } catch {
        cancelWordGuessTimer(roomCode);
      }
    }, delay);

    wordGuessTimers.set(roomCode, timer);
  }

  function scheduleBoostRound(room) {
    cancelBoostRound(room.roomCode);

    const state = room.boost;

    if (
      room.gameType !== "boost" ||
      !room.gameStarted ||
      room.gameEnded ||
      !state
    ) {
      cancelBoostBotTurn(room.roomCode);
      return;
    }

    const deadlineAt = state.phase === "selecting" ? state.selectDeadlineAt : null;

    if (!deadlineAt) {
      return;
    }

    const roomCode = room.roomCode;
    const moveId = state.moveId;
    const delay = Math.max(0, deadlineAt - Date.now()) + 25;
    const timer = setTimeout(() => {
      boostRoundTimers.delete(roomCode);

      try {
        const result = resolveBoostRoundTimeout({ roomCode, moveId });

        if (!result.changed) {
          scheduleBoostRound(result.room);
          scheduleBoostBotTurn(result.room);
          return;
        }

        if (!context.emitGameEndedIfNeeded(result.room)) {
          context.emitRoomUpdate(result.room);
          scheduleBoostRound(result.room);
          scheduleBoostBotTurn(result.room);
        } else {
          cancelBoostRound(roomCode);
          cancelBoostBotTurn(roomCode);
        }
      } catch {
        cancelBoostRound(roomCode);
        cancelBoostBotTurn(roomCode);
      }
    }, delay);

    boostRoundTimers.set(roomCode, timer);
  }

  function scheduleBoostBotTurn(room) {
    cancelBoostBotTurn(room.roomCode);

    const state = room.boost;

    if (
      room.gameType !== "boost" ||
      !room.gameStarted ||
      room.gameEnded ||
      state?.phase !== "selecting"
    ) {
      return;
    }

    const activePlayer = room.players[state.currentTurnIndex] || null;

    if (!activePlayer?.isBot) {
      return;
    }

    const roomCode = room.roomCode;
    const timer = setTimeout(() => {
      boostBotTimers.delete(roomCode);

      try {
        const result = submitBoostBotSelections({ roomCode });

        if (result.selectedCount > 0) {
          if (!context.emitGameEndedIfNeeded(result.room)) {
            context.emitRoomUpdate(result.room);
            scheduleBoostRound(result.room);
            scheduleBoostBotTurn(result.room);
          } else {
            cancelBoostRound(roomCode);
          }
        }
      } catch {
        cancelBoostBotTurn(roomCode);
      }
    }, BOOST_BOT_DELAY_MS);

    boostBotTimers.set(roomCode, timer);
  }

  function scheduleRajaRaniReveal(room) {
    cancelRajaRaniReveal(room.roomCode);

    const state = room.rajaRani;

    if (
      room.gameType !== "raja-rani" ||
      !room.gameStarted ||
      room.gameEnded ||
      state?.phase !== "reveal" ||
      !state.revealDeadlineAt
    ) {
      return;
    }

    const roomCode = room.roomCode;
    const moveId = state.moveId;
    const delay = Math.max(0, state.revealDeadlineAt - Date.now()) + 25;
    const timer = setTimeout(() => {
      rajaRaniRevealTimers.delete(roomCode);

      try {
        const result = resolveRajaRaniReveal({ roomCode, moveId });

        if (!result.changed) {
          scheduleRajaRaniReveal(result.room);
          return;
        }

        if (!context.emitGameEndedIfNeeded(result.room)) {
          context.emitRoomUpdate(result.room);
          scheduleRajaRaniReveal(result.room);
        } else {
          cancelRajaRaniReveal(roomCode);
        }
      } catch {
        cancelRajaRaniReveal(roomCode);
      }
    }, delay);

    rajaRaniRevealTimers.set(roomCode, timer);
  }

  function scheduleRajaRaniTurnsTimer(room) {
    cancelRajaRaniTurnsTimer(room.roomCode);

    const state = room.rajaRaniTurns;

    if (
      room.gameType !== "raja-rani-turns" ||
      !room.gameStarted ||
      room.gameEnded ||
      !state
    ) {
      return;
    }

    const deadlineAt =
      state.phase === "turn"
        ? state.turnDeadlineAt
        : state.phase === "reveal"
          ? state.revealDeadlineAt
          : null;

    if (!deadlineAt) {
      return;
    }

    const roomCode = room.roomCode;
    const moveId = state.moveId;
    const delay = Math.max(0, deadlineAt - Date.now()) + 25;
    const timer = setTimeout(() => {
      rajaRaniTurnsTimers.delete(roomCode);

      try {
        const result = resolveRajaRaniTurnsTimer({ roomCode, moveId });

        if (!result.changed) {
          scheduleRajaRaniTurnsTimer(result.room);
          return;
        }

        if (!context.emitGameEndedIfNeeded(result.room)) {
          context.emitRoomUpdate(result.room);
          scheduleRajaRaniTurnsTimer(result.room);
        } else {
          cancelRajaRaniTurnsTimer(roomCode);
        }
      } catch {
        cancelRajaRaniTurnsTimer(roomCode);
      }
    }, delay);

    rajaRaniTurnsTimers.set(roomCode, timer);
  }

  function scheduleTreasureHuntTimer(room) {
    cancelTreasureHuntTimer(room.roomCode);

    const state = room.treasureHunt;

    if (
      room.gameType !== "treasure-hunt" ||
      !room.gameStarted ||
      room.gameEnded ||
      !state?.turnDeadlineAt
    ) {
      return;
    }

    const roomCode = room.roomCode;
    const turnNumber = state.currentTurnCount;
    const delay = Math.max(0, state.turnDeadlineAt - Date.now()) + 25;
    const timer = setTimeout(() => {
      treasureHuntTimers.delete(roomCode);

      try {
        const result = resolveTreasureHuntTimeout({ roomCode, turnNumber });

        if (!result.changed) {
          scheduleTreasureHuntTimer(result.room);
          return;
        }

        if (!context.emitGameEndedIfNeeded(result.room)) {
          context.emitRoomUpdate(result.room);
          context.emitRoomEvent(result.room, "treasure-hunt:turn-timeout", {
            skippedPlayer: result.skippedPlayer,
            message: result.message
          });
          scheduleTreasureHuntTimer(result.room);
        } else {
          cancelTreasureHuntTimer(roomCode);
        }
      } catch {
        cancelTreasureHuntTimer(roomCode);
      }
    }, delay);

    treasureHuntTimers.set(roomCode, timer);
  }

  function scheduleTagLoop(room) {
    if (room.gameType !== "tag" || !room.gameStarted || room.gameEnded) {
      cancelTagLoop(room.roomCode);
      return;
    }

    if (tagRoomLoops.has(room.roomCode)) {
      return;
    }

    const roomCode = room.roomCode;
    const loop = setInterval(() => {
      try {
        const result = tickTagRoom({ roomCode });
        const roomState = context.serializeRoom(result.room);

        context.io.to(roomCode).volatile.emit("room-updated", {
          room: roomState
        });

        if (!result.active || result.room.gameEnded) {
          cancelTagLoop(roomCode);

          if (result.room.gameEnded) {
            context.io.to(roomCode).emit("game-ended", {
              winner: result.room.winner,
              room: roomState
            });
            context.emitActiveRooms();
          }
        }
      } catch {
        cancelTagLoop(roomCode);
      }
    }, TAG_LOOP_INTERVAL_MS);

    tagRoomLoops.set(roomCode, loop);
  }

  function scheduleHandCricketMove(room) {
    cancelHandCricketMove(room.roomCode);

    const state = room.handCricket;

    if (
      room.gameType !== "hand-cricket" ||
      !room.gameStarted ||
      room.gameEnded ||
      !state
    ) {
      return;
    }

    const roomCode = room.roomCode;
    const moveId = state.moveId;
    const isToss = state.phase === "toss-throw";
    const isDecision = state.phase === "decision";
    const isSelection = state.phase === "player-selection";
    const isCountdown = state.phase === "countdown";
    const isReveal = state.phase === "ball-reveal";
    const deadlineAt = isToss
      ? state.tossDeadlineAt
      : isDecision
        ? state.decisionDeadlineAt
        : isSelection
          ? state.teamSelectionDeadlineAt
          : isCountdown
            ? state.countdownDeadlineAt
            : isReveal
              ? state.revealDeadlineAt
              : state.moveDeadlineAt;

    if (
      state.phase !== "innings" &&
      !isReveal &&
      !isCountdown &&
      !isToss &&
      !isDecision &&
      !isSelection
    ) {
      return;
    }

    if (!deadlineAt) {
      return;
    }

    const delay = Math.max(0, deadlineAt - Date.now()) + 25;
    const timer = setTimeout(() => {
      handCricketMoveTimers.delete(roomCode);

      try {
        const result = isCountdown
          ? resolveHandCricketCountdown({ roomCode, moveId })
          : isReveal
            ? resolveHandCricketReveal({ roomCode, moveId })
            : isToss
              ? resolveHandCricketTossTimeout({ roomCode, moveId })
              : isDecision
                ? resolveHandCricketDecisionTimeout({ roomCode, moveId })
                : isSelection
                  ? resolveHandCricketTeamSelectionTimeout({ roomCode, moveId })
                  : resolveHandCricketMoveTimeout({ roomCode, moveId });

        if (!result.changed) {
          scheduleHandCricketMove(result.room);
          return;
        }

        if (!context.emitGameEndedIfNeeded(result.room)) {
          context.emitRoomUpdate(result.room);
          scheduleHandCricketMove(result.room);
        } else {
          cancelHandCricketMove(roomCode);
        }
      } catch {
        cancelHandCricketMove(roomCode);
      }
    }, delay);

    handCricketMoveTimers.set(roomCode, timer);
  }

  function scheduleBotTurn(room) {
    cancelBotTurn(room.roomCode);

    if (!room.gameStarted || room.gameEnded) {
      return;
    }

    const currentPlayer = room.players[room.currentTurn];

    if (!currentPlayer?.isBot) {
      return;
    }

    const roomCode = room.roomCode;
    const playerId = currentPlayer.playerId;
    const timer = setTimeout(() => {
      botTurnTimers.delete(roomCode);

      try {
        const result = callBotNumber({ roomCode, playerId });
        context.emitNumberCalled(result);
        scheduleBotTurn(result.room);
      } catch {
        cancelBotTurn(roomCode);
      }
    }, BOT_TURN_DELAY_MS);

    botTurnTimers.set(roomCode, timer);
  }

  function scheduleDisconnectCleanup(roomCode, playerId) {
    cancelDisconnectCleanup(roomCode, playerId);

    const key = timerKey(roomCode, playerId);
    const timer = setTimeout(() => {
      disconnectTimers.delete(key);
      const result = cleanupDisconnectedPlayer({ roomCode, playerId });

      if (result && !result.deleted) {
        context.emitRoomEvent(result.room, "player-left", {
          player: result.player
        });
        context.emitRoomUpdate(result.room);
        scheduleTimeoutDrivenGames(result.room);
        context.emitActiveRooms();
      } else if (result?.deleted) {
        cancelGameTimers(roomCode);
        context.emitActiveRooms();
      }
    }, DISCONNECT_GRACE_MS);

    disconnectTimers.set(key, timer);
  }

  function scheduleTimeoutDrivenGames(room) {
    scheduleWordGuessTimer(room);
    scheduleBoostRound(room);
    scheduleBoostBotTurn(room);
    scheduleRajaRaniReveal(room);
    scheduleRajaRaniTurnsTimer(room);
    scheduleTreasureHuntTimer(room);
  }

  function scheduleGameStart(room) {
    scheduleBotTurn(room);
    scheduleHandCricketMove(room);
    scheduleTagLoop(room);
    scheduleTimeoutDrivenGames(room);
  }

  return {
    cancelBoostBotTurn,
    cancelBoostRound,
    cancelBotTurn,
    cancelDisconnectCleanup,
    cancelGameTimers,
    cancelHandCricketMove,
    cancelRajaRaniReveal,
    cancelRajaRaniTurnsTimer,
    cancelTagLoop,
    cancelTreasureHuntTimer,
    cancelWordGuessTimer,
    scheduleBoostBotTurn,
    scheduleBoostRound,
    scheduleBotTurn,
    scheduleDisconnectCleanup,
    scheduleGameStart,
    scheduleHandCricketMove,
    scheduleRajaRaniReveal,
    scheduleRajaRaniTurnsTimer,
    scheduleTagLoop,
    scheduleTimeoutDrivenGames,
    scheduleTreasureHuntTimer,
    scheduleWordGuessTimer
  };
}
