import { X as XIcon } from "lucide-react";

export default function Cell({ number, called, latest, clickable, onClick, animateCall = true }) {
  const baseClasses =
    "relative aspect-square w-full overflow-hidden rounded-md border text-center text-base font-extrabold transition sm:text-xl";
  const stateClasses = called
    ? "border-coral bg-coral text-white shadow-soft"
    : clickable
      ? "border-ink/20 bg-white text-ink hover:-translate-y-0.5 hover:border-mint hover:bg-mint/10"
      : "border-ink/15 bg-white text-ink";

  return (
    <button
      type="button"
      className={`${baseClasses} ${stateClasses} ${latest && animateCall ? "strike-pop" : ""}`}
      disabled={!clickable}
      onClick={() => onClick(number)}
      aria-label={called ? `${number} called` : `Call ${number}`}
    >
      {called ? (
        <>
          <XIcon className="mx-auto h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          {latest && animateCall ? (
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-1 w-full rounded-full bg-white/85"
              style={{ animation: "strike-line 360ms ease-out both" }}
              aria-hidden="true"
            />
          ) : null}
          <span className="absolute bottom-0.5 right-0.5 rounded bg-white/20 px-1 text-[9px] font-bold leading-4">
            {number}
          </span>
        </>
      ) : (
        number
      )}
    </button>
  );
}
