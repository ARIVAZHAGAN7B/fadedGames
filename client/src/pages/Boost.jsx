import {
  ArrowRight,
  Check,
  Clock,
  Send,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  GamePage,
  ResultActions,
  RoomHeader,
  StatusMessage
} from "../components/game/GameLayout.jsx";
import { useNow } from "../hooks/useNow.js";
import { formatSeconds, getTimeLeft } from "../utils/time.js";

const toneClasses = {
  coral: {
    card: "border-coral bg-coral/10 text-coral",
    badge: "bg-coral text-white",
    soft: "bg-coral/10 text-coral"
  },
  mint: {
    card: "border-mint bg-mint/10 text-mint",
    badge: "bg-mint text-white",
    soft: "bg-mint/10 text-mint"
  },
  honey: {
    card: "border-honey bg-honey/20 text-ink",
    badge: "bg-honey text-ink",
    soft: "bg-honey/20 text-ink"
  },
  ink: {
    card: "border-ink bg-ink text-white",
    badge: "bg-ink text-white",
    soft: "bg-ink/10 text-ink"
  }
};

function getCategoryMeta(categories = [], categoryId = "") {
  return categories.find((category) => category.id === categoryId) || {
    id: categoryId,
    label: categoryId || "Card",
    short: "?",
    tone: "ink"
  };
}

function getCardMeta(categories, card) {
  if (!card) {
    return getCategoryMeta(categories, "");
  }

  return {
    ...getCategoryMeta(categories, card.category),
    ...card
  };
}

function BoostCard({ card, categories, selected = false, disabled = false, onClick, compact = false }) {
  const meta = getCardMeta(categories, card);
  const tone = toneClasses[meta.tone] || toneClasses.ink;
  const clickable = typeof onClick === "function" && !disabled;

  return (
    <button
      type="button"
      className={`relative flex aspect-[3/4] min-h-32 flex-col justify-between overflow-hidden rounded-md border-2 p-3 text-left shadow-soft transition ${
        tone.card
      } ${selected ? "boost-card-selected scale-[1.02] ring-2 ring-coral ring-offset-2 ring-offset-paper" : ""} ${
        clickable ? "hover:-translate-y-1 active:scale-[0.98]" : "cursor-default"
      } ${disabled && !selected ? "opacity-80" : ""} ${compact ? "min-h-24 p-2" : ""}`}
      onClick={clickable ? onClick : undefined}
      disabled={disabled && !selected}
      aria-pressed={selected}
    >
      <span className="relative z-10 flex items-center justify-between gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-extrabold ${tone.badge}`}>
          {meta.short}
        </span>
        {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
      </span>
      <span className="relative z-10 text-center text-5xl font-extrabold leading-none sm:text-6xl">
        {meta.short}
      </span>
      <span className="relative z-10 truncate text-sm font-extrabold">{meta.label}</span>
      <span className="pointer-events-none absolute -right-8 top-8 h-28 w-28 rotate-12 rounded-md bg-white/30" />
    </button>
  );
}

function PlayerStatus({ player, isMe, active, handCount, currentTransfer }) {
  return (
    <div
      className={`rounded-md border p-3 transition ${
        active ? "border-honey bg-honey/15" : isMe ? "border-coral bg-coral/5" : "border-ink/10 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold">
            {player.name}
            {isMe ? " (You)" : ""}
          </h3>
          <p className="text-xs font-extrabold uppercase text-ink/45">{handCount || 0} cards</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
            active ? "bg-honey text-ink" : "bg-ink/10 text-ink/55"
          }`}
        >
          {active ? <Zap className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
          {active ? "Turn" : "Waiting"}
        </span>
      </div>
      {currentTransfer ? (
        <p className="truncate text-xs font-bold text-ink/55">
          {currentTransfer.sentCard
            ? `Dropped ${currentTransfer.sentCard.label || "card"}`
            : `Received ${currentTransfer.receivedCard?.label || "card"}`}
        </p>
      ) : null}
    </div>
  );
}

function CategoryTracker({ categories, counts, targetCount }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {categories.map((category) => {
        const tone = toneClasses[category.tone] || toneClasses.ink;
        const count = counts?.[category.id] || 0;

        return (
          <div key={category.id} className={`rounded-md px-3 py-2 ${tone.soft}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-extrabold uppercase">{category.label}</span>
              <span className="text-sm font-extrabold">{count}/{targetCount}</span>
            </div>
            <div
              className="mt-2 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${targetCount}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: targetCount }).map((_, index) => (
                <span
                  key={index}
                  className={`h-2 rounded-full ${index < count ? tone.badge : "bg-white/70"}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Boost({
  room,
  session,
  onSelectCard,
  onClaimBoost,
  onRestartGame,
  onLeaveRoom
}) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [status, setStatus] = useState("");
  const isHost = room.host === session.playerId;
  const state = room.boost || {};
  const now = useNow({
    enabled: !room.gameEnded && (state.phase === "selecting" || Boolean(state.falseBoostCooldownUntil))
  });
  const categories = state.categories || [];
  const hand = state.hand || [];
  const myCounts = state.viewerCounts || {};
  const targetCount = state.targetCount || categories.length || room.maxPlayers || 4;
  const hasBoost = Object.values(myCounts).some((count) => count >= targetCount);
  const activePlayer = room.players.find((player) => player.playerId === state.activePlayerId) || null;
  const isMyTurn = state.activePlayerId === session.playerId;
  const cooldownLeftMs = state.falseBoostCooldownUntil
    ? getTimeLeft(state.falseBoostCooldownUntil, now)
    : state.falseBoostCooldownLeftMs || 0;
  const phaseDeadline = state.phase === "selecting" ? state.selectDeadlineAt : null;
  const phaseLeftMs = getTimeLeft(phaseDeadline, now);
  const canSelect = state.phase === "selecting" && isMyTurn && !room.gameEnded;
  const canDrop = canSelect && Boolean(selectedCardId);
  const canClaim = !room.gameEnded && cooldownLeftMs <= 0;
  const transfer = state.lastTransfer || null;
  const winnerCategory = getCategoryMeta(categories, room.winner?.category || state.winnerCategory);
  const falseBoosts = [...(state.falseBoosts || [])].reverse();

  useEffect(() => {
    setSelectedCardId("");
  }, [state.moveId, state.phase]);

  const handleDrop = async () => {
    if (!canDrop) {
      return;
    }

    setStatus("");
    const result = await onSelectCard(selectedCardId);

    if (!result.ok) {
      setStatus(result.error);
    }
  };

  const handleClaim = async () => {
    if (!canClaim) {
      return;
    }

    setStatus("");
    const result = await onClaimBoost();

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    if (!result.valid) {
      setStatus(`False BOOST. Cooldown ${formatSeconds(result.cooldownMs || 0)}s`);
    }
  };

  const handleRestart = async () => {
    const result = await onRestartGame();

    if (!result.ok) {
      setStatus(result.error);
    }
  };

  if (room.gameEnded) {
    return (
      <GamePage overflowHidden>
          <RoomHeader
            room={room}
            codeLabel="BO"
            eyebrow="BOOST Result"
            showCopy={false}
            showLeave={false}
          />

          <section className="grid gap-3 lg:grid-cols-[1fr_21rem]">
            <div className="surface result-card relative overflow-hidden border-honey p-5 text-center">
              <Zap className="winner-trophy mx-auto mb-2 h-12 w-12 text-honey" aria-hidden="true" />
              <p className="text-xs font-extrabold uppercase text-ink/50">BOOST</p>
              <h2 className="text-3xl font-extrabold text-ink">{room.winner?.name || "Round ended"}</h2>
              {room.winner?.byForfeit ? (
                <p className="mt-2 text-sm font-bold text-ink/55">Won by forfeit</p>
              ) : (
                <div
                  className="mx-auto mt-5 grid max-w-xl gap-2"
                  style={{ gridTemplateColumns: `repeat(${Math.min(targetCount, 4)}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: targetCount }).map((_, index) => (
                    <BoostCard
                      key={index}
                      card={{
                        id: `${winnerCategory.id}-${index}`,
                        category: winnerCategory.id,
                        label: winnerCategory.label,
                        short: winnerCategory.short,
                        tone: winnerCategory.tone
                      }}
                      categories={categories}
                      disabled
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="surface h-fit p-3">
              <h2 className="mb-3 text-base font-extrabold">Match Actions</h2>
              <ResultActions
                onLeaveRoom={onLeaveRoom}
                onRestart={handleRestart}
                restartDisabled={!isHost}
                layoutClassName="flex flex-col gap-2"
              />
              {!isHost ? (
                <p className="mt-2 text-center text-xs font-bold text-ink/55">Waiting for host</p>
              ) : null}
            </aside>
          </section>
      </GamePage>
    );
  }

  return (
    <GamePage>
      <RoomHeader
        room={room}
        codeLabel="BO"
        eyebrow="BOOST Room"
        onStatus={setStatus}
        onLeaveRoom={onLeaveRoom}
      />

        <StatusMessage status={status} />

        <section className="grid gap-3 lg:grid-cols-[1fr_21rem]">
          <div className="space-y-3">
            <section className="surface p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase text-ink/50">Round {state.round || 1}</p>
                  <h2 className="text-2xl font-extrabold">
                    {isMyTurn ? "Drop one card" : `${activePlayer?.name || "Player"} is choosing`}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-extrabold ${
                      phaseLeftMs <= 3000 && state.phase === "selecting"
                        ? "tag-timer-pulse bg-coral text-white"
                        : "bg-honey text-ink"
                    }`}
                  >
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {formatSeconds(phaseLeftMs)}s
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-white">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Turn {state.turnNumber || 1}
                  </span>
                </div>
              </div>

              {transfer ? (
                <div className="boost-pass-card mb-3 grid gap-2 rounded-md border border-mint/30 bg-mint/10 p-3 text-sm font-bold text-ink sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  {transfer.sentCard ? (
                    <span className="truncate">
                      Dropped {transfer.sentCard.label || "card"} to {transfer.sentToPlayerName}
                    </span>
                  ) : (
                    <span className="truncate">Waiting for your drop</span>
                  )}
                  <ArrowRight className="hidden h-4 w-4 text-mint sm:block" aria-hidden="true" />
                  {transfer.receivedCard ? (
                    <span className="truncate">
                      Received {transfer.receivedCard.label || "card"} from {transfer.receivedFromPlayerName}
                    </span>
                  ) : (
                    <span className="truncate">Next player receives it</span>
                  )}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-4">
                {hand.map((card) => (
                  <BoostCard
                    key={card.id}
                    card={card}
                    categories={categories}
                    selected={selectedCardId === card.id}
                    disabled={!canSelect}
                    onClick={() => setSelectedCardId(card.id)}
                  />
                ))}
              </div>
            </section>

            <section className="surface p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold">Collection</h2>
                {hasBoost ? (
                  <span className="boost-ready-pulse rounded-full bg-mint px-2.5 py-1 text-xs font-extrabold text-white">
                    Ready
                  </span>
                ) : null}
              </div>
              <CategoryTracker categories={categories} counts={myCounts} targetCount={targetCount} />
            </section>
          </div>

          <aside className="space-y-3">
            <section className="surface p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold">Actions</h2>
                {isMyTurn ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-honey">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                    Your turn
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="compact-button mb-2 w-full border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint disabled:bg-ink/10 disabled:text-ink/35"
                onClick={handleDrop}
                disabled={!canDrop}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Drop In
              </button>
              <button
                type="button"
                className={`compact-button w-full text-white disabled:bg-ink/20 ${
                  hasBoost ? "boost-ready-pulse bg-mint hover:bg-mint/90" : "bg-coral hover:bg-coral/90"
                }`}
                onClick={handleClaim}
                disabled={!canClaim}
              >
                <Zap className="h-5 w-5" aria-hidden="true" />
                {cooldownLeftMs > 0 ? `${formatSeconds(cooldownLeftMs)}s` : "BOOST"}
              </button>
            </section>

            <section className="surface p-3">
              <h2 className="mb-3 text-base font-extrabold">Players</h2>
              <div className="space-y-2">
                {room.players.map((player) => (
                  <PlayerStatus
                    key={player.playerId}
                    player={player}
                    isMe={player.playerId === session.playerId}
                    active={player.playerId === state.activePlayerId}
                    handCount={state.handCounts?.[player.playerId]}
                    currentTransfer={player.playerId === session.playerId ? transfer : null}
                  />
                ))}
              </div>
            </section>

            {falseBoosts.length > 0 ? (
              <section className="surface p-3">
                <h2 className="mb-2 text-base font-extrabold">False BOOST</h2>
                <div className="space-y-1.5">
                  {falseBoosts.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-paper px-2.5 py-2 text-xs font-bold"
                    >
                      <span className="truncate">{entry.playerName}</span>
                      <span className="shrink-0 text-coral">Round {entry.round}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </section>
    </GamePage>
  );
}
