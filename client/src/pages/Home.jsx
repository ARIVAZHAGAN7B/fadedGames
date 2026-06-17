import { useEffect, useState } from "react";
import { ArrowLeft, LogIn, Plus, Wifi, WifiOff } from "lucide-react";
import bingoLogo from "../images/bingo.png";
import handCricketLogo from "../images/handCricket.png";
import tagLogo from "../images/tag.png";
import { normalizeGameType, normalizeRoomCode } from "../utils/roomLink.js";

const games = [
  {
    id: "bingo",
    name: "Bingo",
    status: "Ready",
    available: true,
    defaultRoomName: "Friends Game",
    maxPlayers: 4,
    logo: bingoLogo,
    summary: "Player-sized number board with realtime room play."
  },
  {
    id: "hand-cricket",
    name: "Hand Cricket",
    status: "Ready",
    available: true,
    defaultRoomName: "Hand Cricket Match",
    maxPlayers: 2,
    logo: handCricketLogo,
    summary: "Odd-even toss, secret number picks, and fast cricket scoring."
  },
  {
    id: "tag",
    name: "TAG",
    status: "Ready",
    available: true,
    defaultRoomName: "TAG Match",
    maxPlayers: 4,
    logo: tagLogo,
    summary: "Same-keyboard platform chase where the player marked It must pass it on."
  }
];

const tagMaps = [
  { id: "grass", label: "Grass" },
  { id: "winter", label: "Winter" },
  { id: "desert", label: "Desert" }
];

const tagRoundOptions = [60, 120, 180];

function getGameById(gameId) {
  return games.find((game) => game.id === gameId) || null;
}

function getInitialGameId(gameType, roomCode) {
  const game = normalizeGameType(gameType);

  if (game) {
    return game;
  }

  return normalizeRoomCode(roomCode) ? "bingo" : "";
}

function getActiveRoomStatus(room) {
  if (room.gameStarted) {
    return "Playing";
  }

  if (room.playerCount >= room.maxPlayers) {
    return "Full";
  }

  return "Open";
}

function getActiveRoomMode(room) {
  if (room.gameType === "tag") {
    return `${room.tagRoundSeconds || 60}s`;
  }

  if (room.gameType !== "hand-cricket") {
    return "Bingo";
  }

  return room.handCricketMode === "team" ? "Team" : "Classic";
}

export default function Home({
  connected,
  activeRooms = [],
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = "",
  initialGameType = ""
}) {
  const initialSelectedGameId = getInitialGameId(initialGameType, initialRoomCode);
  const initialSelectedGame = getGameById(initialSelectedGameId);
  const [nickname, setNickname] = useState("");
  const [mode, setMode] = useState(initialRoomCode ? "join" : "create");
  const [selectedGameId, setSelectedGameId] = useState(initialSelectedGameId);
  const [handCricketMode, setHandCricketMode] = useState("classic");
  const [handCricketTeamMembers, setHandCricketTeamMembers] = useState(2);
  const [roomName, setRoomName] = useState(initialSelectedGame?.defaultRoomName || "Friends Game");
  const [maxPlayers, setMaxPlayers] = useState(initialSelectedGame?.maxPlayers || 4);
  const [tagPlayerCount, setTagPlayerCount] = useState(2);
  const [tagMapId, setTagMapId] = useState("grass");
  const [tagRoundSeconds, setTagRoundSeconds] = useState(120);
  const [roomCode, setRoomCode] = useState(normalizeRoomCode(initialRoomCode));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedGame = getGameById(selectedGameId);
  const isHandCricket = selectedGame?.id === "hand-cricket";
  const isTag = selectedGame?.id === "tag";
  const teamMemberCount = Number(handCricketTeamMembers);
  const validTeamMembers =
    Number.isInteger(teamMemberCount) && teamMemberCount >= 2 && teamMemberCount <= 6;
  const handCricketPlayers = handCricketMode === "team" ? teamMemberCount * 2 : 2;
  const selectedGameRooms = selectedGame
    ? activeRooms.filter((activeRoom) => activeRoom.gameType === selectedGame.id)
    : [];

  const selectGame = (gameId, nextMode = "create") => {
    const game = getGameById(gameId);

    if (!game?.available) {
      return;
    }

    setSelectedGameId(game.id);
    setRoomName(game.defaultRoomName);
    setMaxPlayers(game.maxPlayers);
    setHandCricketMode("classic");
    setHandCricketTeamMembers(2);
    setTagPlayerCount(2);
    setTagMapId("grass");
    setTagRoundSeconds(120);
    setMode(nextMode);
    setError("");

    if (nextMode === "create") {
      setRoomCode("");
    }
  };

  useEffect(() => {
    const code = normalizeRoomCode(initialRoomCode);
    const game = normalizeGameType(initialGameType);

    if (!code && !game) {
      setSelectedGameId("");
      setMode("create");
      setRoomCode("");
      return;
    }

    if (game) {
      selectGame(game, code ? "join" : "create");
    } else if (code) {
      selectGame("bingo", "join");
    }

    if (code) {
      setMode("join");
      setRoomCode(code);
    }
  }, [initialGameType, initialRoomCode]);

  const canSubmit =
    Boolean(selectedGame) &&
    nickname.trim().length > 0 &&
    (mode === "create" ? selectedGame.available : roomCode.trim().length > 0) &&
    (!isHandCricket || handCricketMode !== "team" || validTeamMembers) &&
    connected;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit || !selectedGame) {
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      nickname: nickname.trim()
    };
    const result =
      mode === "create"
        ? await onCreateRoom({
            ...payload,
            roomName,
            maxPlayers: isHandCricket
              ? handCricketPlayers
              : isTag
                ? Number(tagPlayerCount)
                : Number(maxPlayers),
            gameType: selectedGame.id,
            handCricketMode: isHandCricket ? handCricketMode : undefined,
            handCricketTeamSize:
              isHandCricket && handCricketMode === "team" ? teamMemberCount : undefined,
            tagMapId: isTag ? tagMapId : undefined,
            tagRoundSeconds: isTag ? Number(tagRoundSeconds) : undefined
          })
        : await onJoinRoom({ ...payload, roomCode });

    if (!result.ok) {
      setError(result.error);
    }

    setSubmitting(false);
  };

  if (!selectedGame) {
    return (
      <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col gap-5">
          <header className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-extrabold text-white">
                FG
              </div>
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Faded Games</h1>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                connected ? "bg-mint text-white" : "bg-coral text-white"
              }`}
            >
              {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {connected ? "Online" : "Offline"}
            </div>
          </header>

          <section className="grid flex-1 items-center gap-3 sm:grid-cols-3">
            {games.map((game) => (
              <button
                key={game.id}
                type="button"
                className="group overflow-hidden rounded-md border border-ink/10 bg-white text-left shadow-soft transition hover:-translate-y-0.5 hover:border-coral disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => selectGame(game.id)}
                disabled={!game.available}
              >
                <span className="block aspect-square w-full overflow-hidden bg-ink/5">
                  <img
                    src={game.logo}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="flex min-h-16 items-center justify-center px-3 py-3 text-center text-xl font-extrabold text-ink">
                  {game.name}
                </span>
              </button>
            ))}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="compact-button shrink-0 border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
              onClick={() => {
                setSelectedGameId("");
                setError("");
                setSubmitting(false);
              }}
              title="Back to games"
              aria-label="Back to games"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <img
              src={selectedGame.logo}
              alt=""
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase text-mint">Selected Game</p>
              <h1 className="truncate text-2xl font-extrabold text-ink">{selectedGame.name}</h1>
            </div>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              connected ? "bg-mint text-white" : "bg-coral text-white"
            }`}
          >
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {connected ? "Online" : "Offline"}
          </div>
        </header>

        <form className="grid gap-3 lg:grid-cols-[1fr_22rem]" onSubmit={handleSubmit}>
          <section className="space-y-3">
            <div className="surface overflow-hidden">
              <div className="grid gap-3 p-3 sm:grid-cols-[9rem_1fr] sm:items-center">
                <img
                  src={selectedGame.logo}
                  alt=""
                  className="aspect-square w-full max-w-36 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase text-mint">{selectedGame.status}</p>
                  <h2 className="text-2xl font-extrabold text-ink">{selectedGame.name}</h2>
                  <p className="mt-1 max-w-2xl text-sm font-bold text-ink/60">
                    {selectedGame.summary}
                  </p>
                </div>
              </div>
            </div>

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold">Active Rooms</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-ink/55">
                  {selectedGameRooms.length}
                </span>
              </div>

              {selectedGameRooms.length > 0 ? (
                <div className="grid gap-2 lg:grid-cols-2">
                  {selectedGameRooms.map((activeRoom) => {
                    const status = getActiveRoomStatus(activeRoom);
                    const canUseRoom =
                      !activeRoom.gameStarted && activeRoom.playerCount < activeRoom.maxPlayers;
                    const selectedRoom =
                      mode === "join" && normalizeRoomCode(roomCode) === activeRoom.roomCode;

                    return (
                      <div
                        key={activeRoom.roomCode}
                        className={`rounded-md border p-3 transition ${
                          selectedRoom
                            ? "border-coral bg-coral/5"
                            : "border-ink/10 bg-white"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-extrabold">
                              {activeRoom.roomName}
                            </h4>
                            <p className="text-xs font-extrabold uppercase text-ink/45">
                              {activeRoom.roomCode} / {getActiveRoomMode(activeRoom)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs font-extrabold text-ink/60">
                            {activeRoom.playerCount}/{activeRoom.maxPlayers}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                              status === "Open"
                                ? "bg-mint text-white"
                                : "bg-ink/10 text-ink/55"
                            }`}
                          >
                            {status}
                          </span>
                          <button
                            type="button"
                            className="rounded-md border border-ink/15 bg-white px-2.5 py-1 text-xs font-extrabold text-ink transition hover:border-coral hover:text-coral disabled:bg-ink/10 disabled:text-ink/35"
                            disabled={!canUseRoom}
                            onClick={() => {
                              setMode("join");
                              setRoomCode(activeRoom.roomCode);
                            }}
                          >
                            Use Code
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-ink/15 bg-white px-3 py-4 text-sm font-bold text-ink/45">
                  No active rooms for {selectedGame.name}.
                </div>
              )}
            </section>
          </section>

          <section className="surface p-3">
            <div className="mb-3 flex rounded-md border border-ink/10 bg-paper p-1">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-extrabold ${
                  mode === "create" ? "bg-ink text-white" : "text-ink/70"
                }`}
                onClick={() => setMode("create")}
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-extrabold ${
                  mode === "join" ? "bg-ink text-white" : "text-ink/70"
                }`}
                onClick={() => setMode("join")}
              >
                <LogIn className="h-4 w-4" />
                Join
              </button>
            </div>

            <label className="mb-3 block">
              <span className="compact-label">Nickname</span>
              <input
                className="compact-input bg-white"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Arivazhagan"
                maxLength={24}
              />
            </label>

            {mode === "create" ? (
              <div className="space-y-3">
                {isHandCricket ? (
                  <div>
                    <span className="compact-label">Mode</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "classic", label: "Classic", players: 2 },
                        { id: "team", label: "Team", players: 4 }
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                            handCricketMode === option.id
                              ? "border-coral bg-coral text-white"
                              : "border-ink/10 bg-white text-ink hover:border-mint"
                          }`}
                          onClick={() => {
                            setHandCricketMode(option.id);
                            setMaxPlayers(option.players);
                            setHandCricketTeamMembers(2);
                            setRoomName(
                              option.id === "team" ? "Team Hand Cricket" : "Hand Cricket Match"
                            );
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isTag ? (
                  <div className="space-y-3">
                    <div>
                      <span className="compact-label">Players</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[2, 3, 4].map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                              tagPlayerCount === count
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-white text-ink hover:border-mint"
                            }`}
                            onClick={() => setTagPlayerCount(count)}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="compact-label">Map</span>
                      <div className="grid gap-2">
                        {tagMaps.map((map) => (
                          <button
                            key={map.id}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-left text-sm font-extrabold transition ${
                              tagMapId === map.id
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-white text-ink hover:border-mint"
                            }`}
                            onClick={() => setTagMapId(map.id)}
                          >
                            {map.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="compact-label">Round Length</span>
                      <div className="grid grid-cols-3 gap-2">
                        {tagRoundOptions.map((seconds) => (
                          <button
                            key={seconds}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                              tagRoundSeconds === seconds
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-white text-ink hover:border-mint"
                            }`}
                            onClick={() => setTagRoundSeconds(seconds)}
                          >
                            {seconds}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                  <label className="block">
                    <span className="compact-label">Room Name</span>
                    <input
                      className="compact-input bg-white"
                      value={roomName}
                      onChange={(event) => setRoomName(event.target.value)}
                      maxLength={40}
                    />
                  </label>
                  {isHandCricket ? (
                    handCricketMode === "team" ? (
                      <label className="block">
                        <span className="compact-label">Team Members</span>
                        <input
                          className="compact-input bg-white"
                          type="number"
                          min="2"
                          max="6"
                          value={handCricketTeamMembers}
                          onChange={(event) => setHandCricketTeamMembers(event.target.value)}
                        />
                      </label>
                    ) : (
                      <div className="rounded-md border border-ink/10 bg-white px-3 py-2">
                        <span className="compact-label">Players</span>
                        <p className="text-sm font-extrabold text-ink">{handCricketPlayers}</p>
                      </div>
                    )
                  ) : isTag ? (
                    <div className="rounded-md border border-ink/10 bg-white px-3 py-2">
                      <span className="compact-label">Players</span>
                      <p className="text-sm font-extrabold text-ink">{tagPlayerCount}</p>
                    </div>
                  ) : (
                    <label className="block">
                      <span className="compact-label">Players</span>
                      <input
                        className="compact-input bg-white"
                        type="number"
                        min="1"
                        max="12"
                        value={maxPlayers}
                        onChange={(event) => setMaxPlayers(event.target.value)}
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label className="block">
                <span className="compact-label">Room Code</span>
                <input
                  className="compact-input bg-white uppercase"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="ABCD12"
                  maxLength={6}
                />
              </label>
            )}

            {error ? <p className="mt-3 text-xs font-bold text-coral">{error}</p> : null}

            <button
              type="submit"
              className="compact-button mt-4 w-full bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20"
              disabled={!canSubmit || submitting}
            >
              {mode === "create" ? <Plus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              {submitting ? "Working" : mode === "create" ? "Create Room" : "Join Room"}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}
