import { useMemo, useState } from "react";
import { Copy, DoorOpen, Trophy } from "lucide-react";
import Board from "../components/Board.jsx";
import TurnIndicator from "../components/TurnIndicator.jsx";
import { countCompletedLines, getBoardSize } from "../game/board.js";
import { buildRoomLink } from "../utils/roomLink.js";

export default function Game({ room, session, board, onCallNumber, onClaimBingo, onLeaveRoom }) {
  const [status, setStatus] = useState("");
  const isMyTurn = room.currentPlayerId === session.playerId && !room.gameEnded;
  const boardSize = useMemo(() => room.boardSize || getBoardSize(room.players.length), [room.boardSize, room.players.length]);
  const requiredLines = boardSize;
  const completedLines = useMemo(
    () => countCompletedLines(board, room.calledNumbers, boardSize),
    [board, room.calledNumbers, boardSize]
  );

  const calledNumbers = [...room.calledNumbers].reverse();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

  const handleCallNumber = async (number) => {
    const result = await onCallNumber(number);

    if (!result.ok) {
      setStatus(result.error);
    } else {
      setStatus("");
    }
  };

  const handleClaimBingo = async () => {
    const result = await onClaimBingo();

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    if (!result.valid) {
      setStatus(`${result.completedLines}/${requiredLines} lines`);
    }
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              BI
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">Bingo Room</p>
              <h1 className="text-2xl font-extrabold text-ink">{room.roomName}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="compact-button border border-ink/15 bg-paper font-extrabold"
              onClick={handleCopy}
              title="Copy room link"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {room.roomCode}
            </button>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
              onClick={onLeaveRoom}
              title="Leave room"
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Leave
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1fr_19rem] xl:grid-cols-[1fr_21rem]">
          <div className="surface p-3">
            <Board
              board={board}
              calledNumbers={room.calledNumbers}
              boardSize={boardSize}
              isMyTurn={isMyTurn}
              gameEnded={room.gameEnded}
              onCallNumber={handleCallNumber}
            />
          </div>

          <aside className="space-y-3">
            <TurnIndicator room={room} isMyTurn={isMyTurn} />

            <section className="surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold">Lines</h2>
                <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink">
                  {completedLines}/{requiredLines}
                </span>
              </div>
              <button
                type="button"
                className="compact-button w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                onClick={handleClaimBingo}
                disabled={room.gameEnded}
              >
                <Trophy className="h-5 w-5" aria-hidden="true" />
                BINGO
              </button>
              {status ? <p className="mt-2 text-xs font-bold text-coral">{status}</p> : null}
            </section>

            <section className="surface p-3">
              <h2 className="mb-2 text-base font-extrabold">Called Numbers</h2>
              <div className="flex max-h-44 flex-wrap gap-1.5 overflow-auto pr-1">
                {calledNumbers.length > 0 ? (
                  calledNumbers.map((number, index) => (
                    <span
                      key={`${number}-${calledNumbers.indexOf(number)}`}
                      className={`number-pill rounded-md px-2 py-1.5 text-center text-sm font-extrabold text-white ${
                        index === 0 ? "latest-pill bg-coral" : "bg-ink"
                      }`}
                    >
                      {number}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-bold text-ink/50">Waiting...</span>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
