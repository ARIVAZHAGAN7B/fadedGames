import { useEffect, useMemo, useState } from "react";
import { Bot, Copy, DoorOpen, Play, Settings, Users } from "lucide-react";
import BoardSetup from "../components/BoardSetup.jsx";
import PlayerList from "../components/PlayerList.jsx";
import { buildRoomLink } from "../utils/roomLink.js";

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

const tagMaps = {
  grass: "Grass",
  winter: "Winter",
  desert: "Desert"
};

const tagRoundOptions = [60, 120, 180];

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
  const [tagMapId, setTagMapId] = useState(room.tag?.mapId || "grass");
  const [tagRoundSeconds, setTagRoundSeconds] = useState(room.tag?.roundSeconds || 60);
  const isHost = room.host === session.playerId;
  const isBingo = room.gameType === "bingo";
  const isHandCricket = room.gameType === "hand-cricket";
  const isTag = room.gameType === "tag";
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
  const canStart = isTag
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
    setTagMapId(room.tag?.mapId || "grass");
    setTagRoundSeconds(room.tag?.roundSeconds || 60);
  }, [room.handCricketTeamSize, room.maxPlayers, room.roomName, room.tag?.mapId, room.tag?.roundSeconds]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      setStatus("Link copied");
    } catch {
      setStatus("Copy failed");
    }
  };

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
      tagRoundSeconds: isTag ? Number(tagRoundSeconds) : undefined
    });

    setStatus(result.ok ? "Settings updated" : result.error);
  };

  const handleAddBot = async () => {
    setStatus("");
    const result = await onAddBot();
    setStatus(result.ok ? `${result.player.name} added` : result.error);
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
              {isTag ? "TG" : isHandCricket ? "HC" : "BI"}
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase text-mint">
                {isTag ? "TAG Lobby" : isHandCricket ? "Hand Cricket Lobby" : "Bingo Lobby"}
              </p>
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
              title="Leave room"
            >
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Leave
            </button>
          </div>
        </header>

        {status ? <p className="text-xs font-bold text-coral">{status}</p> : null}

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
                ) : isTag ? (
                  <div className="mb-3 space-y-3">
                    <label className="block">
                      <span className="compact-label">Players</span>
                      <input
                        className="compact-input"
                        type="number"
                        min={Math.max(2, room.players.length)}
                        max="4"
                        value={maxPlayers}
                        onChange={(event) => setMaxPlayers(event.target.value)}
                      />
                    </label>

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

            {isHost && isBingo ? (
              <button
                type="button"
                className="compact-button w-full border border-ink/15 bg-white text-ink hover:border-mint hover:text-mint disabled:bg-ink/10 disabled:text-ink/35"
                onClick={handleAddBot}
                disabled={room.players.length >= room.maxPlayers}
                title="Add bot"
              >
                <Bot className="h-4 w-4" aria-hidden="true" />
                Add Bot
              </button>
            ) : null}

            {isHandCricket || isTag ? (
              <div className="surface p-3 text-sm font-bold text-ink/70">
                {canStart
                  ? isTag
                    ? "Ready to chase"
                    : "Ready for toss"
                  : `Waiting for ${Math.max(0, (isTag ? 2 : room.maxPlayers) - room.players.length)} player(s)`}
              </div>
            ) : null}

            {isHost ? (
              <button
                type="button"
                className="compact-button w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
                onClick={handleStart}
                disabled={!canStart}
                title="Start game"
              >
                <Play className="h-5 w-5" aria-hidden="true" />
                Start Game
              </button>
            ) : (
              <div className="surface p-3 text-center text-sm font-bold text-ink/70">
                Waiting...
              </div>
            )}
          </div>

          {isBingo ? (
            <BoardSetup initialBoard={board} numPlayers={room.players.length} onSave={onBoardSaved} />
          ) : isTag ? (
            <TagSetup room={room} />
          ) : (
            <TeamSetup
              room={room}
              session={session}
              onJoinTeam={onJoinHandCricketTeam}
            />
          )}
        </section>
      </div>
    </main>
  );
}
