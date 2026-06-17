import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, DoorOpen, Sparkles, Trophy } from "lucide-react";
import Board from "../components/Board.jsx";
import TurnIndicator from "../components/TurnIndicator.jsx";
import { countCompletedLines, getBoardSize } from "../game/board.js";
import { buildRoomLink } from "../utils/roomLink.js";

const CALL_ANIMATION_STORAGE_KEY = "bingo-call-animations";
const KEYBOARD_CALL_DELAY_MS = 420;

function readCallAnimationPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(CALL_ANIMATION_STORAGE_KEY) !== "off";
}

function isEditableTarget(target) {
  const element = target instanceof HTMLElement ? target : null;

  if (!element) {
    return false;
  }

  return (
    element.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)
  );
}

function getDigitFromKeyboardEvent(event) {
  if (event.key.length === 1 && event.key >= "0" && event.key <= "9") {
    return Number(event.key);
  }

  const codeMatch = String(event.code || "").match(/^(?:Digit|Numpad)([0-9])$/);

  if (codeMatch) {
    return Number(codeMatch[1]);
  }

  const legacyCode = event.which || event.keyCode;

  if (legacyCode >= 48 && legacyCode <= 57) {
    return legacyCode - 48;
  }

  if (legacyCode >= 96 && legacyCode <= 105) {
    return legacyCode - 96;
  }

  return null;
}

export default function Game({ room, session, board, onCallNumber, onClaimBingo, onLeaveRoom }) {
  const [status, setStatus] = useState("");
  const [callAnimationsEnabled, setCallAnimationsEnabled] = useState(readCallAnimationPreference);
  const keyboardCallTimerRef = useRef(null);
  const keyboardBufferRef = useRef("");
  const isMyTurn = room.currentPlayerId === session.playerId && !room.gameEnded;
  const boardSize = useMemo(() => room.boardSize || getBoardSize(room.players.length), [room.boardSize, room.players.length]);
  const requiredLines = boardSize;
  const completedLines = useMemo(
    () => countCompletedLines(board, room.calledNumbers, boardSize),
    [board, room.calledNumbers, boardSize]
  );
  const calledNumberSet = useMemo(
    () => new Set(room.calledNumbers.map((number) => Number(number))),
    [room.calledNumbers]
  );
  const availableKeyboardNumbers = useMemo(
    () =>
      board
        .map((number) => Number(number))
        .filter((number) => Number.isInteger(number) && !calledNumberSet.has(number)),
    [board, calledNumberSet]
  );

  const calledNumbers = [...room.calledNumbers].reverse();
  const maxNumber = boardSize * boardSize;
  const maxKeyboardDigits = String(maxNumber).length;

  const clearKeyboardCallTimer = () => {
    if (keyboardCallTimerRef.current) {
      window.clearTimeout(keyboardCallTimerRef.current);
      keyboardCallTimerRef.current = null;
    }
  };

  const clearKeyboardBuffer = () => {
    clearKeyboardCallTimer();
    keyboardBufferRef.current = "";
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

  const handleCallNumber = async (number) => {
    const result = await onCallNumber(number);

    if (!result.ok) {
      setStatus(result.error);
    } else {
      setStatus("");
    }
  };

  const toggleCallAnimations = () => {
    setCallAnimationsEnabled((enabled) => {
      const nextEnabled = !enabled;
      window.localStorage.setItem(CALL_ANIMATION_STORAGE_KEY, nextEnabled ? "on" : "off");
      return nextEnabled;
    });
  };

  useEffect(() => {
    if (!isMyTurn || room.gameEnded) {
      clearKeyboardBuffer();
      return undefined;
    }

    const commitKeyboardNumber = (number) => {
      clearKeyboardBuffer();

      if (!availableKeyboardNumbers.includes(number)) {
        setStatus(calledNumberSet.has(number) ? "That number was already called." : `Choose a number from 1 to ${maxNumber}.`);
        return;
      }

      handleCallNumber(number);
    };

    const scheduleKeyboardNumber = (number) => {
      clearKeyboardCallTimer();
      keyboardCallTimerRef.current = window.setTimeout(() => {
        commitKeyboardNumber(number);
      }, KEYBOARD_CALL_DELAY_MS);
    };

    const hasLongerMatch = (prefix) =>
      availableKeyboardNumbers.some((number) => {
        const label = String(number);

        return label.startsWith(prefix) && label.length > prefix.length;
      });

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        clearKeyboardBuffer();
        return;
      }

      if (event.key === "Enter" && keyboardBufferRef.current) {
        event.preventDefault();
        commitKeyboardNumber(Number(keyboardBufferRef.current));
        return;
      }

      if (event.key === "Backspace" && keyboardBufferRef.current) {
        event.preventDefault();
        keyboardBufferRef.current = keyboardBufferRef.current.slice(0, -1);

        if (!keyboardBufferRef.current) {
          clearKeyboardCallTimer();
        }

        return;
      }

      const digit = getDigitFromKeyboardEvent(event);

      if (digit === null) {
        return;
      }

      event.preventDefault();

      if (!keyboardBufferRef.current && digit === 0) {
        setStatus(`Choose a number from 1 to ${maxNumber}.`);
        clearKeyboardBuffer();
        return;
      }

      const nextBuffer = `${keyboardBufferRef.current}${digit}`.slice(0, maxKeyboardDigits);
      const number = Number(nextBuffer);

      if (!Number.isInteger(number) || number < 1 || number > maxNumber) {
        setStatus(`Choose a number from 1 to ${maxNumber}.`);
        clearKeyboardBuffer();
        return;
      }

      keyboardBufferRef.current = nextBuffer;

      if (hasLongerMatch(nextBuffer)) {
        scheduleKeyboardNumber(number);
        return;
      }

      commitKeyboardNumber(number);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearKeyboardBuffer();
    };
  }, [
    availableKeyboardNumbers,
    calledNumberSet,
    handleCallNumber,
    isMyTurn,
    maxKeyboardDigits,
    maxNumber,
    room.gameEnded
  ]);

  const handleClaimBingo = async () => {
    const result = await onClaimBingo();

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    if (!result.valid) {
      setStatus(`${result.completedLines}/${requiredLines} lines`);
    }
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              BI
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">Bingo Room</p>
              <h1 className="text-2xl font-extrabold text-ink">{room.roomName}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`compact-button border border-ink/15 ${
                callAnimationsEnabled ? "bg-honey text-ink" : "bg-white text-ink/55"
              }`}
              onClick={toggleCallAnimations}
              title={callAnimationsEnabled ? "Disable click animation" : "Enable click animation"}
              aria-label={callAnimationsEnabled ? "Disable click animation" : "Enable click animation"}
              aria-pressed={callAnimationsEnabled}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-paper font-extrabold"
              onClick={handleCopy}
              title="Copy room link"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {room.roomCode}
            </button>
            <button
              type="button"
              className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
              onClick={onLeaveRoom}
              title="Leave room"
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Leave
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1fr_19rem] xl:grid-cols-[1fr_21rem]">
          <div className="surface p-3">
            <Board
              board={board}
              calledNumbers={room.calledNumbers}
              boardSize={boardSize}
              isMyTurn={isMyTurn}
              gameEnded={room.gameEnded}
              onCallNumber={handleCallNumber}
              animateCalls={callAnimationsEnabled}
            />
          </div>

          <aside className="space-y-3">
            <TurnIndicator room={room} isMyTurn={isMyTurn} />

            <section className="surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold">Lines</h2>
                <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink">
                  {completedLines}/{requiredLines}
                </span>
              </div>
              <button
                type="button"
                className="compact-button w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                onClick={handleClaimBingo}
                disabled={room.gameEnded}
              >
                <Trophy className="h-5 w-5" aria-hidden="true" />
                BINGO
              </button>
              {status ? <p className="mt-2 text-xs font-bold text-coral">{status}</p> : null}
            </section>

            <section className="surface p-3">
              <h2 className="mb-2 text-base font-extrabold">Called Numbers</h2>
              <div className="flex max-h-44 flex-wrap gap-1.5 overflow-auto pr-1">
                {calledNumbers.length > 0 ? (
                  calledNumbers.map((number, index) => (
                    <span
                      key={`${number}-${calledNumbers.indexOf(number)}`}
                      className={`number-pill rounded-md px-2 py-1.5 text-center text-sm font-extrabold text-white ${
                        index === 0 ? `${callAnimationsEnabled ? "latest-pill " : ""}bg-coral` : "bg-ink"
                      }`}
                    >
                      {number}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-bold text-ink/50">Waiting...</span>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
