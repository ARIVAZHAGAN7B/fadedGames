import { CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import cardBackImage from "../../images/optimized/cardbackside.webp";

export default function RajaRaniCardPicker({ cardPick, session, onPickCard }) {
  const [pickingCardId, setPickingCardId] = useState("");
  const [status, setStatus] = useState("");
  const cards = cardPick?.cards || [];
  const isMyTurn = cardPick?.activePlayerId === session.playerId;

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
    <div className="rounded-md border border-ink/10 bg-paper p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">
            Pick {Math.min(cardPick?.pickNumber || 1, cardPick?.totalCount || 5)} / {cardPick?.totalCount || 5}
          </p>
          <h3 className="text-xl font-extrabold text-ink">
            {isMyTurn ? "Choose Your Card" : `${cardPick?.activePlayerName || "Player"} is choosing`}
          </h3>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-extrabold text-white">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {cards.length} cards
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
                  ? "border-honey hover:-translate-y-1 hover:border-coral"
                  : "border-ink/10 opacity-85"
              } ${isPicking ? "boost-card-selected ring-2 ring-coral ring-offset-2 ring-offset-paper" : ""}`}
              onClick={() => handlePick(card.id)}
              disabled={!isMyTurn || Boolean(pickingCardId)}
              aria-label={`Card ${card.position}`}
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
