import {
  Bomb,
  Copy,
  Crown,
  DoorOpen,
  Gem,
  Home,
  RotateCcw,
  Square,
  Timer,
  Trophy,
  Users
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildRoomLink } from "../utils/roomLink.js";

const GRID_SIZE = 10;
const BOMB_LIMIT = 3;
const CELL_TYPES = {
  BOMB: "bomb",
  TREASURE: "treasure",
  EMPTY: "empty"
};

function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      revealed: false,
      type: null
    }))
  );
}

function getTimeLeft(deadlineAt, now) {
  if (!deadlineAt) {
    return 0;
  }

  return Math.max(0, deadlineAt - now);
}

function formatSeconds(milliseconds) {
  return Math.max(0, Math.ceil(milliseconds / 1000));
}

function getCellClass(cell) {
  if (!cell?.revealed) {
    return "border-ink/15 bg-[#d9c8a6] text-ink shadow-[inset_0_-4px_0_rgba(23,33,43,0.12)] hover:border-mint hover:bg-[#e8d7b5]";
  }

  if (cell.type === CELL_TYPES.BOMB) {
    return "border-coral bg-coral/10 text-coral";
  }

  if (cell.type === CELL_TYPES.TREASURE) {
    return "border-honey bg-honey/25 text-ink";
  }

  return "border-ink/10 bg-white text-ink/35";
}

function CellIcon({ type, revealed }) {
  if (!revealed) {
    return null;
  }

  if (type === CELL_TYPES.BOMB) {
    return <Bomb className="h-[58%] w-[58%]" aria-hidden="true" />;
  }

  if (type === CELL_TYPES.TREASURE) {
    return <Gem className="h-[58%] w-[58%]" aria-hidden="true" />;
  }

  return <Square className="h-[42%] w-[42%]" aria-hidden="true" />;
}

function StatTile({ icon: Icon, label, value, tone = "ink" }) {
  const toneClass =
    tone === "coral"
      ? "bg-coral/10 text-coral"
      : tone === "mint"
        ? "bg-mint/10 text-mint"
        : tone === "honey"
          ? "bg-honey/25 text-ink"
          : "bg-ink/10 text-ink";

  return (
    <div className="rounded-md border border-ink/10 bg-white p-3">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-xl font-extrabold leading-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-extrabold uppercase text-ink/50">{label}</p>
    </div>
  );
}

function GameGrid({ board, canSelect, onSelectCell }) {
  return (
    <section className="surface p-3 sm:p-4">
      <div
        className="grid w-full gap-1"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const revealed = Boolean(cell?.revealed);
            const disabled = !canSelect || revealed;

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                className={`relative aspect-square rounded-md border-2 transition active:scale-95 disabled:cursor-not-allowed ${getCellClass(
                  cell
                )} ${canSelect && !revealed ? "hover:-translate-y-0.5" : ""}`}
                disabled={disabled}
                onClick={() => onSelectCell(rowIndex, colIndex)}
                title={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${
                  revealed ? ` ${cell.type || "empty"}` : ""
                }`}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  <CellIcon type={cell?.type} revealed={revealed} />
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function PlayerCard({ player, isCurrent, isMe }) {
  const bombs = player.bombs || 0;

  return (
    <div
      className={`rounded-md border p-3 transition ${
        player.eliminated
          ? "border-ink/10 bg-ink/5 text-ink/45"
          : isCurrent
            ? "border-honey bg-honey/20 text-ink"
            : isMe
              ? "border-mint bg-mint/5 text-ink"
              : "border-ink/10 bg-white text-ink"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold">
            {player.name}
            {isMe ? " (You)" : ""}
          </h3>
          <p className="text-xs font-extrabold uppercase text-ink/45">
            {player.eliminated ? "Eliminated" : isCurrent ? "Turn" : "Active"}
          </p>
        </div>
        {isCurrent && !player.eliminated ? (
          <Crown className="h-4 w-4 shrink-0 text-honey" aria-hidden="true" />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm font-extrabold">
        <div className="rounded bg-honey/20 px-2 py-1.5 text-ink">
          <span className="mr-1 inline-block align-[-2px]">
            <Gem className="h-4 w-4" aria-hidden="true" />
          </span>
          {player.treasures || 0}
        </div>
        <div className="rounded bg-coral/10 px-2 py-1.5 text-coral">
          <span className="mr-1 inline-block align-[-2px]">
            <Bomb className="h-4 w-4" aria-hidden="true" />
          </span>
          {bombs}/{BOMB_LIMIT}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1">
        {Array.from({ length: BOMB_LIMIT }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${index < bombs ? "bg-coral" : "bg-ink/10"}`}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerPanel({ players, currentPlayerIndex, sessionPlayerId }) {
  return (
    <section className="surface p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
          <Users className="h-5 w-5" aria-hidden="true" />
          Players
        </h2>
        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-extrabold text-white">
          {players.filter((player) => !player.eliminated).length} active
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {players.map((player, index) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            isCurrent={index === currentPlayerIndex}
            isMe={player.playerId === sessionPlayerId}
          />
        ))}
      </div>
    </section>
  );
}

function StatusPanel({ currentPlayer, isMyTurn, timeLeftMs, turnTimeMs, roomEnded }) {
  const seconds = formatSeconds(timeLeftMs);
  const progress = turnTimeMs ? Math.max(0, Math.min(100, (timeLeftMs / turnTimeMs) * 100)) : 0;
  const danger = seconds <= 3 && !roomEnded;

  return (
    <section className="surface p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase text-ink/50">Current Turn</p>
          <h2 className="truncate text-2xl font-extrabold text-ink">
            {roomEnded ? "Game Over" : currentPlayer?.name || "Waiting"}
          </h2>
          <p
            className={`mt-1 text-sm font-extrabold ${
              isMyTurn ? "text-mint" : roomEnded ? "text-ink/45" : "text-ink/55"
            }`}
          >
            {roomEnded ? "Final result" : isMyTurn ? "Your turn" : "Waiting"}
          </p>
        </div>

        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-ink/55">
              <Timer className="h-4 w-4" aria-hidden="true" />
              Timer
            </span>
            <span className={`text-xl font-extrabold ${danger ? "text-coral" : "text-ink"}`}>
              {roomEnded ? "--" : `${seconds}s`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full transition-all ${danger ? "bg-coral" : "bg-mint"}`}
              style={{ width: `${roomEnded ? 0 : progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ winner, finalStats }) {
  if (!winner) {
    return null;
  }

  return (
    <section className="surface border-honey bg-honey/15 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-honey text-ink">
          <Trophy className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase text-ink/55">Winner</p>
          <h2 className="truncate text-2xl font-extrabold text-ink">{winner.name}</h2>
        </div>
      </div>

      {finalStats?.length ? (
        <div className="grid gap-2">
          {finalStats.map((stat, index) => (
            <div
              key={stat.playerId || stat.name}
              className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-extrabold"
            >
              <span className="text-ink/45">{index + 1}</span>
              <span className="truncate">{stat.name}</span>
              <span className="flex items-center gap-1 text-ink">
                <Gem className="h-4 w-4 text-honey" aria-hidden="true" />
                {stat.treasures || 0}
              </span>
              <span className="flex items-center gap-1 text-coral">
                <Bomb className="h-4 w-4" aria-hidden="true" />
                {stat.bombs || 0}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RevealToast({ reveal }) {
  if (!reveal) {
    return null;
  }

  const isBomb = reveal.type === CELL_TYPES.BOMB;
  const isTreasure = reveal.type === CELL_TYPES.TREASURE;
  const Icon = isBomb ? Bomb : isTreasure ? Gem : reveal.type === "timeout" ? Timer : Square;
  const tone = isBomb
    ? "border-coral bg-coral text-white"
    : isTreasure
      ? "border-honey bg-honey text-ink"
      : reveal.type === "timeout"
        ? "border-ink bg-ink text-white"
        : "border-mint bg-mint text-white";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className={`flex max-w-md items-center gap-3 rounded-md border-2 px-4 py-3 shadow-soft ${tone}`}>
        <Icon className="h-7 w-7 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold">{reveal.title}</p>
          {reveal.message ? <p className="text-sm font-bold opacity-85">{reveal.message}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function TreasureHunt({
  socket,
  room,
  session,
  onRestartGame,
  onLeaveRoom
}) {
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState("");
  const [reveal, setReveal] = useState(null);
  const revealTimerRef = useRef(null);
  const state = room.treasureHunt || {};
  const board = state.board?.length ? state.board : createEmptyBoard();
  const players = room.players || [];
  const currentPlayerIndex = state.currentPlayerIndex || 0;
  const currentPlayer = players[currentPlayerIndex] || null;
  const me = players.find((player) => player.playerId === session.playerId) || null;
  const isHost = room.host === session.playerId;
  const isMyTurn = currentPlayer?.playerId === session.playerId && !room.gameEnded;
  const canSelect = isMyTurn && !me?.eliminated && !room.gameEnded;
  const timeLeftMs = getTimeLeft(state.turnDeadlineAt, now);
  const totalTreasures = state.totalTreasures || 15;
  const totalBombs = state.totalBombs || 20;
  const roomLink = buildRoomLink(room.roomCode, room.gameType);
  const winner = room.winner || state.winner || null;
  const finalStats = state.finalStats || [];
  const cellsRevealed = state.cellsRevealed || 0;
  const activePlayers = useMemo(
    () => players.filter((player) => !player.eliminated),
    [players]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setStatus("");
  }, [state.currentTurnCount]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const showReveal = (nextReveal) => {
      setReveal(nextReveal);

      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }

      revealTimerRef.current = window.setTimeout(() => {
        setReveal(null);
      }, 1700);
    };

    const handleCellRevealed = (payload = {}) => {
      const type = payload.cellType || CELL_TYPES.EMPTY;
      const title =
        type === CELL_TYPES.BOMB
          ? "Bomb"
          : type === CELL_TYPES.TREASURE
            ? "Treasure"
            : "Empty";

      showReveal({
        type,
        title: payload.player?.name ? `${payload.player.name}: ${title}` : title,
        message: payload.message || ""
      });
    };

    const handleTurnTimeout = (payload = {}) => {
      showReveal({
        type: "timeout",
        title: "Time up",
        message: payload.skippedPlayer?.name
          ? `${payload.skippedPlayer.name} lost the turn`
          : "Turn skipped"
      });
    };

    socket.on("treasure-hunt:cell-revealed", handleCellRevealed);
    socket.on("treasure-hunt:turn-timeout", handleTurnTimeout);

    return () => {
      socket.off("treasure-hunt:cell-revealed", handleCellRevealed);
      socket.off("treasure-hunt:turn-timeout", handleTurnTimeout);

      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, [socket]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

  const handleSelectCell = (row, col) => {
    if (!canSelect) {
      return;
    }

    setStatus("");
    socket?.emit(
      "treasure-hunt:select-cell",
      {
        roomCode: room.roomCode,
        row,
        col
      },
      (response) => {
        if (!response?.ok) {
          setStatus(response?.error || "Move failed");
        }
      }
    );
  };

  const handleRestart = async () => {
    if (!isHost) {
      setStatus("Only the host can restart.");
      return;
    }

    const result = await onRestartGame?.();

    if (result && !result.ok) {
      setStatus(result.error);
    }
  };

  return (
    <main className="min-h-screen bg-paper px-3 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase text-mint">{room.roomCode}</p>
            <h1 className="truncate text-3xl font-extrabold text-ink">Treasure Hunt</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint"
              onClick={handleCopy}
              title="Copy room link"
              aria-label="Copy room link"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
              onClick={onLeaveRoom}
              title="Leave room"
              aria-label="Leave room"
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {status ? (
          <div className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-extrabold text-coral">
            {status}
          </div>
        ) : null}

        <StatusPanel
          currentPlayer={currentPlayer}
          isMyTurn={canSelect}
          timeLeftMs={timeLeftMs}
          turnTimeMs={state.turnTimeMs || 10000}
          roomEnded={room.gameEnded}
        />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Gem}
            label="Treasures"
            value={`${state.treasuresRevealed || 0}/${totalTreasures}`}
            tone="honey"
          />
          <StatTile
            icon={Bomb}
            label="Bombs"
            value={`${state.bombsRevealed || 0}/${totalBombs}`}
            tone="coral"
          />
          <StatTile icon={Square} label="Revealed" value={`${cellsRevealed}/100`} tone="mint" />
          <StatTile icon={Users} label="Active" value={`${activePlayers.length}/${players.length}`} />
        </section>

        {room.gameEnded ? <ResultPanel winner={winner} finalStats={finalStats} /> : null}

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <GameGrid board={board} canSelect={canSelect} onSelectCell={handleSelectCell} />
          <PlayerPanel
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            sessionPlayerId={session.playerId}
          />
        </section>

        {room.gameEnded ? (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="compact-button bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
              onClick={handleRestart}
              disabled={!isHost}
              title={isHost ? "Play again" : "Only the host can restart"}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Play Again
            </button>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint"
              onClick={onLeaveRoom}
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Back Home
            </button>
          </div>
        ) : null}
      </div>

      <RevealToast reveal={reveal} />
    </main>
  );
}
