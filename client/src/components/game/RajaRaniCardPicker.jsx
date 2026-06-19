import { CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import cardBackImage from "../../images/optimized/cardbackside.webp";

export default function RajaRaniCardPicker({ cardPick, gameLabel = "Hidden Roles", session, onPickCard }) {
  const [pickingCardId, setPickingCardId] = useState("");
  const [status, setStatus] = useState("");
  const cards = cardPick?.cards || [];
  const isMyTurn = cardPick?.isViewerTurn || cardPick?.activePlayerId === session.playerId;
  const viewerHasPicked = Boolean(cardPick?.viewerHasPicked);
  const totalCount = cardPick?.totalCount || 5;
  const pickNumber = Math.min(cardPick?.pickNumber || 1, totalCount);
  const activePlayerName = cardPick?.activePlayerName || "Player";
  const title = isMyTurn
    ? "Your Turn"
    : viewerHasPicked
      ? "Card Locked"
      : `${activePlayerName} Picking`;
  const badge = isMyTurn ? "Pick Now" : viewerHasPicked ? "Picked" : "Waiting";
  const badgeClass = isMyTurn
    ? "bg-coral text-white"
    : viewerHasPicked
      ? "bg-mint text-white"
      : "bg-ink text-white";

  useEffect(() => {
    setPickingCardId("");
    setStatus("");
  }, [cardPick?.activePlayerId, cardPick?.remainingCount]);

  const handlePick = async (cardId) => {
    if (!isMyTurn || pickingCardId) {
      return;
    }

    setPickingCardId(cardId);
    setStatus("");
    const result = await onPickCard(cardId);

    if (!result.ok) {
      setStatus(result.error);
      setPickingCardId("");
    }
  };

  return (
    <div
      className={`rounded-md border p-3 ${
        isMyTurn ? "border-coral bg-coral/5" : "border-ink/10 bg-paper"
      }`}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">
            {gameLabel} - Pick {pickNumber} / {totalCount}
          </p>
          <h3 className="text-xl font-extrabold text-ink">{title}</h3>
        </div>
        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${badgeClass}`}>
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {badge}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => {
          const isPicking = pickingCardId === card.id;

          return (
            <button
              key={card.id}
              type="button"
              className={`relative aspect-[3/4] min-h-36 overflow-hidden rounded-md border bg-ink shadow-soft transition ${
                isMyTurn
                  ? "cursor-pointer border-honey hover:-translate-y-1 hover:border-coral"
                  : "cursor-not-allowed border-ink/10 opacity-70"
              } ${isPicking ? "boost-card-selected ring-2 ring-coral ring-offset-2 ring-offset-paper" : ""}`}
              onClick={() => handlePick(card.id)}
              disabled={!isMyTurn || Boolean(pickingCardId)}
              aria-label={`${gameLabel} card ${card.position}`}
            >
              <img
                src={cardBackImage}
                alt=""
                decoding="async"
                loading="eager"
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>

      {cards.length === 0 ? (
        <div className="grid min-h-36 place-items-center rounded-md border border-ink/10 bg-white p-4 text-center">
          <div>
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-mint" aria-hidden="true" />
            <p className="text-sm font-extrabold text-ink">Cards Locked</p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        {(cardPick?.order || []).map((entry) => (
          <div
            key={entry.playerId}
            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-extrabold ${
              entry.active
                ? "border-coral bg-coral text-white"
                : entry.picked
                  ? "border-mint bg-mint/10 text-mint"
                  : "border-ink/10 bg-white text-ink/55"
            }`}
          >
            {entry.picked ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
            <span className="min-w-0 truncate">
              {entry.pickNumber}. {entry.playerName}
            </span>
          </div>
        ))}
      </div>

      {status ? <p className="mt-3 text-xs font-bold text-coral">{status}</p> : null}
    </div>
  );
}
