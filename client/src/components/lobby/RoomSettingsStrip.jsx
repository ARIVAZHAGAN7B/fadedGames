import { Bot, Play, Settings, Users } from "lucide-react";
import { spyWordMinPlayers, spyWordTotalRounds, tagMaps } from "../../game/options.js";

export default function RoomSettingsStrip({ room, canStart, isHost, onAddBot, onStartGame }) {
  const isBingo = room.gameType === "bingo";
  const isBoost = room.gameType === "boost";
  const isTag = room.gameType === "tag";
  const isGuessNumber = room.gameType === "guess-number";
  const isWordGuess = room.gameType === "word-guess";
  const isSpyWord = room.gameType === "spy-word";
  const isThirudanPolice = room.gameType === "thirudan-police" || room.gameType === "raja-rani";
  const isRajaRaniTurns = room.gameType === "raja-rani-turns";
  const isTreasureHunt = room.gameType === "treasure-hunt";
  const isHandCricket = room.gameType === "hand-cricket";
  const isTeamHandCricket = room.handCricketMode === "team";
  const categories = room.boost?.categories || [];
  const showAddBot = isHost && (isBingo || isBoost || isTreasureHunt);
  const neededPlayers = Math.max(
    0,
    (isSpyWord
      ? spyWordMinPlayers
      : isTag || isGuessNumber || isWordGuess || isTreasureHunt
        ? 2
        : isThirudanPolice || isRajaRaniTurns
          ? 5
          : room.maxPlayers) - room.players.length
  );
  const readyLabel = canStart
    ? "Ready"
    : neededPlayers > 0
      ? `Need ${neededPlayers} player${neededPlayers === 1 ? "" : "s"}`
      : isBingo
        ? "Boards pending"
        : "Waiting";
  const settingBadges = [
    isBoost ? `${room.maxPlayers} players` : null,
    isBoost ? `${room.maxPlayers} card set` : null,
    isTag ? `${tagMaps[room.tag?.mapId] || "TAG Playground"}` : null,
    isTag ? `${room.tag?.roundSeconds || 60}s round` : null,
    isGuessNumber ? `${room.guessNumber?.min || 1}-${room.guessNumber?.max || 100}` : null,
    isWordGuess ? "5 letters" : null,
    isSpyWord ? `${room.spyWord?.difficulty || "easy"} difficulty` : null,
    isSpyWord ? `${spyWordTotalRounds} clue rounds` : null,
    isThirudanPolice ? "5 hidden roles" : null,
    isThirudanPolice ? "Police guess" : null,
    isThirudanPolice ? "10 rounds" : null,
    isRajaRaniTurns ? "Clockwise turns" : null,
    isRajaRaniTurns ? "10s timer" : null,
    isTreasureHunt ? "2-10 players" : null,
    isTreasureHunt ? "10 diamonds" : null,
    isTreasureHunt ? "25 bombs" : null,
    isTreasureHunt ? "3 lives" : null,
    isTreasureHunt ? "10s turns" : null,
    isHandCricket ? (isTeamHandCricket ? `Teams of ${room.handCricketTeamSize || 2}` : "Classic") : null
  ].filter(Boolean);

  return (
    <section className="surface p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4 text-mint" aria-hidden="true" />
            <h2 className="text-base font-extrabold">Room Settings</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                canStart ? "bg-mint text-white" : "bg-paper text-ink/60"
              }`}
            >
              {readyLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-xs font-extrabold text-white">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {room.players.length}/{room.maxPlayers}
            </span>
            {settingBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-md border border-ink/10 bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/70"
              >
                {badge}
              </span>
            ))}
          </div>

          {isBoost && categories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full bg-honey/20 px-2 py-0.5 text-[11px] font-extrabold text-ink"
                >
                  {category.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`grid gap-2 ${showAddBot ? "sm:grid-cols-2 lg:w-72" : "lg:w-40"}`}>
          {showAddBot ? (
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint disabled:bg-ink/10 disabled:text-ink/35"
              onClick={onAddBot}
              disabled={room.players.length >= room.maxPlayers}
              title="Add bot"
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              Add Bot
            </button>
          ) : null}

          {isHost ? (
            <button
              type="button"
              className="compact-button bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
              onClick={onStartGame}
              disabled={!canStart}
              title="Start game"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              Start Game
            </button>
          ) : (
            <div className="rounded-md border border-ink/10 bg-paper p-3 text-center text-sm font-bold text-ink/70">
              Waiting...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
