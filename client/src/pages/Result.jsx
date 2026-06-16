import { Home, RotateCcw, Trophy, Users, Hash } from "lucide-react";

const confetti = [
  ["8%", "0ms", "#e05d44"],
  ["18%", "180ms", "#2f9f88"],
  ["29%", "80ms", "#f2bd45"],
  ["42%", "260ms", "#17212b"],
  ["56%", "120ms", "#e05d44"],
  ["68%", "340ms", "#2f9f88"],
  ["80%", "220ms", "#f2bd45"],
  ["91%", "40ms", "#17212b"]
];

export default function Result({ room, session, onRestartGame, onLeaveRoom }) {
  const isHost = room.host === session.playerId;
  const winnerName = room.winner?.name || "Bingo";
  const completedLines = room.winner?.completedLines || 5;

  return (
    <main className="min-h-screen overflow-hidden bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              BI
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">Bingo Result</p>
              <h1 className="text-2xl font-extrabold text-ink">{room.roomName}</h1>
            </div>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1fr_21rem]">
          <section className="surface result-card relative overflow-hidden border-honey p-5 text-center">
            {confetti.map(([left, delay, color], index) => (
              <span
                key={`${left}-${delay}`}
                className="confetti-piece pointer-events-none absolute top-0 h-2.5 w-1.5 rounded-sm"
                style={{
                  left,
                  backgroundColor: color,
                  animationDelay: delay,
                  animationDuration: `${1100 + index * 90}ms`
                }}
                aria-hidden="true"
              />
            ))}

            <Trophy
              className="winner-trophy mx-auto mb-2 h-10 w-10 text-honey"
              aria-hidden="true"
            />
            <p className="text-xs font-extrabold uppercase text-ink/50">Winner</p>
            <h2 className="text-3xl font-extrabold text-ink">{winnerName}</h2>

            <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-paper p-3">
                <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-bold text-ink/55">
                  <Hash className="h-4 w-4" aria-hidden="true" />
                  Calls
                </div>
                <p className="text-xl font-extrabold">{room.calledNumbers.length}</p>
              </div>
              <div className="rounded-md bg-paper p-3">
                <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-bold text-ink/55">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Lines
                </div>
                <p className="text-xl font-extrabold">{completedLines}</p>
              </div>
            </div>
          </section>

          <section className="surface h-fit p-3">
            <h2 className="mb-3 text-base font-extrabold">Match Actions</h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="compact-button w-full border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
                onClick={onLeaveRoom}
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Home
              </button>
              <button
                type="button"
                className="compact-button w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                onClick={onRestartGame}
                disabled={!isHost}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Restart
              </button>
            </div>

            {!isHost ? (
              <p className="mt-2 text-center text-xs font-bold text-ink/55">Waiting for host</p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
