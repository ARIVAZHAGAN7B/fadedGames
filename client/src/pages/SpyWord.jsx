import {
  CheckCircle2,
  KeyRound,
  MessageSquare,
  Send,
  Shield,
  Trophy,
  Users,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  GamePage,
  ResultActions,
  RestartButton,
  RoomHeader,
  StatusMessage
} from "../components/game/GameLayout.jsx";

function cleanClue(value) {
  return String(value || "")
    .replace(/[^A-Za-z-]/g, "")
    .slice(0, 24);
}

function cleanGuess(value) {
  return String(value || "")
    .replace(/[^A-Za-z -]/g, "")
    .slice(0, 32);
}

function getCluesByRound(clues = [], totalRounds = 5) {
  return Array.from({ length: totalRounds }, (_entry, index) => {
    const round = index + 1;

    return {
      round,
      clues: clues
        .filter((clue) => clue.round === round)
        .sort((first, second) => first.turnNumber - second.turnNumber)
    };
  });
}

function roleLabel(role) {
  return role === "spy" ? "Spy" : "Detective";
}

function roleClass(role) {
  return role === "spy"
    ? "border-coral bg-coral/10 text-coral"
    : "border-mint bg-mint/10 text-mint";
}

function phaseTitle(state, room) {
  if (room.gameEnded || state.phase === "result") {
    return "Match Result";
  }

  if (state.phase === "clue") {
    return `${state.activePlayerName || "Player"} gives a clue`;
  }

  if (state.phase === "voting") {
    return "Vote for the spy";
  }

  if (state.phase === "spy-guess") {
    return "Spy final guess";
  }

  return "Spy Word";
}

function SecretPanel({ state }) {
  const role = state.viewerRole || "detective";
  const word = state.viewerWord || "Hidden";

  return (
    <section className={`surface border-2 p-4 ${roleClass(role)}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase opacity-70">Your Role</p>
          <h2 className="text-2xl font-extrabold">{roleLabel(role)}</h2>
        </div>
        <Shield className="h-8 w-8 shrink-0" aria-hidden="true" />
      </div>
      <div className="rounded-md border border-current/20 bg-white px-3 py-3 text-center">
        <p className="text-xs font-extrabold uppercase text-ink/45">Secret Word</p>
        <p className="mt-1 break-words text-3xl font-extrabold text-ink">{word}</p>
      </div>
    </section>
  );
}

function ClueBoard({ state }) {
  const rounds = getCluesByRound(state.clues || [], state.totalRounds || 5);
  const revealed = state.phase === "result";

  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-mint" aria-hidden="true" />
          <h2 className="text-base font-extrabold">Clues</h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/60">
          {state.clues?.length || 0}
        </span>
      </div>

      <div className="grid gap-2 lg:grid-cols-5">
        {rounds.map((round) => (
          <div key={round.round} className="rounded-md border border-ink/10 bg-paper p-2">
            <p className="mb-2 text-xs font-extrabold uppercase text-ink/45">
              Round {round.round}
            </p>
            <div className="space-y-1.5">
              {round.clues.length ? (
                round.clues.map((clue) => (
                  <div key={clue.id} className="rounded-md bg-white px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs font-extrabold text-ink/50">
                        {clue.playerName}
                      </span>
                      {revealed && clue.role ? (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                            clue.role === "spy" ? "bg-coral text-white" : "bg-mint text-white"
                          }`}
                        >
                          {clue.role === "spy" ? "Spy" : "Det"}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-words text-lg font-extrabold text-ink">{clue.clue}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-white px-2.5 py-2 text-sm font-bold text-ink/35">
                  Waiting
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlayerPanel({ room, state, session }) {
  const readyVoters = new Set(state.readyVoterIds || []);

  return (
    <section className="surface p-3">
      <h2 className="mb-2 text-base font-extrabold">Players</h2>
      <div className="space-y-2">
        {room.players.map((player) => {
          const isActive = state.phase === "clue" && state.activePlayerId === player.playerId;
          const voted = readyVoters.has(player.playerId);

          return (
            <div
              key={player.playerId}
              className={`rounded-md px-3 py-2 ${
                isActive ? "bg-mint/10 ring-1 ring-mint/40" : "bg-paper"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-bold">
                  {player.name}
                  {player.playerId === session.playerId ? " (You)" : ""}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                    isActive
                      ? "bg-mint text-white"
                      : voted
                        ? "bg-honey text-ink"
                        : "bg-white text-ink/55"
                  }`}
                >
                  {isActive ? "Turn" : voted ? "Voted" : "In"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VotePanel({ room, state }) {
  const showCounts = state.phase === "spy-guess" || state.phase === "result";
  const tally = state.voteTally || [];

  return (
    <section className="surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold">Votes</h2>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/60">
          {(state.readyVoterIds || []).length}/{room.players.length}
        </span>
      </div>
      <div className="space-y-2">
        {tally.map((entry) => (
          <div key={entry.playerId} className="rounded-md bg-paper px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-extrabold">{entry.name}</span>
              <span className="shrink-0 rounded bg-white px-2 py-0.5 text-sm font-extrabold text-ink">
                {showCounts ? entry.count : "-"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultPanel({ room, state, onLeaveRoom, onRestartGame, restartDisabled }) {
  const winnerSide = state.result?.winnerSide || room.winner?.side;
  const spyWon = winnerSide === "spy";
  const spyGuess = state.spyGuess || state.result?.spyGuess || null;

  return (
    <section className="surface result-card border-honey p-5 text-center">
      <Trophy className="winner-trophy mx-auto mb-2 h-12 w-12 text-honey" aria-hidden="true" />
      <p className="text-xs font-extrabold uppercase text-ink/50">Winner</p>
      <h2 className="text-3xl font-extrabold text-ink">
        {spyWon ? "Spy Wins" : "Detectives Win"}
      </h2>
      <p className="mt-2 text-sm font-bold text-ink/60">
        Spy: {state.spyPlayerName || state.result?.spyPlayerName || "Hidden"}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-mint/30 bg-mint/10 p-3">
          <p className="text-xs font-extrabold uppercase text-mint">Detectives</p>
          <p className="text-2xl font-extrabold text-ink">{state.detectiveWord || "-"}</p>
        </div>
        <div className="rounded-md border border-coral/30 bg-coral/10 p-3">
          <p className="text-xs font-extrabold uppercase text-coral">Spy</p>
          <p className="text-2xl font-extrabold text-ink">{state.spyWord || "-"}</p>
        </div>
      </div>

      {spyGuess ? (
        <div
          className={`mt-3 rounded-md border p-3 ${
            spyGuess.correct ? "border-coral bg-coral/10" : "border-mint bg-mint/10"
          }`}
        >
          <p className="text-xs font-extrabold uppercase text-ink/45">Final Guess</p>
          <p className="text-xl font-extrabold text-ink">
            {spyGuess.skipped ? "Skipped" : spyGuess.guess}
          </p>
        </div>
      ) : null}

      <ResultActions
        onLeaveRoom={onLeaveRoom}
        onRestart={onRestartGame}
        restartDisabled={restartDisabled}
      />
    </section>
  );
}

export default function SpyWord({
  room,
  session,
  onSubmitClue,
  onVote,
  onSubmitSpyGuess,
  onRestartGame,
  onLeaveRoom
}) {
  const [clue, setClue] = useState("");
  const [selectedSuspectId, setSelectedSuspectId] = useState("");
  const [spyGuess, setSpyGuess] = useState("");
  const [status, setStatus] = useState("");
  const isHost = room.host === session.playerId;
  const state = room.spyWord || {};
  const isSpy = state.viewerRole === "spy";
  const myVote = state.myVote || "";
  const canClue = state.phase === "clue" && state.activePlayerId === session.playerId && !room.gameEnded;
  const canVote = state.phase === "voting" && !myVote && !room.gameEnded;
  const canSpyGuess = state.phase === "spy-guess" && isSpy && !room.gameEnded;
  const groupedClues = useMemo(
    () => getCluesByRound(state.clues || [], state.totalRounds || 5),
    [state.clues, state.totalRounds]
  );
  const currentRoundClues = groupedClues.find((entry) => entry.round === state.round)?.clues || [];

  useEffect(() => {
    setSelectedSuspectId("");
    setStatus("");
  }, [state.moveId]);

  const handleClueSubmit = async (event) => {
    event.preventDefault();
    const value = cleanClue(clue);

    if (!value) {
      setStatus("Enter a clue.");
      return;
    }

    setStatus("");
    const result = await onSubmitClue(value);

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setClue("");
  };

  const handleVote = async () => {
    if (!selectedSuspectId) {
      return;
    }

    setStatus("");
    const result = await onVote(selectedSuspectId);

    if (!result.ok) {
      setStatus(result.error);
    }
  };

  const handleSpyGuess = async (skip = false) => {
    const value = skip ? "" : cleanGuess(spyGuess);

    if (!skip && !value) {
      setStatus("Enter a word guess.");
      return;
    }

    setStatus("");
    const result = await onSubmitSpyGuess(value);

    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    setSpyGuess("");
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
        codeLabel="SW"
        eyebrow="Spy Word Room"
        onStatus={setStatus}
        onLeaveRoom={onLeaveRoom}
        actions={<RestartButton onRestart={handleRestart} disabled={!isHost} />}
      />

        <StatusMessage status={status} />

        <section className="grid gap-3 lg:grid-cols-[1fr_21rem]">
          <div className="space-y-3">
            {!room.gameEnded ? (
              <section className="surface p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-ink/50">
                      Round {Math.min(state.round || 1, state.totalRounds || 5)} / {state.totalRounds || 5}
                    </p>
                    <h2 className="text-2xl font-extrabold">{phaseTitle(state, room)}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-white">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {room.players.length}
                    </span>
                    <span className="rounded-full bg-honey px-3 py-1 text-sm font-extrabold text-ink capitalize">
                      {state.difficulty || "easy"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[18rem_1fr]">
                  <SecretPanel state={state} />

                  {state.phase === "clue" ? (
                    <div className="rounded-md border border-ink/10 bg-paper p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold">
                          {canClue ? "Your clue" : "Current round"}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                            canClue ? "bg-mint text-white" : "bg-white text-ink/55"
                          }`}
                        >
                          {currentRoundClues.length}/{room.players.length}
                        </span>
                      </div>

                      {canClue ? (
                        <form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={handleClueSubmit}>
                          <input
                            className="compact-input bg-white text-center text-2xl font-extrabold"
                            value={clue}
                            onChange={(event) => setClue(cleanClue(event.target.value))}
                            maxLength={24}
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="compact-button bg-coral px-5 text-white hover:bg-coral/90 disabled:bg-ink/20"
                            disabled={!clue}
                          >
                            <Send className="h-5 w-5" aria-hidden="true" />
                            Send
                          </button>
                        </form>
                      ) : (
                        <div className="grid place-items-center rounded-md bg-white p-5 text-center">
                          <MessageSquare className="mx-auto mb-2 h-9 w-9 text-ink/35" aria-hidden="true" />
                          <p className="text-xl font-extrabold text-ink">{state.activePlayerName || "Player"}</p>
                          <p className="mt-1 text-sm font-bold text-ink/55">Turn {state.turnNumber || 1}</p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {state.phase === "voting" ? (
                    <div className="rounded-md border border-ink/10 bg-paper p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold">{myVote ? "Vote locked" : "Choose Player"}</h3>
                        <span className="rounded-full bg-honey px-2.5 py-1 text-xs font-extrabold text-ink">
                          {(state.readyVoterIds || []).length}/{room.players.length}
                        </span>
                      </div>

                      {myVote ? (
                        <div className="rounded-md border border-mint/30 bg-white p-4 text-center">
                          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-mint" aria-hidden="true" />
                          <p className="text-lg font-extrabold text-ink">Submitted</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {room.players
                              .filter((player) => player.playerId !== session.playerId)
                              .map((player) => (
                                <button
                                  key={player.playerId}
                                  type="button"
                                  className={`rounded-md border px-3 py-3 text-left text-sm font-extrabold transition ${
                                    selectedSuspectId === player.playerId
                                      ? "border-coral bg-coral text-white"
                                      : "border-ink/10 bg-white text-ink hover:border-mint"
                                  }`}
                                  onClick={() => setSelectedSuspectId(player.playerId)}
                                >
                                  {player.name}
                                </button>
                              ))}
                          </div>
                          <button
                            type="button"
                            className="compact-button mt-3 w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                            onClick={handleVote}
                            disabled={!selectedSuspectId}
                          >
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                            Vote
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}

                  {state.phase === "spy-guess" ? (
                    <div className="rounded-md border border-ink/10 bg-paper p-3">
                      {canSpyGuess ? (
                        <>
                          <div className="mb-3 flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-coral" aria-hidden="true" />
                            <h3 className="text-base font-extrabold">Guess the detectives word</h3>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                            <input
                              className="compact-input bg-white text-center text-2xl font-extrabold"
                              value={spyGuess}
                              onChange={(event) => setSpyGuess(cleanGuess(event.target.value))}
                              maxLength={32}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="compact-button bg-coral px-5 text-white hover:bg-coral/90 disabled:bg-ink/20"
                              onClick={() => handleSpyGuess(false)}
                              disabled={!spyGuess}
                            >
                              <Send className="h-5 w-5" aria-hidden="true" />
                              Guess
                            </button>
                          </div>
                          <button
                            type="button"
                            className="compact-button mt-2 w-full border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint"
                            onClick={() => handleSpyGuess(true)}
                          >
                            Skip
                          </button>
                        </>
                      ) : (
                        <div className="grid place-items-center rounded-md bg-white p-5 text-center">
                          <Shield className="mx-auto mb-2 h-9 w-9 text-coral" aria-hidden="true" />
                          <p className="text-xl font-extrabold text-ink">Spy is guessing</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <ResultPanel
                room={room}
                state={state}
                onLeaveRoom={onLeaveRoom}
                onRestartGame={handleRestart}
                restartDisabled={!isHost}
              />
            )}

            <ClueBoard state={state} />
          </div>

          <aside className="space-y-3">
            <PlayerPanel room={room} state={state} session={session} />
            <VotePanel room={room} state={state} />
            {state.phase === "result" && state.result?.caughtSpy === false ? (
              <section className="surface p-3">
                <div className="flex items-center gap-2 rounded-md border border-coral/30 bg-coral/10 p-3 text-coral">
                  <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <p className="text-sm font-extrabold">Spy escaped the vote</p>
                </div>
              </section>
            ) : null}
          </aside>
        </section>
    </GamePage>
  );
}
