import {
  Check,
  Clock,
  CornerDownLeft,
  Delete,
  Eye,
  KeyRound,
  Lock,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  GamePage,
  ResultActions,
  RestartButton,
  RoomHeader,
  StatusMessage
} from "../components/game/GameLayout.jsx";
import { useNow } from "../hooks/useNow.js";
import { formatSeconds, getTimeLeft } from "../utils/time.js";

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const feedbackRank = {
  absent: 1,
  present: 2,
  correct: 3
};

function cleanWord(value, length = 5) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, length);
}

function getPlayerEntries(state, playerId) {
  return [...(state.guesses || [])]
    .filter((entry) => entry.playerId === playerId)
    .sort((first, second) => first.round - second.round || first.createdAt - second.createdAt);
}

function getRoundEntry(state, playerId) {
  return getPlayerEntries(state, playerId).find((entry) => entry.round === state.round) || null;
}

function getRevealedWord(state, playerId) {
  return (state.revealedSecrets || []).find((entry) => entry.playerId === playerId)?.word || "";
}

function getTileClass(status, highContrast) {
  if (highContrast && status === "correct") {
    return "word-cell-correct-hc border-ink text-white";
  }

  if (highContrast && status === "present") {
    return "word-cell-present-hc border-ink text-ink";
  }

  if (highContrast && status === "absent") {
    return "word-cell-absent-hc border-ink text-white";
  }

  if (status === "correct") {
    return "border-mint bg-mint text-white";
  }

  if (status === "present") {
    return "border-honey bg-honey text-ink";
  }

  if (status === "absent") {
    return "border-ink/25 bg-[#6f7780] text-white";
  }

  if (status === "timeout") {
    return "border-coral bg-coral/10 text-coral";
  }

  return "border-ink/15 bg-white text-ink";
}

function getKeyboardClass(status, highContrast) {
  if (!status) {
    return "border-ink/10 bg-white text-ink hover:border-mint";
  }

  if (highContrast) {
    return getTileClass(status, true);
  }

  return getTileClass(status, false);
}

function getStatusMark(status) {
  if (status === "correct") {
    return "C";
  }

  if (status === "present") {
    return "P";
  }

  if (status === "absent") {
    return "X";
  }

  return "";
}

function buildKeyboardState(entries) {
  const state = {};

  for (const entry of entries) {
    if (entry.status !== "submitted") {
      continue;
    }

    for (let index = 0; index < entry.guess.length; index += 1) {
      const letter = entry.guess[index];
      const status = entry.feedback?.[index];

      if (!letter || !status) {
        continue;
      }

      if (!state[letter] || feedbackRank[status] > feedbackRank[state[letter]]) {
        state[letter] = status;
      }
    }
  }

  return state;
}

function WordRow({ entry, length, highContrast }) {
  const timeoutLetters = "TIMED".split("");
  const letters =
    entry?.status === "timeout"
      ? timeoutLetters
      : cleanWord(entry?.guess || "", length).padEnd(length, " ").split("");

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Array.from({ length }).map((_, index) => {
        const status = entry?.status === "timeout" ? "timeout" : entry?.feedback?.[index] || "empty";
        const mark = highContrast ? getStatusMark(status) : "";

        return (
          <div
            key={index}
            className={`relative flex h-12 min-h-11 w-12 min-w-11 items-center justify-center rounded-md border text-xl font-extrabold ${getTileClass(
              status,
              highContrast
            )}`}
          >
            {letters[index].trim()}
            {mark ? (
              <span className="absolute bottom-0.5 right-1 text-[9px] font-extrabold leading-none">
                {mark}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function GuessGrid({ entries, maxAttempts, wordLength, highContrast }) {
  return (
    <div className="mx-auto grid w-fit gap-1.5">
      {Array.from({ length: maxAttempts }).map((_, index) => (
        <WordRow
          key={index}
          entry={entries[index] || null}
          length={wordLength}
          highContrast={highContrast}
        />
      ))}
    </div>
  );
}

function OnScreenKeyboard({ keyboardState, disabled, highContrast, onKey }) {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-1.5">
      {keyboardRows.map((row, rowIndex) => (
        <div key={row} className="flex justify-center gap-1.5">
          {rowIndex === 2 ? (
            <button
              type="button"
              className="flex h-11 min-w-12 items-center justify-center rounded-md border border-ink/10 bg-white px-2 text-xs font-extrabold text-ink transition hover:border-mint disabled:opacity-45"
              disabled={disabled}
              onClick={() => onKey("ENTER")}
              title="Enter"
              aria-label="Enter"
            >
              <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}

          {row.split("").map((letter) => (
            <button
              key={letter}
              type="button"
              className={`flex h-11 min-w-7 flex-1 items-center justify-center rounded-md border px-1 text-sm font-extrabold transition disabled:opacity-45 sm:min-w-10 sm:flex-none ${getKeyboardClass(
                keyboardState[letter],
                highContrast
              )}`}
              disabled={disabled}
              onClick={() => onKey(letter)}
              title={letter}
              aria-label={letter}
            >
              {letter}
            </button>
          ))}

          {rowIndex === 2 ? (
            <button
              type="button"
              className="flex h-11 min-w-12 items-center justify-center rounded-md border border-ink/10 bg-white px-2 text-xs font-extrabold text-ink transition hover:border-coral disabled:opacity-45"
              disabled={disabled}
              onClick={() => onKey("BACKSPACE")}
              title="Backspace"
              aria-label="Backspace"
            >
              <Delete className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MatchScore({ room, state, session }) {
  const players = room.players;

  return (
    <section className="surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold">Score</h2>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/60">
          Best of 3
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {players.map((player) => (
          <div key={player.playerId} className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
            <span className="truncate text-sm font-extrabold">
              {player.name}
              {player.playerId === session.playerId ? " (You)" : ""}
            </span>
            <span className="rounded bg-white px-2 py-0.5 text-sm font-extrabold text-ink">
              {state.matchWins?.[player.playerId] || 0}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-extrabold text-ink/65">
        Round {state.phase === "guessing" ? state.round : Math.min(state.round || 0, state.maxAttempts || 6)}/
        {state.maxAttempts || 6}
      </div>
    </section>
  );
}

function PlayerProgress({ room, state, session }) {
  const readyPlayerIds = new Set(state.readyPlayerIds || []);

  return (
    <section className="surface p-3">
      <h2 className="mb-2 text-base font-extrabold">Players</h2>
      <div className="space-y-2">
        {room.players.map((player) => {
          const entries = getPlayerEntries(state, player.playerId);
          const currentEntry = getRoundEntry(state, player.playerId);
          const isMe = player.playerId === session.playerId;
          const phaseLabel =
            state.phase === "selecting"
              ? readyPlayerIds.has(player.playerId)
                ? "Locked"
                : "Picking"
              : state.phase === "locked"
                ? "Locked"
                : state.phase === "guessing"
                  ? currentEntry
                    ? "Submitted"
                    : `Attempt ${state.round || 1}`
                  : "Reveal";

          return (
            <div key={player.playerId} className="rounded-md bg-paper px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-bold">
                  {player.name}
                  {isMe ? " (You)" : ""}
                </span>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-ink/55">
                  {phaseLabel}
                </span>
              </div>
              {!isMe ? (
                <p className="mt-1 text-xs font-extrabold text-ink/50">
                  {player.name} is on attempt {state.phase === "guessing" ? state.round : Math.max(entries.length, 1)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RevealPanel({ room, state, highContrast }) {
  return (
    <section className="surface result-card border-honey p-4">
      <div className="mb-4 text-center">
        <Trophy className="winner-trophy mx-auto mb-2 h-10 w-10 text-honey" aria-hidden="true" />
        <p className="text-xs font-extrabold uppercase text-ink/50">Round Result</p>
        <h2 className="text-3xl font-extrabold text-ink">
          {room.winner?.isDraw ? "Draw" : room.winner?.name || "Match over"}
        </h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {room.players.map((player) => {
          const entries = getPlayerEntries(state, player.playerId);
          const word = getRevealedWord(state, player.playerId);

          return (
            <div key={player.playerId} className="rounded-md border border-ink/10 bg-paper p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold uppercase text-ink/45">{player.name}</p>
                  <p className="text-2xl font-extrabold tracking-[0.16em] text-ink">{word || "-----"}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-ink/60">
                  {entries.length}/{state.maxAttempts || 6}
                </span>
              </div>
              <GuessGrid
                entries={entries}
                maxAttempts={state.maxAttempts || 6}
                wordLength={state.wordLength || 5}
                highContrast={highContrast}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function WordGuess({
  room,
  session,
  onSetSecret,
  onSubmitGuess,
  onRestartGame,
  onLeaveRoom
}) {
  const [selectedWord, setSelectedWord] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [guessWord, setGuessWord] = useState("");
  const [status, setStatus] = useState("");
  const [highContrast, setHighContrast] = useState(false);
  const isHost = room.host === session.playerId;
  const state = room.wordGuess || {};
  const now = useNow({ enabled: !room.gameEnded && ["locked", "guessing"].includes(state.phase) });
  const wordLength = state.wordLength || 5;
  const maxAttempts = state.maxAttempts || 6;
  const readyPlayerIds = useMemo(() => new Set(state.readyPlayerIds || []), [state.readyPlayerIds]);
  const opponent = room.players.find((player) => player.playerId !== session.playerId);
  const myEntries = useMemo(() => getPlayerEntries(state, session.playerId), [session.playerId, state]);
  const myRoundEntry = getRoundEntry(state, session.playerId);
  const wordOptions = state.wordPacks?.[session.playerId] || [];
  const keyboardState = useMemo(() => buildKeyboardState(myEntries), [myEntries]);
  const canGuess = state.phase === "guessing" && !room.gameEnded && !myRoundEntry;
  const lockTimeLeft = getTimeLeft(state.lockDeadlineAt, now);
  const guessTimeLeft = getTimeLeft(state.roundDeadlineAt, now);

  useEffect(() => {
    setGuessWord("");
    setStatus("");
  }, [state.round]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!canGuess) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setGuessWord((current) => current.slice(0, -1));
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        setGuessWord((current) => cleanWord(`${current}${event.key}`, wordLength));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGuess, guessWord, wordLength]);

  const lockWord = async () => {
    if (!confirmWord) {
      return;
    }

    setStatus("");
    const result = await onSetSecret(confirmWord);

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setConfirmWord("");
  };

  const submitGuess = async () => {
    const word = cleanWord(guessWord, wordLength);

    if (!canGuess) {
      return;
    }

    if (word.length !== wordLength) {
      setStatus(`Enter ${wordLength} letters.`);
      return;
    }

    setStatus("");
    const result = await onSubmitGuess(word);

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setGuessWord("");
  };

  const handleKeyboard = (key) => {
    if (key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "BACKSPACE") {
      setGuessWord((current) => current.slice(0, -1));
      return;
    }

    setGuessWord((current) => cleanWord(`${current}${key}`, wordLength));
  };

  const handleRestart = async () => {
    const result = await onRestartGame();

    if (!result.ok) {
      setStatus(result.error);
    }
  };

  return (
    <GamePage>
      <RoomHeader
        room={room}
        codeLabel="WD"
        eyebrow="Word Guess Room"
        onStatus={setStatus}
        onLeaveRoom={onLeaveRoom}
        actions={
          <>
            <button
              type="button"
              className={`compact-button border ${
                highContrast ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink"
              }`}
              onClick={() => setHighContrast((current) => !current)}
              title="High contrast"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Contrast
            </button>
            <RestartButton onRestart={handleRestart} disabled={!isHost} />
          </>
        }
      />

        <StatusMessage status={status} />

        <section className="grid gap-3 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-3">
            {!room.gameEnded && state.phase === "selecting" ? (
              <section className="surface p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-ink/50">Word Selection</p>
                    <h2 className="text-2xl font-extrabold">Lock your word</h2>
                  </div>
                  <span className="w-fit rounded-full bg-honey px-3 py-1 text-sm font-extrabold text-ink">
                    {readyPlayerIds.size}/2 locked
                  </span>
                </div>

                {readyPlayerIds.has(session.playerId) ? (
                  <div className="rounded-md border border-mint/40 bg-mint/10 p-4 text-center">
                    <Lock className="mx-auto mb-2 h-8 w-8 text-mint" aria-hidden="true" />
                    <h3 className="text-xl font-extrabold text-ink">Your word is locked</h3>
                    <p className="mt-1 text-sm font-bold text-ink/55">
                      {readyPlayerIds.size === 2 ? "Starting soon." : `Waiting for ${opponent?.name || "opponent"}.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {wordOptions.map((word) => (
                        <button
                          key={word}
                          type="button"
                          className={`min-h-14 rounded-md border px-3 py-2 text-center text-lg font-extrabold tracking-[0.12em] transition ${
                            selectedWord === word
                              ? "border-coral bg-coral text-white"
                              : "border-ink/10 bg-white text-ink hover:border-mint"
                          }`}
                          onClick={() => setSelectedWord(word)}
                        >
                          {word}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="compact-button mt-4 w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                      disabled={!selectedWord}
                      onClick={() => setConfirmWord(selectedWord)}
                    >
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                      Lock In Your Word
                    </button>
                  </>
                )}
              </section>
            ) : null}

            {!room.gameEnded && state.phase === "locked" ? (
              <section className="surface p-5 text-center">
                <Lock className="mx-auto mb-2 h-9 w-9 text-mint" aria-hidden="true" />
                <p className="text-xs font-extrabold uppercase text-ink/50">Both words locked</p>
                <h2 className="text-3xl font-extrabold text-ink">{formatSeconds(lockTimeLeft)}</h2>
              </section>
            ) : null}

            {!room.gameEnded && state.phase === "guessing" ? (
              <section className="surface p-4">
                <div
                  className={`mb-4 flex flex-col gap-2 rounded-md px-3 py-2 text-sm font-extrabold sm:flex-row sm:items-center sm:justify-between ${
                    canGuess ? "word-guess-banner bg-mint text-white" : "bg-white text-ink/60"
                  }`}
                >
                  <span>{canGuess ? "Your turn" : "Waiting for opponent"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {formatSeconds(guessTimeLeft)}s
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[18rem_1fr]">
                  <GuessGrid
                    entries={myEntries}
                    maxAttempts={maxAttempts}
                    wordLength={wordLength}
                    highContrast={highContrast}
                  />

                  <div className="space-y-3">
                    <form
                      className="grid gap-2 sm:grid-cols-[1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitGuess();
                      }}
                    >
                      <input
                        className="compact-input bg-white text-center text-2xl font-extrabold tracking-[0.18em]"
                        value={guessWord}
                        disabled={!canGuess}
                        onChange={(event) => setGuessWord(cleanWord(event.target.value, wordLength))}
                        maxLength={wordLength}
                        autoFocus={canGuess}
                      />
                      <button
                        type="submit"
                        className="compact-button bg-coral px-5 text-white hover:bg-coral/90 disabled:bg-ink/20"
                        disabled={!canGuess || guessWord.length !== wordLength}
                        title="Submit"
                      >
                        <Check className="h-5 w-5" aria-hidden="true" />
                        Submit
                      </button>
                    </form>

                    <OnScreenKeyboard
                      keyboardState={keyboardState}
                      disabled={!canGuess}
                      highContrast={highContrast}
                      onKey={handleKeyboard}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {room.gameEnded || state.phase === "result" ? (
              <section className="space-y-3">
                <RevealPanel room={room} state={state} highContrast={highContrast} />
                <ResultActions
                  onLeaveRoom={onLeaveRoom}
                  onRestart={handleRestart}
                  restartDisabled={!isHost}
                  layoutClassName="flex flex-col gap-2 sm:flex-row"
                />
                {!isHost ? <p className="text-center text-xs font-bold text-ink/55">Waiting for host</p> : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-3">
            <MatchScore room={room} state={state} session={session} />
            <PlayerProgress room={room} state={state} session={session} />
          </aside>
        </section>
      {confirmWord ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4">
          <section className="result-card w-full max-w-sm rounded-md border border-ink/10 bg-white p-5 text-center shadow-soft">
            <p className="text-xs font-extrabold uppercase text-ink/50">Confirm Word</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-[0.16em] text-ink">{confirmWord}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
                onClick={() => setConfirmWord("")}
              >
                Cancel
              </button>
              <button type="button" className="compact-button bg-coral text-white" onClick={lockWord}>
                Lock
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </GamePage>
  );
}
