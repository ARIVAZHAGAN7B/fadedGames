import { useCallback, useEffect, useState } from "react";
import Game from "./pages/Game.jsx";
import GuessNumber from "./pages/GuessNumber.jsx";
import HandCricket from "./pages/HandCricket.jsx";
import Home from "./pages/Home.jsx";
import Lobby from "./pages/Lobby.jsx";
import Result from "./pages/Result.jsx";
import TagGame from "./pages/TagGame.jsx";
import WordGuess from "./pages/WordGuess.jsx";
import { socket } from "./socket/client.js";
import { getGameTypeFromUrl, getRoomCodeFromUrl, setRoomCodeInUrl } from "./utils/roomLink.js";
import { getBoardSize } from "./game/board.js";

const STORAGE_KEY = "bingo-session-v1";

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

  if (room.gameType === "tag" && (room.gameStarted || room.gameEnded)) {
    return "tag";
  }

  if (room.gameType === "hand-cricket" && (room.gameStarted || room.gameEnded)) {
    return "hand-cricket";
  }

  if (room.gameEnded) {
    return "result";
  }

  if (room.gameStarted) {
    return "game";
  }

  return fallback;
}

export default function App() {
  const savedState = readSavedState();
  const initialRoomCode = getRoomCodeFromUrl();
  const initialGameType = getGameTypeFromUrl();
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

  const requestActiveRooms = useCallback(async () => {
    const response = await emitWithAck("list-active-rooms", {});

    if (response.ok) {
      setActiveRooms(Array.isArray(response.rooms) ? response.rooms : []);
    }

    return response;
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
    socket.on("next-turn", onRoomPayload);
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
      socket.off("next-turn", onRoomPayload);
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
    writeSavedState({
      session,
      room,
      board,
      view: viewForRoom(room, view)
    });
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
    return (
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
    return (
      <Result
        room={room}
        session={session}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (view === "hand-cricket" && room) {
    return (
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
    return (
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
    return (
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

  if (view === "game" && room && !room.gameEnded) {
    const expectedBoardSize = room.boardSize || getBoardSize(room.players.length);
    const expectedBoardCells = expectedBoardSize * expectedBoardSize;

    if (board.length === expectedBoardCells) {
      return (
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
    return (
      <TagGame
        room={room}
        session={session}
        onTagInput={handleTagInput}
        onRestartGame={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
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
