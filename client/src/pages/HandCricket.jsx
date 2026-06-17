import { Check, Clock3, Copy, DoorOpen, Home, RefreshCw, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { buildRoomLink } from "../utils/roomLink.js";

const calculatorNumbers = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0, 10];
const teamLabels = {
  red: "Team Red",
  blue: "Team Blue"
};

function hasPick(picks, playerId) {
  return Object.prototype.hasOwnProperty.call(picks || {}, playerId);
}

function CricketBatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.5 3.5 20.5 9.5 9.2 20.8a2.7 2.7 0 0 1-3.8 0l-2.2-2.2a2.7 2.7 0 0 1 0-3.8L14.5 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m15.5 2.5 6 6M4.8 16.7l2.5 2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CricketBallIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9 4.2c2.2 3.1 2.2 12.5 0 15.6M15 4.2c-2.2 3.1-2.2 12.5 0 15.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RoleBadge({ role }) {
  if (!role) {
    return null;
  }

  const isBatting = role === "batting";
  const Icon = isBatting ? CricketBatIcon : CricketBallIcon;

  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
        isBatting ? "bg-coral/15 text-coral" : "bg-mint/15 text-mint"
      }`}
      title={isBatting ? "Batting" : "Bowling"}
      aria-label={isBatting ? "Batting" : "Bowling"}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function getPlayerStats(state, playerId) {
  const balls = state.balls || [];
  const score = state.scores?.[playerId] || 0;
  const ballsFaced = balls.filter((ball) => ball.battingPlayerId === playerId).length;
  const ballsBowled = balls.filter((ball) => ball.bowlingPlayerId === playerId);
  const runsConceded = ballsBowled.reduce((sum, ball) => sum + (ball.runs || 0), 0);
  const wickets = ballsBowled.filter((ball) => ball.out).length;
  const strikeRate = ballsFaced ? ((score / ballsFaced) * 100).toFixed(1) : "0.0";
  const economy = ballsBowled.length ? ((runsConceded / ballsBowled.length) * 6).toFixed(1) : "0.0";

  return { score, ballsFaced, strikeRate, economy, wickets };
}

function getTeamKeyForPlayer(state, playerId) {
  if (!state.teams) {
    return null;
  }

  return ["red", "blue"].find((teamKey) => state.teams[teamKey]?.players?.includes(playerId)) || null;
}

function getActiveTeamName(state, teamKey) {
  return state.teams?.[teamKey]?.name || teamLabels[teamKey] || "-";
}

function getAvailableTeamBatsmen(state) {
  const outPlayerIds = new Set(state.outPlayerIds || []);
  return (state.teams?.[state.battingTeam]?.battingOrder || []).filter(
    (playerId) => !outPlayerIds.has(playerId)
  );
}

function NumberPad({ disabled, onPick, role, secondsLeft, timerProgress, selectedNumber }) {
  const label = role === "bat" ? "Choose runs" : role === "bowl" ? "Choose bowl" : "Waiting";

  return (
    <div className="mx-auto max-w-xs rounded-md border border-ink/10 bg-paper p-2.5">
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            secondsLeft <= 2 ? "bg-coral" : "bg-mint"
          }`}
          style={{ width: `${timerProgress}%` }}
        />
      </div>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-extrabold uppercase text-ink/50">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
            secondsLeft <= 2 ? "bg-coral text-white" : "bg-white text-ink/60"
          }`}
        >
          {secondsLeft}s
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {calculatorNumbers.map((number) => {
          const isSelected = selectedNumber === number;

          return (
            <button
              key={number}
              type="button"
              className={`relative h-12 rounded-md border text-lg font-extrabold shadow-sm transition active:scale-95 disabled:cursor-not-allowed sm:h-14 ${
                number === 10 ? "col-span-2" : ""
              } ${
                isSelected
                  ? "pick-pop border-coral bg-coral text-white shadow-md"
                  : "border-ink/15 bg-white text-ink hover:border-coral hover:text-coral disabled:bg-ink/10 disabled:text-ink/35"
              } ${selectedNumber !== null && !isSelected ? "opacity-45" : ""}`}
              disabled={disabled}
              onClick={() => onPick(number)}
            >
              {number}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TossNumberPad({ disabled, onPick, selectedNumber, secondsLeft, timerProgress }) {
  return (
    <div className="mx-auto max-w-xs rounded-md border border-ink/10 bg-paper p-2.5">
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            secondsLeft <= 3 ? "bg-coral" : "bg-mint"
          }`}
          style={{ width: `${timerProgress}%` }}
        />
      </div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-extrabold uppercase text-ink/50">Toss number</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
            secondsLeft <= 3 ? "bg-coral text-white" : "bg-white text-ink/60"
          }`}
        >
          {secondsLeft}s
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {calculatorNumbers.map((number) => {
          const isSelected = selectedNumber === number;

          return (
            <button
              key={number}
              type="button"
              className={`relative h-12 rounded-md border text-lg font-extrabold shadow-sm transition active:scale-95 disabled:cursor-not-allowed sm:h-14 ${
                number === 10 ? "col-span-2" : ""
              } ${
                isSelected
                  ? "pick-pop border-coral bg-coral text-white shadow-md"
                  : "border-ink/15 bg-white text-ink hover:border-coral hover:text-coral disabled:bg-ink/10 disabled:text-ink/35"
              } ${selectedNumber !== null && !isSelected ? "opacity-45" : ""}`}
              disabled={disabled}
              onClick={() => onPick(number)}
            >
              {number}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StartCountdownClock({ label, progress, state, battingPlayer, bowlingPlayer, isTeamMode }) {
  return (
    <div className="text-center">
      <p className="text-xs font-extrabold uppercase text-ink/50">Match starts</p>
      <div
        className="mx-auto my-4 flex h-44 w-44 items-center justify-center rounded-full p-2 shadow-soft"
        style={{
          background: `conic-gradient(#2f9f88 ${progress * 3.6}deg, rgba(23, 33, 43, 0.1) 0deg)`
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-ink">
          <Clock3 className="mb-1 h-8 w-8 text-mint" aria-hidden="true" />
          <span className={`${typeof label === "number" ? "text-6xl" : "text-xl"} font-extrabold`}>
            {label}
          </span>
        </div>
      </div>
      <h2 className="text-2xl font-extrabold">
        {isTeamMode ? `${getActiveTeamName(state, state.battingTeam)} batting` : `${battingPlayer?.name} batting`}
      </h2>
      <p className="mt-1 text-sm font-bold text-ink/55">
        {battingPlayer?.name} vs {bowlingPlayer?.name}
      </p>
    </div>
  );
}

function BallRevealCard({ reveal, playersById }) {
  if (!reveal) {
    return null;
  }

  const battingPlayer = playersById[reveal.battingPlayerId];
  const bowlingPlayer = playersById[reveal.bowlingPlayerId];

  return (
    <div className="ball-reveal-card mx-auto max-w-md text-center">
      <p className="text-xs font-extrabold uppercase text-ink/50">Ball reveal</p>
      <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="rounded-md bg-paper p-3">
          <p className="truncate text-xs font-extrabold uppercase text-coral">Bat</p>
          <p className="truncate text-sm font-bold text-ink/60">{battingPlayer?.name}</p>
          <p className="mt-1 text-4xl font-extrabold text-ink">{reveal.batsmanNumber}</p>
        </div>
        <span className="text-xs font-extrabold uppercase text-ink/40">vs</span>
        <div className="rounded-md bg-paper p-3">
          <p className="truncate text-xs font-extrabold uppercase text-mint">Bowl</p>
          <p className="truncate text-sm font-bold text-ink/60">{bowlingPlayer?.name}</p>
          <p className="mt-1 text-4xl font-extrabold text-ink">{reveal.bowlerNumber}</p>
        </div>
      </div>
      <div
        className={`rounded-md px-3 py-3 ${
          reveal.out ? "bg-coral text-white" : "bg-honey text-ink"
        }`}
      >
        <h2 className="text-3xl font-extrabold">{reveal.out ? "OUT" : `+${reveal.runs}`}</h2>
        <p className="text-sm font-extrabold">
          {reveal.out ? "Numbers matched" : `Score ${reveal.scoreBefore} to ${reveal.scoreAfter}`}
        </p>
      </div>
    </div>
  );
}

function TeamPlayerSelection({ state, session, playersById, onSelect, secondsLeft, timerProgress }) {
  const battingTeam = state.battingTeam;
  const bowlingTeam = state.bowlingTeam;
  const myTeam = getTeamKeyForPlayer(state, session.playerId);
  const battingCaptainId = state.teams?.[battingTeam]?.captainId;
  const bowlingCaptainId = state.teams?.[bowlingTeam]?.captainId;
  const canPickBatsman = myTeam === battingTeam && battingCaptainId === session.playerId;
  const canPickBowler = myTeam === bowlingTeam && bowlingCaptainId === session.playerId;
  const battingReady = Boolean(state.teamSelectionReady?.[battingTeam]);
  const bowlingReady = Boolean(state.teamSelectionReady?.[bowlingTeam]);
  const availableBatsmen = getAvailableTeamBatsmen(state);
  const battingOrderCount = state.teams?.[battingTeam]?.battingOrder?.length || 0;
  const bowlingPlayers = state.teams?.[bowlingTeam]?.players || [];
  const changeRequester = playersById[state.teamSelectionRequestedById];
  const selectionActions = state.teamSelectionActions || [];

  const renderPlayerButton = (playerId, selected, disabled, tone = "bat") => {
    const player = playersById[playerId];
    const selectedClass =
      tone === "bowl"
        ? "border-mint bg-mint text-white"
        : "border-coral bg-coral text-white";

    return (
      <button
        key={playerId}
        type="button"
        className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-bold transition ${
          selected
            ? selectedClass
            : "border-ink/10 bg-white text-ink hover:border-coral hover:text-coral disabled:bg-ink/10 disabled:text-ink/35"
        }`}
        disabled={disabled}
        onClick={() => onSelect({ playerId })}
      >
        <span className="min-w-0 truncate">{player?.name}</span>
        {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-ink/50">Captain selection</p>
          <h2 className="text-2xl font-extrabold">Choose players</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state.target ? (
            <span className="rounded-full bg-honey px-3 py-1 text-sm font-extrabold text-ink">
              Target {state.target}
            </span>
          ) : null}
          <span
            className={`rounded-full px-3 py-1 text-sm font-extrabold ${
              secondsLeft <= 3 ? "bg-coral text-white" : "bg-white text-ink/60"
            }`}
          >
            {secondsLeft}s
          </span>
        </div>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            secondsLeft <= 3 ? "bg-coral" : "bg-mint"
          }`}
          style={{ width: `${timerProgress}%` }}
        />
      </div>

      {state.teamSelectionReason === "change" && changeRequester ? (
        <div className="mb-3 rounded-md border border-honey/70 bg-honey/20 px-3 py-2">
          <p className="text-sm font-extrabold text-ink">
            {changeRequester.name} opened change window
          </p>
        </div>
      ) : null}

      {selectionActions.length > 0 ? (
        <div className="mb-3 grid gap-2">
          {selectionActions.map((action) => {
            const captain = playersById[action.captainId];
            const selectedPlayer = playersById[action.playerId];
            const roleLabel = action.role === "bat" ? "bat" : "bowl";
            const message =
              action.playerId === session.playerId
                ? `${captain?.name || "Captain"} chose you to ${roleLabel}`
                : `${captain?.name || "Captain"} chose ${selectedPlayer?.name || "a player"} to ${roleLabel}`;

            return (
              <p
                key={action.id}
                className={`rounded-md px-3 py-2 text-sm font-extrabold ${
                  action.playerId === session.playerId
                    ? "bg-mint text-white"
                    : "bg-white text-ink/65"
                }`}
              >
                {message}
              </p>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold uppercase text-coral">
                {getActiveTeamName(state, battingTeam)}
              </p>
              <h3 className="text-base font-extrabold">
                Batsman {availableBatsmen.length}/{battingOrderCount}
              </h3>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                battingReady ? "bg-mint text-white" : "bg-white text-ink/55"
              }`}
            >
              {battingReady ? "Ready" : "Waiting"}
            </span>
          </div>
          <div className="grid gap-2">
            {availableBatsmen.map((playerId) =>
              renderPlayerButton(playerId, playerId === state.battingPlayerId, !canPickBatsman, "bat")
            )}
          </div>
          {canPickBatsman ? (
            <button
              type="button"
              className="compact-button mt-3 w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
              disabled={battingReady || !state.battingPlayerId}
              onClick={() => onSelect({ ready: true })}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Ready
            </button>
          ) : (
            <p className="mt-3 text-xs font-bold text-ink/55">
              Waiting for {playersById[battingCaptainId]?.name || "captain"}
            </p>
          )}
        </div>

        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold uppercase text-mint">
                {getActiveTeamName(state, bowlingTeam)}
              </p>
              <h3 className="text-base font-extrabold">Bowler</h3>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                bowlingReady ? "bg-mint text-white" : "bg-white text-ink/55"
              }`}
            >
              {bowlingReady ? "Ready" : "Waiting"}
            </span>
          </div>
          <div className="grid gap-2">
            {bowlingPlayers.map((playerId) =>
              renderPlayerButton(playerId, playerId === state.bowlingPlayerId, !canPickBowler, "bowl")
            )}
          </div>
          {canPickBowler ? (
            <button
              type="button"
              className="compact-button mt-3 w-full bg-mint text-white hover:bg-mint/90 disabled:bg-ink/20"
              disabled={bowlingReady || !state.bowlingPlayerId}
              onClick={() => onSelect({ ready: true })}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Ready
            </button>
          ) : (
            <p className="mt-3 text-xs font-bold text-ink/55">
              Waiting for {playersById[bowlingCaptainId]?.name || "captain"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamScorePanel({ state }) {
  if (state.mode !== "team") {
    return null;
  }

  return (
    <section className="surface p-3">
      <h2 className="mb-2 text-base font-extrabold">Teams</h2>
      <div className="space-y-2">
        {["red", "blue"].map((teamKey) => {
          const active = state.battingTeam === teamKey;
          const teamName = getActiveTeamName(state, teamKey);
          const teamScore = state.teamScores?.[teamKey] || 0;
          const requiredRuns =
            active && state.innings === 2 && state.target
              ? Math.max(0, Number(state.target) - teamScore)
              : null;

          return (
            <div
              key={teamKey}
              className={`rounded-md px-3 py-2 ${
                active ? "bg-honey text-ink" : "bg-paper text-ink"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-extrabold">{teamName}</span>
                <span className="text-xl font-extrabold">
                  {teamScore}/{state.wickets?.[teamKey] || 0}
                </span>
              </div>
              {active ? (
                <p className="mt-1 text-xs font-extrabold uppercase text-ink/55">
                  {requiredRuns === null ? "Batting" : `Need ${requiredRuns}`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getTeamRequiredRuns(state) {
  if (state.mode !== "team" || state.innings !== 2 || !state.target || !state.battingTeam) {
    return null;
  }

  return Math.max(0, Number(state.target) - (state.teamScores?.[state.battingTeam] || 0));
}

export default function HandCricket({
  room,
  session,
  onChooseToss,
  onPickNumber,
  onChooseDecision,
  onSelectTeamPlayer,
  onRequestTeamChange,
  onRestartGame,
  onLeaveRoom
}) {
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(Date.now());
  const [selectedPick, setSelectedPick] = useState(null);
  const [selectedTossPick, setSelectedTossPick] = useState(null);
  const state = room.handCricket || {};
  const isHost = room.host === session.playerId;
  const isTeamMode = state.mode === "team";
  const playersById = Object.fromEntries(room.players.map((player) => [player.playerId, player]));
  const tossChooser = playersById[state.tossChooserId];
  const tossOpponent = playersById[state.tossOpponentId];
  const tossWinner = playersById[state.tossWinnerId];
  const battingPlayer = playersById[state.battingPlayerId];
  const bowlingPlayer = playersById[state.bowlingPlayerId];
  const myTeam = getTeamKeyForPlayer(state, session.playerId);
  const isCaptain = Boolean(myTeam && state.teams?.[myTeam]?.captainId === session.playerId);
  const lastBall = state.balls?.[state.balls.length - 1];
  const requiredRuns = getTeamRequiredRuns(state);
  const changeRequester = playersById[state.teamSelectionRequestedById];
  const changeWindowOpen = state.phase === "player-selection" && state.teamSelectionReason === "change";
  const myBallPicked = hasPick(state.currentBallPicks, session.playerId);
  const tossPlayerIds = Object.keys(state.tossPicks || {});
  const tossTotal = Object.values(state.tossPicks || {}).reduce((sum, value) => sum + Number(value), 0);
  const tossParity = tossTotal % 2 === 0 ? "even" : "odd";
  const tossParticipantIds = [state.tossChooserId, state.tossOpponentId].filter(Boolean);
  const myTossPicked = hasPick(state.tossPicks, session.playerId);
  const canPickToss =
    state.phase === "toss-throw" &&
    tossParticipantIds.includes(session.playerId) &&
    !myTossPicked;
  const canPickBall =
    state.phase === "innings" &&
    (session.playerId === state.battingPlayerId || session.playerId === state.bowlingPlayerId) &&
    !myBallPicked;
  const canRequestTeamChange = isTeamMode && isCaptain && state.phase === "innings" && Boolean(lastBall);
  const canChooseToss = !isTeamMode || isCaptain;
  const myRole =
    session.playerId === state.battingPlayerId
      ? "bat"
      : session.playerId === state.bowlingPlayerId
        ? "bowl"
        : null;
  const batsmanPicked = hasPick(state.currentBallPicks, state.battingPlayerId);
  const bowlerPicked = hasPick(state.currentBallPicks, state.bowlingPlayerId);
  const ballWaitingText =
    !batsmanPicked && !bowlerPicked
      ? "Waiting for batsman and bowler"
      : !batsmanPicked
        ? "Waiting for batsman"
        : !bowlerPicked
          ? "Waiting for bowler"
          : "Waiting for reveal";
  const moveDurationMs = state.moveDurationMs || 7000;
  const moveTimeLeftMs =
    state.phase === "innings" && state.moveDeadlineAt
      ? Math.max(0, Number(state.moveDeadlineAt) - now)
      : 0;
  const secondsLeft = Math.ceil(moveTimeLeftMs / 1000);
  const timerProgress =
    state.phase === "innings" && state.moveDeadlineAt
      ? Math.max(0, Math.min(100, (moveTimeLeftMs / moveDurationMs) * 100))
      : 100;
  const countdownDurationMs = state.countdownDurationMs || 5000;
  const countdownTimeLeftMs =
    state.phase === "countdown" && state.countdownDeadlineAt
      ? Math.max(0, Number(state.countdownDeadlineAt) - now)
      : 0;
  const countdownSecondsLeft = Math.ceil(countdownTimeLeftMs / 1000);
  const countdownProgress =
    state.phase === "countdown" && state.countdownDeadlineAt
      ? Math.max(0, Math.min(100, (1 - countdownTimeLeftMs / countdownDurationMs) * 100))
      : 100;
  const countdownLabel = countdownSecondsLeft > 0 ? countdownSecondsLeft : "Let's start";
  const tossDurationMs = state.tossDurationMs || 10000;
  const tossTimeLeftMs =
    state.phase === "toss-throw" && state.tossDeadlineAt
      ? Math.max(0, Number(state.tossDeadlineAt) - now)
      : 0;
  const tossSecondsLeft = Math.ceil(tossTimeLeftMs / 1000);
  const tossTimerProgress =
    state.phase === "toss-throw" && state.tossDeadlineAt
      ? Math.max(0, Math.min(100, (tossTimeLeftMs / tossDurationMs) * 100))
      : 100;
  const decisionDurationMs = state.decisionDurationMs || 15000;
  const decisionTimeLeftMs =
    state.phase === "decision" && state.decisionDeadlineAt
      ? Math.max(0, Number(state.decisionDeadlineAt) - now)
      : 0;
  const decisionSecondsLeft = Math.ceil(decisionTimeLeftMs / 1000);
  const decisionTimerProgress =
    state.phase === "decision" && state.decisionDeadlineAt
      ? Math.max(0, Math.min(100, (decisionTimeLeftMs / decisionDurationMs) * 100))
      : 100;
  const selectionDurationMs = state.teamSelectionDurationMs || 5000;
  const selectionTimeLeftMs =
    state.phase === "player-selection" && state.teamSelectionDeadlineAt
      ? Math.max(0, Number(state.teamSelectionDeadlineAt) - now)
      : 0;
  const selectionSecondsLeft = Math.ceil(selectionTimeLeftMs / 1000);
  const selectionTimerProgress =
    state.phase === "player-selection" && state.teamSelectionDeadlineAt
      ? Math.max(0, Math.min(100, (selectionTimeLeftMs / selectionDurationMs) * 100))
      : 100;

  useEffect(() => {
    const hasInningsTimer = state.phase === "innings" && state.moveDeadlineAt;
    const hasCountdownTimer = state.phase === "countdown" && state.countdownDeadlineAt;
    const hasTossTimer = state.phase === "toss-throw" && state.tossDeadlineAt;
    const hasDecisionTimer = state.phase === "decision" && state.decisionDeadlineAt;
    const hasSelectionTimer = state.phase === "player-selection" && state.teamSelectionDeadlineAt;

    if (!hasInningsTimer && !hasCountdownTimer && !hasTossTimer && !hasDecisionTimer && !hasSelectionTimer) {
      return undefined;
    }

    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 200);

    return () => window.clearInterval(interval);
  }, [
    state.phase,
    state.moveDeadlineAt,
    state.countdownDeadlineAt,
    state.tossDeadlineAt,
    state.decisionDeadlineAt,
    state.teamSelectionDeadlineAt,
    state.moveId
  ]);

  useEffect(() => {
    if (state.phase !== "innings") {
      setSelectedPick(null);
      return undefined;
    }

    if (selectedPick === null) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSelectedPick(null);
    }, 560);

    return () => window.clearTimeout(timeout);
  }, [state.phase, state.moveId, selectedPick]);

  useEffect(() => {
    if (state.phase !== "toss-throw") {
      setSelectedTossPick(null);
      return undefined;
    }

    if (selectedTossPick === null) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSelectedTossPick(null);
    }, 560);

    return () => window.clearTimeout(timeout);
  }, [state.phase, selectedTossPick]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

  const runAction = async (action) => {
    setStatus("");
    const result = await action();

    if (!result.ok) {
      setStatus(result.error);
    }

    return result;
  };

  const handlePickTossNumber = async (number) => {
    if (!canPickToss || selectedTossPick !== null) {
      return;
    }

    setSelectedTossPick(number);
    const result = await runAction(() => onPickNumber(number));

    if (!result.ok) {
      setSelectedTossPick(null);
    }
  };

  const handlePickNumber = async (number) => {
    if (!canPickBall || selectedPick !== null) {
      return;
    }

    setSelectedPick(number);
    const result = await runAction(() => onPickNumber(number));

    if (!result.ok) {
      setSelectedPick(null);
    }
  };

  const handleSelectTeamPlayer = async (payload) => {
    const result = await runAction(() => onSelectTeamPlayer(payload));

    return result;
  };

  const handleRequestTeamChange = async () => {
    const result = await runAction(onRequestTeamChange);

    return result;
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              HC
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">Hand Cricket Room</p>
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
              className="compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
              onClick={onLeaveRoom}
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Leave
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1fr_19rem] xl:grid-cols-[1fr_21rem]">
          <div className="space-y-3">
            <section className="surface p-4">
              {state.phase === "toss-choice" ? (
                <div className="text-center">
                  <p className="text-xs font-extrabold uppercase text-ink/50">Toss</p>
                  <h2 className="mb-3 text-2xl font-extrabold">Choose Odd or Even</h2>
                  <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="compact-button bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                      disabled={!canChooseToss}
                      onClick={() => runAction(() => onChooseToss("odd"))}
                    >
                      Odd
                    </button>
                    <button
                      type="button"
                      className="compact-button bg-mint text-white hover:bg-mint/90 disabled:bg-ink/20"
                      disabled={!canChooseToss}
                      onClick={() => runAction(() => onChooseToss("even"))}
                    >
                      Even
                    </button>
                  </div>
                  {!canChooseToss ? (
                    <p className="mt-3 text-sm font-bold text-ink/55">
                      Waiting for a captain to choose
                    </p>
                  ) : null}
                </div>
              ) : null}

              {state.phase === "toss-throw" ? (
                <div className="text-center">
                  <p className="text-xs font-extrabold uppercase text-ink/50">
                    {tossChooser?.name} chose {state.tossChoice}
                  </p>
                  <h2 className="mb-3 text-2xl font-extrabold">Pick a toss number</h2>
                  <div className="mx-auto mb-3 grid max-w-md gap-2 sm:grid-cols-2">
                    {tossParticipantIds.map((playerId) => {
                      const pick = state.tossPicks?.[playerId];
                      const label = pick === undefined ? "Waiting" : pick === true ? "Picked" : pick;

                      return (
                        <div key={playerId} className="rounded-md bg-paper p-3">
                          <p className="truncate text-xs font-bold text-ink/55">
                            {playersById[playerId]?.name}
                          </p>
                          <p className="text-2xl font-extrabold">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                  {canPickToss ? (
                    <TossNumberPad
                      disabled={selectedTossPick !== null}
                      selectedNumber={selectedTossPick}
                      secondsLeft={tossSecondsLeft}
                      timerProgress={tossTimerProgress}
                      onPick={handlePickTossNumber}
                    />
                  ) : myTossPicked ? (
                    <p className="font-bold text-ink/60">Waiting for {tossOpponent?.name || "opponent"}</p>
                  ) : (
                    <p className="font-bold text-ink/60">Waiting for toss numbers</p>
                  )}
                </div>
              ) : null}

              {state.phase === "decision" ? (
                <div className="text-center">
                  <p className="text-xs font-extrabold uppercase text-ink/50">
                    {tossChooser?.name} chose {state.tossChoice}
                  </p>
                  <div className="mx-auto my-3 grid max-w-md gap-2 sm:grid-cols-2">
                    {tossPlayerIds.map((playerId) => (
                      <div key={playerId} className="rounded-md bg-paper p-3">
                        <p className="text-xs font-bold text-ink/55">
                          {playersById[playerId]?.name}
                        </p>
                        <p className="text-2xl font-extrabold">
                          {state.tossPicks?.[playerId]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mb-1 text-sm font-extrabold text-ink/60">
                    Total {tossTotal} - {tossParity}
                  </p>
                  <p className="text-xs font-extrabold uppercase text-ink/50">Toss winner</p>
                  <h2 className="mb-3 text-2xl font-extrabold">{tossWinner?.name}</h2>
                  <div className="mx-auto mb-3 max-w-sm">
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className={`h-full rounded-full transition-[width] duration-200 ${
                          decisionSecondsLeft <= 5 ? "bg-coral" : "bg-mint"
                        }`}
                        style={{ width: `${decisionTimerProgress}%` }}
                      />
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                        decisionSecondsLeft <= 5 ? "bg-coral text-white" : "bg-white text-ink/60"
                      }`}
                    >
                      {decisionSecondsLeft}s
                    </span>
                  </div>
                  {session.playerId === state.tossWinnerId ? (
                    <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="compact-button bg-coral text-white hover:bg-coral/90"
                        onClick={() => runAction(() => onChooseDecision("bat"))}
                      >
                        Bat
                      </button>
                      <button
                        type="button"
                        className="compact-button bg-mint text-white hover:bg-mint/90"
                        onClick={() => runAction(() => onChooseDecision("bowl"))}
                      >
                        Bowl
                      </button>
                    </div>
                  ) : (
                    <p className="font-bold text-ink/60">Waiting for bat/bowl choice</p>
                  )}
                </div>
              ) : null}

              {state.phase === "player-selection" ? (
                <TeamPlayerSelection
                  state={state}
                  session={session}
                  playersById={playersById}
                  onSelect={handleSelectTeamPlayer}
                  secondsLeft={selectionSecondsLeft}
                  timerProgress={selectionTimerProgress}
                />
              ) : null}

              {state.phase === "countdown" ? (
                <StartCountdownClock
                  label={countdownLabel}
                  progress={countdownProgress}
                  state={state}
                  battingPlayer={battingPlayer}
                  bowlingPlayer={bowlingPlayer}
                  isTeamMode={isTeamMode}
                />
              ) : null}

              {state.phase === "innings" ? (
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold uppercase text-ink/50">
                        Innings {state.innings}
                      </p>
                      <h2 className="text-2xl font-extrabold">
                        {isTeamMode
                          ? `${getActiveTeamName(state, state.battingTeam)} batting`
                          : `${battingPlayer?.name} batting`}
                      </h2>
                      {isTeamMode ? (
                        <p className="text-sm font-bold text-ink/55">
                          {battingPlayer?.name} on strike / {bowlingPlayer?.name} bowling
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {state.target ? (
                        <span className="rounded-full bg-honey px-3 py-1 text-sm font-extrabold text-ink">
                          Target {state.target}
                        </span>
                      ) : null}
                      {requiredRuns !== null ? (
                        <span className="rounded-full bg-mint px-3 py-1 text-sm font-extrabold text-white">
                          Need {requiredRuns}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <NumberPad
                    disabled={!canPickBall || selectedPick !== null}
                    role={myRole}
                    secondsLeft={secondsLeft}
                    timerProgress={timerProgress}
                    selectedNumber={selectedPick}
                    onPick={handlePickNumber}
                  />

                  {myBallPicked ? (
                    <p className="mt-3 text-sm font-bold text-ink/55">{ballWaitingText}</p>
                  ) : !canPickBall && myRole ? (
                    <p className="mt-3 text-sm font-bold text-ink/55">{ballWaitingText}</p>
                  ) : !canPickBall ? (
                    <p className="mt-3 text-sm font-bold text-ink/55">{ballWaitingText}</p>
                  ) : null}
                </div>
              ) : null}

              {state.phase === "ball-reveal" ? (
                <BallRevealCard reveal={state.ballReveal} playersById={playersById} />
              ) : null}

              {state.phase === "result" ? (
                <div className="result-card text-center">
                  <Trophy className="winner-trophy mx-auto mb-2 h-10 w-10 text-honey" />
                  <p className="text-xs font-extrabold uppercase text-ink/50">Result</p>
                  <h2 className="text-3xl font-extrabold">
                    {state.resultType === "tie" ? "Match tied" : `${room.winner?.name} wins`}
                  </h2>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="compact-button flex-1 border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
                      onClick={onLeaveRoom}
                    >
                      <Home className="h-4 w-4" />
                      Home
                    </button>
                    <button
                      type="button"
                      className="compact-button flex-1 bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                      onClick={() => runAction(onRestartGame)}
                      disabled={!isHost}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restart
                    </button>
                  </div>
                  {!isHost ? (
                    <p className="mt-2 text-xs font-bold text-ink/55">Waiting for host</p>
                  ) : null}
                </div>
              ) : null}
            </section>

            {lastBall && state.phase !== "ball-reveal" ? (
              <section className="surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-ink/50">Last ball</p>
                    <p className="text-sm font-bold">
                      {playersById[lastBall.battingPlayerId]?.name} {lastBall.batsmanNumber} vs{" "}
                      {playersById[lastBall.bowlingPlayerId]?.name} {lastBall.bowlerNumber} -{" "}
                      {lastBall.out ? "OUT" : `+${lastBall.runs} runs`}
                    </p>
                  </div>
                  {canRequestTeamChange ? (
                    <button
                      type="button"
                      className="compact-button bg-ink text-white hover:bg-ink/90"
                      onClick={handleRequestTeamChange}
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Change
                    </button>
                  ) : null}
                </div>
                {changeWindowOpen && changeRequester ? (
                  <p className="mt-2 rounded-md bg-honey/25 px-3 py-2 text-sm font-extrabold text-ink">
                    {changeRequester.name} opened change window
                  </p>
                ) : null}
              </section>
            ) : null}

            {status ? <p className="text-xs font-bold text-coral">{status}</p> : null}
          </div>

          <aside className="space-y-3">
            <TeamScorePanel state={state} />

            <section className="surface p-3">
              <h2 className="mb-2 text-base font-extrabold">
                {isTeamMode ? "Players" : "Scoreboard"}
              </h2>
              <div className="space-y-2">
                {room.players.map((player) => {
                  const stats = getPlayerStats(state, player.playerId);
                  const playerTeam = getTeamKeyForPlayer(state, player.playerId);
                  const activeRolePhase = ["player-selection", "countdown", "innings", "ball-reveal"].includes(
                    state.phase
                  );
                  const isOut =
                    isTeamMode &&
                    playerTeam === state.battingTeam &&
                    (state.outPlayerIds || []).includes(player.playerId);
                  const role =
                    activeRolePhase && player.playerId === state.battingPlayerId
                      ? "batting"
                      : activeRolePhase && player.playerId === state.bowlingPlayerId
                        ? "bowling"
                        : null;

                  return (
                    <div key={player.playerId} className="rounded-md bg-paper px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <RoleBadge role={role} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{player.name}</span>
                            {isTeamMode ? (
                              <span className="block truncate text-[11px] font-extrabold uppercase text-ink/40">
                                {getActiveTeamName(state, playerTeam)}
                              </span>
                            ) : null}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isOut ? (
                            <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                              OUT
                            </span>
                          ) : null}
                          <span className="text-xl font-extrabold">{stats.score}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs font-extrabold text-ink/55">
                        {role === "bowling" ? (
                          <>
                            <span>ECO {stats.economy}</span>
                            <span>WKT {stats.wickets}</span>
                          </>
                        ) : (
                          <>
                            <span>BF {stats.ballsFaced}</span>
                            <span>SR {stats.strikeRate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
