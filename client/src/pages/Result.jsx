import { Trophy, Users, Hash } from "lucide-react";
import {
  GamePage,
  ResultActions,
  RoomHeader
} from "../components/game/GameLayout.jsx";

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
    <GamePage overflowHidden>
        <RoomHeader
          room={room}
          codeLabel="BI"
          eyebrow="Bingo Result"
          showCopy={false}
          showLeave={false}
        />

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
            <ResultActions
              onLeaveRoom={onLeaveRoom}
              onRestart={onRestartGame}
              restartDisabled={!isHost}
              layoutClassName="flex flex-col gap-2"
            />

            {!isHost ? (
              <p className="mt-2 text-center text-xs font-bold text-ink/55">Waiting for host</p>
            ) : null}
          </section>
        </div>
    </GamePage>
  );
}
