import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Shuffle } from "lucide-react";
import Board from "./Board.jsx";
import { generateBoard, validateBoard } from "../game/board.js";

function emptyDraft() {
  return Array.from({ length: 25 }, () => "");
}

function getDuplicateValues(board) {
  const counts = new Map();

  board.forEach((entry) => {
    if (String(entry).trim() === "") {
      return;
    }

    const value = Number(entry);

    if (!Number.isInteger(value) || value < 1 || value > 25) {
      return;
    }

    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

export default function BoardSetup({ initialBoard, onSave }) {
  const [mode, setMode] = useState("auto");
  const [autoDraft, setAutoDraft] = useState(() => initialBoard.length === 25 ? initialBoard : generateBoard());
  const [manualDraft, setManualDraft] = useState(() => emptyDraft());
  const [status, setStatus] = useState("");
  const draft = mode === "auto" ? autoDraft : manualDraft;
  const validation = useMemo(() => validateBoard(draft), [draft]);
  const duplicateValues = useMemo(() => getDuplicateValues(manualDraft), [manualDraft]);
  const filledCount = useMemo(
    () => manualDraft.filter((entry) => String(entry).trim() !== "").length,
    [manualDraft]
  );
  const manualMessage = duplicateValues.length
    ? `Duplicate number: ${duplicateValues.join(", ")}`
    : filledCount < 25
      ? `${filledCount}/25 filled`
      : validation.valid
        ? "Valid board"
        : validation.message;
  const statusMessage = status || (mode === "manual" ? manualMessage : validation.valid ? "Valid board" : validation.message);
  const statusClass = validation.valid ? "text-mint" : mode === "manual" && filledCount === 0 ? "text-ink/50" : "text-coral";

  useEffect(() => {
    if (mode === "auto" && initialBoard.length === 25) {
      setAutoDraft(initialBoard);
    }
  }, [initialBoard, mode]);

  const handleShuffle = () => {
    setStatus("");
    setAutoDraft(generateBoard());
  };

  const handleManualChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, 2);
    setStatus("");
    setManualDraft((current) => current.map((entry, entryIndex) => (entryIndex === index ? digits : entry)));
  };

  const handleManualReset = () => {
    setStatus("");
    setManualDraft(emptyDraft());
  };

  const handleSave = async () => {
    if (!validation.valid) {
      setStatus(validation.message);
      return;
    }

    const result = await onSave(validation.normalized);
    setStatus(result.ok ? "Board saved" : result.error);
  };

  return (
    <section className="surface p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-extrabold">Board</h2>

        <div className="flex rounded-md border border-ink/10 bg-paper p-1">
          <button
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-extrabold ${
              mode === "auto" ? "bg-ink text-white" : "text-ink/70"
            }`}
            onClick={() => {
              setMode("auto");
              if (!validateBoard(autoDraft).valid) {
                setAutoDraft(generateBoard());
              }
            }}
          >
            Auto
          </button>
          <button
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-extrabold ${
              mode === "manual" ? "bg-ink text-white" : "text-ink/70"
            }`}
            onClick={() => {
              setStatus("");
              setMode("manual");
            }}
          >
            Manual
          </button>
        </div>
      </div>

      {mode === "auto" ? (
        <div className="space-y-3">
          <Board board={draft.map(Number)} calledNumbers={[]} isMyTurn={false} gameEnded onCallNumber={() => {}} />
          <button
            type="button"
            className="compact-button border border-ink/15 bg-paper text-ink hover:border-mint hover:text-mint"
            onClick={handleShuffle}
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Shuffle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto grid w-full max-w-[26rem] bingo-grid gap-1.5">
            {manualDraft.map((value, index) => {
              const numericValue = Number(value);
              const hasValue = String(value).trim() !== "";
              const isDuplicate = hasValue && duplicateValues.includes(numericValue);
              const isOutOfRange = hasValue && (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 25);

              return (
                <input
                  key={index}
                  className={`aspect-square min-w-0 w-full rounded-md border text-center text-base font-extrabold outline-none transition focus:border-mint focus:bg-white sm:text-xl ${
                    isDuplicate || isOutOfRange
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-ink/15 bg-paper text-ink"
                  }`}
                  inputMode="numeric"
                  value={value}
                  onChange={(event) => handleManualChange(index, event.target.value)}
                  aria-label={`Cell ${index + 1}`}
                />
              );
            })}
          </div>
          <button
            type="button"
            className="compact-button border border-ink/15 bg-paper text-ink hover:border-coral hover:text-coral"
            onClick={handleManualReset}
            title="Clear board"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
        <span className={`text-xs font-bold ${statusClass}`}>
          {statusMessage}
        </span>
        <button
          type="button"
          className="compact-button bg-mint text-white hover:bg-mint/90 disabled:bg-ink/20"
          onClick={handleSave}
          disabled={!validation.valid}
          title="Ready"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Ready
        </button>
      </div>
    </section>
  );
}
