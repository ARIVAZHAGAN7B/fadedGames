import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { socket } from "./socket/client.js";
import {
  readRoomRouteFromUrl,
  ROOM_ROUTE_CHANGE_EVENT,
  setRoomCodeInUrl
} from "./utils/roomLink.js";
import { getBoardSize } from "./game/board.js";

const Boost = lazy(() => import("./pages/Boost.jsx"));
const Game = lazy(() => import("./pages/Game.jsx"));
const GuessNumber = lazy(() => import("./pages/GuessNumber.jsx"));
const HandCricket = lazy(() => import("./pages/HandCricket.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Lobby = lazy(() => import("./pages/Lobby.jsx"));
const RajaRani = lazy(() => import("./pages/RajaRani.jsx"));
const RajaRaniTurns = lazy(() => import("./pages/RajaRaniTurns.jsx"));
const Result = lazy(() => import("./pages/Result.jsx"));
const SpyWord = lazy(() => import("./pages/SpyWord.jsx"));
const TagGame = lazy(() => import("./pages/TagGame.jsx"));
const TreasureHunt = lazy(() => import("./pages/TreasureHunt.jsx"));
const WordGuess = lazy(() => import("./pages/WordGuess.jsx"));

const STORAGE_KEY = "bingo-session-v1";
const SAVED_STATE_WRITE_DELAY_MS = 500;

const emptySession = {
  nickname: "",
  playerId: "",
  roomCode: ""
};

function readSavedState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function writeSavedState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local storage can fail in private browsing; the game still works for the current tab.
  }
}

function getPersistableRoom(room) {
  if (!room) {
    return null;
  }

  return {
    roomCode: room.roomCode,
    gameType: room.gameType,
    roomName: room.roomName,
    host: room.host,
    maxPlayers: room.maxPlayers,
    boardSize: room.boardSize || null,
    players: room.players,
    calledNumbers: room.calledNumbers,
    currentTurn: room.currentTurn,
    currentPlayerId: room.currentPlayerId,
    currentPlayerName: room.currentPlayerName,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
    winner: room.winner,
    handCricketMode: room.handCricketMode,
    handCricketTeamSize: room.handCricketTeamSize
  };
}

function clearSavedState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function emitWithAck(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => {
      resolve(response || { ok: false, error: "No server response." });
    });
  });
}

function viewForRoom(room, fallback = "lobby") {
  if (room.gameType === "guess-number" && (room.gameStarted || room.gameEnded)) {
    return "guess-number";
  }

  if (room.gameType === "word-guess" && (room.gameStarted || room.gameEnded)) {
    return "word-guess";
  }

  if (room.gameType === "spy-word" && (room.gameStarted || room.gameEnded)) {
    return "spy-word";
  }

  if (room.gameType === "tag" && (room.gameStarted || room.gameEnded)) {
    return "tag";
  }

  if (room.gameType === "hand-cricket" && (room.gameStarted || room.gameEnded)) {
    return "hand-cricket";
  }

  if (room.gameType === "boost" && (room.gameStarted || room.gameEnded)) {
    return "boost";
  }

  if (room.gameType === "treasure-hunt" && (room.gameStarted || room.gameEnded)) {
    return "treasure-hunt";
  }

  if (room.gameType === "raja-rani" && (room.gameStarted || room.gameEnded)) {
    return "raja-rani";
  }

  if (room.gameType === "raja-rani-turns" && (room.gameStarted || room.gameEnded)) {
    return "raja-rani-turns";
  }

  if (room.gameEnded) {
    return "result";
  }

  if (room.gameStarted) {
    return "game";
  }

  return fallback;
}

function LoadingView() {
  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center">
        <div className="surface px-5 py-4 text-sm font-extrabold text-ink/60">Loading...</div>
      </div>
    </main>
  );
}

function screen(node) {
  return <Suspense fallback={<LoadingView />}>{node}</Suspense>;
}

export default function App() {
  const [route, setRoute] = useState(() => readRoomRouteFromUrl());
  const savedState = readSavedState();
  const initialRoomCode = route.roomCode;
  const initialGameType = route.gameType;
  const canResumeSavedState =
    savedState?.session?.playerId &&
    savedState?.session?.roomCode &&
    (!initialRoomCode || savedState.session.roomCode === initialRoomCode) &&
    (!initialGameType || savedState.room?.gameType === initialGameType);
  const activeSavedState = canResumeSavedState ? savedState : null;
  const [connected, setConnected] = useState(socket.connected);
  const [view, setView] = useState(activeSavedState?.view || "home");
  const [session, setSession] = useState(activeSavedState?.session || emptySession);
  const [room, setRoom] = useState(activeSavedState?.room || null);
  const [board, setBoard] = useState(activeSavedState?.board || []);
  const [activeRooms, setActiveRooms] = useState([]);
  const [needsResume, setNeedsResume] = useState(Boolean(activeSavedState));
  const saveTimerRef = useRef(null);

  const requestActiveRooms = useCallback(async () => {
    const response = await emitWithAck("list-active-rooms", {});

    if (response.ok) {
      setActiveRooms(Array.isArray(response.rooms) ? response.rooms : []);
    }

    return response;
  }, []);

  useEffect(() => {
    const syncRoute = () => setRoute(readRoomRouteFromUrl());

    window.addEventListener("popstate", syncRoute);
    window.addEventListener(ROOM_ROUTE_CHANGE_EVENT, syncRoute);

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener(ROOM_ROUTE_CHANGE_EVENT, syncRoute);
    };
  }, []);

  const resetLocalState = () => {
    clearSavedState();
    setRoomCodeInUrl("");
    setNeedsResume(false);
    setView("home");
    setSession(emptySession);
    setRoom(null);
    setBoard([]);
  };

  useEffect(() => {
    let canceled = false;
    const applyActiveRooms = (payload) => {
      if (!canceled) {
        setActiveRooms(Array.isArray(payload?.rooms) ? payload.rooms : []);
      }
    };
    const onConnect = () => {
      setConnected(true);
      requestActiveRooms();
    };
    const onDisconnect = () => setConnected(false);
    const onRoomPayload = (payload) => {
      if (payload?.room) {
        setRoom(payload.room);
        setView((currentView) => viewForRoom(payload.room, currentView));
      }
    };
    const onStartGame = (payload) => {
      if (payload?.room) {
        setRoom(payload.room);
        setView(viewForRoom(payload.room));
      }
    };
    const onRoomRestarted = (payload) => {
      if (payload?.room) {
        setRoom(payload.room);
        setBoard([]);
        setView("lobby");
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("active-rooms", applyActiveRooms);
    socket.on("room-updated", onRoomPayload);
    socket.on("player-joined", onRoomPayload);
    socket.on("player-left", onRoomPayload);
    socket.on("number-called", onRoomPayload);
    socket.on("start-game", onStartGame);
    socket.on("game-ended", onRoomPayload);
    socket.on("room-restarted", onRoomRestarted);

    if (socket.connected) {
      requestActiveRooms();
    }

    return () => {
      canceled = true;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("active-rooms", applyActiveRooms);
      socket.off("room-updated", onRoomPayload);
      socket.off("player-joined", onRoomPayload);
      socket.off("player-left", onRoomPayload);
      socket.off("number-called", onRoomPayload);
      socket.off("start-game", onStartGame);
      socket.off("game-ended", onRoomPayload);
      socket.off("room-restarted", onRoomRestarted);
    };
  }, [requestActiveRooms]);

  useEffect(() => {
    if (!session.roomCode || !session.playerId || !room) {
      return;
    }

    setRoomCodeInUrl(session.roomCode, room.gameType);

    const savedState = {
      session,
      room: room.gameType === "tag" ? getPersistableRoom(room) : room,
      board,
      view: viewForRoom(room, view)
    };

    if (room.gameType !== "tag") {
      writeSavedState(savedState);
      return undefined;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      writeSavedState(savedState);
      saveTimerRef.current = null;
    }, SAVED_STATE_WRITE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [board, room, session, view]);

  useEffect(() => {
    if (!connected || !needsResume || !session.roomCode || !session.playerId) {
      return;
    }

    let canceled = false;

    async function resumeSavedSession() {
      const response = await emitWithAck("resume-session", {
        roomCode: session.roomCode,
        playerId: session.playerId
      });

      if (canceled) {
        return;
      }

      setNeedsResume(false);

      if (!response.ok) {
        resetLocalState();
        return;
      }

      setSession({
        nickname: response.player.name,
        playerId: response.player.playerId,
        roomCode: response.roomCode
      });
      setRoom(response.room);
      setBoard(response.board?.length ? response.board : board);
      setView(viewForRoom(response.room));
    }

    resumeSavedSession();

    return () => {
      canceled = true;
    };
  }, [board, connected, needsResume, session.playerId, session.roomCode]);

  const handleCreateRoom = async (payload) => {
    const response = await emitWithAck("create-room", payload);

    if (response.ok) {
      setSession({
        nickname: payload.nickname,
        playerId: response.player.playerId,
        roomCode: response.roomCode
      });
      setRoom(response.room);
      setBoard([]);
      setView("lobby");
    }

    return response;
  };

  const handleJoinRoom = async (payload) => {
    const response = await emitWithAck("join-room", payload);

    if (response.ok) {
      setSession({
        nickname: payload.nickname,
        playerId: response.player.playerId,
        roomCode: response.roomCode
      });
      setRoom(response.room);
      setBoard([]);
      setView("lobby");
    }

    return response;
  };

  const handleBoardSaved = async (nextBoard) => {
    const response = await emitWithAck("set-board", {
      roomCode: session.roomCode,
      board: nextBoard
    });

    if (response.ok) {
      setBoard(nextBoard);
      setRoom(response.room);
    }

    return response;
  };

  const handleUpdateRoomSettings = async (settings) => {
    const response = await emitWithAck("update-room-settings", {
      roomCode: session.roomCode,
      ...settings
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleAddBot = async () => {
    const response = await emitWithAck("add-bot", {
      roomCode: session.roomCode
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleStartGame = async () => {
    const response = await emitWithAck("start-game", {
      roomCode: session.roomCode
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleCallNumber = async (number) => {
    const response = await emitWithAck("call-number", {
      roomCode: session.roomCode,
      number
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleClaimBingo = async () => {
    const response = await emitWithAck("bingo-claimed", {
      roomCode: session.roomCode
    });

    if (response.ok && response.room) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleHandCricketTossChoice = async (choice) => {
    const response = await emitWithAck("hand-cricket-choose-toss", {
      roomCode: session.roomCode,
      choice
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleHandCricketJoinTeam = async (team) => {
    const response = await emitWithAck("hand-cricket-join-team", {
      roomCode: session.roomCode,
      team
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleHandCricketPickNumber = async (number) => {
    const response = await emitWithAck("hand-cricket-pick-number", {
      roomCode: session.roomCode,
      number
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleHandCricketDecision = async (decision) => {
    const response = await emitWithAck("hand-cricket-choose-decision", {
      roomCode: session.roomCode,
      decision
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleHandCricketSelectPlayer = async (payload) => {
    const response = await emitWithAck("hand-cricket-select-player", {
      roomCode: session.roomCode,
      ...payload
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleHandCricketRequestChange = async () => {
    const response = await emitWithAck("hand-cricket-request-change", {
      roomCode: session.roomCode
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleGuessNumberSetSecret = async (number) => {
    const response = await emitWithAck("guess-number-set-secret", {
      roomCode: session.roomCode,
      number
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleGuessNumberSubmitGuess = async (number) => {
    const response = await emitWithAck("guess-number-submit-guess", {
      roomCode: session.roomCode,
      number
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleWordGuessSetSecret = async (word) => {
    const response = await emitWithAck("word-guess-set-secret", {
      roomCode: session.roomCode,
      word
    });

    if (response.ok) {
      setRoom(response.room);
    }

    return response;
  };

  const handleWordGuessSubmitGuess = async (word) => {
    const response = await emitWithAck("word-guess-submit-guess", {
      roomCode: session.roomCode,
      word
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleSpyWordSubmitClue = async (clue) => {
    const response = await emitWithAck("spy-word-submit-clue", {
      roomCode: session.roomCode,
      clue
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleSpyWordVote = async (suspectPlayerId) => {
    const response = await emitWithAck("spy-word-vote", {
      roomCode: session.roomCode,
      suspectPlayerId
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleSpyWordSubmitGuess = async (guess) => {
    const response = await emitWithAck("spy-word-submit-guess", {
      roomCode: session.roomCode,
      guess
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleBoostSelectCard = async (cardId) => {
    const response = await emitWithAck("boost-select-card", {
      roomCode: session.roomCode,
      cardId
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleBoostClaim = async () => {
    const response = await emitWithAck("boost-claim", {
      roomCode: session.roomCode
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleRajaRaniGuess = async (suspectPlayerId) => {
    const response = await emitWithAck("raja-rani-guess", {
      roomCode: session.roomCode,
      suspectPlayerId
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleRajaRaniPickCard = async (cardId) => {
    const response = await emitWithAck("raja-rani-pick-card", {
      roomCode: session.roomCode,
      cardId
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleRajaRaniTurnsPickCard = async (cardId) => {
    const response = await emitWithAck("raja-rani-turns-pick-card", {
      roomCode: session.roomCode,
      cardId
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleRajaRaniTurnsSelect = async (suspectPlayerId) => {
    const response = await emitWithAck("raja-rani-turns-select", {
      roomCode: session.roomCode,
      suspectPlayerId
    });

    if (response.ok) {
      setRoom(response.room);
      setView(viewForRoom(response.room));
    }

    return response;
  };

  const handleRestartGame = async () => {
    const response = await emitWithAck("restart-game", {
      roomCode: session.roomCode
    });

    if (response.ok) {
      setRoom(response.room);
      setBoard([]);
      setView("lobby");
    }

    return response;
  };

  const handleLeaveRoom = async () => {
    await emitWithAck("leave-room", {});
    resetLocalState();
  };

  const handleTagInput = useCallback((input) => {
    socket.emit("tag-input", {
      roomCode: session.roomCode,
      input
    });
  }, [session.roomCode]);

  if (view === "lobby" && room) {
    return screen(
      <Lobby
        room={room}
        session={session}
        board={board}
        onBoardSaved={handleBoardSaved}
        onUpdateRoomSettings={handleUpdateRoomSettings}
        onAddBot={handleAddBot}
        onJoinHandCricketTeam={handleHandCricketJoinTeam}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "result" && room) {
    return screen(
      <Result
        room={room}
        session={session}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "hand-cricket" && room) {
    return screen(
      <HandCricket
        room={room}
        session={session}
        onChooseToss={handleHandCricketTossChoice}
        onPickNumber={handleHandCricketPickNumber}
        onChooseDecision={handleHandCricketDecision}
        onSelectTeamPlayer={handleHandCricketSelectPlayer}
        onRequestTeamChange={handleHandCricketRequestChange}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "guess-number" && room) {
    return screen(
      <GuessNumber
        room={room}
        session={session}
        onSetSecret={handleGuessNumberSetSecret}
        onSubmitGuess={handleGuessNumberSubmitGuess}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "word-guess" && room) {
    return screen(
      <WordGuess
        room={room}
        session={session}
        onSetSecret={handleWordGuessSetSecret}
        onSubmitGuess={handleWordGuessSubmitGuess}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "spy-word" && room) {
    return screen(
      <SpyWord
        room={room}
        session={session}
        onSubmitClue={handleSpyWordSubmitClue}
        onVote={handleSpyWordVote}
        onSubmitSpyGuess={handleSpyWordSubmitGuess}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "boost" && room) {
    return screen(
      <Boost
        room={room}
        session={session}
        onSelectCard={handleBoostSelectCard}
        onClaimBoost={handleBoostClaim}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "raja-rani" && room) {
    return screen(
      <RajaRani
        room={room}
        session={session}
        onPickCard={handleRajaRaniPickCard}
        onGuess={handleRajaRaniGuess}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "raja-rani-turns" && room) {
    return screen(
      <RajaRaniTurns
        room={room}
        session={session}
        onPickCard={handleRajaRaniTurnsPickCard}
        onSelect={handleRajaRaniTurnsSelect}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "game" && room && !room.gameEnded) {
    const expectedBoardSize = room.boardSize || getBoardSize(room.players.length);
    const expectedBoardCells = expectedBoardSize * expectedBoardSize;

    if (board.length === expectedBoardCells) {
      return screen(
        <Game
          room={room}
          session={session}
          board={board}
          onCallNumber={handleCallNumber}
          onClaimBingo={handleClaimBingo}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }
  }

  if (view === "tag" && room) {
    return screen(
      <TagGame
        room={room}
        session={session}
        onTagInput={handleTagInput}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "treasure-hunt" && room) {
    return screen(
      <TreasureHunt
        socket={socket}
        room={room}
        session={session}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return screen(
    <Home
      connected={connected}
      activeRooms={activeRooms}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onRefreshActiveRooms={requestActiveRooms}
      initialRoomCode={initialRoomCode}
      initialGameType={initialGameType}
    />
  );
}
