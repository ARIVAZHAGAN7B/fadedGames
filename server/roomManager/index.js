import { countCompletedLines, validateBoard, getBoardSize } from "../gameEngine/index.js";
import { chooseBotNumber, createBotName, generateBotBoard } from "../botPlayer/index.js";
import { randomUUID } from "node:crypto";

const rooms = new Map();
const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_PLAYERS_LIMIT = 12;
const HAND_CRICKET_CLASSIC_PLAYERS = 2;
const HAND_CRICKET_DEFAULT_TEAM_SIZE = 2;
const HAND_CRICKET_MIN_TEAM_SIZE = 2;
const HAND_CRICKET_MAX_TEAM_SIZE = 6;
const HAND_CRICKET_START_COUNTDOWN_MS = 5000;
const HAND_CRICKET_TOSS_THROW_MS = 10000;
const HAND_CRICKET_DECISION_MS = 15000;
const HAND_CRICKET_TEAM_SELECTION_START_MS = 15000;
const HAND_CRICKET_TEAM_SELECTION_WICKET_MS = 12000;
const HAND_CRICKET_TEAM_SELECTION_SWITCH_MS = 5000;
const HAND_CRICKET_MOVE_MS = 7000;
const HAND_CRICKET_REVEAL_MS = 1000;
const TAG_MIN_PLAYERS = 2;
const TAG_MAX_PLAYERS = 4;
const TAG_DEFAULT_ROUND_SECONDS = 60;
const TAG_ROUND_SECONDS = new Set([60, 120, 180]);
const TAG_WORLD_WIDTH = 2400;
const TAG_WORLD_HEIGHT = 1200;
const TAG_PLAYER_WIDTH = 30;
const TAG_PLAYER_HEIGHT = 34;
const TAG_GRAVITY = 1850;
const TAG_JUMP_VELOCITY = -720;
const TAG_BOUNCE_VELOCITY = -920;
const TAG_RUN_SPEED = 330;
const TAG_CHASER_SPEED = 350;
const TAG_TAG_COOLDOWN_MS = 850;
const TAG_TELEPORT_COOLDOWN_MS = 900;
const SUPPORTED_GAME_TYPES = new Set(["bingo", "hand-cricket", "tag"]);
const HAND_CRICKET_MODES = new Set(["classic", "team"]);
const HAND_CRICKET_TEAMS = ["red", "blue"];
const HAND_CRICKET_NUMBERS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const TAG_MAPS = {
  grass: {
    name: "Grass",
    spawnPoints: [
      { x: 1110, y: 620 },
      { x: 1285, y: 620 },
      { x: 340, y: 520 },
      { x: 2030, y: 900 }
    ],
    platforms: [
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 370, y: 690, w: 740, h: 24 },
      { x: 1500, y: 690, w: 940, h: 24 },
      { x: 365, y: 500, w: 340, h: 24 },
      { x: 760, y: 500, w: 700, h: 24 },
      { x: 1650, y: 500, w: 720, h: 24 },
      { x: 430, y: 275, w: 520, h: 24 },
      { x: 1250, y: 365, w: 420, h: 24 },
      { x: 1960, y: 230, w: 520, h: 24 },
      { x: 1020, y: 850, w: 450, h: 24 },
      { x: 1440, y: 790, w: 480, h: 24 },
      { x: 2060, y: 790, w: 400, h: 24 },
      { x: 1540, y: 1010, w: 820, h: 24 },
      { x: 640, y: 1000, w: 360, h: 24 }
    ],
    bouncePads: [
      { x: 980, y: 818, w: 70, h: 14 },
      { x: 2100, y: 758, w: 70, h: 14 },
      { x: 470, y: 246, w: 70, h: 14 }
    ],
    teleporters: [
      { id: "left", target: "right", x: 330, y: 246, w: 44, h: 64 },
      { id: "right", target: "left", x: 2040, y: 758, w: 44, h: 64 }
    ]
  },
  winter: {
    name: "Winter",
    spawnPoints: [
      { x: 1080, y: 620 },
      { x: 1320, y: 620 },
      { x: 360, y: 520 },
      { x: 2040, y: 900 }
    ],
    platforms: [
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 365, y: 690, w: 720, h: 24 },
      { x: 1510, y: 690, w: 900, h: 24 },
      { x: 360, y: 500, w: 410, h: 24 },
      { x: 770, y: 500, w: 720, h: 24 },
      { x: 1630, y: 500, w: 660, h: 24 },
      { x: 625, y: 275, w: 520, h: 24 },
      { x: 1300, y: 365, w: 420, h: 24 },
      { x: 1920, y: 230, w: 500, h: 24 },
      { x: 1040, y: 850, w: 430, h: 24 },
      { x: 1460, y: 790, w: 480, h: 24 },
      { x: 2060, y: 790, w: 400, h: 24 },
      { x: 1540, y: 1010, w: 820, h: 24 }
    ],
    bouncePads: [
      { x: 900, y: 818, w: 70, h: 14 },
      { x: 2060, y: 758, w: 70, h: 14 },
      { x: 615, y: 246, w: 70, h: 14 }
    ],
    teleporters: [
      { id: "left", target: "right", x: 350, y: 470, w: 44, h: 64 },
      { id: "right", target: "left", x: 2105, y: 758, w: 44, h: 64 }
    ]
  },
  desert: {
    name: "Desert",
    spawnPoints: [
      { x: 1080, y: 620 },
      { x: 1320, y: 620 },
      { x: 365, y: 520 },
      { x: 2040, y: 900 }
    ],
    platforms: [
      { x: 1200, y: 1160, w: 2400, h: 34 },
      { x: 360, y: 690, w: 700, h: 24 },
      { x: 1510, y: 690, w: 900, h: 24 },
      { x: 355, y: 500, w: 380, h: 24 },
      { x: 760, y: 500, w: 700, h: 24 },
      { x: 1620, y: 500, w: 700, h: 24 },
      { x: 500, y: 275, w: 520, h: 24 },
      { x: 1240, y: 365, w: 420, h: 24 },
      { x: 1950, y: 230, w: 520, h: 24 },
      { x: 1040, y: 850, w: 430, h: 24 },
      { x: 1470, y: 790, w: 480, h: 24 },
      { x: 2060, y: 790, w: 400, h: 24 },
      { x: 1540, y: 1010, w: 820, h: 24 }
    ],
    bouncePads: [
      { x: 960, y: 818, w: 70, h: 14 },
      { x: 2070, y: 758, w: 70, h: 14 },
      { x: 520, y: 246, w: 70, h: 14 }
    ],
    teleporters: [
      { id: "left", target: "right", x: 330, y: 246, w: 44, h: 64 },
      { id: "right", target: "left", x: 2050, y: 758, w: 44, h: 64 }
    ]
  }
};

function cleanNickname(nickname) {
  const value = String(nickname || "").trim().replace(/\s+/g, " ");

  if (!value) {
    throw new Error("Enter a nickname.");
  }

  if (value.length > 24) {
    throw new Error("Nickname must be 24 characters or less.");
  }

  return value;
}

function cleanRoomName(roomName) {
  const value = String(roomName || "").trim().replace(/\s+/g, " ");
  return value.slice(0, 40) || "Bingo Room";
}

function cleanRoomCode(roomCode) {
  return String(roomCode || "").trim().toUpperCase();
}

function cleanGameType(gameType) {
  const value = String(gameType || "bingo").trim().toLowerCase();

  if (!SUPPORTED_GAME_TYPES.has(value)) {
    throw new Error("Game is not available yet.");
  }

  return value;
}

function cleanHandCricketMode(mode) {
  const value = String(mode || "classic").trim().toLowerCase();

  if (!HAND_CRICKET_MODES.has(value)) {
    throw new Error("Hand Cricket mode is not available.");
  }

  return value;
}

function cleanHandCricketTeamSize(teamSize) {
  const value = Number(teamSize || HAND_CRICKET_DEFAULT_TEAM_SIZE);

  if (
    !Number.isInteger(value) ||
    value < HAND_CRICKET_MIN_TEAM_SIZE ||
    value > HAND_CRICKET_MAX_TEAM_SIZE
  ) {
    throw new Error(
      `Team members must be between ${HAND_CRICKET_MIN_TEAM_SIZE} and ${HAND_CRICKET_MAX_TEAM_SIZE}.`
    );
  }

  return value;
}

function cleanMaxPlayers(maxPlayers) {
  const value = Number(maxPlayers);

  if (!Number.isInteger(value) || value < 1) {
    return 4;
  }

  return Math.min(value, MAX_PLAYERS_LIMIT);
}

function cleanTagMaxPlayers(maxPlayers) {
  const value = Number(maxPlayers || TAG_MAX_PLAYERS);

  if (!Number.isInteger(value)) {
    return TAG_MAX_PLAYERS;
  }

  return Math.max(TAG_MIN_PLAYERS, Math.min(TAG_MAX_PLAYERS, value));
}

function cleanTagMapId(mapId) {
  const value = String(mapId || "grass").trim().toLowerCase();
  return TAG_MAPS[value] ? value : "grass";
}

function cleanTagRoundSeconds(roundSeconds) {
  const value = Number(roundSeconds || TAG_DEFAULT_ROUND_SECONDS);
  return TAG_ROUND_SECONDS.has(value) ? value : TAG_DEFAULT_ROUND_SECONDS;
}

function getHandCricketMaxPlayers(mode, teamSize = HAND_CRICKET_DEFAULT_TEAM_SIZE) {
  return mode === "team"
    ? cleanHandCricketTeamSize(teamSize) * 2
    : HAND_CRICKET_CLASSIC_PLAYERS;
}

function cleanMaxPlayersForGame(
  gameType,
  maxPlayers,
  handCricketMode = "classic",
  handCricketTeamSize = HAND_CRICKET_DEFAULT_TEAM_SIZE
) {
  if (gameType === "hand-cricket") {
    return getHandCricketMaxPlayers(handCricketMode, handCricketTeamSize);
  }

  if (gameType === "tag") {
    return cleanTagMaxPlayers(maxPlayers);
  }

  return cleanMaxPlayers(maxPlayers);
}

function cleanRoomSize(maxPlayers) {
  const value = Number(maxPlayers);

  if (!Number.isInteger(value) || value < 1 || value > MAX_PLAYERS_LIMIT) {
    throw new Error(`Players must be between 1 and ${MAX_PLAYERS_LIMIT}.`);
  }

  return value;
}

function getSetupBingoBoardSize(room) {
  return getBoardSize(room.players.length);
}

function getActiveBingoBoardSize(room) {
  return room.boardSize || getSetupBingoBoardSize(room);
}

function hasValidBingoBoard(room, player) {
  if (room.gameType !== "bingo") {
    return false;
  }

  return validateBoard(room.boards[player.playerId], getActiveBingoBoardSize(room)).valid;
}

function syncBingoBoardsForRoster(room) {
  if (room.gameType !== "bingo" || room.gameStarted) {
    return;
  }

  const boardSize = getSetupBingoBoardSize(room);
  const playerIds = new Set(room.players.map((player) => player.playerId));

  for (const playerId of Object.keys(room.boards)) {
    if (!playerIds.has(playerId)) {
      delete room.boards[playerId];
    }
  }

  for (const player of room.players) {
    if (player.isBot) {
      room.boards[player.playerId] = generateBotBoard(boardSize);
      continue;
    }

    if (!validateBoard(room.boards[player.playerId], boardSize).valid) {
      delete room.boards[player.playerId];
    }
  }
}

function cleanHandCricketNumber(number) {
  const value = Number(number);

  if (!Number.isInteger(value) || !HAND_CRICKET_NUMBERS.has(value)) {
    throw new Error("Choose a number from 0 to 10.");
  }

  return value;
}

function getRandomTimeoutHandCricketNumber() {
  return Math.floor(Math.random() * 11);
}

function cleanTossChoice(choice) {
  const value = String(choice || "").trim().toLowerCase();

  if (value !== "odd" && value !== "even") {
    throw new Error("Choose odd or even.");
  }

  return value;
}

function cleanTossDecision(decision) {
  const value = String(decision || "").trim().toLowerCase();

  if (value !== "bat" && value !== "bowl") {
    throw new Error("Choose bat or bowl.");
  }

  return value;
}

function generateRoomCode() {
  let code = "";

  do {
    code = Array.from({ length: CODE_LENGTH }, () => {
      const index = Math.floor(Math.random() * CODE_CHARACTERS.length);
      return CODE_CHARACTERS[index];
    }).join("");
  } while (rooms.has(code));

  return code;
}

function touch(room) {
  room.updatedAt = Date.now();
}

function requireRoom(roomCode) {
  const code = cleanRoomCode(roomCode);
  const room = rooms.get(code);

  if (!room) {
    throw new Error("Room not found.");
  }

  return room;
}

function createPlayer(socketId, name) {
  return {
    playerId: randomUUID(),
    socketId,
    name,
    isBot: false,
    connected: true,
    lastSeen: Date.now()
  };
}

function createBotPlayer(name) {
  return {
    playerId: randomUUID(),
    socketId: null,
    name,
    isBot: true,
    connected: true,
    lastSeen: Date.now()
  };
}

function findPlayerBySocket(room, socketId) {
  return room.players.find((player) => player.socketId === socketId);
}

function findPlayerById(room, playerId) {
  return room.players.find((player) => player.playerId === playerId);
}

function getOpponent(room, playerId) {
  return room.players.find((player) => player.playerId !== playerId);
}

function getHandCricketTeamSize(room) {
  return cleanHandCricketTeamSize(room.handCricketTeamSize || HAND_CRICKET_DEFAULT_TEAM_SIZE);
}

function createEmptyHandCricketTeams() {
  return {
    red: {
      name: "Team Red",
      captainId: null,
      players: [],
      battingOrder: []
    },
    blue: {
      name: "Team Blue",
      captainId: null,
      players: [],
      battingOrder: []
    }
  };
}

function getHandCricketTeamKey(state, playerId) {
  if (!state?.teams) {
    return null;
  }

  return HAND_CRICKET_TEAMS.find((teamKey) => state.teams[teamKey].players.includes(playerId)) || null;
}

function getOppositeTeam(teamKey) {
  return teamKey === "red" ? "blue" : "red";
}

function removePlayerFromHandCricketTeams(state, playerId) {
  if (!state?.teams) {
    return;
  }

  for (const teamKey of HAND_CRICKET_TEAMS) {
    const team = state.teams[teamKey];
    team.players = team.players.filter((id) => id !== playerId);
    team.battingOrder = team.battingOrder.filter((id) => id !== playerId);

    if (team.captainId === playerId) {
      team.captainId = team.players[0] || null;
    }
  }
}

function assignPlayerToHandCricketTeam(room, playerId, preferredTeam = null) {
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || state?.mode !== "team" || !state.teams) {
    return;
  }

  const teamKey =
    preferredTeam && HAND_CRICKET_TEAMS.includes(preferredTeam)
      ? preferredTeam
      : HAND_CRICKET_TEAMS.reduce((best, current) =>
          state.teams[current].players.length < state.teams[best].players.length ? current : best
        );
  const team = state.teams[teamKey];
  const teamSize = getHandCricketTeamSize(room);

  if (team.players.length >= teamSize) {
    throw new Error(`${team.name} is full.`);
  }

  removePlayerFromHandCricketTeams(state, playerId);
  team.players.push(playerId);
  team.battingOrder.push(playerId);
  team.captainId = team.captainId || playerId;
}

function syncHandCricketTeams(room) {
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || state?.mode !== "team" || !state.teams) {
    return;
  }

  const validPlayerIds = new Set(room.players.map((player) => player.playerId));

  for (const teamKey of HAND_CRICKET_TEAMS) {
    const team = state.teams[teamKey];
    team.players = team.players.filter((playerId) => validPlayerIds.has(playerId));
    team.battingOrder = team.battingOrder.filter((playerId) => team.players.includes(playerId));

    for (const playerId of team.players) {
      if (!team.battingOrder.includes(playerId)) {
        team.battingOrder.push(playerId);
      }
    }

    if (!team.players.includes(team.captainId)) {
      team.captainId = team.players[0] || null;
    }
  }
}

function createHandCricketState(phase = "waiting", mode = "classic") {
  return {
    mode,
    phase,
    teams: mode === "team" ? createEmptyHandCricketTeams() : null,
    tossChooserId: null,
    tossOpponentId: null,
    tossChoice: null,
    tossPicks: {},
    tossWinnerId: null,
    tossDecision: null,
    tossStartedAt: null,
    tossDeadlineAt: null,
    tossDurationMs: HAND_CRICKET_TOSS_THROW_MS,
    decisionStartedAt: null,
    decisionDeadlineAt: null,
    decisionDurationMs: HAND_CRICKET_DECISION_MS,
    innings: 0,
    battingPlayerId: null,
    bowlingPlayerId: null,
    battingTeam: null,
    bowlingTeam: null,
    currentBatsmanIndex: 0,
    currentBowlerIndex: 0,
    scores: {},
    teamScores: { red: 0, blue: 0 },
    wickets: { red: 0, blue: 0 },
    target: null,
    currentBallPicks: {},
    outPlayerIds: [],
    teamSelectionReady: { red: false, blue: false },
    teamSelectionCountdownRequired: false,
    teamSelectionStartedAt: null,
    teamSelectionDeadlineAt: null,
    teamSelectionDurationMs: HAND_CRICKET_TEAM_SELECTION_SWITCH_MS,
    teamSelectionReason: null,
    moveId: 0,
    moveStartedAt: null,
    moveDeadlineAt: null,
    moveDurationMs: HAND_CRICKET_MOVE_MS,
    countdownStartedAt: null,
    countdownDeadlineAt: null,
    countdownDurationMs: HAND_CRICKET_START_COUNTDOWN_MS,
    ballReveal: null,
    revealStartedAt: null,
    revealDeadlineAt: null,
    revealDurationMs: HAND_CRICKET_REVEAL_MS,
    balls: [],
    resultType: null
  };
}

function createTagState(phase = "waiting", mapId = "grass", roundSeconds = TAG_DEFAULT_ROUND_SECONDS) {
  return {
    phase,
    mapId: cleanTagMapId(mapId),
    roundSeconds: cleanTagRoundSeconds(roundSeconds),
    startedAt: null,
    endAt: null,
    lastTickAt: null,
    itPlayerId: null,
    tagCooldownUntil: null,
    players: {},
    result: null
  };
}

function createTagInput(input = {}) {
  return {
    left: Boolean(input.left),
    right: Boolean(input.right),
    jump: Boolean(input.jump)
  };
}

function rectsOverlap(first, second) {
  return (
    Math.abs(first.x - second.x) * 2 < first.w + second.w &&
    Math.abs(first.y - second.y) * 2 < first.h + second.h
  );
}

function tagPlayerRect(player) {
  return {
    x: player.x,
    y: player.y,
    w: TAG_PLAYER_WIDTH,
    h: TAG_PLAYER_HEIGHT
  };
}

function clampTagPlayerToWorld(player) {
  const halfWidth = TAG_PLAYER_WIDTH / 2;
  const halfHeight = TAG_PLAYER_HEIGHT / 2;

  if (player.x < halfWidth) {
    player.x = halfWidth;
    player.vx = 0;
  }

  if (player.x > TAG_WORLD_WIDTH - halfWidth) {
    player.x = TAG_WORLD_WIDTH - halfWidth;
    player.vx = 0;
  }

  if (player.y < halfHeight) {
    player.y = halfHeight;
    player.vy = Math.max(0, player.vy);
  }

  if (player.y > TAG_WORLD_HEIGHT - halfHeight) {
    player.y = TAG_WORLD_HEIGHT - halfHeight;
    player.vy = 0;
    player.grounded = true;
  }
}

function moveTagPlayer(player, map, dt) {
  const input = player.input || createTagInput();
  const speed = player.isIt ? TAG_CHASER_SPEED : TAG_RUN_SPEED;
  const wasGrounded = player.grounded;

  player.vx = input.left === input.right ? 0 : input.left ? -speed : speed;

  if (input.jump && !player.jumpWasDown && wasGrounded) {
    player.vy = TAG_JUMP_VELOCITY;
    player.grounded = false;
  }

  player.jumpWasDown = input.jump;
  player.vy = Math.min(player.vy + TAG_GRAVITY * dt, 980);

  const previousX = player.x;
  player.x += player.vx * dt;

  for (const platform of map.platforms) {
    if (!rectsOverlap(tagPlayerRect(player), platform)) {
      continue;
    }

    if (previousX < platform.x) {
      player.x = platform.x - platform.w / 2 - TAG_PLAYER_WIDTH / 2;
    } else {
      player.x = platform.x + platform.w / 2 + TAG_PLAYER_WIDTH / 2;
    }

    player.vx = 0;
  }

  clampTagPlayerToWorld(player);

  const previousY = player.y;
  player.y += player.vy * dt;
  player.grounded = false;

  for (const platform of map.platforms) {
    if (!rectsOverlap(tagPlayerRect(player), platform)) {
      continue;
    }

    const previousBottom = previousY + TAG_PLAYER_HEIGHT / 2;
    const previousTop = previousY - TAG_PLAYER_HEIGHT / 2;
    const platformTop = platform.y - platform.h / 2;
    const platformBottom = platform.y + platform.h / 2;

    if (previousBottom <= platformTop && player.vy >= 0) {
      player.y = platformTop - TAG_PLAYER_HEIGHT / 2;
      player.vy = 0;
      player.grounded = true;
    } else if (previousTop >= platformBottom && player.vy < 0) {
      player.y = platformBottom + TAG_PLAYER_HEIGHT / 2;
      player.vy = 0;
    }
  }

  clampTagPlayerToWorld(player);
}

function applyTagSpecialObjects(player, map, now) {
  for (const pad of map.bouncePads) {
    if (rectsOverlap(tagPlayerRect(player), pad) && player.vy >= 0) {
      player.vy = TAG_BOUNCE_VELOCITY;
      player.grounded = false;
    }
  }

  if (player.teleportCooldownUntil && now < player.teleportCooldownUntil) {
    return;
  }

  const teleporter = map.teleporters.find((entry) => rectsOverlap(tagPlayerRect(player), entry));

  if (!teleporter) {
    return;
  }

  const target = map.teleporters.find((entry) => entry.id === teleporter.target);

  if (!target) {
    return;
  }

  player.x = target.x;
  player.y = target.y - 50;
  player.vx = 0;
  player.vy = -260;
  player.teleportCooldownUntil = now + TAG_TELEPORT_COOLDOWN_MS;
}

function finishTagRound(room, loserId) {
  const loser = findPlayerById(room, loserId);
  const survivors = room.players
    .filter((player) => player.playerId !== loserId)
    .map((player) => ({
      playerId: player.playerId,
      name: player.name
    }));

  room.gameEnded = true;
  room.winner = loser
    ? {
        playerId: loser.playerId,
        name: loser.name,
        isLoser: true
      }
    : null;
  room.tag.phase = "result";
  room.tag.result = {
    loser: loser
      ? {
          playerId: loser.playerId,
          name: loser.name
        }
      : null,
    survivors
  };
}

function syncTagPlayers(room) {
  if (room.gameType !== "tag" || !room.tag) {
    return;
  }

  const map = TAG_MAPS[room.tag.mapId] || TAG_MAPS.grass;
  const activePlayerIds = new Set(room.players.map((player) => player.playerId));

  for (const playerId of Object.keys(room.tag.players)) {
    if (!activePlayerIds.has(playerId)) {
      delete room.tag.players[playerId];
    }
  }

  room.players.forEach((player, index) => {
    if (room.tag.players[player.playerId]) {
      return;
    }

    const spawn = map.spawnPoints[index % map.spawnPoints.length];
    room.tag.players[player.playerId] = {
      playerId: player.playerId,
      name: player.name,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      isIt: false,
      grounded: false,
      input: createTagInput(),
      jumpWasDown: false,
      teleportCooldownUntil: 0
    };
  });

  if (!room.players.some((player) => player.playerId === room.tag.itPlayerId)) {
    room.tag.itPlayerId = room.players[0]?.playerId || null;
  }

  for (const player of Object.values(room.tag.players)) {
    player.isIt = player.playerId === room.tag.itPlayerId;
  }
}

function startTagRound(room) {
  const now = Date.now();
  const map = TAG_MAPS[room.tag.mapId] || TAG_MAPS.grass;
  const chaserIndex = Math.floor(Math.random() * room.players.length);
  const chaser = room.players[chaserIndex];

  room.tag.phase = "playing";
  room.tag.startedAt = now;
  room.tag.endAt = now + room.tag.roundSeconds * 1000;
  room.tag.lastTickAt = now;
  room.tag.itPlayerId = chaser.playerId;
  room.tag.tagCooldownUntil = now + TAG_TAG_COOLDOWN_MS;
  room.tag.result = null;
  room.tag.players = {};

  room.players.forEach((player, index) => {
    const spawn = map.spawnPoints[index % map.spawnPoints.length];

    room.tag.players[player.playerId] = {
      playerId: player.playerId,
      name: player.name,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      isIt: player.playerId === chaser.playerId,
      grounded: false,
      input: createTagInput(),
      jumpWasDown: false,
      teleportCooldownUntil: 0
    };
  });
}

function transferTag(room, nextItPlayerId, now) {
  room.tag.itPlayerId = nextItPlayerId;
  room.tag.tagCooldownUntil = now + TAG_TAG_COOLDOWN_MS;

  for (const player of Object.values(room.tag.players)) {
    player.isIt = player.playerId === nextItPlayerId;
  }
}

function processTagCollisions(room, now) {
  if (now < (room.tag.tagCooldownUntil || 0)) {
    return;
  }

  const chaser = room.tag.players[room.tag.itPlayerId];

  if (!chaser) {
    return;
  }

  for (const runner of Object.values(room.tag.players)) {
    if (runner.playerId === chaser.playerId) {
      continue;
    }

    if (rectsOverlap(tagPlayerRect(chaser), tagPlayerRect(runner))) {
      transferTag(room, runner.playerId, now);
      runner.vy = Math.min(runner.vy, -190);
      break;
    }
  }
}

function clearHandCricketTossTimer(state) {
  state.tossStartedAt = null;
  state.tossDeadlineAt = null;
}

function clearHandCricketDecisionTimer(state) {
  state.decisionStartedAt = null;
  state.decisionDeadlineAt = null;
}

function clearHandCricketSelectionTimer(state) {
  state.teamSelectionStartedAt = null;
  state.teamSelectionDeadlineAt = null;
  state.teamSelectionReason = null;
}

function clearHandCricketWaitingTimers(state) {
  clearHandCricketTossTimer(state);
  clearHandCricketDecisionTimer(state);
  clearHandCricketSelectionTimer(state);
}

function beginHandCricketTossThrow(state, { chooserId, opponentId, choice }) {
  const now = Date.now();

  state.tossChoice = cleanTossChoice(choice);
  state.tossChooserId = chooserId;
  state.tossOpponentId = opponentId;
  state.tossPicks = {};
  state.tossWinnerId = null;
  state.phase = "toss-throw";
  state.moveId += 1;
  state.tossStartedAt = now;
  state.tossDeadlineAt = now + HAND_CRICKET_TOSS_THROW_MS;
  state.tossDurationMs = HAND_CRICKET_TOSS_THROW_MS;
  clearHandCricketDecisionTimer(state);
  clearHandCricketSelectionTimer(state);
}

function beginHandCricketDecision(state) {
  const now = Date.now();

  state.phase = "decision";
  state.moveId += 1;
  state.decisionStartedAt = now;
  state.decisionDeadlineAt = now + HAND_CRICKET_DECISION_MS;
  state.decisionDurationMs = HAND_CRICKET_DECISION_MS;
  clearHandCricketTossTimer(state);
  clearHandCricketSelectionTimer(state);
}

function beginHandCricketMove(state) {
  const now = Date.now();

  state.currentBallPicks = {};
  state.ballReveal = null;
  state.teamSelectionCountdownRequired = false;
  state.phase = "innings";
  state.moveId += 1;
  clearHandCricketWaitingTimers(state);
  state.countdownStartedAt = null;
  state.countdownDeadlineAt = null;
  state.moveStartedAt = now;
  state.moveDeadlineAt = now + HAND_CRICKET_MOVE_MS;
  state.moveDurationMs = HAND_CRICKET_MOVE_MS;
  state.revealStartedAt = null;
  state.revealDeadlineAt = null;
  state.revealDurationMs = HAND_CRICKET_REVEAL_MS;
}

function beginHandCricketCountdown(state) {
  const now = Date.now();

  state.currentBallPicks = {};
  state.ballReveal = null;
  state.phase = "countdown";
  state.teamSelectionCountdownRequired = false;
  state.moveId += 1;
  clearHandCricketWaitingTimers(state);
  state.countdownStartedAt = now;
  state.countdownDeadlineAt = now + HAND_CRICKET_START_COUNTDOWN_MS;
  state.countdownDurationMs = HAND_CRICKET_START_COUNTDOWN_MS;
  state.moveStartedAt = null;
  state.moveDeadlineAt = null;
  state.revealStartedAt = null;
  state.revealDeadlineAt = null;
}

function clearHandCricketMove(state) {
  state.currentBallPicks = {};
  state.moveStartedAt = null;
  state.moveDeadlineAt = null;
  state.countdownStartedAt = null;
  state.countdownDeadlineAt = null;
  state.ballReveal = null;
  state.teamSelectionCountdownRequired = false;
  clearHandCricketWaitingTimers(state);
  state.revealStartedAt = null;
  state.revealDeadlineAt = null;
}

function createHandCricketBallReveal(state) {
  const batsmanNumber = state.currentBallPicks[state.battingPlayerId];
  const bowlerNumber = state.currentBallPicks[state.bowlingPlayerId];
  const isOut = batsmanNumber === bowlerNumber;
  const runs = isOut ? 0 : batsmanNumber;
  const scoreBefore =
    state.mode === "team"
      ? state.teamScores[state.battingTeam] || 0
      : state.scores[state.battingPlayerId] || 0;
  const scoreAfter = isOut ? scoreBefore : scoreBefore + runs;

  return {
    moveId: state.moveId,
    innings: state.innings,
    mode: state.mode,
    battingTeam: state.battingTeam,
    bowlingTeam: state.bowlingTeam,
    battingPlayerId: state.battingPlayerId,
    bowlingPlayerId: state.bowlingPlayerId,
    batsmanNumber,
    bowlerNumber,
    runs,
    out: isOut,
    scoreBefore,
    scoreAfter,
    target: state.target
  };
}

function beginHandCricketReveal(state) {
  const now = Date.now();

  state.ballReveal = createHandCricketBallReveal(state);
  state.phase = "ball-reveal";
  clearHandCricketWaitingTimers(state);
  state.moveStartedAt = null;
  state.moveDeadlineAt = null;
  state.revealStartedAt = now;
  state.revealDeadlineAt = now + HAND_CRICKET_REVEAL_MS;
  state.revealDurationMs = HAND_CRICKET_REVEAL_MS;
}

function getTeamBattingOrder(state, teamKey) {
  return state.teams?.[teamKey]?.battingOrder || [];
}

function getTeamBowlingOrder(state, teamKey) {
  return state.teams?.[teamKey]?.players || [];
}

function getTeamOutPlayerIds(state) {
  return new Set(state.outPlayerIds || []);
}

function getAvailableTeamBatsmen(state, teamKey = state.battingTeam) {
  const outPlayerIds = getTeamOutPlayerIds(state);
  return getTeamBattingOrder(state, teamKey).filter((playerId) => !outPlayerIds.has(playerId));
}

function setTeamBatsman(state, playerId) {
  const battingOrder = getTeamBattingOrder(state, state.battingTeam);

  if (!battingOrder.includes(playerId) || getTeamOutPlayerIds(state).has(playerId)) {
    throw new Error("Choose a batter who is still available.");
  }

  state.battingPlayerId = playerId;
  state.currentBatsmanIndex = battingOrder.indexOf(playerId);
}

function setTeamBowler(state, playerId) {
  const bowlingOrder = getTeamBowlingOrder(state, state.bowlingTeam);

  if (!bowlingOrder.includes(playerId)) {
    throw new Error("Choose a bowler from the bowling team.");
  }

  state.bowlingPlayerId = playerId;
  state.currentBowlerIndex = bowlingOrder.indexOf(playerId);
}

function setDefaultTeamBatsman(state, preferredPlayerId = state.battingPlayerId) {
  const availableBatsmen = getAvailableTeamBatsmen(state);
  const nextBatsmanId = availableBatsmen.includes(preferredPlayerId)
    ? preferredPlayerId
    : availableBatsmen[0] || null;

  if (nextBatsmanId) {
    setTeamBatsman(state, nextBatsmanId);
  } else {
    state.battingPlayerId = null;
    state.currentBatsmanIndex = 0;
  }
}

function setDefaultTeamBowler(state, preferredPlayerId = state.bowlingPlayerId) {
  const bowlingOrder = getTeamBowlingOrder(state, state.bowlingTeam);
  const nextBowlerId = bowlingOrder.includes(preferredPlayerId)
    ? preferredPlayerId
    : bowlingOrder[0] || null;

  if (nextBowlerId) {
    setTeamBowler(state, nextBowlerId);
  } else {
    state.bowlingPlayerId = null;
    state.currentBowlerIndex = 0;
  }
}

function setTeamCaptainsAsCurrentPlayers(state) {
  const battingCaptainId = state.teams?.[state.battingTeam]?.captainId;
  const bowlingCaptainId = state.teams?.[state.bowlingTeam]?.captainId;

  setDefaultTeamBatsman(state, battingCaptainId);
  setDefaultTeamBowler(state, bowlingCaptainId);
}

function setCurrentTeamPlayers(state) {
  if (state.mode !== "team") {
    return;
  }

  setDefaultTeamBatsman(state, getTeamBattingOrder(state, state.battingTeam)[state.currentBatsmanIndex]);
  setDefaultTeamBowler(state, getTeamBowlingOrder(state, state.bowlingTeam)[state.currentBowlerIndex]);
}

function rotateTeamBowler(state) {
  if (state.mode !== "team") {
    return;
  }

  const bowlingOrder = getTeamBowlingOrder(state, state.bowlingTeam);

  if (bowlingOrder.length > 0) {
    state.currentBowlerIndex = (state.currentBowlerIndex + 1) % bowlingOrder.length;
  }

  setCurrentTeamPlayers(state);
}

function switchHandCricketTeamInnings(state) {
  [state.battingTeam, state.bowlingTeam] = [state.bowlingTeam, state.battingTeam];
  state.currentBatsmanIndex = 0;
  state.currentBowlerIndex = 0;
  state.outPlayerIds = [];
  setTeamCaptainsAsCurrentPlayers(state);
  state.innings = 2;
}

function getHandCricketTeamSelectionDuration(reason) {
  if (reason === "switch") {
    return HAND_CRICKET_TEAM_SELECTION_SWITCH_MS;
  }

  if (reason === "wicket") {
    return HAND_CRICKET_TEAM_SELECTION_WICKET_MS;
  }

  return HAND_CRICKET_TEAM_SELECTION_START_MS;
}

function beginHandCricketTeamSelection(state, { countdownRequired = false, reason = "switch" } = {}) {
  if (state.mode !== "team") {
    return;
  }

  const now = Date.now();
  const duration = getHandCricketTeamSelectionDuration(reason);

  setCurrentTeamPlayers(state);
  state.currentBallPicks = {};
  state.ballReveal = null;
  state.phase = "player-selection";
  state.moveId += 1;
  state.moveStartedAt = null;
  state.moveDeadlineAt = null;
  state.countdownStartedAt = null;
  state.countdownDeadlineAt = null;
  state.revealStartedAt = null;
  state.revealDeadlineAt = null;
  clearHandCricketTossTimer(state);
  clearHandCricketDecisionTimer(state);
  state.teamSelectionReady = {
    [state.battingTeam]: false,
    [state.bowlingTeam]: false
  };
  state.teamSelectionCountdownRequired = Boolean(countdownRequired);
  state.teamSelectionStartedAt = now;
  state.teamSelectionDeadlineAt = now + duration;
  state.teamSelectionDurationMs = duration;
  state.teamSelectionReason = reason;
}

function maybeStartHandCricketAfterTeamSelection(state) {
  if (state.mode !== "team" || state.phase !== "player-selection") {
    return false;
  }

  if (!state.battingPlayerId || !state.bowlingPlayerId) {
    return false;
  }

  if (!state.teamSelectionReady?.[state.battingTeam] || !state.teamSelectionReady?.[state.bowlingTeam]) {
    return false;
  }

  if (state.teamSelectionCountdownRequired) {
    beginHandCricketCountdown(state);
  } else {
    beginHandCricketMove(state);
  }

  return true;
}

function createVisiblePickMap(picks, reveal) {
  if (reveal) {
    return picks;
  }

  return Object.fromEntries(Object.keys(picks).map((playerId) => [playerId, true]));
}

function serializeHandCricket(room) {
  if (room.gameType !== "hand-cricket") {
    return null;
  }

  const state = room.handCricket || createHandCricketState();
  const playerCount = room.players.length;
  const tossPlayerCount = state.mode === "team" ? HAND_CRICKET_CLASSIC_PLAYERS : playerCount;
  const revealToss = Object.keys(state.tossPicks || {}).length === tossPlayerCount;
  const revealBall = Object.keys(state.currentBallPicks || {}).length === HAND_CRICKET_CLASSIC_PLAYERS;

  return {
    ...state,
    tossPicks: createVisiblePickMap(state.tossPicks || {}, revealToss),
    currentBallPicks: createVisiblePickMap(state.currentBallPicks || {}, revealBall)
  };
}

function serializeTag(room) {
  if (room.gameType !== "tag") {
    return null;
  }

  const state = room.tag || createTagState();
  const now = Date.now();

  return {
    phase: state.phase,
    mapId: state.mapId,
    roundSeconds: state.roundSeconds,
    world: {
      width: TAG_WORLD_WIDTH,
      height: TAG_WORLD_HEIGHT
    },
    timeLeftMs:
      state.phase === "playing" && state.endAt
        ? Math.max(0, state.endAt - now)
        : state.roundSeconds * 1000,
    itPlayerId: state.itPlayerId,
    tagCooldownUntil: state.tagCooldownUntil,
    players: Object.values(state.players || {}).map((player) => ({
      playerId: player.playerId,
      name: player.name,
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: Math.round(player.vx),
      vy: Math.round(player.vy),
      isIt: player.playerId === state.itPlayerId,
      grounded: Boolean(player.grounded)
    })),
    result: state.result
  };
}

function publicPlayer(player, room) {
  return {
    playerId: player.playerId,
    socketId: player.socketId,
    name: player.name,
    isBot: Boolean(player.isBot),
    connected: player.connected,
    isHost: room.host === player.playerId,
    hasBoard: hasValidBingoBoard(room, player)
  };
}

export function serializeRoom(room) {
  const currentPlayer = room.players[room.currentTurn] || null;

  return {
    roomCode: room.roomCode,
    gameType: room.gameType,
    handCricketMode: room.handCricketMode,
    handCricketTeamSize: room.handCricketTeamSize,
    roomName: room.roomName,
    host: room.host,
    maxPlayers: room.maxPlayers,
    boardSize: room.boardSize || null,
    players: room.players.map((player) => publicPlayer(player, room)),
    calledNumbers: [...room.calledNumbers],
    currentTurn: room.currentTurn,
    currentPlayerId: currentPlayer?.playerId || null,
    currentPlayerName: currentPlayer?.name || null,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
    winner: room.winner,
    handCricket: serializeHandCricket(room),
    tag: serializeTag(room)
  };
}

function serializeActiveRoom(room) {
  return {
    roomCode: room.roomCode,
    gameType: room.gameType,
    handCricketMode: room.handCricketMode,
    handCricketTeamSize: room.handCricketTeamSize,
    tagMapId: room.tag?.mapId || null,
    tagRoundSeconds: room.tag?.roundSeconds || null,
    roomName: room.roomName,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
    updatedAt: room.updatedAt
  };
}

export function listActiveRooms() {
  return [...rooms.values()]
    .filter((room) => !room.gameEnded)
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .map(serializeActiveRoom);
}

export function createRoom({
  socketId,
  nickname,
  roomName,
  maxPlayers,
  gameType,
  handCricketMode,
  handCricketTeamSize,
  tagMapId,
  tagRoundSeconds
}) {
  const name = cleanNickname(nickname);
  const code = generateRoomCode();
  const player = createPlayer(socketId, name);
  const type = cleanGameType(gameType);
  const cricketMode = type === "hand-cricket" ? cleanHandCricketMode(handCricketMode) : null;
  const cricketTeamSize =
    type === "hand-cricket" && cricketMode === "team"
      ? cleanHandCricketTeamSize(handCricketTeamSize)
      : null;
  const cleanTagMap = type === "tag" ? cleanTagMapId(tagMapId) : null;
  const cleanTagRound = type === "tag" ? cleanTagRoundSeconds(tagRoundSeconds) : null;
  const room = {
    roomCode: code,
    gameType: type,
    handCricketMode: cricketMode,
    handCricketTeamSize: cricketTeamSize,
    roomName: cleanRoomName(roomName),
    host: player.playerId,
    maxPlayers: cleanMaxPlayersForGame(type, maxPlayers, cricketMode, cricketTeamSize),
    players: [player],
    calledNumbers: [],
    currentTurn: 0,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    boardSize: null,
    boards: {},
    handCricket: type === "hand-cricket" ? createHandCricketState("waiting", cricketMode) : null,
    tag: type === "tag" ? createTagState("waiting", cleanTagMap, cleanTagRound) : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  rooms.set(code, room);

  if (cricketMode === "team") {
    assignPlayerToHandCricketTeam(room, player.playerId, "red");
  }

  return { room, player };
}

export function joinRoom({ socketId, nickname, roomCode }) {
  const room = requireRoom(roomCode);
  const name = cleanNickname(nickname);
  const normalizedName = name.toLowerCase();

  if (room.gameStarted) {
    throw new Error("Game already started.");
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error("Room is full.");
  }

  if (room.players.some((player) => player.name.toLowerCase() === normalizedName)) {
    throw new Error("Nickname is already used in this room.");
  }

  const player = createPlayer(socketId, name);
  room.players.push(player);
  syncBingoBoardsForRoster(room);

  if (room.gameType === "hand-cricket" && room.handCricketMode === "team") {
    assignPlayerToHandCricketTeam(room, player.playerId);
  }

  touch(room);

  return { room, player };
}

export function updateRoomSettings({
  socketId,
  roomCode,
  roomName,
  maxPlayers,
  handCricketTeamSize,
  tagMapId,
  tagRoundSeconds
}) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const nextTeamSize =
    room.gameType === "hand-cricket" && room.handCricketMode === "team"
      ? cleanHandCricketTeamSize(handCricketTeamSize || room.handCricketTeamSize)
      : room.handCricketTeamSize;
  const nextMaxPlayers =
    room.gameType === "hand-cricket"
      ? getHandCricketMaxPlayers(room.handCricketMode, nextTeamSize)
      : room.gameType === "tag"
        ? cleanTagMaxPlayers(maxPlayers)
      : cleanRoomSize(maxPlayers);

  if (!player || room.host !== player.playerId) {
    throw new Error("Only the host can change room settings.");
  }

  if (room.gameStarted) {
    throw new Error("Room settings are locked after the game starts.");
  }

  if (nextMaxPlayers < room.players.length) {
    throw new Error(`Players cannot be less than ${room.players.length}.`);
  }

  if (room.gameType === "hand-cricket" && room.handCricketMode === "team") {
    const oversizedTeam = HAND_CRICKET_TEAMS.find(
      (teamKey) => (room.handCricket?.teams?.[teamKey]?.players || []).length > nextTeamSize
    );

    if (oversizedTeam) {
      throw new Error(`${room.handCricket.teams[oversizedTeam].name} already has too many players.`);
    }

    room.handCricketTeamSize = nextTeamSize;
  }

  if (room.gameType === "tag") {
    room.tag.mapId = cleanTagMapId(tagMapId || room.tag.mapId);
    room.tag.roundSeconds = cleanTagRoundSeconds(tagRoundSeconds || room.tag.roundSeconds);
  }

  room.roomName = cleanRoomName(roomName);
  room.maxPlayers = nextMaxPlayers;
  touch(room);

  return room;
}

export function joinHandCricketTeam({ socketId, roomCode, team }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const teamKey = String(team || "").trim().toLowerCase();

  if (room.gameType !== "hand-cricket" || room.handCricketMode !== "team") {
    throw new Error("Team mode is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (room.gameStarted) {
    throw new Error("Teams are locked after the game starts.");
  }

  if (!HAND_CRICKET_TEAMS.includes(teamKey)) {
    throw new Error("Choose Team Red or Team Blue.");
  }

  assignPlayerToHandCricketTeam(room, player.playerId, teamKey);
  syncHandCricketTeams(room);
  touch(room);

  return room;
}

export function addBot({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (room.gameType !== "bingo") {
    throw new Error("Bots are only available for Bingo right now.");
  }

  if (!player || room.host !== player.playerId) {
    throw new Error("Only the host can add bots.");
  }

  if (room.gameStarted) {
    throw new Error("Bots can only be added before the game starts.");
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error("Room is full.");
  }

  const bot = createBotPlayer(createBotName(room.players.map((entry) => entry.name)));
  room.players.push(bot);
  syncBingoBoardsForRoster(room);
  touch(room);

  return {
    room,
    player: bot
  };
}

export function resumeSession({ socketId, roomCode, playerId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerById(room, playerId);

  if (!player) {
    throw new Error("Saved session was not found.");
  }

  player.socketId = socketId;
  player.connected = true;
  player.lastSeen = Date.now();
  touch(room);

  return {
    room,
    player,
    board: room.boards[player.playerId] || []
  };
}

export function setPlayerBoard({ socketId, roomCode, board }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (room.gameType !== "bingo") {
    throw new Error("Boards are only used for Bingo.");
  }

  if (room.gameStarted) {
    throw new Error("Boards are locked after the game starts.");
  }

  const boardSize = getSetupBingoBoardSize(room);
  const validation = validateBoard(board, boardSize);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  room.boards[player.playerId] = validation.normalized;
  touch(room);

  return room;
}

export function startGame({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (!player || room.host !== player.playerId) {
    throw new Error("Only the host can start the game.");
  }

  if (room.gameType === "tag") {
    if (room.players.length < TAG_MIN_PLAYERS) {
      throw new Error(`TAG needs at least ${TAG_MIN_PLAYERS} players.`);
    }

    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    startTagRound(room);
    touch(room);

    return room;
  }

  if (room.gameType === "hand-cricket") {
    if (room.handCricketMode === "team") {
      syncHandCricketTeams(room);
      const teamSize = getHandCricketTeamSize(room);
      const requiredPlayers = teamSize * 2;

      if (room.players.length !== requiredPlayers) {
        throw new Error(`Team Hand Cricket needs exactly ${requiredPlayers} players.`);
      }

      if (HAND_CRICKET_TEAMS.some((teamKey) => room.handCricket.teams[teamKey].players.length !== teamSize)) {
        throw new Error(`Each team needs exactly ${teamSize} players.`);
      }
    } else if (room.players.length !== HAND_CRICKET_CLASSIC_PLAYERS) {
      throw new Error("Classic Hand Cricket needs exactly 2 players.");
    }

    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    room.handCricket = {
      ...createHandCricketState("toss-choice", room.handCricketMode),
      teams: room.handCricket?.teams || null,
      tossChooserId: null,
      scores: Object.fromEntries(room.players.map((entry) => [entry.playerId, 0])),
      teamScores: { red: 0, blue: 0 },
      wickets: { red: 0, blue: 0 }
    };
    syncHandCricketTeams(room);
    touch(room);

    return room;
  }

  const boardSize = getSetupBingoBoardSize(room);
  const missingBoard = room.players.find((entry) => !validateBoard(room.boards[entry.playerId], boardSize).valid);

  if (missingBoard) {
    throw new Error(`${missingBoard.name} needs a ${boardSize}x${boardSize} board.`);
  }

  room.calledNumbers = [];
  room.currentTurn = 0;
  room.gameStarted = true;
  room.gameEnded = false;
  room.winner = null;
  room.boardSize = boardSize;
  touch(room);

  return room;
}

export function restartGame({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (!player || room.host !== player.playerId) {
    throw new Error("Only the host can restart the game.");
  }

  room.calledNumbers = [];
  room.currentTurn = 0;
  room.gameStarted = false;
  room.gameEnded = false;
  room.winner = null;
  room.boardSize = null;

  if (room.gameType === "hand-cricket") {
    const previousTeams = room.handCricket?.teams || null;
    room.handCricket = createHandCricketState("waiting", room.handCricketMode);
    room.handCricket.teams = room.handCricketMode === "team" ? previousTeams || createEmptyHandCricketTeams() : null;
    syncHandCricketTeams(room);
    touch(room);

    return room;
  }

  if (room.gameType === "tag") {
    room.tag = createTagState("waiting", room.tag?.mapId, room.tag?.roundSeconds);
    touch(room);

    return room;
  }

  for (const entry of room.players) {
    if (entry.isBot) {
      const boardSize = getSetupBingoBoardSize(room);
      room.boards[entry.playerId] = generateBotBoard(boardSize);
    } else {
      delete room.boards[entry.playerId];
    }
  }

  touch(room);

  return room;
}

export function submitTagInput({ socketId, roomCode, input }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (room.gameType !== "tag" || !room.tag) {
    throw new Error("TAG is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || room.tag.phase !== "playing") {
    return room;
  }

  const tagPlayer = room.tag.players[player.playerId];

  if (tagPlayer) {
    tagPlayer.input = createTagInput(input);
  }

  return room;
}

export function tickTagRoom({ roomCode, now = Date.now() }) {
  const room = requireRoom(roomCode);

  if (room.gameType !== "tag" || !room.tag || !room.gameStarted || room.gameEnded) {
    return {
      room,
      active: false
    };
  }

  if (room.tag.phase !== "playing") {
    return {
      room,
      active: false
    };
  }

  syncTagPlayers(room);

  const map = TAG_MAPS[room.tag.mapId] || TAG_MAPS.grass;
  const lastTickAt = room.tag.lastTickAt || now;
  const dt = Math.max(0.001, Math.min(0.05, (now - lastTickAt) / 1000));

  room.tag.lastTickAt = now;

  for (const player of Object.values(room.tag.players)) {
    moveTagPlayer(player, map, dt);
    applyTagSpecialObjects(player, map, now);
  }

  processTagCollisions(room, now);

  if (room.tag.endAt && now >= room.tag.endAt) {
    finishTagRound(room, room.tag.itPlayerId);
    touch(room);

    return {
      room,
      active: false
    };
  }

  return {
    room,
    active: true
  };
}

export function chooseHandCricketToss({ socketId, roomCode, choice }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "toss-choice") {
    throw new Error("Toss choice is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (state.mode === "team") {
    const playerTeam = getHandCricketTeamKey(state, player.playerId);
    const opponentTeam = getOppositeTeam(playerTeam);
    const opponentCaptainId = state.teams?.[opponentTeam]?.captainId;

    if (!playerTeam || state.teams[playerTeam].captainId !== player.playerId) {
      throw new Error("Only captains can choose the toss in team mode.");
    }

    if (!opponentCaptainId) {
      throw new Error("Opponent captain not found.");
    }

    beginHandCricketTossThrow(state, {
      chooserId: player.playerId,
      opponentId: opponentCaptainId,
      choice
    });
    touch(room);

    return room;
  }

  const opponent = getOpponent(room, player.playerId);

  if (!opponent) {
    throw new Error("Opponent not found.");
  }

  beginHandCricketTossThrow(state, {
    chooserId: player.playerId,
    opponentId: opponent.playerId,
    choice
  });
  touch(room);

  return room;
}

export function chooseHandCricketDecision({ socketId, roomCode, decision }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "decision") {
    throw new Error("Bat or bowl decision is not active.");
  }

  if (!player || player.playerId !== state.tossWinnerId) {
    throw new Error("Only the toss winner can choose bat or bowl.");
  }

  const value = cleanTossDecision(decision);
  applyHandCricketDecision(room, player, value);
  touch(room);

  return room;
}

function applyHandCricketDecision(room, player, decision) {
  const state = room.handCricket;
  const value = cleanTossDecision(decision);

  if (state.mode === "team") {
    const playerTeam = getHandCricketTeamKey(state, player.playerId);
    const opponentTeam = getOppositeTeam(playerTeam);

    if (!playerTeam || !opponentTeam) {
      throw new Error("Team setup is incomplete.");
    }

    state.tossDecision = value;
    state.innings = 1;
    state.battingTeam = value === "bat" ? playerTeam : opponentTeam;
    state.bowlingTeam = value === "bat" ? opponentTeam : playerTeam;
    state.currentBatsmanIndex = 0;
    state.currentBowlerIndex = 0;
    state.outPlayerIds = [];
    setTeamCaptainsAsCurrentPlayers(state);

    if (!state.battingPlayerId || !state.bowlingPlayerId) {
      throw new Error("Team setup is incomplete.");
    }

    beginHandCricketTeamSelection(state, { countdownRequired: true, reason: "start" });

    return room;
  }

  const opponent = getOpponent(room, player.playerId);

  if (!opponent) {
    throw new Error("Opponent not found.");
  }

  state.tossDecision = value;
  state.innings = 1;
  state.battingPlayerId = value === "bat" ? player.playerId : opponent.playerId;
  state.bowlingPlayerId = value === "bat" ? opponent.playerId : player.playerId;
  beginHandCricketCountdown(state);

  return room;
}

export function selectHandCricketTeamPlayer({ socketId, roomCode, playerId: selectedPlayerId, ready }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.mode !== "team") {
    throw new Error("Team Hand Cricket is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "player-selection") {
    throw new Error("Player selection is not active.");
  }

  const playerTeam = getHandCricketTeamKey(state, player.playerId);
  const isBattingCaptain =
    playerTeam === state.battingTeam && state.teams?.[playerTeam]?.captainId === player.playerId;
  const isBowlingCaptain =
    playerTeam === state.bowlingTeam && state.teams?.[playerTeam]?.captainId === player.playerId;

  if (!isBattingCaptain && !isBowlingCaptain) {
    throw new Error("Only the active team captains can choose players.");
  }

  const requestedPlayerId = String(selectedPlayerId || "").trim();

  if (requestedPlayerId) {
    const selectionChanged = isBattingCaptain
      ? requestedPlayerId !== state.battingPlayerId
      : requestedPlayerId !== state.bowlingPlayerId;

    if (isBattingCaptain) {
      setTeamBatsman(state, requestedPlayerId);
    } else {
      setTeamBowler(state, requestedPlayerId);
    }

    if (selectionChanged) {
      state.teamSelectionReady[playerTeam] = false;
    }
  }

  if (ready !== undefined) {
    state.teamSelectionReady[playerTeam] = Boolean(ready);
  }

  maybeStartHandCricketAfterTeamSelection(state);
  touch(room);

  return room;
}

function completeHandCricketToss(room) {
  const state = room.handCricket;
  const chooserId = state.tossChooserId;
  const opponentId = state.tossOpponentId;
  const firstPick = state.tossPicks[chooserId];
  const secondPick = state.tossPicks[opponentId];

  if (firstPick === undefined || secondPick === undefined) {
    return;
  }

  const total = firstPick + secondPick;
  const parity = total % 2 === 0 ? "even" : "odd";
  const chooserWon = parity === state.tossChoice;

  state.tossWinnerId = chooserWon ? chooserId : opponentId;
  beginHandCricketDecision(state);
}

function finishHandCricketMatch(room, winnerId, resultType) {
  const state = room.handCricket;
  const winner = winnerId ? findPlayerById(room, winnerId) : null;

  state.phase = "result";
  state.resultType = resultType;
  clearHandCricketMove(state);
  room.gameEnded = true;
  room.winner = winner
    ? {
        playerId: winner.playerId,
        name: winner.name
      }
    : null;
}

function finishHandCricketTeamMatch(room, winnerTeam, resultType) {
  const state = room.handCricket;
  const team = winnerTeam ? state.teams?.[winnerTeam] : null;

  state.phase = "result";
  state.resultType = resultType;
  clearHandCricketMove(state);
  room.gameEnded = true;
  room.winner = team
    ? {
        teamKey: winnerTeam,
        name: team.name
      }
    : null;
}

function completeHandCricketBall(room) {
  const state = room.handCricket;
  const reveal = state.ballReveal || createHandCricketBallReveal(state);
  const isOut = reveal.out;

  if (!isOut) {
    state.scores[reveal.battingPlayerId] = (state.scores[reveal.battingPlayerId] || 0) + reveal.runs;

    if (state.mode === "team") {
      state.teamScores[reveal.battingTeam] = reveal.scoreAfter;
    }
  }

  state.balls.push({
    moveId: reveal.moveId,
    pairId: reveal.pairId,
    innings: reveal.innings,
    battingTeam: reveal.battingTeam,
    bowlingTeam: reveal.bowlingTeam,
    battingPlayerId: reveal.battingPlayerId,
    bowlingPlayerId: reveal.bowlingPlayerId,
    batsmanNumber: reveal.batsmanNumber,
    bowlerNumber: reveal.bowlerNumber,
    runs: reveal.runs,
    out: isOut,
    scoreAfter: reveal.scoreAfter
  });
  state.ballReveal = null;
  state.revealStartedAt = null;
  state.revealDeadlineAt = null;

  if (state.mode === "team") {
    const battingTeam = state.battingTeam;
    const bowlingTeam = state.bowlingTeam;
    const scoreAfter = state.teamScores[battingTeam] || 0;
    const battingOrder = getTeamBattingOrder(state, battingTeam);

    if (isOut) {
      const outPlayerIds = getTeamOutPlayerIds(state);

      if (!outPlayerIds.has(reveal.battingPlayerId)) {
        outPlayerIds.add(reveal.battingPlayerId);
        state.outPlayerIds = Array.from(outPlayerIds);
        state.wickets[battingTeam] += 1;
      }

      const outIndex = battingOrder.indexOf(reveal.battingPlayerId);

      if (outIndex !== -1) {
        state.currentBatsmanIndex = Math.min(outIndex + 1, battingOrder.length - 1);
      }
    }

    if (state.innings === 2 && !isOut && scoreAfter >= state.target) {
      finishHandCricketTeamMatch(room, battingTeam, "win");
      return;
    }

    if (isOut && getAvailableTeamBatsmen(state, battingTeam).length === 0) {
      if (state.innings === 1) {
        state.target = scoreAfter + 1;
        switchHandCricketTeamInnings(state);
        beginHandCricketTeamSelection(state, { countdownRequired: true, reason: "innings" });
        return;
      }

      if (scoreAfter === state.target - 1) {
        finishHandCricketTeamMatch(room, null, "tie");
      } else {
        finishHandCricketTeamMatch(room, bowlingTeam, "win");
      }

      return;
    }

    rotateTeamBowler(state);
    beginHandCricketTeamSelection(state, { reason: isOut ? "wicket" : "switch" });
    return;
  }

  if (state.innings === 1 && isOut) {
    state.target = reveal.scoreAfter + 1;
    [state.battingPlayerId, state.bowlingPlayerId] = [state.bowlingPlayerId, state.battingPlayerId];
    state.innings = 2;
    beginHandCricketMove(state);
    return;
  }

  if (state.innings === 2 && !isOut && reveal.scoreAfter >= state.target) {
    finishHandCricketMatch(room, state.battingPlayerId, "win");
    return;
  }

  if (state.innings === 2 && isOut) {
    if (reveal.scoreAfter === state.target - 1) {
      finishHandCricketMatch(room, null, "tie");
    } else {
      finishHandCricketMatch(room, state.bowlingPlayerId, "win");
    }
    return;
  }

  beginHandCricketMove(state);
}

export function resolveHandCricketMoveTimeout({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "innings") {
    return { room, changed: false };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return { room, changed: false };
  }

  if (!state.moveDeadlineAt || Date.now() < state.moveDeadlineAt) {
    return { room, changed: false };
  }

  const activePlayerIds = [state.battingPlayerId, state.bowlingPlayerId];
  let changed = false;

  for (const playerId of activePlayerIds) {
    if (state.currentBallPicks[playerId] === undefined) {
      state.currentBallPicks[playerId] = getRandomTimeoutHandCricketNumber();
      changed = true;
    }
  }

  if (Object.keys(state.currentBallPicks).length === HAND_CRICKET_CLASSIC_PLAYERS) {
    beginHandCricketReveal(state);
    changed = true;
  }

  touch(room);

  return { room, changed };
}

export function resolveHandCricketTossTimeout({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "toss-throw") {
    return { room, changed: false };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return { room, changed: false };
  }

  if (!state.tossDeadlineAt || Date.now() < state.tossDeadlineAt) {
    return { room, changed: false };
  }

  const tossPlayerIds = [state.tossChooserId, state.tossOpponentId].filter(Boolean);

  for (const playerId of tossPlayerIds) {
    if (state.tossPicks[playerId] === undefined) {
      state.tossPicks[playerId] = getRandomTimeoutHandCricketNumber();
    }
  }

  completeHandCricketToss(room);
  touch(room);

  return { room, changed: true };
}

export function resolveHandCricketDecisionTimeout({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "decision") {
    return { room, changed: false };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return { room, changed: false };
  }

  if (!state.decisionDeadlineAt || Date.now() < state.decisionDeadlineAt) {
    return { room, changed: false };
  }

  const winner = findPlayerById(room, state.tossWinnerId);

  if (!winner) {
    return { room, changed: false };
  }

  applyHandCricketDecision(room, winner, "bat");
  touch(room);

  return { room, changed: true };
}

export function resolveHandCricketTeamSelectionTimeout({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "player-selection") {
    return { room, changed: false };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return { room, changed: false };
  }

  if (!state.teamSelectionDeadlineAt || Date.now() < state.teamSelectionDeadlineAt) {
    return { room, changed: false };
  }

  setCurrentTeamPlayers(state);
  state.teamSelectionReady = {
    [state.battingTeam]: true,
    [state.bowlingTeam]: true
  };
  maybeStartHandCricketAfterTeamSelection(state);
  touch(room);

  return { room, changed: true };
}

export function resolveHandCricketCountdown({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "countdown") {
    return { room, changed: false };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return { room, changed: false };
  }

  if (!state.countdownDeadlineAt || Date.now() < state.countdownDeadlineAt) {
    return { room, changed: false };
  }

  beginHandCricketMove(state);
  touch(room);

  return { room, changed: true };
}

export function resolveHandCricketReveal({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.phase !== "ball-reveal") {
    return { room, changed: false };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return { room, changed: false };
  }

  if (!state.revealDeadlineAt || Date.now() < state.revealDeadlineAt) {
    return { room, changed: false };
  }

  completeHandCricketBall(room);
  touch(room);

  return { room, changed: true };
}

export function submitHandCricketNumber({ socketId, roomCode, number }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.handCricket;
  const value = cleanHandCricketNumber(number);

  if (room.gameType !== "hand-cricket" || !state) {
    throw new Error("Hand Cricket is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (state.phase === "toss-throw") {
    const tossPlayerIds = [state.tossChooserId, state.tossOpponentId].filter(Boolean);

    if (!tossPlayerIds.includes(player.playerId)) {
      throw new Error("You are not part of the toss.");
    }

    if (state.tossPicks[player.playerId] !== undefined) {
      throw new Error("You already picked for the toss.");
    }

    state.tossPicks[player.playerId] = value;

    if (tossPlayerIds.every((playerId) => state.tossPicks[playerId] !== undefined)) {
      completeHandCricketToss(room);
    }

    touch(room);
    return room;
  }

  if (state.phase === "innings") {
    if (player.playerId !== state.battingPlayerId && player.playerId !== state.bowlingPlayerId) {
      throw new Error("You are not batting or bowling.");
    }

    if (state.currentBallPicks[player.playerId] !== undefined) {
      throw new Error("You already picked this ball.");
    }

    state.currentBallPicks[player.playerId] = value;

    if (Object.keys(state.currentBallPicks).length === HAND_CRICKET_CLASSIC_PLAYERS) {
      beginHandCricketReveal(state);
    }

    touch(room);
    return room;
  }

  throw new Error("Number selection is not active.");
}

export function callNumber({ socketId, roomCode, number }) {
  const room = requireRoom(roomCode);
  const value = Number(number);
  const currentPlayer = room.players[room.currentTurn];

  if (room.gameType !== "bingo") {
    throw new Error("Number calling is only active for Bingo.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game is not active.");
  }

  if (!currentPlayer || currentPlayer.socketId !== socketId) {
    throw new Error("It is not your turn.");
  }

  return callNumberForPlayer(room, currentPlayer, value);
}

function callNumberForPlayer(room, player, value) {
  const boardSize = getActiveBingoBoardSize(room);
  const maxNumber = boardSize * boardSize;

  if (!Number.isInteger(value) || value < 1 || value > maxNumber) {
    throw new Error(`Choose a number from 1 to ${maxNumber}.`);
  }

  if (room.calledNumbers.includes(value)) {
    throw new Error("That number was already called.");
  }

  room.calledNumbers.push(value);
  room.currentTurn = room.players.length > 0 ? (room.currentTurn + 1) % room.players.length : 0;
  touch(room);

  return {
    room,
    number: value,
    calledBy: player
  };
}

export function callBotNumber({ roomCode, playerId }) {
  const room = requireRoom(roomCode);
  const currentPlayer = room.players[room.currentTurn];

  if (room.gameType !== "bingo") {
    throw new Error("Bot number calling is only active for Bingo.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game is not active.");
  }

  if (!currentPlayer || !currentPlayer.isBot || currentPlayer.playerId !== playerId) {
    throw new Error("It is not this bot's turn.");
  }

  const number = chooseBotNumber(room.boards[currentPlayer.playerId] || [], room.calledNumbers);

  if (!number) {
    throw new Error("No numbers left to call.");
  }

  return callNumberForPlayer(room, currentPlayer, number);
}

export function claimBingo({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game is not active.");
  }

  const board = room.boards[player.playerId];
  const boardSize = getActiveBingoBoardSize(room);
  const completedLines = countCompletedLines(board, room.calledNumbers, boardSize);
  const requiredLines = boardSize;

  if (completedLines < requiredLines) {
    return {
      room,
      completedLines,
      winner: null,
      valid: false
    };
  }

  room.gameEnded = true;
  room.winner = {
    playerId: player.playerId,
    socketId,
    name: player.name,
    completedLines
  };
  touch(room);

  return {
    room,
    completedLines,
    winner: room.winner,
    valid: true
  };
}

function removePlayerAtIndex(room, leavingIndex) {
  const [player] = room.players.splice(leavingIndex, 1);
  delete room.boards[player.playerId];

  if (room.players.length === 0 || !room.players.some((entry) => !entry.isBot)) {
    rooms.delete(room.roomCode);
    return {
      deleted: true,
      roomCode: room.roomCode,
      player
    };
  }

  if (room.host === player.playerId) {
    room.host = room.players.find((entry) => !entry.isBot)?.playerId || room.players[0].playerId;
  }

  if (room.gameType === "hand-cricket" && room.handCricketMode === "team") {
    removePlayerFromHandCricketTeams(room.handCricket, player.playerId);
    syncHandCricketTeams(room);
  }

  if (room.gameType === "tag") {
    delete room.tag?.players?.[player.playerId];
    syncTagPlayers(room);

    if (room.gameStarted && room.players.length < TAG_MIN_PLAYERS) {
      room.gameEnded = true;
      room.tag.phase = "result";
      room.tag.result = {
        loser: null,
        survivors: room.players.map((entry) => ({
          playerId: entry.playerId,
          name: entry.name
        }))
      };
    }
  }

  syncBingoBoardsForRoster(room);

  if (room.currentTurn >= room.players.length) {
    room.currentTurn = 0;
  } else if (leavingIndex < room.currentTurn) {
    room.currentTurn -= 1;
  }

  touch(room);

  return {
    deleted: false,
    room,
    player
  };
}

export function removePlayer(socketId) {
  for (const room of rooms.values()) {
    const leavingIndex = room.players.findIndex((player) => player.socketId === socketId);

    if (leavingIndex !== -1) {
      return removePlayerAtIndex(room, leavingIndex);
    }
  }

  return null;
}

export function markPlayerDisconnected(socketId) {
  for (const room of rooms.values()) {
    const player = findPlayerBySocket(room, socketId);

    if (!player) {
      continue;
    }

    player.connected = false;
    player.socketId = null;
    player.lastSeen = Date.now();
    touch(room);

    return {
      room,
      player
    };
  }

  return null;
}

export function cleanupDisconnectedPlayer({ roomCode, playerId }) {
  const room = rooms.get(cleanRoomCode(roomCode));

  if (!room) {
    return null;
  }

  const playerIndex = room.players.findIndex((player) => player.playerId === playerId);

  if (playerIndex === -1 || room.players[playerIndex].connected) {
    return null;
  }

  return removePlayerAtIndex(room, playerIndex);
}
