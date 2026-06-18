import {
  CheckCircle2,
  Clock,
  Crown,
  EyeOff,
  Gem,
  KeyRound,
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
import { useNow } from "../hooks/useNow.js";
import { formatSeconds, getTimeLeft } from "../utils/time.js";

const roleToneClasses = {
  honey: "border-honey bg-honey/20 text-ink",
  coral: "border-coral bg-coral/10 text-coral",
  mint: "border-mint bg-mint/10 text-mint",
  ink: "border-ink bg-ink text-white",
  paper: "border-ink/10 bg-white text-ink"
};

function RoleIcon({ roleId, className = "h-5 w-5" }) {
  if (roleId === "raja") {
    return <Crown className={className} aria-hidden="true" />;
  }

  if (roleId === "police") {
    return <Shield className={className} aria-hidden="true" />;
  }

  if (roleId === "rani") {
    return <Gem className={className} aria-hidden="true" />;
  }

  if (roleId === "thirudan") {
    return <EyeOff className={className} aria-hidden="true" />;
  }

  return <KeyRound className={className} aria-hidden="true" />;
}

function RoleCard({ player, compact = false }) {
  const role = player.role;
  const tone = roleToneClasses[role?.tone] || roleToneClasses.paper;

  return (
    <div className={`rounded-md border p-3 ${tone} ${compact ? "" : "min-h-36"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-extrabold">{player.name}</span>
        {role ? <RoleIcon roleId={role.id} className="h-4 w-4 shrink-0" /> : null}
      </div>
      {role ? (
        <>
          <p className={`${compact ? "text-2xl" : "text-4xl"} font-extrabold leading-none`}>
            {role.short}
          </p>
          <p className="mt-2 truncate text-sm font-extrabold">{role.label}</p>
        </>
      ) : (
        <>
          <p className={`${compact ? "text-2xl" : "text-4xl"} font-extrabold leading-none`}>?</p>
          <p className="mt-2 truncate text-sm font-extrabold">Hidden</p>
        </>
      )}
      <p className="mt-3 text-xs font-extrabold opacity-70">+{player.roundScore || 0}</p>
    </div>
  );
}

function Scoreboard({ leaderboard = [], currentPlayerId }) {
  return (
    <section className="surface p-3">
      <h2 className="mb-3 text-base font-extrabold">Scores</h2>
      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.playerId}
            className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ${
              entry.playerId === currentPlayerId ? "bg-coral/10" : "bg-paper"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">
                {index + 1}. {entry.name}
                {entry.playerId === currentPlayerId ? " (You)" : ""}
              </p>
            </div>
            <span className="shrink-0 text-sm font-extrabold">{entry.score}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RajaRani({
  room,
  session,
  onGuess,
  onRestartGame,
  onLeaveRoom
}) {
  const [selectedSuspectId, setSelectedSuspectId] = useState("");
  const [status, setStatus] = useState("");
  const isHost = room.host === session.playerId;
  const state = room.rajaRani || {};
  const now = useNow({ enabled: !room.gameEnded && state.phase === "reveal" });
  const myRole = state.viewerRole || null;
  const isPolice = myRole?.id === "police";
  const isPoliceTurn = state.phase === "police-turn" && isPolice && !room.gameEnded;
  const revealLeftMs = getTimeLeft(state.revealDeadlineAt, now);
  const players = state.players || [];
  const myPlayer = players.find((player) => player.playerId === session.playerId) || {
    playerId: session.playerId,
    name: session.nickname || "You",
    role: myRole,
    score: 0,
    roundScore: 0
  };
  const lastGuess = state.lastGuess || null;
  const history = useMemo(() => [...(state.history || [])].reverse().slice(0, 5), [state.history]);

  useEffect(() => {
    setSelectedSuspectId("");
  }, [state.moveId]);

  const handleGuess = async () => {
    if (!selectedSuspectId) {
      return;
    }

    setStatus("");
    const result = await onGuess(selectedSuspectId);

    if (!result.ok) {
      setStatus(result.error);
    }
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
        codeLabel="RR"
        eyebrow="Raja Rani Room"
        onStatus={setStatus}
        onLeaveRoom={onLeaveRoom}
        actions={<RestartButton onRestart={handleRestart} disabled={!isHost} />}
      />

        <StatusMessage status={status} />

        <section className="grid gap-3 lg:grid-cols-[1fr_21rem]">
          <div className="space-y-3">
            <section className="surface p-4">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase text-ink/50">
                    Round {state.round || 1} / {state.totalRounds || 10}
                  </p>
                  <h2 className="text-2xl font-extrabold">
                    {room.gameEnded
                      ? "Match Result"
                      : state.phase === "reveal"
                        ? lastGuess?.correct
                          ? "Police caught the thief"
                          : "Thief escaped"
                        : isPolice
                          ? "Catch Thief"
                          : "Role Locked"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-white">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {room.players.length}/5
                  </span>
                  {state.phase === "reveal" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-honey px-3 py-1 text-sm font-extrabold text-ink">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {formatSeconds(revealLeftMs)}s
                    </span>
                  ) : null}
                </div>
              </div>

              {room.gameEnded ? (
                <div className="result-card rounded-md border border-honey bg-honey/20 p-5 text-center">
                  <Trophy className="winner-trophy mx-auto mb-2 h-12 w-12 text-honey" aria-hidden="true" />
                  <p className="text-xs font-extrabold uppercase text-ink/50">Winner</p>
                  <h3 className="text-3xl font-extrabold text-ink">{room.winner?.name || "Match over"}</h3>
                  <p className="mt-2 text-sm font-bold text-ink/60">
                    {room.winner?.tied ? "Shared top score" : `${room.winner?.score || 0} points`}
                  </p>
                  <ResultActions
                    onLeaveRoom={onLeaveRoom}
                    onRestart={handleRestart}
                    restartDisabled={!isHost}
                  />
                </div>
              ) : state.phase === "reveal" ? (
                <div className="space-y-3">
                  <div
                    className={`rounded-md border p-4 ${
                      lastGuess?.correct
                        ? "border-mint bg-mint/10 text-mint"
                        : "border-coral bg-coral/10 text-coral"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {lastGuess?.correct ? (
                        <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-7 w-7 shrink-0" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-xl font-extrabold">
                          {lastGuess?.policePlayerName} chose {lastGuess?.suspectPlayerName}
                        </h3>
                        <p className="truncate text-sm font-bold opacity-75">
                          Thirudan: {lastGuess?.thiefPlayerName || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-5">
                    {players.map((player) => (
                      <RoleCard key={player.playerId} player={player} compact />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
                  <RoleCard player={myPlayer} />

                  {isPoliceTurn ? (
                    <div className="rounded-md border border-ink/10 bg-paper p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold">Suspects</h3>
                        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-extrabold text-white">
                          Police
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(state.suspects || []).map((player) => (
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
                        onClick={handleGuess}
                        disabled={!selectedSuspectId}
                      >
                        <Shield className="h-5 w-5" aria-hidden="true" />
                        Catch Thief
                      </button>
                    </div>
                  ) : (
                    <div className="grid place-items-center rounded-md border border-ink/10 bg-paper p-5 text-center">
                      <div>
                        <EyeOff className="mx-auto mb-2 h-9 w-9 text-ink/35" aria-hidden="true" />
                        <h3 className="text-xl font-extrabold text-ink">Police is choosing</h3>
                        <p className="mt-1 text-sm font-bold text-ink/55">
                          Round {state.round || 1}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-3">
            <Scoreboard leaderboard={state.leaderboard || []} currentPlayerId={session.playerId} />

            {history.length > 0 ? (
              <section className="surface p-3">
                <h2 className="mb-3 text-base font-extrabold">Rounds</h2>
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.round} className="rounded-md bg-paper px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold">Round {entry.round}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                            entry.guess?.correct ? "bg-mint text-white" : "bg-coral text-white"
                          }`}
                        >
                          {entry.guess?.correct ? "Caught" : "Missed"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-bold text-ink/55">
                        {entry.guess?.policePlayerName} chose {entry.guess?.suspectPlayerName}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </section>
    </GamePage>
  );
}
