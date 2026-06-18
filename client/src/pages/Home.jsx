import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LogIn, Plus, Wifi, WifiOff } from "lucide-react";
import bingoLogo from "../images/optimized/bingo.webp";
import boostLogo from "../images/optimized/boost.webp";
import fadedGamesLogo from "../images/optimized/FGlogo.webp";
import guessNumberLogo from "../images/optimized/guessNumber.webp";
import handCricketLogo from "../images/optimized/handCricket.webp";
import rajaRaniLogo from "../images/optimized/raja_rani.webp";
import tagLogo from "../images/optimized/tag.webp";
import thirudanPoliceLogo from "../images/optimized/thirudan police.webp";
import spyWordLogo from "../images/optimized/spy word.webp";
import treasureHuntLogo from "../images/optimized/treasure hunt.webp";
import wordGuessLogo from "../images/wordGuess.svg";
import { warmImageCache } from "../utils/imageCache.js";
import { normalizeGameType, normalizeRoomCode, setGameRouteInUrl } from "../utils/roomLink.js";

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
    name: "Tag",
    status: "Ready",
    available: true,
    defaultRoomName: "Tag Match",
    maxPlayers: 4,
    logo: tagLogo,
    summary: "Same-keyboard platform chase where the player marked It must pass it on."
  },
  {
    id: "guess-number",
    name: "Guess Number",
    status: "Ready",
    available: true,
    defaultRoomName: "Guess Number Duel",
    maxPlayers: 2,
    logo: guessNumberLogo,
    summary: "Two players lock secret numbers, then take turns guessing."
  },
  {
    id: "word-guess",
    name: "Word Guess",
    status: "Ready",
    available: true,
    defaultRoomName: "Word Guess Match",
    maxPlayers: 2,
    logo: wordGuessLogo,
    summary: "Two players lock hidden words, then race through Wordle-style guesses."
  },
  {
    id: "spy-word",
    name: "Spy Word",
    status: "Ready",
    available: true,
    defaultRoomName: "Spy Word Table",
    maxPlayers: 6,
    logo: spyWordLogo,
    summary: "One spy gets a related word while detectives trade careful clues."
  },
  {
    id: "raja-rani",
    name: "Thirudan Police",
    status: "Ready",
    available: true,
    defaultRoomName: "Thirudan Police Table",
    maxPlayers: 5,
    logo: thirudanPoliceLogo,
    summary: "Five hidden roles, one Police guess, ten suspense rounds."
  },
  {
    id: "raja-rani-turns",
    name: "Raja Rani",
    status: "Ready",
    available: true,
    defaultRoomName: "Raja Rani Turns",
    maxPlayers: 5,
    logo: rajaRaniLogo,
    summary: "Clockwise hidden-role turns with instant swaps on wrong guesses."
  },
  {
    id: "boost",
    name: "Boost",
    status: "Ready",
    available: true,
    defaultRoomName: "Boost Table",
    maxPlayers: 4,
    logo: boostLogo,
    summary: "Adjustable card passing race to collect a matching set."
  },
  {
    id: "treasure-hunt",
    name: "Treasure Hunt",
    status: "Ready",
    available: true,
    defaultRoomName: "Treasure Hunt",
    maxPlayers: 10,
    logo: treasureHuntLogo,
    summary: "Find 10 diamonds, dodge 25 bombs, and protect your lives."
  }
];

const tagMaps = [
  { id: "classic", label: "The Classic" },
  { id: "tower", label: "The Tower" },
  { id: "maze", label: "The Maze" },
  { id: "arena", label: "The Arena" }
];

const tagRoundOptions = [60, 90, 120];
const boostPlayerOptions = [3, 4, 5];
const spyWordPlayerOptions = [4, 5, 6, 7, 8, 9, 10];
const spyWordDifficulties = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" }
];
const boostDefaultNames = [
  "Perambalur",
  "Ariyalur",
  "Trichy",
  "Kovai",
  "Madurai"
];

function resizeBoostNames(names, count) {
  return Array.from({ length: count }, (_entry, index) => names[index] || boostDefaultNames[index] || `Card ${index + 1}`);
}

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

  if (room.gameType === "guess-number") {
    return "1-100";
  }

  if (room.gameType === "word-guess") {
    return "5 letters";
  }

  if (room.gameType === "spy-word") {
    return `${room.spyWordDifficulty || "easy"} / 5 rounds`;
  }

  if (room.gameType === "boost") {
    return `${room.maxPlayers || 4} players`;
  }

  if (room.gameType === "treasure-hunt") {
    return `${room.maxPlayers || 10} players`;
  }

  if (room.gameType === "raja-rani" || room.gameType === "raja-rani-turns") {
    return "10 rounds";
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
  onRefreshActiveRooms,
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
  const [tagMapId, setTagMapId] = useState("classic");
  const [tagRoundSeconds, setTagRoundSeconds] = useState(60);
  const [boostPlayerCount, setBoostPlayerCount] = useState(4);
  const [spyWordPlayerCount, setSpyWordPlayerCount] = useState(6);
  const [spyWordDifficulty, setSpyWordDifficulty] = useState("easy");
  const [boostCategoryNames, setBoostCategoryNames] = useState(boostDefaultNames.slice(0, 4));
  const [roomCode, setRoomCode] = useState(normalizeRoomCode(initialRoomCode));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pickingGameId, setPickingGameId] = useState("");
  const pickingGameTimerRef = useRef(null);
  const selectedGame = getGameById(selectedGameId);
  const isHandCricket = selectedGame?.id === "hand-cricket";
  const isTag = selectedGame?.id === "tag";
  const isGuessNumber = selectedGame?.id === "guess-number";
  const isWordGuess = selectedGame?.id === "word-guess";
  const isSpyWord = selectedGame?.id === "spy-word";
  const isBoost = selectedGame?.id === "boost";
  const isRajaRani = selectedGame?.id === "raja-rani";
  const isRajaRaniTurns = selectedGame?.id === "raja-rani-turns";
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
    setTagMapId("classic");
    setTagRoundSeconds(60);
    setBoostPlayerCount(game.id === "boost" ? game.maxPlayers : 4);
    setSpyWordPlayerCount(game.id === "spy-word" ? game.maxPlayers : 6);
    setSpyWordDifficulty("easy");
    setBoostCategoryNames(resizeBoostNames([], game.id === "boost" ? game.maxPlayers : 4));
    setMode(nextMode);
    setError("");

    if (nextMode === "create") {
      setRoomCode("");
    }
  };

  const handleGamePick = (gameId) => {
    const game = getGameById(gameId);

    if (!game?.available || pickingGameId) {
      return;
    }

    setPickingGameId(game.id);
    pickingGameTimerRef.current = window.setTimeout(() => {
      setPickingGameId("");
      selectGame(game.id);
      setGameRouteInUrl(game.id);
    }, 220);
  };

  useEffect(() => {
    warmImageCache([fadedGamesLogo, ...games.map((game) => game.logo)]);
  }, []);

  useEffect(() => {
    return () => {
      if (pickingGameTimerRef.current) {
        window.clearTimeout(pickingGameTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (connected && selectedGameId && typeof onRefreshActiveRooms === "function") {
      onRefreshActiveRooms();
    }
  }, [connected, onRefreshActiveRooms, selectedGameId]);

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
                : isGuessNumber
                  ? 2
                  : isWordGuess
                    ? 2
                    : isSpyWord
                      ? Number(spyWordPlayerCount)
                      : isBoost
                        ? Number(boostPlayerCount)
                        : isRajaRani
                          ? 5
                          : isRajaRaniTurns
                            ? 5
                          : Number(maxPlayers),
            gameType: selectedGame.id,
            handCricketMode: isHandCricket ? handCricketMode : undefined,
            handCricketTeamSize:
              isHandCricket && handCricketMode === "team" ? teamMemberCount : undefined,
            tagMapId: isTag ? tagMapId : undefined,
            tagRoundSeconds: isTag ? Number(tagRoundSeconds) : undefined,
            spyWordDifficulty: isSpyWord ? spyWordDifficulty : undefined,
            boostCategoryLabels: isBoost ? boostCategoryNames : undefined
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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
          <header className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-3">
              <img
                src={fadedGamesLogo}
                alt=""
                decoding="async"
                loading="eager"
                className="h-10 w-10 shrink-0 rounded-md object-cover"
              />
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

          <section className="grid auto-rows-fr gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {games.map((game, index) => {
              const isPicking = pickingGameId === game.id;

              return (
                <button
                  key={game.id}
                  type="button"
                  className={`group relative grid h-full grid-rows-[1fr_4rem] overflow-hidden rounded-md border bg-white text-left shadow-soft transition hover:-translate-y-0.5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPicking ? "game-select-pop border-coral" : "border-ink/10"
                  }`}
                  onClick={() => handleGamePick(game.id)}
                  disabled={!game.available || Boolean(pickingGameId)}
                >
                  <span className="block aspect-square h-full w-full overflow-hidden bg-ink/5">
                    <img
                      src={game.logo}
                      alt=""
                      decoding="async"
                      loading={index < 4 ? "eager" : "lazy"}
                      className={`h-full w-full object-cover transition duration-300 ${
                        isPicking ? "scale-[1.06]" : "group-hover:scale-[1.03]"
                      }`}
                    />
                  </span>
                  <span
                    className={`flex h-16 items-center justify-center overflow-hidden px-2 text-center text-lg font-extrabold leading-tight transition ${
                      isPicking ? "bg-coral text-white" : "text-ink"
                    }`}
                  >
                    {game.name}
                  </span>
                </button>
              );
            })}
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
                setGameRouteInUrl("", "", { replace: true });
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
              decoding="async"
              loading="eager"
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
                  decoding="async"
                  loading="eager"
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
                              setGameRouteInUrl(selectedGame.id, activeRoom.roomCode);
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
                onClick={() => {
                  setMode("create");
                  setRoomCode("");
                  setGameRouteInUrl(selectedGame.id, "", { replace: true });
                }}
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-extrabold ${
                  mode === "join" ? "bg-ink text-white" : "text-ink/70"
                }`}
                onClick={() => {
                  setMode("join");
                  setGameRouteInUrl(selectedGame.id, roomCode, { replace: true });
                }}
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

                {isSpyWord ? (
                  <div className="space-y-3">
                    <div>
                      <span className="compact-label">Players</span>
                      <div className="grid grid-cols-4 gap-2">
                        {spyWordPlayerOptions.map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                              Number(spyWordPlayerCount) === count
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-white text-ink hover:border-mint"
                            }`}
                            onClick={() => setSpyWordPlayerCount(count)}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="compact-label">Difficulty</span>
                      <div className="grid grid-cols-3 gap-2">
                        {spyWordDifficulties.map((difficulty) => (
                          <button
                            key={difficulty.id}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                              spyWordDifficulty === difficulty.id
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-white text-ink hover:border-mint"
                            }`}
                            onClick={() => setSpyWordDifficulty(difficulty.id)}
                          >
                            {difficulty.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {isBoost ? (
                  <div className="space-y-3">
                    <div>
                      <span className="compact-label">Players</span>
                      <div className="grid grid-cols-4 gap-2">
                        {boostPlayerOptions.map((count) => (
                          <button
                            key={count}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                              Number(boostPlayerCount) === count
                                ? "border-coral bg-coral text-white"
                                : "border-ink/10 bg-white text-ink hover:border-mint"
                            }`}
                            onClick={() => {
                              setBoostPlayerCount(count);
                              setBoostCategoryNames((names) => resizeBoostNames(names, count));
                            }}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="compact-label">Card Names</span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {resizeBoostNames(boostCategoryNames, Number(boostPlayerCount)).map((name, index) => (
                          <input
                            key={index}
                            className="compact-input bg-white"
                            value={name}
                            onChange={(event) => {
                              const value = event.target.value;
                              setBoostCategoryNames((names) => {
                                const nextNames = resizeBoostNames(names, Number(boostPlayerCount));
                                nextNames[index] = value;
                                return nextNames;
                              });
                            }}
                            maxLength={18}
                          />
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
                  ) : isTag || isGuessNumber || isWordGuess || isSpyWord || isBoost || isRajaRani || isRajaRaniTurns ? (
                    <div className="rounded-md border border-ink/10 bg-white px-3 py-2">
                      <span className="compact-label">Players</span>
                      <p className="text-sm font-extrabold text-ink">
                        {isGuessNumber || isWordGuess
                          ? 2
                          : isSpyWord
                            ? spyWordPlayerCount
                            : isBoost
                              ? boostPlayerCount
                              : isRajaRani || isRajaRaniTurns
                                ? 5
                                : tagPlayerCount}
                      </p>
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
