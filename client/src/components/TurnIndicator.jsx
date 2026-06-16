import { Hash } from "lucide-react";

export default function TurnIndicator({ room, isMyTurn }) {
  return (
    <section className="surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase text-ink/50">Turn</p>
          <h2 className="text-xl font-extrabold">{room.currentPlayerName || "Waiting"}</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
            isMyTurn ? "bg-mint text-white" : "bg-paper text-ink/70"
          }`}
        >
          {isMyTurn ? "Your turn" : "Live"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-bold text-ink/70">
        <Hash className="h-4 w-4" aria-hidden="true" />
        <span>{room.calledNumbers.length} called</span>
      </div>
    </section>
  );
}
