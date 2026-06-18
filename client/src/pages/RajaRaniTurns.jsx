import {
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  DoorOpen,
  EyeOff,
  Gem,
  Home,
  KeyRound,
  Repeat2,
  RotateCcw,
  Shield,
  Trophy,
  Users,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildRoomLink } from "../utils/roomLink.js";

const roleToneClasses = {
  honey: "border-honey bg-honey/20 text-ink",
  coral: "border-coral bg-coral/10 text-coral",
  mint: "border-mint bg-mint/10 text-mint",
  ink: "border-ink bg-ink text-white",
  paper: "border-ink/10 bg-white text-ink"
};

function formatSeconds(milliseconds) {
  return Math.max(0, Math.ceil(milliseconds / 1000));
}

function getTimeLeft(deadlineAt, now) {
  if (!deadlineAt) {
    return 0;
  }

  return Math.max(0, deadlineAt - now);
}

function RoleIcon({ roleId, className = "h-5 w-5" }) {
  if (roleId === "raja") {
    return <Crown className={className} aria-hidden="true" />;
  }

  if (roleId === "rani") {
    return <Gem className={className} aria-hidden="true" />;
  }

  if (roleId === "police") {
    return <Shield className={className} aria-hidden="true" />;
  }

  if (roleId === "thirudan") {
    return <EyeOff className={className} aria-hidden="true" />;
  }

  return <KeyRound className={className} aria-hidden="true" />;
}

function RoleCard({ player, title = "", compact = false }) {
  const role = player.role;
  const tone = roleToneClasses[role?.tone] || roleToneClasses.paper;

  return (
    <div className={`rounded-md border p-3 ${tone} ${compact ? "" : "min-h-36"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-extrabold">{title || player.name}</span>
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
            <p className="min-w-0 truncate text-sm font-extrabold">
              {index + 1}. {entry.name}
              {entry.playerId === currentPlayerId ? " (You)" : ""}
            </p>
            <span className="shrink-0 text-sm font-extrabold">{entry.score}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionLog({ actions = [], revealed = false }) {
  const entries = [...actions].reverse();

  return (
    <section className="surface p-3">
      <h2 className="mb-3 text-base font-extrabold">Turns</h2>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="rounded-md bg-paper px-3 py-2 text-sm font-bold text-ink/45">Waiting</div>
        ) : null}
        {entries.map((action) => (
          <div key={action.id} className="rounded-md bg-paper px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-extrabold">
                {action.turnNumber}. {action.actorPlayerName}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                  action.skipped
                    ? "bg-ink/10 text-ink/55"
                    : action.correct
                      ? "bg-mint text-white"
                      : "bg-coral text-white"
                }`}
              >
                {action.skipped ? "Skip" : action.correct ? "+100" : "Swap"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-bold text-ink/55">
              {action.skipped ? "Timed out" : `Selected ${action.suspectPlayerName}`}
            </p>
            {revealed && action.actorRoleBefore ? (
              <p className="mt-1 truncate text-[11px] font-bold text-ink/45">
                {action.actorRoleBefore.label} → {action.targetRole?.label || "-"}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RajaRaniTurns({
  room,
  session,
  onSelect,
  onRestartGame,
  onLeaveRoom
}) {
  const [selectedSuspectId, setSelectedSuspectId] = useState("");
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(Date.now());
  const isHost = room.host === session.playerId;
  const state = room.rajaRaniTurns || {};
  const myRole = state.viewerRole || null;
  const myTargetRole = state.viewerTargetRole || null;
  const isMyTurn = state.phase === "turn" && state.activePlayerId === session.playerId && !room.gameEnded;
  const turnLeftMs = getTimeLeft(state.turnDeadlineAt, now);
  const revealLeftMs = getTimeLeft(state.revealDeadlineAt, now);
  const players = state.players || [];
  const myPlayer = players.find((player) => player.playerId === session.playerId) || {
    playerId: session.playerId,
    name: session.nickname || "You",
    role: myRole,
    score: 0,
    roundScore: 0
  };
  const latestAction = (state.actions || [])[state.actions?.length - 1] || null;
  const history = useMemo(() => [...(state.history || [])].reverse().slice(0, 5), [state.history]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedSuspectId("");
  }, [state.moveId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

  const handleSelect = async () => {
    if (!selectedSuspectId) {
      return;
    }

    setStatus("");
    const result = await onSelect(selectedSuspectId);

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
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              RT
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">Raja Rani Turns</p>
              <h1 className="text-2xl font-extrabold text-ink">{room.roomName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              className="compact-button bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
              onClick={handleRestart}
              disabled={!isHost}
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restart
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

        {status ? <p className="text-xs font-bold text-coral">{status}</p> : null}

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
                        ? "Round Reveal"
                        : isMyTurn
                          ? "Your Turn"
                          : `${state.activePlayerName || "Player"}'s Turn`}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-white">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {room.players.length}/5
                  </span>
                  {!room.gameEnded && state.phase === "turn" ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-extrabold ${
                        turnLeftMs <= 3000 ? "tag-timer-pulse bg-coral text-white" : "bg-honey text-ink"
                      }`}
                    >
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {formatSeconds(turnLeftMs)}s
                    </span>
                  ) : null}
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="compact-button flex-1 border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
                      onClick={onLeaveRoom}
                    >
                      <Home className="h-4 w-4" aria-hidden="true" />
                      Home
                    </button>
                    <button
                      type="button"
                      className="compact-button flex-1 bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                      onClick={handleRestart}
                      disabled={!isHost}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Restart
                    </button>
                  </div>
                </div>
              ) : state.phase === "reveal" ? (
                <div className="space-y-3">
                  {latestAction ? (
                    <div
                      className={`rounded-md border p-4 ${
                        latestAction.correct
                          ? "border-mint bg-mint/10 text-mint"
                          : latestAction.skipped
                            ? "border-ink/10 bg-paper text-ink"
                            : "border-coral bg-coral/10 text-coral"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {latestAction.correct ? (
                          <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" />
                        ) : latestAction.skipped ? (
                          <Clock className="h-7 w-7 shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-7 w-7 shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-xl font-extrabold">
                            {latestAction.skipped
                              ? `${latestAction.actorPlayerName} skipped`
                              : `${latestAction.actorPlayerName} selected ${latestAction.suspectPlayerName}`}
                          </h3>
                          <p className="truncate text-sm font-bold opacity-75">
                            {latestAction.correct ? "+100" : latestAction.skipped ? "No change" : "Roles swapped"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-2 sm:grid-cols-5">
                    {players.map((player) => (
                      <RoleCard key={player.playerId} player={player} compact />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
                  <div className="space-y-3">
                    <RoleCard player={myPlayer} title="Your Role" />
                    {myTargetRole ? (
                      <div className="rounded-md border border-ink/10 bg-paper p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Repeat2 className="h-4 w-4 text-mint" aria-hidden="true" />
                          <p className="text-sm font-extrabold">Target</p>
                        </div>
                        <div className={`rounded-md border p-3 ${roleToneClasses[myTargetRole.tone] || roleToneClasses.paper}`}>
                          <p className="text-2xl font-extrabold leading-none">{myTargetRole.short}</p>
                          <p className="mt-1 text-sm font-extrabold">{myTargetRole.label}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {isMyTurn ? (
                    <div className="rounded-md border border-ink/10 bg-paper p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold">Choose Player</h3>
                        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-extrabold text-white">
                          Turn {state.turnNumber || 1}
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
                        onClick={handleSelect}
                        disabled={!selectedSuspectId}
                      >
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <div className="grid place-items-center rounded-md border border-ink/10 bg-paper p-5 text-center">
                      <div>
                        <Clock className="mx-auto mb-2 h-9 w-9 text-ink/35" aria-hidden="true" />
                        <h3 className="text-xl font-extrabold text-ink">{state.activePlayerName || "Player"}</h3>
                        <p className="mt-1 text-sm font-bold text-ink/55">Turn {state.turnNumber || 1}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-3">
            <Scoreboard leaderboard={state.leaderboard || []} currentPlayerId={session.playerId} />
            <ActionLog actions={state.actions || []} revealed={state.revealed || room.gameEnded} />

            {history.length > 0 ? (
              <section className="surface p-3">
                <h2 className="mb-3 text-base font-extrabold">Rounds</h2>
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.round} className="rounded-md bg-paper px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold">Round {entry.round}</span>
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-extrabold text-white">
                          {Object.values(entry.roundScores || {}).reduce((sum, points) => sum + Number(points || 0), 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
