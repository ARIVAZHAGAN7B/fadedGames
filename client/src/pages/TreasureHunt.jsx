import { Copy, DoorOpen, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buildRoomLink } from "../utils/roomLink.js";

const GRID_SIZE = 10;
const CELL_TYPES = {
  UNREVEALED: "unrevealed",
  BOMB: "bomb",
  TREASURE: "treasure",
  EMPTY: "empty"
};

function getCellContent(cellType) {
  switch (cellType) {
    case CELL_TYPES.BOMB:
      return "💣";
    case CELL_TYPES.TREASURE:
      return "💰";
    case CELL_TYPES.EMPTY:
      return "⬜";
    default:
      return "?";
  }
}

function getCellClass(cellType, isRevealed) {
  const base = "w-12 h-12 flex items-center justify-center text-2xl rounded-md transition-all cursor-pointer border-2 font-bold";
  
  if (!isRevealed) {
    return `${base} bg-slate-300 border-slate-400 hover:bg-slate-400`;
  }

  switch (cellType) {
    case CELL_TYPES.BOMB:
      return `${base} bg-red-100 border-red-400`;
    case CELL_TYPES.TREASURE:
      return `${base} bg-yellow-100 border-yellow-400`;
    case CELL_TYPES.EMPTY:
      return `${base} bg-gray-100 border-gray-300`;
    default:
      return base;
  }
}

function GameGrid({ board, onCellClick, isCurrentPlayer, gameEnded }) {
  return (
    <div className="flex justify-center my-6">
      <div 
        className="inline-grid gap-1 p-4 bg-slate-100 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const col = index % GRID_SIZE;
          const cell = board?.[row]?.[col];
          const isRevealed = cell?.revealed || false;
          
          return (
            <button
              key={index}
              className={getCellClass(cell?.type || CELL_TYPES.UNREVEALED, isRevealed)}
              onClick={() => {
                if (isCurrentPlayer && !gameEnded && !isRevealed) {
                  onCellClick(row, col);
                }
              }}
              disabled={!isCurrentPlayer || gameEnded || isRevealed}
              title={`Cell (${row}, ${col})`}
            >
              {isRevealed && getCellContent(cell.type)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlayerStats({ players, currentPlayerIndex, gameEnded }) {
  return (
    <section className="surface p-4 mb-6">
      <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5" aria-hidden="true" />
        Players
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {players.map((player, index) => {
          const isActive = !player.eliminated;
          const isCurrent = index === currentPlayerIndex && !gameEnded;
          
          return (
            <div
              key={player.playerId}
              className={`p-3 rounded-lg border-2 transition-all ${
                player.eliminated
                  ? "bg-gray-100 border-gray-300 opacity-50"
                  : isCurrent
                  ? "bg-blue-100 border-blue-400 font-bold"
                  : "bg-white border-gray-300"
              }`}
            >
              <p className="text-sm font-bold truncate">{player.name}</p>
              <div className="mt-2 space-y-1 text-xs">
                <p className="text-yellow-600">💰 {player.treasures || 0}</p>
                <p className="text-red-600">💣 {(player.bombs || 0)}/3</p>
              </div>
              {player.eliminated && (
                <p className="mt-2 text-xs font-bold text-red-600">Eliminated</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Timer({ timeLeft, totalTime = 10 }) {
  const percentage = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= 3;
  
  return (
    <div className="flex justify-center my-4">
      <div className="w-32 h-32 rounded-full flex items-center justify-center relative">
        <div className={`absolute inset-0 rounded-full border-8 flex items-center justify-center text-4xl font-bold ${
          isWarning ? "border-red-500 text-red-600" : "border-blue-500 text-blue-600"
        }`}>
          {timeLeft}
        </div>
        <div className={`absolute inset-0 rounded-full border-8 opacity-30`}
          style={{
            borderColor: isWarning ? '#ef4444' : '#3b82f6',
            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((percentage / 100) * Math.PI * 2 - Math.PI / 2)}% ${50 + 50 * Math.sin((percentage / 100) * Math.PI * 2 - Math.PI / 2)}%)`
          }}
        />
      </div>
    </div>
  );
}

function GameStatus({ state, room, isCurrentPlayer }) {
  const currentPlayer = room?.players?.[state?.currentPlayerIndex];
  
  if (room?.gameEnded) {
    return (
      <section className="surface p-4 mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400">
        <h2 className="text-2xl font-extrabold mb-3">Game Over!</h2>
        <div className="space-y-2">
          {state?.winner && (
            <p className="text-lg">
              <span className="font-bold text-green-600">🏆 Winner:</span> {state.winner.name}
            </p>
          )}
          {state?.finalStats && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-bold">Final Standings:</p>
              {state.finalStats.map((stat, idx) => (
                <div key={idx} className="text-sm">
                  {idx + 1}. {stat.name} - 💰 {stat.treasures} | 💣 {stat.bombs}/3
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="surface p-4 mb-4">
      {currentPlayer && (
        <div className={`text-center ${isCurrentPlayer ? "text-blue-600 font-bold" : ""}`}>
          <p className="text-sm opacity-70 uppercase">Current Turn</p>
          <p className="text-xl font-bold">{currentPlayer.name}</p>
          {isCurrentPlayer && (
            <p className="text-sm text-blue-600 mt-2">Your turn - Select a cell!</p>
          )}
        </div>
      )}
    </section>
  );
}

function RevealAnimation({ revealResult, onAnimationEnd }) {
  if (!revealResult) return null;

  const getResultColor = () => {
    switch (revealResult.type) {
      case CELL_TYPES.BOMB:
        return "bg-red-100 border-red-400";
      case CELL_TYPES.TREASURE:
        return "bg-yellow-100 border-yellow-400";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getResultMessage = () => {
    switch (revealResult.type) {
      case CELL_TYPES.BOMB:
        return "💣 BOMB!";
      case CELL_TYPES.TREASURE:
        return "💰 TREASURE!";
      default:
        return "⬜ Empty";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className={`p-8 rounded-lg border-4 text-center ${getResultColor()} animate-pulse`}>
        <p className="text-6xl mb-4">{getCellContent(revealResult.type)}</p>
        <p className="text-2xl font-bold mb-2">{getResultMessage()}</p>
        {revealResult.message && (
          <p className="text-lg mt-4">{revealResult.message}</p>
        )}
      </div>
    </div>
  );
}

export default function TreasureHunt({ socket, room, session }) {
  const [state, setState] = useState(room?.state || {});
  const [timeLeft, setTimeLeft] = useState(10);
  const [revealResult, setRevealResult] = useState(null);
  const timerRef = useRef(null);
  const animationRef = useRef(null);

  const currentPlayerIndex = state.currentPlayerIndex || 0;
  const currentPlayer = room?.players?.[currentPlayerIndex];
  const isCurrentPlayer = currentPlayer?.playerId === session?.playerId;
  const board = state.board || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (newState) => {
      setState(newState);
      setTimeLeft(10);
      setRevealResult(null);
    };

    const handleCellRevealed = (data) => {
      setRevealResult({
        type: data.cellType,
        message: data.message
      });
      
      animationRef.current = setTimeout(() => {
        setRevealResult(null);
      }, 2000);
    };

    const handleTurnTimeout = () => {
      setRevealResult({
        type: null,
        message: "⏰ Time's up! Next player..."
      });
      
      animationRef.current = setTimeout(() => {
        setRevealResult(null);
      }, 1500);
    };

    socket.on("treasure-hunt:state-update", handleStateUpdate);
    socket.on("treasure-hunt:cell-revealed", handleCellRevealed);
    socket.on("treasure-hunt:turn-timeout", handleTurnTimeout);

    return () => {
      socket.off("treasure-hunt:state-update", handleStateUpdate);
      socket.off("treasure-hunt:cell-revealed", handleCellRevealed);
      socket.off("treasure-hunt:turn-timeout", handleTurnTimeout);
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [socket, session?.clientId]);

  useEffect(() => {
    if (room?.gameEnded) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.gameEnded]);

  const handleCellClick = (row, col) => {
    if (!isCurrentPlayer || room?.gameEnded) return;
    
    socket?.emit("treasure-hunt:select-cell", {
      roomCode: room.code,
      row,
      col
    });
  };

  const handleRestart = () => {
    socket?.emit("restart-game", {
      roomCode: room.code
    });
  };

  const handleLeave = () => {
    window.location.href = "/";
  };

  const roomLink = room?.code ? buildRoomLink(room.code, "treasure-hunt") : "";
  const livePlayers = room?.players?.filter((p) => !p.eliminated) || [];
  const stats = {
    treasuresFound: state.treasuresRevealed || 0,
    bombsRevealed: state.bombsRevealed || 0,
    cellsRevealed: state.cellsRevealed || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-800">Treasure Hunt</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(roomLink)}
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Copy room link"
            >
              <Copy className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={handleLeave}
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Leave room"
            >
              <DoorOpen className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Game Status */}
        <GameStatus state={state} room={room} isCurrentPlayer={isCurrentPlayer} />

        {/* Timer */}
        {!room?.gameEnded && isCurrentPlayer && <Timer timeLeft={timeLeft} />}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="surface p-4 text-center">
            <p className="text-2xl font-bold">💰 {stats.treasuresFound}</p>
            <p className="text-xs text-ink/60">Treasures Found</p>
          </div>
          <div className="surface p-4 text-center">
            <p className="text-2xl font-bold">💣 {stats.bombsRevealed}</p>
            <p className="text-xs text-ink/60">Bombs Revealed</p>
          </div>
          <div className="surface p-4 text-center">
            <p className="text-2xl font-bold">⬜ {stats.cellsRevealed}</p>
            <p className="text-xs text-ink/60">Cells Revealed</p>
          </div>
        </div>

        {/* Game Grid */}
        <GameGrid
          board={board}
          onCellClick={handleCellClick}
          isCurrentPlayer={isCurrentPlayer}
          gameEnded={room?.gameEnded}
        />

        {/* Player Stats */}
        <PlayerStats
          players={room?.players || []}
          currentPlayerIndex={currentPlayerIndex}
          gameEnded={room?.gameEnded}
        />

        {/* Game Ended */}
        {room?.gameEnded && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Play Again
            </button>
            <button
              onClick={handleLeave}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Reveal Animation */}
        <RevealAnimation revealResult={revealResult} onAnimationEnd={() => setRevealResult(null)} />
      </div>
    </div>
  );
}
