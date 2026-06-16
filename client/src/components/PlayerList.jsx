import { Bot, Check, Crown, Circle, Users } from "lucide-react";

export default function PlayerList({ players, maxPlayers, showReadyStatus = true }) {
  return (
    <section className="surface p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-mint" aria-hidden="true" />
          <h2 className="text-base font-extrabold">Players</h2>
        </div>
        <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
          {players.length}/{maxPlayers}
        </span>
      </div>

      <div className="space-y-1.5">
        {players.map((player) => (
          <div
            key={player.playerId}
            className="flex min-h-9 items-center justify-between rounded-md border border-ink/10 bg-paper px-2.5 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              {player.isBot ? (
                <Bot className="h-4 w-4 shrink-0 text-mint" aria-label="Bot" />
              ) : player.isHost ? (
                <Crown className="h-4 w-4 shrink-0 text-honey" aria-label="Host" />
              ) : (
                <Check className="h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
              )}
              <span className="truncate font-bold">{player.name}</span>
            </div>

            {showReadyStatus ? (
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {player.hasBoard ? (
                  <>
                    <Check className="h-4 w-4 text-mint" aria-hidden="true" />
                    <span>Ready</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 text-ink/40" aria-hidden="true" />
                    <span className="text-ink/60">Board</span>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
