import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Shuffle } from "lucide-react";
import Board from "./Board.jsx";
import { generateBoard, validateBoard, getBoardSize } from "../game/board.js";

function emptyDraft(boardSize) {
  return Array.from({ length: boardSize * boardSize }, () => "");
}

function getDuplicateValues(board, boardSize) {
  const maxValue = boardSize * boardSize;
  const counts = new Map();

  board.forEach((entry) => {
    if (String(entry).trim() === "") {
      return;
    }

    const value = Number(entry);

    if (!Number.isInteger(value) || value < 1 || value > maxValue) {
      return;
    }

    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

export default function BoardSetup({ initialBoard, numPlayers, onSave }) {
  const boardSize = useMemo(() => getBoardSize(numPlayers), [numPlayers]);
  const boardCells = boardSize * boardSize;
  const maxValue = boardCells;
  
  const [mode, setMode] = useState("auto");
  const [autoDraft, setAutoDraft] = useState(() => initialBoard.length === boardCells ? initialBoard : generateBoard(boardSize));
  const [manualDraft, setManualDraft] = useState(() => emptyDraft(boardSize));
  const [status, setStatus] = useState("");
  const draft = mode === "auto" ? autoDraft : manualDraft;
  const validation = useMemo(() => validateBoard(draft, boardSize), [draft, boardSize]);
  const duplicateValues = useMemo(() => getDuplicateValues(manualDraft, boardSize), [manualDraft, boardSize]);
  const filledCount = useMemo(
    () => manualDraft.filter((entry) => String(entry).trim() !== "").length,
    [manualDraft]
  );
  const manualMessage = duplicateValues.length
    ? `Duplicate number: ${duplicateValues.join(", ")}`
    : filledCount < boardCells
      ? `${filledCount}/${boardCells} filled`
      : validation.valid
        ? "Valid board"
        : validation.message;
  const statusMessage = status || (mode === "manual" ? manualMessage : validation.valid ? "Valid board" : validation.message);
  const statusClass = validation.valid ? "text-mint" : mode === "manual" && filledCount === 0 ? "text-ink/50" : "text-coral";

  useEffect(() => {
    if (mode === "auto" && initialBoard.length === boardCells) {
      setAutoDraft(initialBoard);
    }
  }, [initialBoard, mode, boardCells]);

  // Reset drafts when board size changes
  useEffect(() => {
    setAutoDraft(generateBoard(boardSize));
    setManualDraft(emptyDraft(boardSize));
  }, [boardSize]);

  const handleShuffle = () => {
    setStatus("");
    setAutoDraft(generateBoard(boardSize));
  };

  const handleManualChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, String(maxValue).length);
    setStatus("");
    setManualDraft((current) => current.map((entry, entryIndex) => (entryIndex === index ? digits : entry)));
  };

  const handleManualReset = () => {
    setStatus("");
    setManualDraft(emptyDraft(boardSize));
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
              if (!validateBoard(autoDraft, boardSize).valid) {
                setAutoDraft(generateBoard(boardSize));
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
          <Board
            board={draft.map(Number)}
            boardSize={boardSize}
            calledNumbers={[]}
            isMyTurn={false}
            gameEnded
            onCallNumber={() => {}}
          />
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
          <div
            className="mx-auto grid w-full max-w-[26rem] gap-1.5"
            style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
          >
            {manualDraft.map((value, index) => {
              const numericValue = Number(value);
              const hasValue = String(value).trim() !== "";
              const isDuplicate = hasValue && duplicateValues.includes(numericValue);
              const isOutOfRange = hasValue && (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > maxValue);

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
