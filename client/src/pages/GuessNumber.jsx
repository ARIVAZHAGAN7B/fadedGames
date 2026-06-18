import {
  KeyRound,
  Lock,
  Send,
  Trophy
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  GamePage,
  ResultActions,
  RestartButton,
  RoomHeader,
  StatusMessage
} from "../components/game/GameLayout.jsx";

function hintText(hint) {
  if (hint === "low") {
    return "Too low";
  }

  if (hint === "high") {
    return "Too high";
  }

  return "Correct";
}

function hintClass(hint) {
  if (hint === "low") {
    return "bg-mint text-white";
  }

  if (hint === "high") {
    return "bg-coral text-white";
  }

  return "bg-honey text-ink";
}

function cleanLocalNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max) {
    return null;
  }

  return number;
}

export default function GuessNumber({
  room,
  session,
  onSetSecret,
  onSubmitGuess,
  onRestartGame,
  onLeaveRoom
}) {
  const [secretNumber, setSecretNumber] = useState("");
  const [guessNumber, setGuessNumber] = useState("");
  const [status, setStatus] = useState("");
  const [dismissedGuessId, setDismissedGuessId] = useState("");
  const isHost = room.host === session.playerId;
  const state = room.guessNumber || {};
  const min = state.min || 1;
  const max = state.max || 100;
  const readyPlayerIds = useMemo(() => new Set(state.readyPlayerIds || []), [state.readyPlayerIds]);
  const revealedSecretsById = useMemo(
    () => Object.fromEntries((state.revealedSecrets || []).map((entry) => [entry.playerId, entry])),
    [state.revealedSecrets]
  );
  const guesses = [...(state.guesses || [])].reverse();
  const latestGuess = guesses[0] || null;
  const opponent = room.players.find((player) => player.playerId !== session.playerId);
  const currentPlayer = room.players.find((player) => player.playerId === room.currentPlayerId);
  const mySecretLocked = readyPlayerIds.has(session.playerId);
  const opponentSecretLocked = opponent ? readyPlayerIds.has(opponent.playerId) : false;
  const isMyTurn = state.phase === "guessing" && room.currentPlayerId === session.playerId && !room.gameEnded;
  const showFeedbackModal =
    latestGuess &&
    latestGuess.playerId === session.playerId &&
    latestGuess.id !== dismissedGuessId;

  const handleSecretSubmit = async (event) => {
    event.preventDefault();
    setStatus("");

    const number = cleanLocalNumber(secretNumber, min, max);

    if (number === null) {
      setStatus(`Choose a number from ${min} to ${max}.`);
      return;
    }

    const result = await onSetSecret(number);

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setSecretNumber("");
  };

  const handleGuessSubmit = async (event) => {
    event.preventDefault();
    setStatus("");

    const number = cleanLocalNumber(guessNumber, min, max);

    if (number === null) {
      setStatus(`Choose a number from ${min} to ${max}.`);
      return;
    }

    const result = await onSubmitGuess(number);

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setDismissedGuessId("");
    setGuessNumber("");
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
        codeLabel="GN"
        eyebrow="Guess Number Room"
        onStatus={setStatus}
        onLeaveRoom={onLeaveRoom}
        actions={<RestartButton onRestart={handleRestart} disabled={!isHost} />}
      />

        <StatusMessage status={status} />

        <section className="grid gap-3 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-3">
            {!room.gameEnded && state.phase === "secret" ? (
              <section className="surface p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-ink/50">Secret numbers</p>
                    <h2 className="text-2xl font-extrabold">Lock your number</h2>
                  </div>
                  <span className="w-fit rounded-full bg-honey px-3 py-1 text-sm font-extrabold text-ink">
                    {readyPlayerIds.size}/2 locked
                  </span>
                </div>

                {mySecretLocked ? (
                  <div className="rounded-md border border-mint/40 bg-mint/10 p-4 text-center">
                    <Lock className="mx-auto mb-2 h-8 w-8 text-mint" aria-hidden="true" />
                    <h3 className="text-xl font-extrabold text-ink">Your number is locked</h3>
                    <p className="mt-1 text-sm font-bold text-ink/55">
                      {opponentSecretLocked ? "Starting guesses now." : `Waiting for ${opponent?.name || "opponent"}.`}
                    </p>
                  </div>
                ) : (
                  <form className="mx-auto max-w-sm" onSubmit={handleSecretSubmit}>
                    <label className="mb-3 block">
                      <span className="compact-label">Secret Number</span>
                      <input
                        className="compact-input bg-white text-center text-3xl font-extrabold tracking-normal"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={secretNumber}
                        onChange={(event) => setSecretNumber(event.target.value.replace(/\D/g, "").slice(0, 3))}
                        autoFocus
                      />
                    </label>
                    <button type="submit" className="compact-button w-full bg-coral text-white hover:bg-coral/90">
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                      Lock Number
                    </button>
                  </form>
                )}
              </section>
            ) : null}

            {!room.gameEnded && state.phase === "guessing" ? (
              <section className="surface p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-ink/50">Current Turn</p>
                    <h2 className="text-2xl font-extrabold">
                      {isMyTurn ? "Your guess" : `${currentPlayer?.name || "Player"} is guessing`}
                    </h2>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm font-extrabold ${
                      isMyTurn ? "bg-mint text-white" : "bg-white text-ink/60"
                    }`}
                  >
                    {isMyTurn ? "You" : "Waiting"}
                  </span>
                </div>

                <form className="mx-auto max-w-md" onSubmit={handleGuessSubmit}>
                  <label className="mb-3 block">
                    <span className="compact-label">
                      Guess {opponent?.name || "opponent"}'s number
                    </span>
                    <input
                      className="compact-input bg-white text-center text-4xl font-extrabold"
                      type="number"
                      min={min}
                      max={max}
                      value={guessNumber}
                      disabled={!isMyTurn}
                      onChange={(event) => setGuessNumber(event.target.value)}
                      autoFocus={isMyTurn}
                    />
                  </label>
                  <button
                    type="submit"
                    className="compact-button w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                    disabled={!isMyTurn}
                  >
                    <Send className="h-5 w-5" aria-hidden="true" />
                    Send Guess
                  </button>
                </form>
              </section>
            ) : null}

            {room.gameEnded || state.phase === "result" ? (
              <section className="surface result-card border-honey p-5 text-center">
                <Trophy className="winner-trophy mx-auto mb-2 h-10 w-10 text-honey" aria-hidden="true" />
                <p className="text-xs font-extrabold uppercase text-ink/50">Winner</p>
                <h2 className="text-3xl font-extrabold text-ink">{room.winner?.name || "Match over"}</h2>
                {room.winner?.guess ? (
                  <p className="mt-2 text-sm font-bold text-ink/55">
                    Found it with {room.winner.guess}
                  </p>
                ) : null}
                <ResultActions
                  onLeaveRoom={onLeaveRoom}
                  onRestart={handleRestart}
                  restartDisabled={!isHost}
                />
                {!isHost ? <p className="mt-2 text-xs font-bold text-ink/55">Waiting for host</p> : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-3">
            <section className="surface p-3">
              <h2 className="mb-2 text-base font-extrabold">Players</h2>
              <div className="space-y-2">
                {room.players.map((player) => {
                  const secret = revealedSecretsById[player.playerId];
                  const isCurrent = player.playerId === room.currentPlayerId && state.phase === "guessing";

                  return (
                    <div key={player.playerId} className="rounded-md bg-paper px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-bold">
                          {player.name}
                          {player.playerId === session.playerId ? " (You)" : ""}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                            isCurrent ? "bg-mint text-white" : "bg-white text-ink/55"
                          }`}
                        >
                          {isCurrent ? "Turn" : readyPlayerIds.has(player.playerId) ? "Locked" : "Setting"}
                        </span>
                      </div>
                      {room.gameEnded ? (
                        <p className="mt-1 text-xs font-extrabold text-ink/55">
                          Secret {secret?.number ?? "-"}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
    

      {showFeedbackModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4">
          <section className="result-card w-full max-w-sm rounded-md border border-ink/10 bg-white p-5 text-center shadow-soft">
            <p className="text-xs font-extrabold uppercase text-ink/50">
              {latestGuess.playerName} guessed {latestGuess.guess}
            </p>
            <h2 className="mt-2 text-4xl font-extrabold text-ink">
              {hintText(latestGuess.hint)}
            </h2>
            <p className="mt-2 text-sm font-bold text-ink/55">
              {latestGuess.hint === "low"
                ? "The number is higher."
                : latestGuess.hint === "high"
                  ? "The number is lower."
                  : "That was the number."}
            </p>
            <button
              type="button"
              className={`compact-button mt-4 w-full ${hintClass(latestGuess.hint)}`}
              onClick={() => setDismissedGuessId(latestGuess.id)}
            >
              OK
            </button>
          </section>
        </div>
      ) : null}
    </GamePage>
  );
}
