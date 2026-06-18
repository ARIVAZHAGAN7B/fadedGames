import { useEffect, useMemo, useState } from "react";
import { Bomb, Clock, Crown, Gem, KeyRound, Keyboard, MessageSquare, Settings, Shield, Square, Users, Zap } from "lucide-react";
import BoardSetup from "../components/BoardSetup.jsx";
import { GamePage, RoomHeader, StatusMessage } from "../components/game/GameLayout.jsx";
import PlayerList from "../components/PlayerList.jsx";
import RoomSettingsStrip from "../components/lobby/RoomSettingsStrip.jsx";
import { resizeBoostNames, spyWordDifficulties, tagMaps, tagRoundOptions } from "../game/options.js";

const teamMeta = {
  red: {
    label: "Team Red",
    accent: "text-coral",
    activeClass: "border-coral bg-coral text-white"
  },
  blue: {
    label: "Team Blue",
    accent: "text-mint",
    activeClass: "border-mint bg-mint text-white"
  }
};

const rajaRaniRoles = ["Raja", "Rani", "Police", "Thirudan", "Manthiri"];
const rajaRaniTurnRoles = ["Raja", "Rani", "Manthiri", "Police", "Thirudan"];

function TeamSetup({ room, session, onJoinTeam }) {
  const [status, setStatus] = useState("");
  const playersById = Object.fromEntries(room.players.map((player) => [player.playerId, player]));
  const teams = room.handCricket?.teams || {};
  const teamSize = room.handCricketTeamSize || 2;

  const handleJoinTeam = async (teamKey) => {
    setStatus("");
    const result = await onJoinTeam(teamKey);
    setStatus(result.ok ? "" : result.error);
  };

  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">
            {room.handCricketMode === "team" ? "Team Match" : "Classic Match"}
          </p>
          <h2 className="text-lg font-extrabold">Hand Cricket</h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      {room.handCricketMode === "team" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {["red", "blue"].map((teamKey) => {
            const team = teams[teamKey] || { players: [], battingOrder: [] };
            const isMine = team.players.includes(session.playerId);
            const meta = teamMeta[teamKey];

            return (
              <div key={teamKey} className="rounded-md border border-ink/10 bg-paper p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className={`h-4 w-4 ${meta.accent}`} aria-hidden="true" />
                    <h3 className="text-base font-extrabold">{meta.label}</h3>
                  </div>
                  <span className="text-xs font-extrabold text-ink/55">
                    {team.players.length}/{teamSize}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(team.battingOrder.length ? team.battingOrder : team.players).map(
                    (playerId, index) => {
                      const player = playersById[playerId];

                      return (
                        <div
                          key={playerId}
                          className="flex items-center justify-between rounded-md bg-white px-2.5 py-2 text-sm font-bold"
                        >
                          <span className="truncate">
                            {index + 1}. {player?.name || "Player"}
                          </span>
                          {team.captainId === playerId ? (
                            <span className="text-[11px] font-extrabold uppercase text-ink/45">
                              Captain
                            </span>
                          ) : null}
                        </div>
                      );
                    }
                  )}

                  {team.players.length === 0 ? (
                    <div className="rounded-md bg-white px-2.5 py-2 text-sm font-bold text-ink/45">
                      Empty
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={`compact-button mt-3 w-full border ${
                    isMine
                      ? meta.activeClass
                      : "border-ink/15 bg-white text-ink hover:border-mint hover:text-mint"
                  } disabled:bg-ink/10 disabled:text-ink/35`}
                  disabled={isMine || team.players.length >= teamSize}
                  onClick={() => handleJoinTeam(teamKey)}
                >
                  {isMine ? "Selected" : "Join Team"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-2 text-sm font-bold text-ink/70 sm:grid-cols-2">
          <div className="rounded-md bg-paper p-3">Choose Odd or Even in the toss.</div>
          <div className="rounded-md bg-paper p-3">Pick 0 to 10 each ball.</div>
          <div className="rounded-md bg-paper p-3">Same number means OUT.</div>
          <div className="rounded-md bg-paper p-3">Second innings chases the target.</div>
        </div>
      )}

      {status ? <p className="mt-3 text-xs font-bold text-coral">{status}</p> : null}
    </section>
  );
}

function TagSetup({ room }) {
  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Realtime Chase</p>
          <h2 className="text-lg font-extrabold">TAG</h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Map</p>
          <p className="text-xl font-extrabold">{tagMaps[room.tag?.mapId] || "Grass"}</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Round</p>
          <p className="text-xl font-extrabold">{room.tag?.roundSeconds || 60}s</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Needed</p>
          <p className="text-xl font-extrabold">{Math.max(0, 2 - room.players.length)}</p>
        </div>
      </div>
    </section>
  );
}

function GuessNumberSetup({ room }) {
  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Number Duel</p>
          <h2 className="text-lg font-extrabold">Guess Number</h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/2
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <KeyRound className="mb-2 h-5 w-5 text-coral" aria-hidden="true" />
          <p className="text-sm font-extrabold text-ink">Lock a secret number from 1 to 100.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Clock className="mb-2 h-5 w-5 text-mint" aria-hidden="true" />
          <p className="text-sm font-extrabold text-ink">Take turns guessing the other number.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Users className="mb-2 h-5 w-5 text-honey" aria-hidden="true" />
          <p className="text-sm font-extrabold text-ink">Each guess returns higher, lower, or correct.</p>
        </div>
      </div>
    </section>
  );
}

function WordGuessSetup({ room }) {
  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Word Guess</p>
          <h2 className="text-lg font-extrabold">Blind Word Match</h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/2
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <KeyRound className="mb-2 h-5 w-5 text-coral" aria-hidden="true" />
          <p className="text-sm font-extrabold text-ink">Pick one word from your private pack.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Clock className="mb-2 h-5 w-5 text-mint" aria-hidden="true" />
          <p className="text-sm font-extrabold text-ink">Both players guess on the same clock.</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Keyboard className="mb-2 h-5 w-5 text-honey" aria-hidden="true" />
          <p className="text-sm font-extrabold text-ink">Six attempts with Wordle-style feedback.</p>
        </div>
      </div>
    </section>
  );
}

function SpyWordSetup({ room }) {
  const difficulty = room.spyWord?.difficulty || "easy";

  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Hidden Word</p>
          <h2 className="text-lg font-extrabold">Spy Word</h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Shield className="mb-2 h-5 w-5 text-coral" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Spy</p>
          <p className="text-xl font-extrabold">1</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Users className="mb-2 h-5 w-5 text-mint" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Players</p>
          <p className="text-xl font-extrabold">4-10</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <MessageSquare className="mb-2 h-5 w-5 text-honey" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Rounds</p>
          <p className="text-xl font-extrabold">5</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <KeyRound className="mb-2 h-5 w-5 text-ink" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Difficulty</p>
          <p className="text-xl font-extrabold capitalize">{difficulty}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-ink/10 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {spyWordDifficulties.map((option) => (
            <span
              key={option.id}
              className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                option.id === difficulty ? "bg-coral text-white" : "bg-paper text-ink/55"
              }`}
            >
              {option.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function RajaRaniSetup({ room }) {
  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Hidden Roles</p>
          <h2 className="flex items-center gap-1.5 text-lg font-extrabold">
            <Crown className="h-4 w-4 text-honey" aria-hidden="true" />
            Raja Rani
          </h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/5
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {rajaRaniTurnRoles.map((role, index) => (
          <div key={role} className="rounded-md border border-ink/10 bg-paper p-3">
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${
                index === 0
                  ? "bg-honey text-ink"
                  : index === 1
                    ? "bg-coral text-white"
                    : index === 2
                      ? "bg-mint text-white"
                      : index === 3
                        ? "bg-ink text-white"
                        : "bg-white text-ink"
              }`}
            >
              {role === "Police" ? <Shield className="h-4 w-4" aria-hidden="true" /> : role.slice(0, 2).toUpperCase()}
            </div>
            <p className="truncate text-sm font-extrabold">{role}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Rounds</p>
          <p className="text-xl font-extrabold">10</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Action</p>
          <p className="text-xl font-extrabold">Police</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Needed</p>
          <p className="text-xl font-extrabold">{Math.max(0, 5 - room.players.length)}</p>
        </div>
      </div>
    </section>
  );
}

function RajaRaniTurnsSetup({ room }) {
  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Clockwise Roles</p>
          <h2 className="flex items-center gap-1.5 text-lg font-extrabold">
            <Crown className="h-4 w-4 text-honey" aria-hidden="true" />
            Raja Rani Turns
          </h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/5
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {rajaRaniRoles.map((role, index) => (
          <div key={role} className="rounded-md border border-ink/10 bg-paper p-3">
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${
                index === 0
                  ? "bg-honey text-ink"
                  : index === 1
                    ? "bg-coral text-white"
                    : index === 2
                      ? "bg-mint text-white"
                      : index === 3
                        ? "bg-ink text-white"
                        : "bg-white text-ink"
              }`}
            >
              {index === 2 ? <Shield className="h-4 w-4" aria-hidden="true" /> : role.slice(0, 2).toUpperCase()}
            </div>
            <p className="truncate text-sm font-extrabold">{role}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Turns</p>
          <p className="text-xl font-extrabold">5 / round</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Timer</p>
          <p className="text-xl font-extrabold">10s</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <p className="text-xs font-extrabold uppercase text-ink/45">Needed</p>
          <p className="text-xl font-extrabold">{Math.max(0, 5 - room.players.length)}</p>
        </div>
      </div>
    </section>
  );
}

function BoostSetup({ room }) {
  const categories = room.boost?.categories || [];
  const toneClass = {
    coral: "border-coral bg-coral/10 text-coral",
    mint: "border-mint bg-mint/10 text-mint",
    honey: "border-honey bg-honey/20 text-ink",
    ink: "border-ink bg-ink text-white"
  };

  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Card Rush</p>
          <h2 className="flex items-center gap-1.5 text-lg font-extrabold">
            <Zap className="h-4 w-4 text-honey" aria-hidden="true" />
            BOOST
          </h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`flex min-h-28 flex-col justify-between rounded-md border p-3 ${
              toneClass[category.tone] || toneClass.ink
            }`}
          >
            <span className="text-xs font-extrabold uppercase">{category.label}</span>
            <span className="text-4xl font-extrabold leading-none">{category.short}</span>
            <span className="text-xs font-extrabold opacity-75">x{room.maxPlayers}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TreasureHuntSetup({ room }) {
  const neededPlayers = Math.max(0, 2 - room.players.length);

  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase text-mint">Grid Race</p>
          <h2 className="flex items-center gap-1.5 text-lg font-extrabold">
            <Gem className="h-4 w-4 text-honey" aria-hidden="true" />
            Treasure Hunt
          </h2>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink/65">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Square className="mb-2 h-5 w-5 text-mint" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Grid</p>
          <p className="text-xl font-extrabold">10x10</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Gem className="mb-2 h-5 w-5 text-honey" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Treasures</p>
          <p className="text-xl font-extrabold">15</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Bomb className="mb-2 h-5 w-5 text-coral" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Bomb Limit</p>
          <p className="text-xl font-extrabold">3</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-3">
          <Users className="mb-2 h-5 w-5 text-ink" aria-hidden="true" />
          <p className="text-xs font-extrabold uppercase text-ink/45">Needed</p>
          <p className="text-xl font-extrabold">{neededPlayers}</p>
        </div>
      </div>
    </section>
  );
}

export default function Lobby({
  room,
  session,
  board,
  onBoardSaved,
  onUpdateRoomSettings,
  onAddBot,
  onJoinHandCricketTeam,
  onStartGame,
  onLeaveRoom
}) {
  const [status, setStatus] = useState("");
  const [roomName, setRoomName] = useState(room.roomName);
  const [maxPlayers, setMaxPlayers] = useState(room.maxPlayers);
  const [teamMembers, setTeamMembers] = useState(room.handCricketTeamSize || 2);
  const [tagMapId, setTagMapId] = useState(room.tag?.mapId || "classic");
  const [tagRoundSeconds, setTagRoundSeconds] = useState(room.tag?.roundSeconds || 60);
  const [spyWordDifficulty, setSpyWordDifficulty] = useState(room.spyWord?.difficulty || "easy");
  const [boostCategoryNames, setBoostCategoryNames] = useState(
    resizeBoostNames((room.boost?.categories || []).map((category) => category.label), room.maxPlayers)
  );
  const isHost = room.host === session.playerId;
  const isBingo = room.gameType === "bingo";
  const isHandCricket = room.gameType === "hand-cricket";
  const isTag = room.gameType === "tag";
  const isGuessNumber = room.gameType === "guess-number";
  const isWordGuess = room.gameType === "word-guess";
  const isSpyWord = room.gameType === "spy-word";
  const isBoost = room.gameType === "boost";
  const isRajaRani = room.gameType === "raja-rani";
  const isRajaRaniTurns = room.gameType === "raja-rani-turns";
  const isTreasureHunt = room.gameType === "treasure-hunt";
  const isTeamHandCricket = room.handCricketMode === "team";
  const teamSize = room.handCricketTeamSize || 2;
  const teams = room.handCricket?.teams || {};
  const teamsReady =
    isTeamHandCricket &&
    ["red", "blue"].every((teamKey) => (teams[teamKey]?.players || []).length === teamSize);
  const allReady = useMemo(
    () => room.players.length > 0 && room.players.every((player) => player.hasBoard),
    [room.players]
  );
  const canStart = isGuessNumber
    ? room.players.length === 2
    : isWordGuess
      ? room.players.length === 2
      : isSpyWord
        ? room.players.length >= 4 && room.players.length <= 10
        : isBoost
          ? room.players.length === room.maxPlayers
          : isRajaRani
            ? room.players.length === 5
            : isRajaRaniTurns
              ? room.players.length === 5
              : isTreasureHunt
                ? room.players.length >= 2 && room.players.length <= room.maxPlayers
                : isTag
                ? room.players.length >= 2
                : isHandCricket
                  ? isTeamHandCricket
                    ? room.players.length === teamSize * 2 && teamsReady
                    : room.players.length === 2
                  : allReady;

  useEffect(() => {
    setRoomName(room.roomName);
    setMaxPlayers(room.maxPlayers);
    setTeamMembers(room.handCricketTeamSize || 2);
    setTagMapId(room.tag?.mapId || "classic");
    setTagRoundSeconds(room.tag?.roundSeconds || 60);
    setSpyWordDifficulty(room.spyWord?.difficulty || "easy");
    setBoostCategoryNames(
      resizeBoostNames((room.boost?.categories || []).map((category) => category.label), room.maxPlayers)
    );
  }, [room.boost?.categories, room.handCricketTeamSize, room.maxPlayers, room.roomName, room.spyWord?.difficulty, room.tag?.mapId, room.tag?.roundSeconds]);

  const handleStart = async () => {
    const result = await onStartGame();

    if (!result.ok) {
      setStatus(result.error);
    }
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setStatus("");

    const result = await onUpdateRoomSettings({
      roomName,
      maxPlayers: Number(maxPlayers),
      handCricketTeamSize: isTeamHandCricket ? Number(teamMembers) : undefined,
      tagMapId: isTag ? tagMapId : undefined,
      tagRoundSeconds: isTag ? Number(tagRoundSeconds) : undefined,
      spyWordDifficulty: isSpyWord ? spyWordDifficulty : undefined,
      boostCategoryLabels: isBoost ? boostCategoryNames : undefined
    });

    setStatus(result.ok ? "Settings updated" : result.error);
  };

  const handleAddBot = async () => {
    setStatus("");
    const result = await onAddBot();
    setStatus(result.ok ? `${result.player.name} added` : result.error);
  };

  const codeLabel = isWordGuess
    ? "WG"
    : isSpyWord
      ? "SW"
      : isGuessNumber
        ? "GN"
        : isBoost
          ? "BO"
          : isRajaRani
            ? "RR"
            : isRajaRaniTurns
              ? "RT"
              : isTreasureHunt
                ? "TH"
                : isTag
                  ? "TG"
                  : isHandCricket
                    ? "HC"
                    : "BI";
  const lobbyEyebrow = isGuessNumber
    ? "Guess Number Lobby"
    : isWordGuess
      ? "Word Guess Lobby"
      : isSpyWord
        ? "Spy Word Lobby"
        : isBoost
          ? "BOOST Lobby"
          : isRajaRani
            ? "Raja Rani Lobby"
            : isRajaRaniTurns
              ? "Raja Rani Turns Lobby"
              : isTreasureHunt
                ? "Treasure Hunt Lobby"
                : isTag
                  ? "TAG Lobby"
                  : isHandCricket
                    ? "Hand Cricket Lobby"
                    : "Bingo Lobby";

  return (
    <GamePage>
        <RoomHeader
          room={room}
          codeLabel={codeLabel}
          eyebrow={lobbyEyebrow}
          onStatus={setStatus}
          onLeaveRoom={onLeaveRoom}
        />

        <StatusMessage status={status} />

        <RoomSettingsStrip
          room={room}
          canStart={canStart}
          isHost={isHost}
          onAddBot={handleAddBot}
          onStartGame={handleStart}
        />

        <section className="grid gap-3 lg:grid-cols-[20rem_1fr]">
          <div className="space-y-3">
            <PlayerList players={room.players} maxPlayers={room.maxPlayers} showReadyStatus={isBingo} />

            {isHost ? (
              <form className="surface p-3" onSubmit={handleSettingsSubmit}>
                <div className="mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-mint" aria-hidden="true" />
                  <h2 className="text-base font-extrabold">Room Settings</h2>
                </div>

                <label className="mb-2 block">
                  <span className="compact-label">Room Name</span>
                  <input
                    className="compact-input"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    maxLength={40}
                  />
                </label>

                {isBingo ? (
                  <label className="mb-3 block">
                    <span className="compact-label">Players</span>
                    <input
                      className="compact-input"
                      type="number"
                      min={room.players.length}
                      max="12"
                      value={maxPlayers}
                      onChange={(event) => setMaxPlayers(event.target.value)}
                    />
                  </label>
                ) : isTag || isTreasureHunt ? (
                  <div className="mb-3 space-y-3">
                    <label className="block">
                      <span className="compact-label">Players</span>
                      <input
                        className="compact-input"
                        type="number"
                        min={Math.max(2, room.players.length)}
                        max={isTreasureHunt ? "10" : "4"}
                        value={maxPlayers}
                        onChange={(event) => setMaxPlayers(event.target.value)}
                      />
                    </label>

                    {isTag ? (
                      <>
                        <div>
                          <span className="compact-label">Map</span>
                          <div className="grid gap-2">
                            {Object.entries(tagMaps).map(([mapId, label]) => (
                              <button
                                key={mapId}
                                type="button"
                                className={`rounded-md border px-3 py-2 text-left text-sm font-extrabold transition ${
                                  tagMapId === mapId
                                    ? "border-coral bg-coral text-white"
                                    : "border-ink/10 bg-paper text-ink hover:border-mint"
                                }`}
                                onClick={() => setTagMapId(mapId)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="compact-label">Round</span>
                          <div className="grid grid-cols-3 gap-2">
                            {tagRoundOptions.map((seconds) => (
                              <button
                                key={seconds}
                                type="button"
                                className={`rounded-md border px-2 py-2 text-sm font-extrabold transition ${
                                  tagRoundSeconds === seconds
                                    ? "border-coral bg-coral text-white"
                                    : "border-ink/10 bg-paper text-ink hover:border-mint"
                                }`}
                                onClick={() => setTagRoundSeconds(seconds)}
                              >
                                {seconds}s
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : isSpyWord ? (
                  <div className="mb-3 space-y-3">
                    <label className="block">
                      <span className="compact-label">Players</span>
                      <input
                        className="compact-input"
                        type="number"
                        min={Math.max(4, room.players.length)}
                        max="10"
                        value={maxPlayers}
                        onChange={(event) => setMaxPlayers(event.target.value)}
                      />
                    </label>

                    <div>
                      <span className="compact-label">Difficulty</span>
                      <div className="grid grid-cols-3 gap-2">
                        {spyWordDifficulties.map((difficulty) => (
                          <button
                            key={difficulty.id}
                            type="button"
                            className={`rounded-md border px-2 py-2 text-sm font-extrabold transition ${
                              spyWordDifficulty === difficulty.id
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-paper text-ink hover:border-mint"
                            }`}
                            onClick={() => setSpyWordDifficulty(difficulty.id)}
                          >
                            {difficulty.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isBoost ? (
                  <div className="mb-3 space-y-3">
                    <label className="block">
                      <span className="compact-label">Players</span>
                      <input
                        className="compact-input"
                        type="number"
                        min={Math.max(3, room.players.length)}
                        max="5"
                        value={maxPlayers}
                        onChange={(event) => {
                          const nextCount = Number(event.target.value);
                          setMaxPlayers(event.target.value);

                          if (Number.isInteger(nextCount) && nextCount >= 3 && nextCount <= 5) {
                            setBoostCategoryNames((names) => resizeBoostNames(names, nextCount));
                          }
                        }}
                      />
                    </label>

                    <div>
                      <span className="compact-label">Card Names</span>
                      <div className="grid gap-2">
                        {resizeBoostNames(boostCategoryNames, Number(maxPlayers) || room.maxPlayers).map(
                          (name, index) => (
                            <input
                              key={index}
                              className="compact-input"
                              value={name}
                              onChange={(event) => {
                                const value = event.target.value;
                                setBoostCategoryNames((names) => {
                                  const nextNames = resizeBoostNames(
                                    names,
                                    Number(maxPlayers) || room.maxPlayers
                                  );
                                  nextNames[index] = value;
                                  return nextNames;
                                });
                              }}
                              maxLength={18}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : isTeamHandCricket ? (
                  <label className="mb-3 block">
                    <span className="compact-label">Team Members</span>
                    <input
                      className="compact-input"
                      type="number"
                      min="2"
                      max="6"
                      value={teamMembers}
                      onChange={(event) => setTeamMembers(event.target.value)}
                    />
                  </label>
                ) : (
                  <div className="mb-3 rounded-md border border-ink/10 bg-paper px-3 py-2">
                    <span className="compact-label">Players</span>
                    <p className="text-sm font-extrabold text-ink">{room.maxPlayers}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="compact-button w-full border border-ink/15 bg-paper text-ink hover:border-mint hover:text-mint"
                >
                  Update
                </button>
              </form>
            ) : null}
          </div>

          {isBingo ? (
            <BoardSetup initialBoard={board} numPlayers={room.players.length} onSave={onBoardSaved} />
          ) : isTag ? (
            <TagSetup room={room} />
          ) : isGuessNumber ? (
            <GuessNumberSetup room={room} />
          ) : isWordGuess ? (
            <WordGuessSetup room={room} />
          ) : isSpyWord ? (
            <SpyWordSetup room={room} />
          ) : isBoost ? (
            <BoostSetup room={room} />
          ) : isRajaRani ? (
            <RajaRaniSetup room={room} />
          ) : isRajaRaniTurns ? (
            <RajaRaniTurnsSetup room={room} />
          ) : isTreasureHunt ? (
            <TreasureHuntSetup room={room} />
          ) : (
            <TeamSetup
              room={room}
              session={session}
              onJoinTeam={onJoinHandCricketTeam}
            />
          )}
        </section>
    </GamePage>
  );
}
