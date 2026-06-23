import { countCompletedLines, validateBoard, getBoardSize } from "../gameEngine/index.js";
import { chooseBotNumber, createBotName, generateBotBoard } from "../botPlayer/index.js";
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

const rooms = new Map();
const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const SESSION_TOKEN_BYTES = 32;
const MAX_ACTIVE_ROOMS = Math.max(1, Number(process.env.MAX_ACTIVE_ROOMS || 300));
const MATCH_CHAT_MAX_MESSAGES = 100;
const MATCH_CHAT_MAX_LENGTH = 280;
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
const TAG_ROUND_SECONDS = new Set([60, 90, 120, 180]);
const TAG_WORLD_WIDTH = 2400;
const TAG_WORLD_HEIGHT = 1200;
const TAG_PLAYER_WIDTH = 36;
const TAG_PLAYER_HEIGHT = 42;
const TAG_GRAVITY = 1500;
const TAG_JUMP_VELOCITY = -720;
const TAG_BOUNCE_VELOCITY = -1040;
const TAG_RUN_SPEED = 390;
const TAG_CHASER_SPEED = 420;
const TAG_ACCELERATION = 12000;
const TAG_DECELERATION = 14000;
const TAG_MAX_FALL_SPEED = 1080;
const TAG_PHYSICS_STEP_SECONDS = 1 / 90;
const TAG_COUNTDOWN_MS = 3000;
const TAG_NEW_IT_COOLDOWN_MS = 500;
const TAG_FREED_INVUL_MS = 1200;
const TAG_SPAWN_INVUL_MS = 850;
const TAG_BOUNCE_COOLDOWN_MS = 300;
const TAG_TELEPORT_COOLDOWN_MS = 1200;
const TAG_MIN_TAG_OVERLAP = 14;
const TAG_FLASH_MS = 260;
const GUESS_NUMBER_PLAYERS = 2;
const GUESS_NUMBER_MIN = 1;
const GUESS_NUMBER_DEFAULT_MAX = 100;
const GUESS_NUMBER_MAX_OPTIONS = new Set([100, 250, 500]);
const WORD_GUESS_PLAYERS = 2;
const WORD_GUESS_WORD_LENGTH = 5;
const WORD_GUESS_WORDS_PER_PLAYER = 10;
const WORD_GUESS_MAX_ATTEMPTS = 6;
const WORD_GUESS_GUESS_MS = 60000;
const WORD_GUESS_LOCK_REVEAL_MS = 5000;
const SPY_WORD_MIN_PLAYERS = 3;
const SPY_WORD_MAX_PLAYERS = 10;
const SPY_WORD_TOTAL_ROUNDS = 5;
const SPY_WORD_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const SPY_WORD_PAIRS = {
  easy: [
    { detective: "APPLE", spy: "FRUIT" },
    { detective: "DOCTOR", spy: "HOSPITAL" },
    { detective: "BEACH", spy: "OCEAN" },
    { detective: "CAT", spy: "DOG" },
    { detective: "DOCTOR", spy: "NURSE" },
    { detective: "SCHOOL", spy: "TEACHER" },
    { detective: "RAIN", spy: "UMBRELLA" },
    { detective: "CAR", spy: "ROAD" }
  ],
  medium: [
    { detective: "PIZZA", spy: "BURGER" },
    { detective: "CRICKET", spy: "FOOTBALL" },
    { detective: "TIGER", spy: "LION" },
    { detective: "TRAIN", spy: "BUS" },
    { detective: "PIANO", spy: "GUITAR" },
    { detective: "MANGO", spy: "BANANA" },
    { detective: "RIVER", spy: "LAKE" },
    { detective: "MOVIE", spy: "THEATER" }
  ],
  hard: [
    { detective: "KEYBOARD", spy: "MOUSE" },
    { detective: "COFFEE", spy: "TEA" },
    { detective: "SUN", spy: "MOON" },
    { detective: "LOCK", spy: "KEY" },
    { detective: "CLOCK", spy: "TIME" },
    { detective: "CANDLE", spy: "SHADOW" },
    { detective: "MAP", spy: "COMPASS" },
    { detective: "MIRROR", spy: "GLASS" }
  ]
};
const BOOST_DEFAULT_PLAYERS = 4;
const BOOST_MIN_PLAYERS = 3;
const BOOST_MAX_PLAYERS = 5;
const BOOST_SELECT_MS = 10000;
const BOOST_FALSE_COOLDOWN_MS = 5000;
const BOOST_CATEGORY_TONES = ["coral", "mint", "honey", "ink"];
const BOOST_DEFAULT_CATEGORY_LABELS = [
  "Perambalur",
  "Ariyalur",
  "Trichy",
  "Kovai",
  "Madurai"
];
const RAJA_RANI_PLAYERS = 5;
const RAJA_RANI_TOTAL_ROUNDS = 10;
const RAJA_RANI_REVEAL_MS = 6000;
const RAJA_RANI_ROLES = [
  { id: "raja", label: "Raja", short: "RA", tone: "honey" },
  { id: "rani", label: "Rani", short: "RI", tone: "coral" },
  { id: "police", label: "Police", short: "PO", tone: "mint" },
  { id: "thirudan", label: "Thirudan", short: "TH", tone: "ink" },
  { id: "manthiri", label: "Manthiri", short: "MA", tone: "paper" }
];
const RAJA_RANI_POINTS = {
  correct: {
    raja: 500,
    rani: 400,
    manthiri: 300,
    police: 600,
    thirudan: 0
  },
  wrong: {
    raja: 500,
    rani: 400,
    manthiri: 300,
    police: 0,
    thirudan: 600
  }
};
const RAJA_RANI_TURNS_TURN_MS = 10000;
const RAJA_RANI_TURNS_REVEAL_MS = 6000;
const RAJA_RANI_TURNS_CORRECT_POINTS = 100;
const RAJA_RANI_TURNS_TARGETS = {
  raja: "rani",
  rani: "raja",
  manthiri: "police",
  police: "thirudan",
  thirudan: "police"
};
const TREASURE_HUNT_GRID_SIZE = 10;
const TREASURE_HUNT_BOMB_COUNT = 25;
const TREASURE_HUNT_TREASURE_COUNT = 10;
const TREASURE_HUNT_TURN_MS = 10000;
const TREASURE_HUNT_MIN_PLAYERS = 2;
const TREASURE_HUNT_MAX_PLAYERS = 10;
const TREASURE_HUNT_STARTING_LIVES = 3;
const TREASURE_HUNT_CELL_TYPES = {
  BOMB: "bomb",
  TREASURE: "treasure",
  EMPTY: "empty"
};
const SUPPORTED_GAME_TYPES = new Set([
  "bingo",
  "hand-cricket",
  "tag",
  "guess-number",
  "word-guess",
  "spy-word",
  "boost",
  "treasure-hunt",
  "thirudan-police",
  "raja-rani",
  "raja-rani-turns"
]);
const HAND_CRICKET_MODES = new Set(["classic", "team"]);
const HAND_CRICKET_TEAMS = ["red", "blue"];
const HAND_CRICKET_NUMBERS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

function isThirudanPoliceGameType(gameType) {
  return gameType === "thirudan-police" || gameType === "raja-rani";
}
const WORD_GUESS_WORD_BANK = [
  "ABOUT",
  "ADAPT",
  "ADMIT",
  "ADORE",
  "AGILE",
  "ALARM",
  "ALBUM",
  "ALERT",
  "ALIVE",
  "ALLOY",
  "AMBER",
  "AMPLE",
  "ANGLE",
  "APPLE",
  "APRON",
  "ARENA",
  "ARGUE",
  "ARISE",
  "ARMOR",
  "ASIDE",
  "ATLAS",
  "AUDIO",
  "AWARD",
  "BASIC",
  "BEACH",
  "BEARD",
  "BLEND",
  "BLOCK",
  "BLOOM",
  "BOARD",
  "BRAIN",
  "BRAND",
  "BRAVE",
  "BREAD",
  "BRICK",
  "BRIDE",
  "BRIEF",
  "BRING",
  "BROAD",
  "BROWN",
  "BUILD",
  "CABIN",
  "CABLE",
  "CANDY",
  "CANOE",
  "CARRY",
  "CAUSE",
  "CHAIR",
  "CHARM",
  "CHART",
  "CHECK",
  "CHEST",
  "CHILL",
  "CHIME",
  "CLASP",
  "CLEAN",
  "CLEAR",
  "CLIMB",
  "CLOCK",
  "CLOUD",
  "COACH",
  "COAST",
  "COLOR",
  "COMET",
  "CRAFT",
  "CREAM",
  "CREST",
  "CROWN",
  "DANCE",
  "DECOR",
  "DELTA",
  "DREAM",
  "DRIFT",
  "DRINK",
  "DRIVE",
  "EARTH",
  "EAGER",
  "ELBOW",
  "ELITE",
  "ENJOY",
  "ENTRY",
  "EQUAL",
  "EVENT",
  "FAITH",
  "FANCY",
  "FIELD",
  "FLAME",
  "FLAIR",
  "FLASH",
  "FLEET",
  "FLOOD",
  "FLOOR",
  "FOCUS",
  "FORCE",
  "FORGE",
  "FRAME",
  "FRESH",
  "FRONT",
  "FROST",
  "FRUIT",
  "GLASS",
  "GLOBE",
  "GRACE",
  "GRAIN",
  "GRAND",
  "GRANT",
  "GRAPE",
  "GRAPH",
  "GREEN",
  "GROVE",
  "GUARD",
  "GUEST",
  "GUIDE",
  "HEART",
  "HONEY",
  "HOUSE",
  "HUMAN",
  "HUMOR",
  "IDEAL",
  "IMAGE",
  "INDEX",
  "INNER",
  "INPUT",
  "ISSUE",
  "JOLLY",
  "JUDGE",
  "JUICE",
  "KNIFE",
  "LABEL",
  "LASER",
  "LAYER",
  "LIGHT",
  "LIMIT",
  "LODGE",
  "MAGIC",
  "MAJOR",
  "MANGO",
  "MAPLE",
  "MATCH",
  "METAL",
  "MIGHT",
  "MODEL",
  "MONEY",
  "MOTOR",
  "MOUNT",
  "MUSIC",
  "NOBLE",
  "NORTH",
  "OCEAN",
  "OLIVE",
  "ONION",
  "OPERA",
  "ORBIT",
  "ORDER",
  "PAINT",
  "PANEL",
  "PARTY",
  "PEACE",
  "PEARL",
  "PHONE",
  "PIANO",
  "PIECE",
  "PILOT",
  "PLACE",
  "PLANT",
  "PLATE",
  "POINT",
  "POWER",
  "PRIME",
  "PRINT",
  "PRIZE",
  "PROUD",
  "QUART",
  "QUEEN",
  "QUICK",
  "QUIET",
  "RADIO",
  "RAISE",
  "RANCH",
  "RANGE",
  "RATIO",
  "READY",
  "RIVER",
  "ROUGH",
  "ROUND",
  "ROYAL",
  "SCALE",
  "SCENE",
  "SCOPE",
  "SCORE",
  "SENSE",
  "SHARE",
  "SHARP",
  "SHEET",
  "SHELF",
  "SHIFT",
  "SHINE",
  "SHIRT",
  "SKILL",
  "SLATE",
  "SMART",
  "SMILE",
  "SOLAR",
  "SOUND",
  "SPACE",
  "SPARE",
  "SPICE",
  "STACK",
  "STAGE",
  "STAIR",
  "STAND",
  "STONE",
  "STORE",
  "STORM",
  "STORY",
  "STRIP",
  "STYLE",
  "SUGAR",
  "TABLE",
  "TASTE",
  "TEACH",
  "THEME",
  "THINK",
  "THORN",
  "THOSE",
  "TITLE",
  "TOAST",
  "TONIC",
  "TOUCH",
  "TRACE",
  "TRACK",
  "TRADE",
  "TRAIL",
  "TRAIN",
  "TREND",
  "TRIAL",
  "TRUST",
  "UNION",
  "UNITY",
  "URBAN",
  "VALUE",
  "VIDEO",
  "VITAL",
  "VOICE",
  "WATER",
  "WHEEL",
  "WIDTH",
  "WORLD",
  "WORTH",
  "WRITE",
  "YEARN",
  "YOUTH",
  "ZESTY"
];
const TAG_BOUNDARY_PLATFORMS = [
  { x: 1200, y: 1176, w: 2400, h: 48, wall: true },
  { x: 1200, y: 24, w: 2400, h: 48, wall: true },
  { x: 24, y: 600, w: 48, h: 1200, wall: true },
  { x: 2376, y: 600, w: 48, h: 1200, wall: true }
];
const TAG_MAPS = {
  classic: {
    name: "TAG Playground",
    spawnPoints: [
      { x: 1900, y: 1131 },
      { x: 610, y: 815 },
      { x: 1230, y: 701 },
      { x: 1930, y: 931 }
    ],
    platforms: [
      ...TAG_BOUNDARY_PLATFORMS,
      { x: 70, y: 1000, w: 300, h: 28 },
      { x: 435, y: 1000, w: 410, h: 28 },
      { x: 800, y: 1065, w: 420, h: 150, oneWay: true, slope: "down-right", thickness: 28 },
      { x: 1340, y: 1018, w: 520, h: 28 },
      { x: 1930, y: 966, w: 580, h: 28 },
      { x: 2320, y: 840, w: 290, h: 28, oneWay: true },
      { x: 665, y: 850, w: 690, h: 28, oneWay: true },
      { x: 1230, y: 735, w: 460, h: 28, oneWay: true },
      { x: 1700, y: 725, w: 680, h: 28, oneWay: true },
      { x: 2050, y: 590, w: 410, h: 28, oneWay: true },
      { x: 1460, y: 585, w: 520, h: 28, oneWay: true },
      { x: 850, y: 620, w: 360, h: 28, oneWay: true },
      { x: 265, y: 475, w: 420, h: 28, oneWay: true },
      { x: 730, y: 430, w: 260, h: 28, oneWay: true },
      { x: 1200, y: 395, w: 520, h: 28, oneWay: true },
      { x: 1785, y: 400, w: 400, h: 28, oneWay: true },
      { x: 2190, y: 330, w: 430, h: 28, oneWay: true },
      { x: 2320, y: 190, w: 300, h: 28, oneWay: true },
      { x: 150, y: 360, w: 330, h: 28, oneWay: true },
      { x: 2035, y: 245, w: 280, h: 105, oneWay: true, slope: "down-right", thickness: 28 }
    ],
    bouncePads: [],
    teleporters: [],
    launchers: [],
    movingPlatforms: []
  }
};

const TAG_SPECIAL_LAYOUTS = {
  none: {
    bouncePads: [],
    teleporters: [],
    launchers: [],
    movingPlatforms: []
  },
  jump: {
    bouncePads: [{ x: 1340, y: 996, w: 82, h: 14 }],
    teleporters: [],
    launchers: [],
    movingPlatforms: []
  },
  teleport: {
    bouncePads: [],
    teleporters: [
      { id: "low-left", target: "high-right", x: 95, y: 965, w: 48, h: 68 },
      { id: "high-right", target: "low-left", x: 2180, y: 805, w: 48, h: 68 }
    ],
    launchers: [],
    movingPlatforms: []
  },
  jumpTeleport: {
    bouncePads: [{ x: 850, y: 599, w: 82, h: 14 }],
    teleporters: [
      { id: "low-left", target: "high-right", x: 95, y: 965, w: 48, h: 68 },
      { id: "high-right", target: "low-left", x: 2180, y: 805, w: 48, h: 68 }
    ],
    launchers: [],
    movingPlatforms: []
  }
};

const TAG_SPECIAL_LAYOUT_SEQUENCE = ["none", "none", "jump", "none", "teleport", "jumpTeleport"];

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

function cleanChatText(text) {
  const value = String(text || "").trim().replace(/\s+/g, " ");

  if (!value) {
    throw new Error("Enter a message.");
  }

  if (value.length > MATCH_CHAT_MAX_LENGTH) {
    throw new Error(`Message must be ${MATCH_CHAT_MAX_LENGTH} characters or less.`);
  }

  return value;
}

function cleanDiscoverable(value) {
  return value === true;
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
  const value = String(mapId || "classic").trim().toLowerCase();
  return TAG_MAPS[value] ? value : "classic";
}

function getTagSpecialLayout(layoutId) {
  return TAG_SPECIAL_LAYOUTS[layoutId] || TAG_SPECIAL_LAYOUTS.none;
}

function chooseTagSpecialLayoutId() {
  return TAG_SPECIAL_LAYOUT_SEQUENCE[randomInt(TAG_SPECIAL_LAYOUT_SEQUENCE.length)];
}

function cleanTagRoundSeconds(roundSeconds) {
  const value = Number(roundSeconds || TAG_DEFAULT_ROUND_SECONDS);
  return TAG_ROUND_SECONDS.has(value) ? value : TAG_DEFAULT_ROUND_SECONDS;
}

function cleanBoostMaxPlayers(maxPlayers) {
  const value = Number(maxPlayers || BOOST_DEFAULT_PLAYERS);

  if (!Number.isInteger(value)) {
    return BOOST_DEFAULT_PLAYERS;
  }

  return Math.max(BOOST_MIN_PLAYERS, Math.min(BOOST_MAX_PLAYERS, value));
}

function getBoostDefaultLabel(index) {
  return BOOST_DEFAULT_CATEGORY_LABELS[index] || `Card ${index + 1}`;
}

function cleanBoostCategoryLabel(label, index) {
  const value = String(label || "").trim().replace(/\s+/g, " ").slice(0, 18);
  return value || getBoostDefaultLabel(index);
}

function createBoostCategories(categoryLabels = [], playerCount = BOOST_DEFAULT_PLAYERS) {
  const count = cleanBoostMaxPlayers(playerCount);

  return Array.from({ length: count }, (_entry, index) => {
    const label = cleanBoostCategoryLabel(categoryLabels[index], index);

    return {
      id: `BOOST_${index + 1}`,
      label,
      short: label.slice(0, 1).toUpperCase() || String(index + 1),
      tone: BOOST_CATEGORY_TONES[index % BOOST_CATEGORY_TONES.length]
    };
  });
}

function getBoostCategoryLabels(room) {
  return (room.boost?.categories || createBoostCategories([], room.maxPlayers)).map(
    (category) => category.label
  );
}

function cleanGuessNumberMax(max) {
  const value = Number(max || GUESS_NUMBER_DEFAULT_MAX);
  return GUESS_NUMBER_MAX_OPTIONS.has(value) ? value : GUESS_NUMBER_DEFAULT_MAX;
}

function cleanGuessNumberValue(number, min = GUESS_NUMBER_MIN, max = GUESS_NUMBER_DEFAULT_MAX) {
  const value = Number(number);

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Choose a number from ${min} to ${max}.`);
  }

  return value;
}

function cleanWordGuessValue(word) {
  const value = String(word || "").trim().toUpperCase();

  if (!new RegExp(`^[A-Z]{${WORD_GUESS_WORD_LENGTH}}$`).test(value)) {
    throw new Error(`Choose a ${WORD_GUESS_WORD_LENGTH}-letter word.`);
  }

  return value;
}

function cleanSpyWordMaxPlayers(maxPlayers) {
  const value = Number(maxPlayers || 6);

  if (!Number.isInteger(value)) {
    return 6;
  }

  return Math.max(SPY_WORD_MIN_PLAYERS, Math.min(SPY_WORD_MAX_PLAYERS, value));
}

function cleanSpyWordDifficulty(difficulty) {
  const value = String(difficulty || "easy").trim().toLowerCase();
  return SPY_WORD_DIFFICULTIES.has(value) ? value : "easy";
}

function cleanSpyWordClue(clue) {
  const value = String(clue || "").trim().replace(/\s+/g, " ");

  if (!/^[A-Za-z][A-Za-z-]{0,23}$/.test(value)) {
    throw new Error("Enter one clue word, up to 24 letters.");
  }

  return value.toUpperCase();
}

function cleanSpyWordGuess(guess) {
  const value = String(guess || "").trim().replace(/\s+/g, " ").slice(0, 32);

  if (!value) {
    return "";
  }

  if (!/^[A-Za-z][A-Za-z -]{0,31}$/.test(value)) {
    throw new Error("Enter a word guess using letters only.");
  }

  return value.toUpperCase();
}

function normalizeSpyWordValue(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function shuffleWords(words) {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function createWordGuessWordPacks(players) {
  const shuffled = shuffleWords(WORD_GUESS_WORD_BANK);

  return Object.fromEntries(
    players.map((player, index) => [
      player.playerId,
      shuffled.slice(
        index * WORD_GUESS_WORDS_PER_PLAYER,
        index * WORD_GUESS_WORDS_PER_PLAYER + WORD_GUESS_WORDS_PER_PLAYER
      )
    ])
  );
}

function createWordGuessReplacementPack(state, playerId) {
  const currentPack = new Set(state.wordPacks?.[playerId] || []);
  const blockedWords = new Set(
    Object.entries(state.wordPacks || {})
      .filter(([entryPlayerId]) => entryPlayerId !== playerId)
      .flatMap(([, words]) => words || [])
  );
  const freshWords = WORD_GUESS_WORD_BANK.filter(
    (word) => !blockedWords.has(word) && !currentPack.has(word)
  );
  const fallbackWords = WORD_GUESS_WORD_BANK.filter((word) => !blockedWords.has(word));
  const source = freshWords.length >= WORD_GUESS_WORDS_PER_PLAYER ? freshWords : fallbackWords;

  if (source.length < WORD_GUESS_WORDS_PER_PLAYER) {
    throw new Error("Not enough word cards to shuffle.");
  }

  return shuffleWords(source).slice(0, WORD_GUESS_WORDS_PER_PLAYER);
}

function scoreWordGuess(guess, target) {
  const result = Array.from({ length: WORD_GUESS_WORD_LENGTH }, () => "absent");
  const remaining = {};

  for (let index = 0; index < WORD_GUESS_WORD_LENGTH; index += 1) {
    if (guess[index] === target[index]) {
      result[index] = "correct";
    } else {
      remaining[target[index]] = (remaining[target[index]] || 0) + 1;
    }
  }

  for (let index = 0; index < WORD_GUESS_WORD_LENGTH; index += 1) {
    const letter = guess[index];

    if (result[index] === "correct") {
      continue;
    }

    if (remaining[letter] > 0) {
      result[index] = "present";
      remaining[letter] -= 1;
    }
  }

  return result;
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

  if (gameType === "guess-number") {
    return GUESS_NUMBER_PLAYERS;
  }

  if (gameType === "word-guess") {
    return WORD_GUESS_PLAYERS;
  }

  if (gameType === "spy-word") {
    return cleanSpyWordMaxPlayers(maxPlayers);
  }

  if (gameType === "boost") {
    return cleanBoostMaxPlayers(maxPlayers);
  }

  if (gameType === "treasure-hunt") {
    const value = Number(maxPlayers);
    if (!Number.isInteger(value) || value < TREASURE_HUNT_MIN_PLAYERS || value > TREASURE_HUNT_MAX_PLAYERS) {
      return TREASURE_HUNT_MAX_PLAYERS;
    }
    return value;
  }

  if (isThirudanPoliceGameType(gameType) || gameType === "raja-rani-turns") {
    return RAJA_RANI_PLAYERS;
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
      const index = randomInt(CODE_CHARACTERS.length);
      return CODE_CHARACTERS[index];
    }).join("");
  } while (rooms.has(code));

  return code;
}

function touch(room) {
  room.updatedAt = Date.now();
}

function createSessionToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

function hashSessionToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function verifySessionToken(token, expectedHash) {
  if (!token || !expectedHash) {
    return false;
  }

  const actual = Buffer.from(hashSessionToken(token), "hex");
  const expected = Buffer.from(String(expectedHash), "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
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
  const sessionToken = createSessionToken();
  const player = {
    playerId: randomUUID(),
    sessionTokenHash: hashSessionToken(sessionToken),
    socketId,
    name,
    isBot: false,
    connected: true,
    lastSeen: Date.now()
  };

  Object.defineProperty(player, "sessionToken", {
    configurable: true,
    enumerable: false,
    value: sessionToken
  });

  return player;
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

function consumeSessionToken(player) {
  const sessionToken = player?.sessionToken || null;

  if (player && Object.prototype.hasOwnProperty.call(player, "sessionToken")) {
    delete player.sessionToken;
  }

  return sessionToken;
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

function serializeChatMessage(message) {
  return {
    id: message.id,
    roomCode: message.roomCode,
    playerId: message.playerId,
    playerName: message.playerName,
    text: message.text,
    createdAt: message.createdAt
  };
}

function getSerializedChatMessages(room) {
  return (room.chatMessages || []).map(serializeChatMessage);
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
    teamSelectionRequestedById: null,
    teamSelectionActions: [],
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

function createTagState(phase = "waiting", mapId = "classic", roundSeconds = TAG_DEFAULT_ROUND_SECONDS) {
  return {
    phase,
    mapId: cleanTagMapId(mapId),
    roundSeconds: cleanTagRoundSeconds(roundSeconds),
    countdownStartedAt: null,
    countdownEndAt: null,
    startedAt: null,
    endAt: null,
    lastTickAt: null,
    itPlayerId: null,
    currentItStartedAt: null,
    tagCount: 0,
    lastTagAt: null,
    lastTaggedPlayerId: null,
    specialLayoutId: "none",
    itHistory: [],
    players: {},
    result: null
  };
}

function createGuessNumberState(phase = "waiting", max = GUESS_NUMBER_DEFAULT_MAX) {
  const cleanMax = cleanGuessNumberMax(max);

  return {
    phase,
    min: GUESS_NUMBER_MIN,
    max: cleanMax,
    secrets: {},
    guesses: [],
    startedAt: null,
    endedAt: null
  };
}

function createWordGuessState(phase = "waiting", matchWins = {}) {
  return {
    phase,
    wordLength: WORD_GUESS_WORD_LENGTH,
    wordsPerPlayer: WORD_GUESS_WORDS_PER_PLAYER,
    maxAttempts: WORD_GUESS_MAX_ATTEMPTS,
    guessDurationMs: WORD_GUESS_GUESS_MS,
    lockRevealDurationMs: WORD_GUESS_LOCK_REVEAL_MS,
    wordPacks: {},
    selectedWords: {},
    matchWins: { ...matchWins },
    guesses: [],
    round: 0,
    moveId: 0,
    lockStartedAt: null,
    lockDeadlineAt: null,
    roundStartedAt: null,
    roundDeadlineAt: null,
    result: null,
    startedAt: null,
    endedAt: null
  };
}

function createSpyWordState(phase = "waiting", difficulty = "easy") {
  return {
    phase,
    difficulty: cleanSpyWordDifficulty(difficulty),
    totalRounds: SPY_WORD_TOTAL_ROUNDS,
    round: 0,
    turnNumber: 0,
    currentTurnIndex: 0,
    spyPlayerId: null,
    spyPlayerName: null,
    detectiveWord: null,
    spyWord: null,
    clues: [],
    votes: {},
    spyGuess: null,
    result: null,
    moveId: 0,
    startedAt: null,
    endedAt: null
  };
}

function createRajaRaniState(phase = "waiting", scores = {}) {
  return {
    phase,
    totalRounds: RAJA_RANI_TOTAL_ROUNDS,
    revealDurationMs: RAJA_RANI_REVEAL_MS,
    round: 0,
    moveId: 0,
    roles: RAJA_RANI_ROLES.map((role) => ({ ...role })),
    rolesByPlayerId: {},
    scores: { ...scores },
    roundScores: {},
    lastGuess: null,
    history: [],
    cardDeck: [],
    cardPickOrder: [],
    cardPickIndex: 0,
    activePickerId: null,
    activePickerName: null,
    pickedCards: [],
    cardPickStartedAt: null,
    roundStartedAt: null,
    revealStartedAt: null,
    revealDeadlineAt: null,
    startedAt: null,
    endedAt: null
  };
}

function createRajaRaniTurnsState(phase = "waiting", scores = {}) {
  return {
    phase,
    totalRounds: RAJA_RANI_TOTAL_ROUNDS,
    turnDurationMs: RAJA_RANI_TURNS_TURN_MS,
    revealDurationMs: RAJA_RANI_TURNS_REVEAL_MS,
    correctPoints: RAJA_RANI_TURNS_CORRECT_POINTS,
    targets: { ...RAJA_RANI_TURNS_TARGETS },
    round: 0,
    moveId: 0,
    roles: RAJA_RANI_ROLES.map((role) => ({ ...role })),
    rolesByPlayerId: {},
    scores: { ...scores },
    roundScores: {},
    actions: [],
    history: [],
    cardDeck: [],
    cardPickOrder: [],
    cardPickIndex: 0,
    activePickerId: null,
    activePickerName: null,
    pickedCards: [],
    cardPickStartedAt: null,
    currentTurnIndex: 0,
    activePlayerId: null,
    activePlayerName: null,
    turnNumber: 0,
    turnStartedAt: null,
    turnDeadlineAt: null,
    revealStartedAt: null,
    revealDeadlineAt: null,
    roundStartedAt: null,
    startedAt: null,
    endedAt: null
  };
}

function createBoostState(phase = "waiting", categories = createBoostCategories()) {
  const cleanCategories = Array.isArray(categories) && categories.length
    ? categories
    : createBoostCategories();

  return {
    phase,
    categories: cleanCategories,
    targetCount: cleanCategories.length,
    round: 0,
    moveId: 0,
    selectDurationMs: BOOST_SELECT_MS,
    falseBoostCooldownMs: BOOST_FALSE_COOLDOWN_MS,
    selectStartedAt: null,
    selectDeadlineAt: null,
    currentTurnIndex: 0,
    activePlayerId: null,
    activePlayerName: null,
    turnNumber: 0,
    hands: {},
    lastTransfers: {},
    falseBoostCooldowns: {},
    falseBoosts: [],
    winnerCategory: null,
    resultType: null,
    startedAt: null,
    endedAt: null
  };
}

function createTreasureHuntGrid() {
  const grid = Array(TREASURE_HUNT_GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(TREASURE_HUNT_GRID_SIZE)
        .fill(null)
        .map(() => ({
          type: TREASURE_HUNT_CELL_TYPES.EMPTY,
          revealed: false
        }))
    );

  // Place bombs
  let bombsPlaced = 0;
  while (bombsPlaced < TREASURE_HUNT_BOMB_COUNT) {
    const row = Math.floor(Math.random() * TREASURE_HUNT_GRID_SIZE);
    const col = Math.floor(Math.random() * TREASURE_HUNT_GRID_SIZE);
    if (grid[row][col].type === TREASURE_HUNT_CELL_TYPES.EMPTY) {
      grid[row][col].type = TREASURE_HUNT_CELL_TYPES.BOMB;
      bombsPlaced += 1;
    }
  }

  // Place treasures
  let treasuresPlaced = 0;
  while (treasuresPlaced < TREASURE_HUNT_TREASURE_COUNT) {
    const row = Math.floor(Math.random() * TREASURE_HUNT_GRID_SIZE);
    const col = Math.floor(Math.random() * TREASURE_HUNT_GRID_SIZE);
    if (grid[row][col].type === TREASURE_HUNT_CELL_TYPES.EMPTY) {
      grid[row][col].type = TREASURE_HUNT_CELL_TYPES.TREASURE;
      treasuresPlaced += 1;
    }
  }

  return grid;
}

function createTreasureHuntState() {
  return {
    phase: "playing",
    board: createTreasureHuntGrid(),
    totalBombs: TREASURE_HUNT_BOMB_COUNT,
    totalTreasures: TREASURE_HUNT_TREASURE_COUNT,
    currentPlayerIndex: 0,
    currentTurnCount: 0,
    cellsRevealed: 0,
    treasuresRevealed: 0,
    bombsRevealed: 0,
    turnStartedAt: null,
    turnDeadlineAt: null,
    turnTimeMs: TREASURE_HUNT_TURN_MS,
    winner: null,
    finalStats: [],
    startedAt: null,
    endedAt: null
  };
}

function getTreasureHuntLives(player) {
  if (Number.isInteger(player?.lives)) {
    return Math.max(0, player.lives);
  }

  return Math.max(0, TREASURE_HUNT_STARTING_LIVES - (player?.bombs || 0));
}

function resetTreasureHuntPlayer(player) {
  player.treasures = 0;
  player.bombs = 0;
  player.lives = TREASURE_HUNT_STARTING_LIVES;
  player.missedTurns = 0;
  player.eliminated = false;
}

function changeTreasureHuntLives(player, delta) {
  const nextLives = Math.max(0, getTreasureHuntLives(player) + delta);
  player.lives = nextLives;

  if (nextLives <= 0) {
    player.eliminated = true;
  }

  return nextLives;
}

function getAvailableTreasureHuntCells(state) {
  const cells = [];

  for (let row = 0; row < TREASURE_HUNT_GRID_SIZE; row += 1) {
    for (let col = 0; col < TREASURE_HUNT_GRID_SIZE; col += 1) {
      if (!state.board[row][col].revealed) {
        cells.push({ row, col });
      }
    }
  }

  return cells;
}

function chooseTreasureHuntBotCell(state) {
  const cells = getAvailableTreasureHuntCells(state);

  if (cells.length === 0) {
    return null;
  }

  return cells[Math.floor(Math.random() * cells.length)];
}

function getActiveTreasureHuntPlayers(room) {
  return room.players.filter((player) => !player.eliminated && getTreasureHuntLives(player) > 0);
}

function getNextTreasureHuntPlayerIndex(room, fromIndex) {
  if (room.players.length === 0) {
    return -1;
  }

  for (let offset = 1; offset <= room.players.length; offset += 1) {
    const index = (fromIndex + offset) % room.players.length;

    if (!room.players[index]?.eliminated) {
      return index;
    }
  }

  return -1;
}

function validateTreasureHuntCell(row, col) {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    row >= TREASURE_HUNT_GRID_SIZE ||
    col < 0 ||
    col >= TREASURE_HUNT_GRID_SIZE
  ) {
    throw new Error("Invalid cell coordinates.");
  }
}

function revealTreasureHuntCell(room, currentPlayer, row, col) {
  const state = room.treasureHunt;

  currentPlayer.lives = getTreasureHuntLives(currentPlayer);
  validateTreasureHuntCell(row, col);

  const cell = state.board[row][col];
  if (cell.revealed) {
    throw new Error("Cell already revealed.");
  }

  cell.revealed = true;
  state.cellsRevealed += 1;

  const resultType = cell.type;
  let message = "";

  if (cell.type === TREASURE_HUNT_CELL_TYPES.TREASURE) {
    currentPlayer.treasures = (currentPlayer.treasures || 0) + 1;
    const livesLeft = changeTreasureHuntLives(currentPlayer, 1);
    state.treasuresRevealed += 1;
    message = `Found a diamond! +1 life (${livesLeft} lives)`;
  } else if (cell.type === TREASURE_HUNT_CELL_TYPES.BOMB) {
    currentPlayer.bombs = (currentPlayer.bombs || 0) + 1;
    state.bombsRevealed += 1;
    const livesLeft = changeTreasureHuntLives(currentPlayer, -1);
    message = `Hit a bomb! -1 life (${livesLeft} left)`;

    if (currentPlayer.eliminated) {
      message = "Eliminated! No lives left";
    }
  } else {
    message = "Empty cell";
  }

  if (shouldEndTreasureHunt(room)) {
    endTreasureHuntGame(room);
  } else {
    advanceTreasureHuntTurn(room);
  }

  touch(room);

  return {
    room,
    cellType: resultType,
    message,
    selection: { row, col },
    player: {
      playerId: currentPlayer.playerId,
      name: currentPlayer.name
    }
  };
}

function advanceTreasureHuntTurn(room, now = Date.now()) {
  const state = room.treasureHunt;
  const nextIndex = getNextTreasureHuntPlayerIndex(room, state.currentPlayerIndex);

  if (nextIndex === -1) {
    endTreasureHuntGame(room);
    return false;
  }

  state.currentPlayerIndex = nextIndex;
  state.currentTurnCount = (state.currentTurnCount || 0) + 1;
  state.turnStartedAt = now;
  state.turnDeadlineAt = now + TREASURE_HUNT_TURN_MS;
  room.currentTurn = nextIndex;

  return true;
}

function shouldEndTreasureHunt(room) {
  const state = room.treasureHunt;
  const activePlayers = getActiveTreasureHuntPlayers(room);

  return activePlayers.length <= 1 || state.treasuresRevealed >= TREASURE_HUNT_TREASURE_COUNT;
}

function shuffleRajaRaniRoles() {
  const roles = RAJA_RANI_ROLES.map((role) => role.id);

  for (let index = roles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [roles[index], roles[swapIndex]] = [roles[swapIndex], roles[index]];
  }

  return roles;
}

function getRajaRaniRole(roleId) {
  return RAJA_RANI_ROLES.find((role) => role.id === roleId) || null;
}

function createRajaRaniScores(players, currentScores = {}) {
  return Object.fromEntries(
    players.map((player) => [player.playerId, Number(currentScores[player.playerId] || 0)])
  );
}

function getRajaRaniPlayerByRole(room, roleId) {
  const state = room.rajaRani;
  const playerId = Object.entries(state?.rolesByPlayerId || {}).find(
    ([, assignedRole]) => assignedRole === roleId
  )?.[0];

  return room.players.find((player) => player.playerId === playerId) || null;
}

function getRajaRaniLeaderboard(room) {
  const scores = room.rajaRani?.scores || {};

  return room.players
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      score: Number(scores[player.playerId] || 0)
    }))
    .sort((first, second) => second.score - first.score || first.name.localeCompare(second.name));
}

function assignRajaRaniRoles(players) {
  const shuffledRoles = shuffleRajaRaniRoles();

  return Object.fromEntries(
    players.map((player, index) => [player.playerId, shuffledRoles[index]])
  );
}

function createRajaRaniRoleDeck() {
  return shuffleRajaRaniRoles().map((roleId, index) => ({
    id: `role-card-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    roleId
  }));
}

function createRajaRaniPickOrder(players, round = 1) {
  if (players.length === 0) {
    return [];
  }

  const startIndex = Math.max(0, (Number(round || 1) - 1) % players.length);

  return players.map((_, index) => players[(startIndex + index) % players.length].playerId);
}

function getRajaRaniActivePicker(room, state) {
  return room.players.find((player) => player.playerId === state.activePickerId) || null;
}

function hasCompleteRajaRaniCardDistribution(room, state) {
  const rolesByPlayerId = state.rolesByPlayerId || {};

  return (
    room.players.length > 0 &&
    room.players.every((player) => Boolean(rolesByPlayerId[player.playerId]))
  );
}

function setRajaRaniActivePicker(room, state, playerId) {
  const activePlayer = room.players.find((player) => player.playerId === playerId) || null;

  state.activePickerId = activePlayer?.playerId || null;
  state.activePickerName = activePlayer?.name || null;
  room.currentTurn = activePlayer
    ? room.players.findIndex((player) => player.playerId === activePlayer.playerId)
    : 0;
}

function beginRajaRaniCardPick(room, state, round) {
  const pickOrder = createRajaRaniPickOrder(room.players, round);

  state.phase = "card-pick";
  state.moveId = (state.moveId || 0) + 1;
  state.round = round;
  state.rolesByPlayerId = {};
  state.cardDeck = createRajaRaniRoleDeck();
  state.cardPickOrder = pickOrder;
  state.cardPickIndex = 0;
  state.pickedCards = [];
  state.cardPickStartedAt = Date.now();
  setRajaRaniActivePicker(room, state, pickOrder[0] || null);
}

function clearRajaRaniCardPick(state) {
  state.cardDeck = [];
  state.cardPickOrder = [];
  state.cardPickIndex = 0;
  state.activePickerId = null;
  state.activePickerName = null;
  state.cardPickStartedAt = null;
}

function getRandomRajaRaniCardId(state) {
  const deck = state.cardDeck || [];

  if (deck.length === 0) {
    return "";
  }

  return deck[Math.floor(Math.random() * deck.length)].id;
}

function completeRajaRaniCardPick(room, state, onComplete) {
  clearRajaRaniCardPick(state);
  onComplete();
}

function processRajaRaniCardPick(room, state, player, cardId, onComplete) {
  if (state.phase !== "card-pick") {
    throw new Error("Card selection is not active.");
  }

  if (state.activePickerId !== player.playerId) {
    throw new Error("It is not your card pick.");
  }

  const selectedCardId = String(cardId || "").trim();
  const cardIndex = (state.cardDeck || []).findIndex((card) => card.id === selectedCardId);

  if (cardIndex < 0) {
    throw new Error("Choose one of the visible cards.");
  }

  const [card] = state.cardDeck.splice(cardIndex, 1);

  state.rolesByPlayerId[player.playerId] = card.roleId;
  state.pickedCards = [
    ...(state.pickedCards || []),
    {
      playerId: player.playerId,
      playerName: player.name,
      cardId: card.id,
      pickNumber: (state.pickedCards || []).length + 1,
      pickedAt: Date.now()
    }
  ];

  if (hasCompleteRajaRaniCardDistribution(room, state)) {
    completeRajaRaniCardPick(room, state, onComplete);
    return {
      completed: true,
      roleId: card.roleId
    };
  }

  state.cardPickIndex = (state.cardPickIndex || 0) + 1;
  setRajaRaniActivePicker(room, state, state.cardPickOrder?.[state.cardPickIndex] || null);
  state.moveId = (state.moveId || 0) + 1;

  return {
    completed: false,
    roleId: card.roleId
  };
}

function autoPickRajaRaniBotCards(room, state, onComplete) {
  let selectedCount = 0;

  while (state.phase === "card-pick") {
    const activePlayer = getRajaRaniActivePicker(room, state);

    if (!activePlayer?.isBot) {
      break;
    }

    const cardId = getRandomRajaRaniCardId(state);

    if (!cardId) {
      break;
    }

    processRajaRaniCardPick(room, state, activePlayer, cardId, onComplete);
    selectedCount += 1;

    if (selectedCount > RAJA_RANI_PLAYERS) {
      break;
    }
  }

  return selectedCount;
}

function beginRajaRaniPoliceTurn(room) {
  const state = room.rajaRani;
  const police = room.players.find((player) => state.rolesByPlayerId[player.playerId] === "police") || null;

  state.phase = "police-turn";
  state.moveId = (state.moveId || 0) + 1;
  state.roundStartedAt = state.roundStartedAt || Date.now();
  room.currentTurn = police ? room.players.findIndex((player) => player.playerId === police.playerId) : 0;
}

function startRajaRaniRound(room, round = 1) {
  const state = room.rajaRani || createRajaRaniState();

  room.rajaRani = {
    ...state,
    phase: "card-pick",
    round,
    moveId: state.moveId || 0,
    rolesByPlayerId: {},
    scores: createRajaRaniScores(room.players, state.scores),
    roundScores: {},
    lastGuess: null,
    revealStartedAt: null,
    revealDeadlineAt: null,
    roundStartedAt: Date.now(),
    startedAt: state.startedAt || Date.now()
  };
  beginRajaRaniCardPick(room, room.rajaRani, round);
  autoPickRajaRaniBotCards(room, room.rajaRani, () => beginRajaRaniPoliceTurn(room));
}

function scoreRajaRaniRound(rolesByPlayerId, correct) {
  const pointTable = correct ? RAJA_RANI_POINTS.correct : RAJA_RANI_POINTS.wrong;

  return Object.fromEntries(
    Object.entries(rolesByPlayerId).map(([playerId, roleId]) => [
      playerId,
      pointTable[roleId] || 0
    ])
  );
}

function revealRajaRaniRound(room, police, suspect) {
  const state = room.rajaRani;
  const now = Date.now();
  const thief = getRajaRaniPlayerByRole(room, "thirudan");
  const correct = Boolean(thief && suspect?.playerId === thief.playerId);
  const roundScores = scoreRajaRaniRound(state.rolesByPlayerId, correct);

  for (const [playerId, points] of Object.entries(roundScores)) {
    state.scores[playerId] = Number(state.scores[playerId] || 0) + points;
  }

  state.phase = "reveal";
  state.roundScores = roundScores;
  state.revealStartedAt = now;
  state.revealDeadlineAt = now + RAJA_RANI_REVEAL_MS;
  state.lastGuess = {
    id: `${now}:${police.playerId}:${suspect.playerId}`,
    round: state.round,
    policePlayerId: police.playerId,
    policePlayerName: police.name,
    suspectPlayerId: suspect.playerId,
    suspectPlayerName: suspect.name,
    thiefPlayerId: thief?.playerId || null,
    thiefPlayerName: thief?.name || null,
    correct,
    createdAt: now
  };
  state.history = [
    ...(state.history || []),
    {
      round: state.round,
      rolesByPlayerId: { ...state.rolesByPlayerId },
      roundScores: { ...roundScores },
      guess: { ...state.lastGuess }
    }
  ].slice(-RAJA_RANI_TOTAL_ROUNDS);
}

function finishRajaRaniMatch(room) {
  const state = room.rajaRani;
  const leaderboard = getRajaRaniLeaderboard(room);
  const topScore = leaderboard[0]?.score || 0;
  const tiedPlayerIds = leaderboard
    .filter((entry) => entry.score === topScore)
    .map((entry) => entry.playerId);
  const winner = leaderboard[0] || null;

  state.phase = "complete";
  state.revealDeadlineAt = null;
  state.endedAt = Date.now();
  room.gameEnded = true;
  room.winner = winner
    ? {
        playerId: winner.playerId,
        name: winner.name,
        score: winner.score,
        tiedPlayerIds,
        tied: tiedPlayerIds.length > 1
      }
    : null;
}

function getRajaRaniTurnsLeaderboard(room) {
  const scores = room.rajaRaniTurns?.scores || {};

  return room.players
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      score: Number(scores[player.playerId] || 0)
    }))
    .sort((first, second) => second.score - first.score || first.name.localeCompare(second.name));
}

function createRoundScoreMap(players) {
  return Object.fromEntries(players.map((player) => [player.playerId, 0]));
}

function beginRajaRaniTurnsTurn(room, turnIndex = 0, turnNumber = 1) {
  const state = room.rajaRaniTurns;
  const now = Date.now();
  const playerCount = room.players.length;
  const cleanIndex = playerCount > 0 ? turnIndex % playerCount : 0;
  const activePlayer = room.players[cleanIndex] || null;

  state.phase = "turn";
  state.moveId = (state.moveId || 0) + 1;
  state.currentTurnIndex = cleanIndex;
  state.activePlayerId = activePlayer?.playerId || null;
  state.activePlayerName = activePlayer?.name || null;
  state.turnNumber = turnNumber;
  state.turnStartedAt = now;
  state.turnDeadlineAt = now + RAJA_RANI_TURNS_TURN_MS;
  state.revealStartedAt = null;
  state.revealDeadlineAt = null;
  room.currentTurn = cleanIndex;
}

function beginRajaRaniTurnsPlay(room) {
  beginRajaRaniTurnsTurn(room, 0, 1);
}

function startRajaRaniTurnsRound(room, round = 1) {
  const state = room.rajaRaniTurns || createRajaRaniTurnsState();

  room.rajaRaniTurns = {
    ...state,
    phase: "card-pick",
    round,
    moveId: state.moveId || 0,
    rolesByPlayerId: {},
    scores: createRajaRaniScores(room.players, state.scores),
    roundScores: createRoundScoreMap(room.players),
    actions: [],
    currentTurnIndex: 0,
    activePlayerId: null,
    activePlayerName: null,
    turnNumber: 0,
    turnStartedAt: null,
    turnDeadlineAt: null,
    revealStartedAt: null,
    revealDeadlineAt: null,
    roundStartedAt: Date.now(),
    startedAt: state.startedAt || Date.now()
  };
  beginRajaRaniCardPick(room, room.rajaRaniTurns, round);
  autoPickRajaRaniBotCards(room, room.rajaRaniTurns, () => beginRajaRaniTurnsPlay(room));
}

function revealRajaRaniTurnsRound(room) {
  const state = room.rajaRaniTurns;
  const now = Date.now();

  state.phase = "reveal";
  state.moveId = (state.moveId || 0) + 1;
  state.activePlayerId = null;
  state.activePlayerName = null;
  state.turnDeadlineAt = null;
  state.revealStartedAt = now;
  state.revealDeadlineAt = now + RAJA_RANI_TURNS_REVEAL_MS;
  state.history = [
    ...(state.history || []),
    {
      round: state.round,
      rolesByPlayerId: { ...state.rolesByPlayerId },
      roundScores: { ...state.roundScores },
      actions: (state.actions || []).map((action) => ({ ...action }))
    }
  ].slice(-RAJA_RANI_TOTAL_ROUNDS);
}

function finishRajaRaniTurnsMatch(room) {
  const state = room.rajaRaniTurns;
  const leaderboard = getRajaRaniTurnsLeaderboard(room);
  const topScore = leaderboard[0]?.score || 0;
  const tiedPlayerIds = leaderboard
    .filter((entry) => entry.score === topScore)
    .map((entry) => entry.playerId);
  const winner = leaderboard[0] || null;

  state.phase = "complete";
  state.activePlayerId = null;
  state.activePlayerName = null;
  state.turnDeadlineAt = null;
  state.revealDeadlineAt = null;
  state.endedAt = Date.now();
  room.gameEnded = true;
  room.winner = winner
    ? {
        playerId: winner.playerId,
        name: winner.name,
        score: winner.score,
        tiedPlayerIds,
        tied: tiedPlayerIds.length > 1
      }
    : null;
}

function advanceRajaRaniTurnsAfterAction(room) {
  const state = room.rajaRaniTurns;

  if ((state.turnNumber || 0) >= room.players.length) {
    revealRajaRaniTurnsRound(room);
    return;
  }

  beginRajaRaniTurnsTurn(
    room,
    (state.currentTurnIndex || 0) + 1,
    (state.turnNumber || 0) + 1
  );
}

function addRajaRaniTurnsAction(room, actor, suspect = null, { skipped = false } = {}) {
  const state = room.rajaRaniTurns;
  const now = Date.now();
  const actorRoleBefore = state.rolesByPlayerId[actor.playerId];
  const suspectRoleBefore = suspect ? state.rolesByPlayerId[suspect.playerId] : null;
  const targetRole = RAJA_RANI_TURNS_TARGETS[actorRoleBefore] || null;
  const correct = Boolean(!skipped && suspectRoleBefore && suspectRoleBefore === targetRole);
  const action = {
    id: `${now}:${actor.playerId}:${state.turnNumber || 0}`,
    round: state.round,
    turnNumber: state.turnNumber || 0,
    actorPlayerId: actor.playerId,
    actorPlayerName: actor.name,
    suspectPlayerId: suspect?.playerId || null,
    suspectPlayerName: suspect?.name || null,
    actorRoleBefore,
    suspectRoleBefore,
    targetRole,
    correct,
    skipped,
    swapped: false,
    points: 0,
    actorRoleAfter: actorRoleBefore,
    suspectRoleAfter: suspectRoleBefore,
    createdAt: now
  };

  if (skipped) {
    state.actions.push(action);
    advanceRajaRaniTurnsAfterAction(room);
    return action;
  }

  if (correct) {
    action.points = RAJA_RANI_TURNS_CORRECT_POINTS;
    state.roundScores[actor.playerId] =
      Number(state.roundScores[actor.playerId] || 0) + RAJA_RANI_TURNS_CORRECT_POINTS;
    state.scores[actor.playerId] =
      Number(state.scores[actor.playerId] || 0) + RAJA_RANI_TURNS_CORRECT_POINTS;
  } else {
    state.rolesByPlayerId[actor.playerId] = suspectRoleBefore;
    state.rolesByPlayerId[suspect.playerId] = actorRoleBefore;
    action.swapped = true;
    action.actorRoleAfter = suspectRoleBefore;
    action.suspectRoleAfter = actorRoleBefore;
  }

  state.actions.push(action);
  advanceRajaRaniTurnsAfterAction(room);
  return action;
}

function getBoostRoomCategories(room) {
  return room.boost?.categories?.length ? room.boost.categories : createBoostCategories([], room.maxPlayers);
}

function getBoostRoomTargetCount(room) {
  return getBoostRoomCategories(room).length;
}

function getBoostCategory(room, categoryId) {
  return getBoostRoomCategories(room).find((category) => category.id === categoryId) || getBoostRoomCategories(room)[0];
}

function shuffleBoostDeck(categories) {
  const deck = [];

  for (const category of categories) {
    for (let copy = 1; copy <= categories.length; copy += 1) {
      deck.push({
        id: `${category.id}-${copy}`,
        category: category.id,
        label: category.label,
        short: category.short,
        tone: category.tone
      });
    }
  }

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function countBoostCategories(hand = []) {
  return hand.reduce((counts, card) => {
    counts[card.category] = (counts[card.category] || 0) + 1;
    return counts;
  }, {});
}

function getBoostWinningCategory(hand = [], targetCount = BOOST_DEFAULT_PLAYERS) {
  const counts = countBoostCategories(hand);
  const winningEntry = Object.entries(counts).find(([, count]) => count >= targetCount);

  return winningEntry?.[0] || null;
}

function getRandomBoostCardId(hand = []) {
  if (!hand.length) {
    return "";
  }

  return hand[Math.floor(Math.random() * hand.length)].id;
}

function chooseBoostBotCardId(hand = []) {
  if (!hand.length) {
    return "";
  }

  const counts = countBoostCategories(hand);
  const targetCategory = Object.entries(counts)
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))[0]?.[0];
  const offTargetCard = hand.find((card) => card.category !== targetCategory);

  return (offTargetCard || hand[0]).id;
}

function beginBoostTurn(room, { advance = false } = {}) {
  const state = room.boost;
  const now = Date.now();
  const playerCount = room.players.length;

  if (!state || playerCount === 0) {
    return;
  }

  const previousIndex = Number.isInteger(state.currentTurnIndex) ? state.currentTurnIndex : 0;
  const nextIndex = advance ? (previousIndex + 1) % playerCount : previousIndex % playerCount;
  const activePlayer = room.players[nextIndex];

  if (advance && nextIndex === 0) {
    state.round = (state.round || 0) + 1;
  } else if (!state.round) {
    state.round = 1;
  }

  state.phase = "selecting";
  state.moveId = (state.moveId || 0) + 1;
  state.turnNumber = (state.turnNumber || 0) + 1;
  state.currentTurnIndex = nextIndex;
  room.currentTurn = nextIndex;
  state.activePlayerId = activePlayer?.playerId || null;
  state.activePlayerName = activePlayer?.name || null;
  state.selectStartedAt = now;
  state.selectDeadlineAt = now + BOOST_SELECT_MS;
}

function removeBoostCard(hand, cardId) {
  const index = hand.findIndex((card) => card.id === cardId);

  if (index === -1) {
    return null;
  }

  const [card] = hand.splice(index, 1);
  return card;
}

function finishBoostGame(room, player, categoryId, resultType) {
  const state = room.boost;
  const category = getBoostCategory(room, categoryId);

  state.phase = "result";
  state.winnerCategory = categoryId;
  state.resultType = resultType;
  state.selectDeadlineAt = null;
  state.endedAt = Date.now();
  room.gameEnded = true;
  room.winner = player
    ? {
        playerId: player.playerId,
        name: player.name,
        category: category.id,
        categoryLabel: category.label,
        round: state.round,
        resultType
      }
    : null;
}

function getBoostWinner(room) {
  const state = room.boost;
  const targetCount = getBoostRoomTargetCount(room);

  for (const player of room.players) {
    const categoryId = getBoostWinningCategory(state.hands[player.playerId] || [], targetCount);

    if (categoryId) {
      return {
        player,
        categoryId
      };
    }
  }

  return null;
}

function processBoostDrop(room, player, cardId, { auto = false } = {}) {
  const state = room.boost;

  if (room.gameType !== "boost" || !state || state.phase !== "selecting") {
    return false;
  }

  const now = Date.now();
  const activePlayer = room.players[state.currentTurnIndex] || null;

  if (!activePlayer || activePlayer.playerId !== player.playerId) {
    throw new Error("It is not your turn.");
  }

  if (state.selectDeadlineAt && Date.now() > state.selectDeadlineAt && !auto) {
    throw new Error("Time is up for this turn.");
  }

  const hand = state.hands[player.playerId] || [];
  const selectedCardId = String(cardId || "").trim();

  if (!auto && !hand.some((card) => card.id === selectedCardId)) {
    throw new Error("Choose a card from your hand.");
  }

  const card =
    removeBoostCard(hand, selectedCardId) ||
    removeBoostCard(hand, player.isBot ? chooseBoostBotCardId(hand) : getRandomBoostCardId(hand));

  if (!card) {
    return false;
  }

  const receiverIndex = (state.currentTurnIndex + 1) % room.players.length;
  const receiver = room.players[receiverIndex];

  state.hands[receiver.playerId] = [...(state.hands[receiver.playerId] || []), card];
  state.lastTransfers = {
    ...(state.lastTransfers || {}),
    [player.playerId]: {
      round: state.round,
      turnNumber: state.turnNumber,
      sentCard: card,
      sentToPlayerId: receiver.playerId,
      sentToPlayerName: receiver.name,
      receivedCard: null,
      receivedFromPlayerId: null,
      receivedFromPlayerName: null,
      processedAt: now,
      auto
    },
    [receiver.playerId]: {
      round: state.round,
      turnNumber: state.turnNumber,
      sentCard: null,
      sentToPlayerId: null,
      sentToPlayerName: null,
      receivedCard: card,
      receivedFromPlayerId: player.playerId,
      receivedFromPlayerName: player.name,
      processedAt: now,
      auto
    }
  };
  const winner = getBoostWinner(room);

  if (winner) {
    finishBoostGame(room, winner.player, winner.categoryId, "auto");
    return true;
  }

  beginBoostTurn(room, { advance: true });

  return true;
}

function createBoostHands(players, categories) {
  const deck = shuffleBoostDeck(categories);

  return Object.fromEntries(
    players.map((player, playerIndex) => [
      player.playerId,
      deck.slice(
        playerIndex * categories.length,
        playerIndex * categories.length + categories.length
      )
    ])
  );
}

function startWordGuessRound(room) {
  const state = room.wordGuess;
  const now = Date.now();

  state.phase = "guessing";
  state.round = (state.round || 0) + 1;
  state.moveId = (state.moveId || 0) + 1;
  state.roundStartedAt = now;
  state.roundDeadlineAt = now + WORD_GUESS_GUESS_MS;
}

function getWordGuessRoundEntries(state) {
  return (state.guesses || []).filter((entry) => entry.round === state.round);
}

function getWordGuessPlayerRoundEntry(state, playerId) {
  return getWordGuessRoundEntries(state).find((entry) => entry.playerId === playerId) || null;
}

function createWordGuessTimeoutEntry(room, player, targetPlayer) {
  const state = room.wordGuess;

  return {
    id: `${Date.now()}:${player.playerId}:${state.guesses.length}:timeout`,
    round: state.round,
    playerId: player.playerId,
    playerName: player.name,
    targetPlayerId: targetPlayer?.playerId || null,
    targetPlayerName: targetPlayer?.name || null,
    guess: "",
    feedback: [],
    status: "timeout",
    correct: false,
    createdAt: Date.now()
  };
}

function finishWordGuessRound(room, winner, resultType = "winner") {
  const state = room.wordGuess;
  const now = Date.now();

  state.phase = "result";
  state.endedAt = now;
  state.result = {
    type: resultType,
    round: state.round,
    winnerPlayerId: winner?.playerId || null
  };
  room.gameEnded = true;

  if (winner) {
    state.matchWins[winner.playerId] = (state.matchWins[winner.playerId] || 0) + 1;
    room.winner = {
      playerId: winner.playerId,
      name: winner.name,
      attempts: state.round,
      word: state.selectedWords[getOpponent(room, winner.playerId)?.playerId]
    };
  } else {
    room.winner = {
      playerId: null,
      name: "Draw",
      isDraw: true,
      attempts: state.round
    };
  }
}

function resolveWordGuessRound(room) {
  const state = room.wordGuess;
  const entries = getWordGuessRoundEntries(state);
  const correctEntries = entries.filter((entry) => entry.correct);

  if (correctEntries.length === 1) {
    const winner = findPlayerById(room, correctEntries[0].playerId);
    finishWordGuessRound(room, winner, "winner");
    return;
  }

  if (correctEntries.length > 1) {
    finishWordGuessRound(room, null, "same-round-draw");
    return;
  }

  if (state.round >= WORD_GUESS_MAX_ATTEMPTS) {
    finishWordGuessRound(room, null, "no-solve-draw");
    return;
  }

  startWordGuessRound(room);
}

function chooseSpyWordPair(difficulty) {
  const pairs = SPY_WORD_PAIRS[cleanSpyWordDifficulty(difficulty)] || SPY_WORD_PAIRS.easy;
  return pairs[Math.floor(Math.random() * pairs.length)];
}

function getSpyWordRole(state, playerId) {
  return state.spyPlayerId === playerId ? "spy" : "detective";
}

function startSpyWordMatch(room) {
  const previousDifficulty = room.spyWord?.difficulty || "easy";
  const pair = chooseSpyWordPair(previousDifficulty);
  const spy = room.players[Math.floor(Math.random() * room.players.length)];
  const now = Date.now();

  room.spyWord = {
    ...createSpyWordState("clue", previousDifficulty),
    round: 1,
    turnNumber: 1,
    currentTurnIndex: 0,
    spyPlayerId: spy.playerId,
    spyPlayerName: spy.name,
    detectiveWord: pair.detective,
    spyWord: pair.spy,
    moveId: 1,
    startedAt: now
  };
  room.currentTurn = 0;
}

function beginSpyWordVoting(room) {
  const state = room.spyWord;

  state.phase = "voting";
  state.currentTurnIndex = null;
  state.votes = {};
  state.moveId = (state.moveId || 0) + 1;
  room.currentTurn = 0;
}

function advanceSpyWordTurn(room) {
  const state = room.spyWord;
  const totalTurns = room.players.length * SPY_WORD_TOTAL_ROUNDS;

  if ((state.turnNumber || 0) >= totalTurns) {
    beginSpyWordVoting(room);
    return;
  }

  const nextTurnNumber = (state.turnNumber || 0) + 1;
  const nextIndex = room.players.length > 0 ? (state.currentTurnIndex + 1) % room.players.length : 0;

  state.turnNumber = nextTurnNumber;
  state.currentTurnIndex = nextIndex;
  state.round = Math.floor((nextTurnNumber - 1) / room.players.length) + 1;
  state.moveId = (state.moveId || 0) + 1;
  room.currentTurn = nextIndex;
}

function getSpyWordVoteTally(room) {
  const state = room.spyWord;
  const tally = Object.fromEntries(
    room.players.map((player) => [
      player.playerId,
      {
        playerId: player.playerId,
        name: player.name,
        count: 0,
        voterIds: []
      }
    ])
  );

  for (const [voterId, suspectId] of Object.entries(state.votes || {})) {
    if (!tally[suspectId]) {
      continue;
    }

    tally[suspectId].count += 1;
    tally[suspectId].voterIds.push(voterId);
  }

  return Object.values(tally);
}

function finishSpyWordMatch(room, winnerSide, resultType, extra = {}) {
  const state = room.spyWord || createSpyWordState("result");
  const spyPlayer =
    findPlayerById(room, state.spyPlayerId) ||
    (state.spyPlayerName
      ? {
          playerId: state.spyPlayerId,
          name: state.spyPlayerName
        }
      : null);

  state.phase = "result";
  state.endedAt = Date.now();
  state.result = {
    ...(state.result || {}),
    ...extra,
    type: resultType,
    winnerSide,
    spyPlayerId: state.spyPlayerId,
    spyPlayerName: spyPlayer?.name || state.spyPlayerName || "Player",
    detectiveWord: state.detectiveWord,
    spyWord: state.spyWord
  };
  room.gameEnded = true;
  room.winner =
    winnerSide === "detectives"
      ? {
          playerId: null,
          side: "detectives",
          name: "Detectives",
          resultType
        }
      : {
          playerId: spyPlayer?.playerId || state.spyPlayerId,
          side: "spy",
          name: spyPlayer?.name || "Player",
          spyPlayerName: spyPlayer?.name || state.spyPlayerName || "Player",
          resultType
        };
}

function resolveSpyWordVotes(room) {
  const state = room.spyWord;
  const tally = getSpyWordVoteTally(room);
  const spyVotes = tally.find((entry) => entry.playerId === state.spyPlayerId)?.count || 0;
  const majority = Math.floor(room.players.length / 2) + 1;
  const topCount = Math.max(0, ...tally.map((entry) => entry.count));
  const topVoted = tally.filter((entry) => entry.count === topCount && topCount > 0);
  const tied = topVoted.length !== 1;
  const caughtSpy = spyVotes >= majority;

  state.result = {
    type: caughtSpy ? "caught" : tied ? "tie" : "escaped",
    winnerSide: caughtSpy ? null : "spy",
    caughtSpy,
    majority,
    tied,
    topPlayerIds: topVoted.map((entry) => entry.playerId),
    voteTally: tally,
    detectiveWord: caughtSpy ? null : state.detectiveWord,
    spyWord: caughtSpy ? null : state.spyWord
  };

  if (caughtSpy) {
    state.phase = "spy-guess";
    state.moveId = (state.moveId || 0) + 1;
    return;
  }

  finishSpyWordMatch(room, "spy", state.result.type, state.result);
}

function createTagInput(input = {}) {
  return {
    left: Boolean(input.left),
    right: Boolean(input.right),
    down: Boolean(input.down),
    jump: Boolean(input.jump)
  };
}

function approachNumber(current, target, amount) {
  if (current < target) {
    return Math.min(current + amount, target);
  }

  if (current > target) {
    return Math.max(current - amount, target);
  }

  return target;
}

function rectOverlap(first, second) {
  const x = (first.w + second.w) / 2 - Math.abs(first.x - second.x);
  const y = (first.h + second.h) / 2 - Math.abs(first.y - second.y);

  if (x <= 0 || y <= 0) {
    return null;
  }

  return { x, y };
}

function rectsOverlap(first, second) {
  return Boolean(rectOverlap(first, second));
}

function getTagSlopeSurfaceY(platform, x) {
  const left = platform.x - platform.w / 2;
  const ratio = Math.max(0, Math.min(1, (x - left) / platform.w));
  const highY = platform.y - platform.h / 2;
  const lowY = platform.y + platform.h / 2;

  return platform.slope === "down-left"
    ? lowY + (highY - lowY) * ratio
    : highY + (lowY - highY) * ratio;
}

function playerOverlapsTagSlopeX(player, platform) {
  const halfWidth = TAG_PLAYER_WIDTH / 2;
  return player.x + halfWidth >= platform.x - platform.w / 2 && player.x - halfWidth <= platform.x + platform.w / 2;
}

function tagPlayerRect(player) {
  return {
    x: player.x,
    y: player.y,
    w: TAG_PLAYER_WIDTH,
    h: TAG_PLAYER_HEIGHT
  };
}

function getTagMap(mapId, specialLayoutId = "none") {
  const baseMap = TAG_MAPS[mapId] || TAG_MAPS.classic;
  const specialLayout = getTagSpecialLayout(specialLayoutId);

  return {
    ...baseMap,
    bouncePads: specialLayout.bouncePads || [],
    teleporters: specialLayout.teleporters || [],
    launchers: specialLayout.launchers || [],
    movingPlatforms: specialLayout.movingPlatforms || []
  };
}

function getMovingTagPlatform(platform, now) {
  const periodMs = platform.periodMs || 3000;
  const distance = platform.distance || 0;
  const phase = Math.sin(((now % periodMs) / periodMs) * Math.PI * 2);
  const offset = phase * distance;

  return {
    ...platform,
    x: platform.axis === "x" ? platform.x + offset : platform.x,
    y: platform.axis === "y" ? platform.y + offset : platform.y
  };
}

function getTagPlatforms(map, now) {
  return [
    ...(map.platforms || []),
    ...(map.movingPlatforms || []).map((platform) => getMovingTagPlatform(platform, now))
  ];
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
}

function getNearestTagSpawn(player, map) {
  return (map.spawnPoints || [{ x: TAG_WORLD_WIDTH / 2, y: TAG_WORLD_HEIGHT - 120 }]).reduce(
    (best, spawn) => {
      const bestDistance = Math.abs(best.x - player.x);
      const distance = Math.abs(spawn.x - player.x);
      return distance < bestDistance ? spawn : best;
    }
  );
}

function respawnTagPlayer(player, map, now) {
  const spawn = getNearestTagSpawn(player, map);

  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.invulUntil = now + TAG_SPAWN_INVUL_MS;
  player.teleportCooldownUntil = now + TAG_TELEPORT_COOLDOWN_MS;
  player.bounceCooldownUntil = now + TAG_BOUNCE_COOLDOWN_MS;
  player.launcherCooldownUntil = now + 350;
}

function moveTagPlayer(player, platforms, map, dt, now) {
  const input = player.input || createTagInput();
  const speed = player.isIt ? TAG_CHASER_SPEED : TAG_RUN_SPEED;
  const wasGrounded = player.grounded;
  const targetVx = input.left === input.right ? 0 : input.left ? -speed : speed;

  player.vx = approachNumber(
    player.vx,
    targetVx,
    (targetVx === 0 ? TAG_DECELERATION : TAG_ACCELERATION) * dt
  );

  if (input.down && input.jump && !player.jumpWasDown && wasGrounded) {
    player.dropThroughUntil = now + 220;
    player.grounded = false;
    player.y += 6;
  } else if (input.jump && !player.jumpWasDown && wasGrounded) {
    player.vy = TAG_JUMP_VELOCITY;
    player.grounded = false;
  }

  player.jumpWasDown = input.jump;
  player.vy = Math.min(player.vy + TAG_GRAVITY * dt, TAG_MAX_FALL_SPEED);

  const previousX = player.x;
  player.x += player.vx * dt;

  for (const platform of platforms) {
    if (platform.oneWay || platform.slope) {
      continue;
    }

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

  for (const platform of platforms) {
    if (platform.slope) {
      if (!playerOverlapsTagSlopeX(player, platform)) {
        continue;
      }

      const surfaceY = getTagSlopeSurfaceY(platform, player.x);
      const previousBottom = previousY + TAG_PLAYER_HEIGHT / 2;
      const currentBottom = player.y + TAG_PLAYER_HEIGHT / 2;
      const droppingThrough = platform.oneWay && now < (player.dropThroughUntil || 0);
      const landingReach = Math.max(30, Math.abs(player.vy) * dt + 12);

      if (
        !droppingThrough &&
        player.vy >= 0 &&
        previousBottom <= surfaceY + 22 &&
        currentBottom >= surfaceY - landingReach &&
        currentBottom <= surfaceY + landingReach
      ) {
        player.y = surfaceY - TAG_PLAYER_HEIGHT / 2;
        player.vy = 0;
        player.grounded = true;
      }

      continue;
    }

    const overlap = rectOverlap(tagPlayerRect(player), platform);

    if (!overlap) {
      continue;
    }

    const previousBottom = previousY + TAG_PLAYER_HEIGHT / 2;
    const previousTop = previousY - TAG_PLAYER_HEIGHT / 2;
    const platformTop = platform.y - platform.h / 2;
    const platformBottom = platform.y + platform.h / 2;
    const droppingThrough = platform.oneWay && now < (player.dropThroughUntil || 0);

    if (platform.oneWay && (droppingThrough || player.vy < 0 || previousBottom > platformTop + 4)) {
      continue;
    }

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

  if (player.y > TAG_WORLD_HEIGHT + TAG_PLAYER_HEIGHT) {
    respawnTagPlayer(player, map, now);
  }
}

function applyTagSpecialObjects(player, map, now) {
  for (const pad of map.bouncePads || []) {
    if (
      now >= (player.bounceCooldownUntil || 0) &&
      rectsOverlap(tagPlayerRect(player), pad) &&
      player.vy >= 0
    ) {
      player.vy = TAG_BOUNCE_VELOCITY;
      player.grounded = false;
      player.bounceCooldownUntil = now + TAG_BOUNCE_COOLDOWN_MS;
      player.flashUntil = Math.max(player.flashUntil || 0, now + 120);
    }
  }

  for (const launcher of map.launchers || []) {
    if (now >= (player.launcherCooldownUntil || 0) && rectsOverlap(tagPlayerRect(player), launcher)) {
      player.vx = launcher.vx || 0;
      player.vy = launcher.vy || TAG_JUMP_VELOCITY;
      player.grounded = false;
      player.launcherCooldownUntil = now + 450;
      player.flashUntil = Math.max(player.flashUntil || 0, now + 140);
    }
  }

  if (player.teleportCooldownUntil && now < player.teleportCooldownUntil) {
    return;
  }

  const teleporter = (map.teleporters || []).find((entry) => rectsOverlap(tagPlayerRect(player), entry));

  if (!teleporter) {
    return;
  }

  const target = (map.teleporters || []).find((entry) => entry.id === teleporter.target);

  if (!target) {
    return;
  }

  player.x = target.x;
  player.y = target.y - 50;
  player.vx = Math.abs(player.vx) > 80 ? player.vx : target.x > teleporter.x ? 220 : -220;
  player.vy = Math.min(player.vy, -260);
  player.teleportCooldownUntil = now + TAG_TELEPORT_COOLDOWN_MS;
  player.flashUntil = Math.max(player.flashUntil || 0, now + 180);
}

function closeCurrentTagHistory(room, now) {
  const state = room.tag;

  if (!state?.itPlayerId || !state.currentItStartedAt) {
    return;
  }

  const endAt = Math.max(now, state.currentItStartedAt);

  state.itHistory.push({
    playerId: state.itPlayerId,
    startAt: state.currentItStartedAt,
    endAt,
    durationMs: endAt - state.currentItStartedAt
  });
  state.currentItStartedAt = null;
}

function getTagDurationTotals(room, now = Date.now()) {
  const totals = Object.fromEntries(room.players.map((player) => [player.playerId, 0]));
  const history = room.tag?.itHistory || [];

  for (const entry of history) {
    totals[entry.playerId] = (totals[entry.playerId] || 0) + Math.max(0, entry.durationMs || 0);
  }

  if (room.tag?.itPlayerId && room.tag.currentItStartedAt) {
    totals[room.tag.itPlayerId] =
      (totals[room.tag.itPlayerId] || 0) + Math.max(0, now - room.tag.currentItStartedAt);
  }

  return totals;
}

function finishTagRound(room, loserId) {
  const now = Date.now();

  closeCurrentTagHistory(room, now);

  const loser = findPlayerById(room, loserId);
  const itDurations = getTagDurationTotals(room, now);
  const ranking = room.players
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      itTimeMs: Math.round(itDurations[player.playerId] || 0),
      isLoser: player.playerId === loserId
    }))
    .sort((first, second) => first.itTimeMs - second.itTimeMs || first.name.localeCompare(second.name));
  const survivors = room.players
    .filter((player) => player.playerId !== loserId)
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      itTimeMs: Math.round(itDurations[player.playerId] || 0)
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
    survivors,
    ranking,
    tagCount: room.tag.tagCount,
    itDurations
  };
}

function syncTagPlayers(room) {
  if (room.gameType !== "tag" || !room.tag) {
    return;
  }

  const map = getTagMap(room.tag.mapId, room.tag.specialLayoutId);
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
      tagCooldownUntil: 0,
      invulUntil: Date.now() + TAG_SPAWN_INVUL_MS,
      flashUntil: 0,
      teleportCooldownUntil: 0,
      bounceCooldownUntil: 0,
      launcherCooldownUntil: 0,
      dropThroughUntil: 0
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
  room.tag.specialLayoutId = chooseTagSpecialLayoutId();
  const map = getTagMap(room.tag.mapId, room.tag.specialLayoutId);
  const chaserIndex = Math.floor(Math.random() * room.players.length);
  const chaser = room.players[chaserIndex];

  room.tag.phase = "countdown";
  room.tag.countdownStartedAt = now;
  room.tag.countdownEndAt = now + TAG_COUNTDOWN_MS;
  room.tag.startedAt = null;
  room.tag.endAt = null;
  room.tag.lastTickAt = now;
  room.tag.itPlayerId = chaser.playerId;
  room.tag.currentItStartedAt = null;
  room.tag.tagCount = 0;
  room.tag.lastTagAt = null;
  room.tag.lastTaggedPlayerId = null;
  room.tag.itHistory = [];
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
      tagCooldownUntil: 0,
      invulUntil: now + TAG_SPAWN_INVUL_MS,
      flashUntil: 0,
      teleportCooldownUntil: 0,
      bounceCooldownUntil: 0,
      launcherCooldownUntil: 0,
      dropThroughUntil: 0
    };
  });
}

function beginTagPlaying(room, now) {
  room.tag.phase = "playing";
  room.tag.startedAt = now;
  room.tag.endAt = now + room.tag.roundSeconds * 1000;
  room.tag.lastTickAt = now;
  room.tag.currentItStartedAt = now;

  for (const player of Object.values(room.tag.players)) {
    player.isIt = player.playerId === room.tag.itPlayerId;
    player.invulUntil = 0;
    player.tagCooldownUntil = player.isIt ? now + 250 : 0;
  }
}

function transferTag(room, nextItPlayerId, now) {
  const previousItPlayerId = room.tag.itPlayerId;
  const previousIt = room.tag.players[previousItPlayerId];
  const nextIt = room.tag.players[nextItPlayerId];

  if (!nextIt || nextItPlayerId === previousItPlayerId) {
    return;
  }

  closeCurrentTagHistory(room, now);
  room.tag.itPlayerId = nextItPlayerId;
  room.tag.currentItStartedAt = now;
  room.tag.tagCount += 1;
  room.tag.lastTagAt = now;
  room.tag.lastTaggedPlayerId = nextItPlayerId;

  for (const player of Object.values(room.tag.players)) {
    player.isIt = player.playerId === nextItPlayerId;
  }

  nextIt.tagCooldownUntil = now + TAG_NEW_IT_COOLDOWN_MS;
  nextIt.invulUntil = 0;
  nextIt.flashUntil = now + TAG_FLASH_MS;
  nextIt.vy = Math.min(nextIt.vy, -190);

  if (previousIt) {
    previousIt.invulUntil = now + TAG_FREED_INVUL_MS;
    previousIt.flashUntil = now + TAG_FLASH_MS;
  }
}

function processTagCollisions(room, players, now) {
  const chaser = room.tag.players[room.tag.itPlayerId];

  if (!chaser || now < (chaser.tagCooldownUntil || 0)) {
    return;
  }

  const chaserRect = tagPlayerRect(chaser);
  const candidates = players
    .filter((runner) => runner.playerId !== chaser.playerId && now >= (runner.invulUntil || 0))
    .map((runner) => {
      const overlap = rectOverlap(chaserRect, tagPlayerRect(runner));

      return {
        runner,
        overlap,
        distance:
          Math.hypot(chaser.x - runner.x, chaser.y - runner.y)
      };
    })
    .filter((candidate) => candidate.overlap && Math.min(candidate.overlap.x, candidate.overlap.y) >= TAG_MIN_TAG_OVERLAP)
    .sort((first, second) => first.distance - second.distance);

  if (candidates[0]) {
    transferTag(room, candidates[0].runner.playerId, now);
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
  state.teamSelectionRequestedById = null;
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

function switchHandCricketTeamInnings(state) {
  [state.battingTeam, state.bowlingTeam] = [state.bowlingTeam, state.battingTeam];
  state.currentBatsmanIndex = 0;
  state.currentBowlerIndex = 0;
  state.outPlayerIds = [];
  setTeamCaptainsAsCurrentPlayers(state);
  state.innings = 2;
}

function getHandCricketTeamSelectionDuration(reason) {
  if (reason === "change") {
    return HAND_CRICKET_TEAM_SELECTION_START_MS;
  }

  if (reason === "wicket") {
    return HAND_CRICKET_TEAM_SELECTION_WICKET_MS;
  }

  if (reason === "switch") {
    return HAND_CRICKET_TEAM_SELECTION_SWITCH_MS;
  }

  return HAND_CRICKET_TEAM_SELECTION_START_MS;
}

function beginHandCricketTeamSelection(
  state,
  { countdownRequired = false, reason = "switch", requestedById = null } = {}
) {
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
  state.teamSelectionRequestedById = requestedById;
  state.teamSelectionActions = [];
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

function addHandCricketTeamSelectionAction(state, { captainId, playerId, role, team }) {
  const action = {
    id: `${Date.now()}:${captainId}:${playerId}:${role}`,
    captainId,
    playerId,
    role,
    team,
    createdAt: Date.now()
  };

  state.teamSelectionActions = [...(state.teamSelectionActions || []), action].slice(-4);
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
  const itDurations = getTagDurationTotals(room, now);
  const map = getTagMap(state.mapId, state.specialLayoutId);

  return {
    phase: state.phase,
    mapId: state.mapId,
    roundSeconds: state.roundSeconds,
    specialLayoutId: state.specialLayoutId || "none",
    specials: {
      bouncePads: map.bouncePads || [],
      teleporters: map.teleporters || [],
      launchers: map.launchers || [],
      movingPlatforms: map.movingPlatforms || []
    },
    world: {
      width: TAG_WORLD_WIDTH,
      height: TAG_WORLD_HEIGHT
    },
    countdownLeftMs:
      state.phase === "countdown" && state.countdownEndAt
        ? Math.max(0, state.countdownEndAt - now)
        : 0,
    timeLeftMs:
      state.phase === "playing" && state.endAt
        ? Math.max(0, state.endAt - now)
        : state.roundSeconds * 1000,
    itPlayerId: state.itPlayerId,
    tagCount: state.tagCount || 0,
    lastTagAt: state.lastTagAt,
    lastTaggedPlayerId: state.lastTaggedPlayerId,
    itDurations,
    players: Object.values(state.players || {}).map((player) => ({
      playerId: player.playerId,
      name: player.name,
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: Math.round(player.vx),
      vy: Math.round(player.vy),
      isIt: player.playerId === state.itPlayerId,
      grounded: Boolean(player.grounded),
      invulMs: Math.max(0, Math.round((player.invulUntil || 0) - now)),
      tagCooldownMs: Math.max(0, Math.round((player.tagCooldownUntil || 0) - now)),
      flash: now < (player.flashUntil || 0)
    })),
    result: state.result
  };
}

function serializeGuessNumber(room) {
  if (room.gameType !== "guess-number") {
    return null;
  }

  const state = room.guessNumber || createGuessNumberState();
  const playersById = Object.fromEntries(room.players.map((player) => [player.playerId, player]));
  const readyPlayerIds = Object.keys(state.secrets || {}).filter((playerId) => playersById[playerId]);
  const revealedSecrets = room.gameEnded
    ? room.players.map((player) => ({
        playerId: player.playerId,
        name: player.name,
        number: state.secrets?.[player.playerId] ?? null
      }))
    : [];

  return {
    phase: state.phase,
    min: state.min || GUESS_NUMBER_MIN,
    max: state.max || GUESS_NUMBER_DEFAULT_MAX,
    readyPlayerIds,
    guesses: [...(state.guesses || [])],
    revealedSecrets,
    startedAt: state.startedAt,
    endedAt: state.endedAt
  };
}

function serializeWordGuess(room, viewerPlayerId = null) {
  if (room.gameType !== "word-guess") {
    return null;
  }

  const state = room.wordGuess || createWordGuessState();
  const playersById = Object.fromEntries(room.players.map((player) => [player.playerId, player]));
  const readyPlayerIds = Object.keys(state.selectedWords || {}).filter((playerId) => playersById[playerId]);
  const viewerWordPack =
    viewerPlayerId && Array.isArray(state.wordPacks?.[viewerPlayerId])
      ? [...state.wordPacks[viewerPlayerId]]
      : [];
  const revealedSecrets = room.gameEnded
    ? room.players.map((player) => ({
        playerId: player.playerId,
        name: player.name,
        word: state.selectedWords?.[player.playerId] ?? null
      }))
    : [];

  return {
    phase: state.phase,
    wordLength: state.wordLength || WORD_GUESS_WORD_LENGTH,
    wordsPerPlayer: state.wordsPerPlayer || WORD_GUESS_WORDS_PER_PLAYER,
    maxAttempts: state.maxAttempts || WORD_GUESS_MAX_ATTEMPTS,
    guessDurationMs: state.guessDurationMs || WORD_GUESS_GUESS_MS,
    lockRevealDurationMs: state.lockRevealDurationMs || WORD_GUESS_LOCK_REVEAL_MS,
    wordPacks: viewerPlayerId ? { [viewerPlayerId]: viewerWordPack } : {},
    matchWins: state.matchWins || {},
    readyPlayerIds,
    guesses: [...(state.guesses || [])],
    revealedSecrets,
    round: state.round || 0,
    moveId: state.moveId || 0,
    lockStartedAt: state.lockStartedAt,
    lockDeadlineAt: state.lockDeadlineAt,
    roundStartedAt: state.roundStartedAt,
    roundDeadlineAt: state.roundDeadlineAt,
    result: state.result,
    startedAt: state.startedAt,
    endedAt: state.endedAt
  };
}

function serializeSpyWord(room, viewerPlayerId = null) {
  if (room.gameType !== "spy-word") {
    return null;
  }

  const state = room.spyWord || createSpyWordState();
  const revealed = room.gameEnded || state.phase === "result";
  const viewerRole = viewerPlayerId ? getSpyWordRole(state, viewerPlayerId) : null;
  const viewerWord =
    viewerRole === "spy"
      ? state.spyWord
      : viewerRole === "detective"
        ? state.detectiveWord
        : null;
  const activePlayer = Number.isInteger(state.currentTurnIndex)
    ? room.players[state.currentTurnIndex] || null
    : null;
  const votes = state.votes || {};
  const readyVoterIds = Object.keys(votes).filter((playerId) =>
    room.players.some((player) => player.playerId === playerId)
  );
  const votersByTarget = Object.fromEntries(room.players.map((player) => [player.playerId, []]));

  if (revealed) {
    for (const [voterId, suspectId] of Object.entries(votes)) {
      if (votersByTarget[suspectId]) {
        votersByTarget[suspectId].push(voterId);
      }
    }
  }

  return {
    phase: state.phase,
    difficulty: state.difficulty || "easy",
    totalRounds: state.totalRounds || SPY_WORD_TOTAL_ROUNDS,
    round: state.round || 0,
    turnNumber: state.turnNumber || 0,
    currentTurnIndex: state.currentTurnIndex,
    activePlayerId: activePlayer?.playerId || null,
    activePlayerName: activePlayer?.name || null,
    viewerRole,
    viewerWord,
    detectiveWord: revealed ? state.detectiveWord : null,
    spyWord: revealed ? state.spyWord : null,
    spyPlayerId: revealed ? state.spyPlayerId : null,
    spyPlayerName: revealed ? state.spyPlayerName : null,
    clues: (state.clues || []).map((clue) => ({
      ...clue,
      role: revealed ? clue.role : null
    })),
    readyVoterIds,
    myVote: viewerPlayerId ? votes[viewerPlayerId] || null : null,
    votes: revealed
      ? Object.entries(votes).map(([voterId, suspectId]) => {
          const voter = findPlayerById(room, voterId);
          const suspect = findPlayerById(room, suspectId);

          return {
            voterId,
            voterName: voter?.name || "Player",
            suspectId,
            suspectName: suspect?.name || "Player"
          };
        })
      : [],
    voteTally: (state.result?.voteTally || getSpyWordVoteTally(room)).map((entry) => ({
      playerId: entry.playerId,
      name: entry.name,
      count: revealed || state.phase === "spy-guess" ? entry.count : 0,
      voterIds: revealed ? entry.voterIds || [] : votersByTarget[entry.playerId] || []
    })),
    spyGuess: revealed || state.phase === "spy-guess" ? state.spyGuess : null,
    result: revealed || state.phase === "spy-guess" ? state.result : null,
    moveId: state.moveId || 0,
    startedAt: state.startedAt,
    endedAt: state.endedAt
  };
}

function serializeBoost(room, viewerPlayerId = null) {
  if (room.gameType !== "boost") {
    return null;
  }

  const state = room.boost || createBoostState();
  const now = Date.now();
  const categories = getBoostRoomCategories(room);
  const viewerHand = viewerPlayerId ? [...(state.hands?.[viewerPlayerId] || [])] : [];
  const handCounts = Object.fromEntries(
    room.players.map((player) => [player.playerId, (state.hands?.[player.playerId] || []).length])
  );
  const cooldownUntil = viewerPlayerId ? state.falseBoostCooldowns?.[viewerPlayerId] || 0 : 0;

  return {
    phase: state.phase,
    categories,
    targetCount: categories.length,
    round: state.round || 0,
    moveId: state.moveId || 0,
    hand: viewerHand,
    handCounts,
    viewerCounts: countBoostCategories(viewerHand),
    activePlayerId: state.activePlayerId,
    activePlayerName: state.activePlayerName,
    currentTurnIndex: state.currentTurnIndex || 0,
    turnNumber: state.turnNumber || 0,
    selectDurationMs: state.selectDurationMs || BOOST_SELECT_MS,
    selectStartedAt: state.selectStartedAt,
    selectDeadlineAt: state.selectDeadlineAt,
    selectLeftMs:
      state.phase === "selecting" && state.selectDeadlineAt
        ? Math.max(0, state.selectDeadlineAt - now)
        : 0,
    lastTransfer: viewerPlayerId ? state.lastTransfers?.[viewerPlayerId] || null : null,
    falseBoostCooldownMs: state.falseBoostCooldownMs || BOOST_FALSE_COOLDOWN_MS,
    falseBoostCooldownUntil: cooldownUntil,
    falseBoostCooldownLeftMs: Math.max(0, cooldownUntil - now),
    falseBoosts: [...(state.falseBoosts || [])].slice(-6),
    winnerCategory: state.winnerCategory,
    resultType: state.resultType,
    startedAt: state.startedAt,
    endedAt: state.endedAt
  };
}

function serializeRajaRaniCardPick(room, state, viewerPlayerId = null) {
  if (state.phase !== "card-pick") {
    return null;
  }

  const pickedPlayerIds = new Set((state.pickedCards || []).map((pick) => pick.playerId));

  return {
    activePlayerId: state.activePickerId || null,
    activePlayerName: state.activePickerName || null,
    cards: (state.cardDeck || []).map((card, index) => ({
      id: card.id,
      position: index + 1
    })),
    remainingCount: (state.cardDeck || []).length,
    totalCount: room.players.length,
    pickNumber: (state.cardPickIndex || 0) + 1,
    isViewerTurn: viewerPlayerId === state.activePickerId,
    viewerHasPicked: viewerPlayerId ? pickedPlayerIds.has(viewerPlayerId) : false,
    pickedPlayers: (state.pickedCards || []).map((pick) => ({
      playerId: pick.playerId,
      playerName: pick.playerName,
      pickNumber: pick.pickNumber
    })),
    order: (state.cardPickOrder || []).map((playerId, index) => {
      const player = room.players.find((entry) => entry.playerId === playerId);

      return {
        playerId,
        playerName: player?.name || "Player",
        pickNumber: index + 1,
        picked: pickedPlayerIds.has(playerId),
        active: playerId === state.activePickerId
      };
    })
  };
}

function serializeRajaRani(room, viewerPlayerId = null) {
  if (!isThirudanPoliceGameType(room.gameType)) {
    return null;
  }

  const state = room.rajaRani || createRajaRaniState();
  const now = Date.now();
  const viewerRoleId = viewerPlayerId ? state.rolesByPlayerId?.[viewerPlayerId] || null : null;
  const revealed = state.phase === "reveal" || state.phase === "complete" || room.gameEnded;
  const cardsDistributed = hasCompleteRajaRaniCardDistribution(room, state);
  const canPoliceAct = cardsDistributed && viewerRoleId === "police" && state.phase === "police-turn";
  const police = getRajaRaniPlayerByRole(room, "police");
  const thief = getRajaRaniPlayerByRole(room, "thirudan");
  const leaderboard = getRajaRaniLeaderboard(room);

  return {
    phase: state.phase,
    round: state.round || 0,
    totalRounds: state.totalRounds || RAJA_RANI_TOTAL_ROUNDS,
    moveId: state.moveId || 0,
    roles: state.roles || RAJA_RANI_ROLES,
    viewerRole: viewerRoleId ? getRajaRaniRole(viewerRoleId) : null,
    revealed,
    cardPick: serializeRajaRaniCardPick(room, state, viewerPlayerId),
    cardsDistributed,
    policePlayerId: revealed || canPoliceAct ? police?.playerId || null : null,
    thiefPlayerId: revealed ? thief?.playerId || null : null,
    scores: createRajaRaniScores(room.players, state.scores),
    roundScores: { ...(state.roundScores || {}) },
    leaderboard,
    players: room.players.map((player) => {
      const roleId = state.rolesByPlayerId?.[player.playerId] || null;
      const showRole = revealed || player.playerId === viewerPlayerId;

      return {
        playerId: player.playerId,
        name: player.name,
        role: showRole && roleId ? getRajaRaniRole(roleId) : null,
        score: Number(state.scores?.[player.playerId] || 0),
        roundScore: Number(state.roundScores?.[player.playerId] || 0)
      };
    }),
    suspects:
      cardsDistributed && viewerRoleId === "police" && state.phase === "police-turn"
        ? room.players
            .filter((player) => player.playerId !== viewerPlayerId)
            .map((player) => ({
              playerId: player.playerId,
              name: player.name,
              score: Number(state.scores?.[player.playerId] || 0)
            }))
        : [],
    lastGuess: revealed ? state.lastGuess : null,
    history: [...(state.history || [])],
    revealDurationMs: state.revealDurationMs || RAJA_RANI_REVEAL_MS,
    revealStartedAt: state.revealStartedAt,
    revealDeadlineAt: state.revealDeadlineAt,
    revealLeftMs:
      state.phase === "reveal" && state.revealDeadlineAt
        ? Math.max(0, state.revealDeadlineAt - now)
        : 0,
    startedAt: state.startedAt,
    endedAt: state.endedAt
  };
}

function serializeRajaRaniTurns(room, viewerPlayerId = null) {
  if (room.gameType !== "raja-rani-turns") {
    return null;
  }

  const state = room.rajaRaniTurns || createRajaRaniTurnsState();
  const now = Date.now();
  const viewerRoleId = viewerPlayerId ? state.rolesByPlayerId?.[viewerPlayerId] || null : null;
  const revealed = state.phase === "reveal" || state.phase === "complete" || room.gameEnded;
  const cardsDistributed = hasCompleteRajaRaniCardDistribution(room, state);
  const targetRoleId =
    viewerRoleId && cardsDistributed ? RAJA_RANI_TURNS_TARGETS[viewerRoleId] || null : null;
  const leaderboard = getRajaRaniTurnsLeaderboard(room);

  return {
    phase: state.phase,
    round: state.round || 0,
    totalRounds: state.totalRounds || RAJA_RANI_TOTAL_ROUNDS,
    moveId: state.moveId || 0,
    roles: state.roles || RAJA_RANI_ROLES,
    targets: { ...(state.targets || RAJA_RANI_TURNS_TARGETS) },
    viewerRole: viewerRoleId ? getRajaRaniRole(viewerRoleId) : null,
    viewerTargetRole: targetRoleId ? getRajaRaniRole(targetRoleId) : null,
    revealed,
    cardPick: serializeRajaRaniCardPick(room, state, viewerPlayerId),
    cardsDistributed,
    scores: createRajaRaniScores(room.players, state.scores),
    roundScores: { ...(state.roundScores || {}) },
    leaderboard,
    players: room.players.map((player) => {
      const roleId = state.rolesByPlayerId?.[player.playerId] || null;
      const showRole = revealed || player.playerId === viewerPlayerId;

      return {
        playerId: player.playerId,
        name: player.name,
        role: showRole && roleId ? getRajaRaniRole(roleId) : null,
        score: Number(state.scores?.[player.playerId] || 0),
        roundScore: Number(state.roundScores?.[player.playerId] || 0),
        isActive: player.playerId === state.activePlayerId
      };
    }),
    suspects:
      cardsDistributed && viewerPlayerId === state.activePlayerId && state.phase === "turn"
        ? room.players
            .filter((player) => player.playerId !== viewerPlayerId)
            .map((player) => ({
              playerId: player.playerId,
              name: player.name,
              score: Number(state.scores?.[player.playerId] || 0)
            }))
        : [],
    actions: (state.actions || []).map((action) => {
      if (revealed) {
        return {
          ...action,
          actorRoleBefore: getRajaRaniRole(action.actorRoleBefore),
          suspectRoleBefore: getRajaRaniRole(action.suspectRoleBefore),
          targetRole: getRajaRaniRole(action.targetRole),
          actorRoleAfter: getRajaRaniRole(action.actorRoleAfter),
          suspectRoleAfter: getRajaRaniRole(action.suspectRoleAfter)
        };
      }

      return {
        id: action.id,
        round: action.round,
        turnNumber: action.turnNumber,
        actorPlayerId: action.actorPlayerId,
        actorPlayerName: action.actorPlayerName,
        suspectPlayerId: action.suspectPlayerId,
        suspectPlayerName: action.suspectPlayerName,
        correct: action.correct,
        skipped: action.skipped,
        swapped: action.swapped,
        points: action.points,
        createdAt: action.createdAt
      };
    }),
    history: [...(state.history || [])],
    activePlayerId: state.activePlayerId,
    activePlayerName: state.activePlayerName,
    currentTurnIndex: state.currentTurnIndex || 0,
    turnNumber: state.turnNumber || 0,
    turnDurationMs: state.turnDurationMs || RAJA_RANI_TURNS_TURN_MS,
    turnStartedAt: state.turnStartedAt,
    turnDeadlineAt: state.turnDeadlineAt,
    turnLeftMs:
      state.phase === "turn" && state.turnDeadlineAt
        ? Math.max(0, state.turnDeadlineAt - now)
        : 0,
    revealDurationMs: state.revealDurationMs || RAJA_RANI_TURNS_REVEAL_MS,
    revealStartedAt: state.revealStartedAt,
    revealDeadlineAt: state.revealDeadlineAt,
    revealLeftMs:
      state.phase === "reveal" && state.revealDeadlineAt
        ? Math.max(0, state.revealDeadlineAt - now)
        : 0,
    startedAt: state.startedAt,
    endedAt: state.endedAt
  };
}

function publicPlayer(player, room) {
  return {
    playerId: player.playerId,
    name: player.name,
    isBot: Boolean(player.isBot),
    connected: player.connected,
    isHost: room.host === player.playerId,
    hasBoard: hasValidBingoBoard(room, player),
    ...(room.gameType === "treasure-hunt"
      ? {
          treasures: player.treasures || 0,
          bombs: player.bombs || 0,
          lives: getTreasureHuntLives(player),
          missedTurns: player.missedTurns || 0,
          eliminated: Boolean(player.eliminated)
        }
      : {})
  };
}

function publicSessionPlayer(player, room, sessionToken = null) {
  return {
    ...publicPlayer(player, room),
    ...(sessionToken ? { sessionToken } : {})
  };
}

function publicWinner(winner) {
  if (!winner) {
    return null;
  }

  const { socketId, ...safeWinner } = winner;
  return safeWinner;
}

function serializeTreasureHunt(room) {
  const state = room.treasureHunt;

  if (room.gameType !== "treasure-hunt" || !state) {
    return null;
  }

  return {
    phase: state.phase,
    board: state.board.map((row) =>
      row.map((cell) => ({
        revealed: Boolean(cell.revealed),
        type: cell.revealed ? cell.type : null
      }))
    ),
    totalBombs: state.totalBombs || TREASURE_HUNT_BOMB_COUNT,
    totalTreasures: state.totalTreasures || TREASURE_HUNT_TREASURE_COUNT,
    currentPlayerIndex: state.currentPlayerIndex || 0,
    currentTurnCount: state.currentTurnCount || 0,
    cellsRevealed: state.cellsRevealed || 0,
    treasuresRevealed: state.treasuresRevealed || 0,
    bombsRevealed: state.bombsRevealed || 0,
    turnStartedAt: state.turnStartedAt || null,
    turnDeadlineAt: state.turnDeadlineAt || null,
    turnTimeMs: state.turnTimeMs || TREASURE_HUNT_TURN_MS,
    winner: publicWinner(state.winner),
    finalStats: state.finalStats || [],
    startedAt: state.startedAt || null,
    endedAt: state.endedAt || null
  };
}

export function serializeRoom(room, viewerPlayerId = null) {
  const currentPlayer = room.players[room.currentTurn] || null;
  const hideCurrentPlayer =
    isThirudanPoliceGameType(room.gameType) &&
    room.rajaRani?.phase === "police-turn";

  return {
    roomCode: room.roomCode,
    gameType: room.gameType,
    discoverable: Boolean(room.discoverable),
    handCricketMode: room.handCricketMode,
    handCricketTeamSize: room.handCricketTeamSize,
    roomName: room.roomName,
    host: room.host,
    maxPlayers: room.maxPlayers,
    boardSize: room.boardSize || null,
    players: room.players.map((player) => publicPlayer(player, room)),
    calledNumbers: [...room.calledNumbers],
    currentTurn: hideCurrentPlayer ? null : room.currentTurn,
    currentPlayerId: hideCurrentPlayer ? null : currentPlayer?.playerId || null,
    currentPlayerName: hideCurrentPlayer ? null : currentPlayer?.name || null,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
    winner: publicWinner(room.winner),
    handCricket: serializeHandCricket(room),
    tag: serializeTag(room),
    guessNumber: serializeGuessNumber(room),
    wordGuess: serializeWordGuess(room, viewerPlayerId),
    spyWord: serializeSpyWord(room, viewerPlayerId),
    boost: serializeBoost(room, viewerPlayerId),
    treasureHunt: serializeTreasureHunt(room),
    rajaRani: serializeRajaRani(room, viewerPlayerId),
    rajaRaniTurns: serializeRajaRaniTurns(room, viewerPlayerId)
  };
}

function serializeActiveRoom(room) {
  return {
    roomCode: room.roomCode,
    gameType: room.gameType,
    discoverable: Boolean(room.discoverable),
    handCricketMode: room.handCricketMode,
    handCricketTeamSize: room.handCricketTeamSize,
    tagMapId: room.tag?.mapId || null,
    tagRoundSeconds: room.tag?.roundSeconds || null,
    guessNumberMin: room.guessNumber?.min || null,
    guessNumberMax: room.guessNumber?.max || null,
    spyWordDifficulty: room.spyWord?.difficulty || null,
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
    .filter((room) => !room.gameEnded && room.discoverable)
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .map(serializeActiveRoom);
}

export function createRoom({
  socketId,
  nickname,
  roomName,
  maxPlayers,
  gameType,
  discoverable,
  handCricketMode,
  handCricketTeamSize,
  tagMapId,
  tagRoundSeconds,
  guessNumberMax,
  spyWordDifficulty,
  boostCategoryLabels
}) {
  if (rooms.size >= MAX_ACTIVE_ROOMS) {
    throw new Error("Server is busy. Try creating a room again shortly.");
  }

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
  const cleanGuessNumberMaxValue =
    type === "guess-number" ? cleanGuessNumberMax(guessNumberMax) : null;
  const cleanSpyDifficulty = type === "spy-word" ? cleanSpyWordDifficulty(spyWordDifficulty) : null;
  const boostPlayers = type === "boost" ? cleanBoostMaxPlayers(maxPlayers) : null;
  const boostCategories =
    type === "boost" ? createBoostCategories(boostCategoryLabels, boostPlayers) : null;
  const room = {
    roomCode: code,
    gameType: type,
    discoverable: cleanDiscoverable(discoverable),
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
    chatMessages: [],
    boardSize: null,
    boards: {},
    handCricket: type === "hand-cricket" ? createHandCricketState("waiting", cricketMode) : null,
    tag: type === "tag" ? createTagState("waiting", cleanTagMap, cleanTagRound) : null,
    guessNumber: type === "guess-number" ? createGuessNumberState("waiting", cleanGuessNumberMaxValue) : null,
    wordGuess: type === "word-guess" ? createWordGuessState("waiting") : null,
    spyWord: type === "spy-word" ? createSpyWordState("waiting", cleanSpyDifficulty) : null,
    boost: type === "boost" ? createBoostState("waiting", boostCategories) : null,
    treasureHunt: type === "treasure-hunt" ? createTreasureHuntState() : null,
    rajaRani: isThirudanPoliceGameType(type) ? createRajaRaniState("waiting") : null,
    rajaRaniTurns: type === "raja-rani-turns" ? createRajaRaniTurnsState("waiting") : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  rooms.set(code, room);

  if (cricketMode === "team") {
    assignPlayerToHandCricketTeam(room, player.playerId, "red");
  }

  return {
    room,
    player: publicSessionPlayer(player, room, consumeSessionToken(player))
  };
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

  return {
    room,
    player: publicSessionPlayer(player, room, consumeSessionToken(player))
  };
}

export function getRoomChatMessages({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (!player) {
    throw new Error("You are not in this room.");
  }

  return {
    room,
    messages: getSerializedChatMessages(room)
  };
}

export function sendRoomChatMessage({ socketId, roomCode, text }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);

  if (!player) {
    throw new Error("You are not in this room.");
  }

  const message = {
    id: randomUUID(),
    roomCode: room.roomCode,
    playerId: player.playerId,
    playerName: player.name,
    text: cleanChatText(text),
    createdAt: Date.now()
  };

  room.chatMessages = [...(room.chatMessages || []), message].slice(-MATCH_CHAT_MAX_MESSAGES);
  touch(room);

  return {
    room,
    message: serializeChatMessage(message),
    messages: getSerializedChatMessages(room)
  };
}

export function updateRoomSettings({
  socketId,
  roomCode,
  roomName,
  maxPlayers,
  handCricketTeamSize,
  tagMapId,
  tagRoundSeconds,
  guessNumberMax,
  spyWordDifficulty,
  boostCategoryLabels,
  discoverable
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
        : room.gameType === "guess-number"
          ? GUESS_NUMBER_PLAYERS
        : room.gameType === "word-guess"
          ? WORD_GUESS_PLAYERS
          : room.gameType === "spy-word"
            ? cleanSpyWordMaxPlayers(maxPlayers || room.maxPlayers)
            : room.gameType === "boost"
              ? cleanBoostMaxPlayers(maxPlayers || room.maxPlayers)
              : room.gameType === "treasure-hunt"
                ? (() => {
                    const value = Number(maxPlayers || room.maxPlayers);
                    if (!Number.isInteger(value) || value < TREASURE_HUNT_MIN_PLAYERS || value > TREASURE_HUNT_MAX_PLAYERS) {
                      return room.maxPlayers || TREASURE_HUNT_MAX_PLAYERS;
                    }
                    return value;
                  })()
              : isThirudanPoliceGameType(room.gameType) || room.gameType === "raja-rani-turns"
                ? RAJA_RANI_PLAYERS
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

  if (room.gameType === "guess-number") {
    room.guessNumber = room.guessNumber || createGuessNumberState("waiting");
    room.guessNumber.min = GUESS_NUMBER_MIN;
    room.guessNumber.max = cleanGuessNumberMax(guessNumberMax || room.guessNumber.max);
  }

  if (room.gameType === "boost") {
    room.boost = room.boost || createBoostState("waiting");
    room.boost.categories = createBoostCategories(
      boostCategoryLabels || getBoostCategoryLabels(room),
      nextMaxPlayers
    );
    room.boost.targetCount = nextMaxPlayers;
  }

  if (room.gameType === "spy-word") {
    room.spyWord = room.spyWord || createSpyWordState("waiting");
    room.spyWord.difficulty = cleanSpyWordDifficulty(spyWordDifficulty || room.spyWord.difficulty);
  }

  room.roomName = cleanRoomName(roomName);
  room.discoverable =
    typeof discoverable === "boolean" ? cleanDiscoverable(discoverable) : Boolean(room.discoverable);
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

  if (room.gameType !== "bingo" && room.gameType !== "boost" && room.gameType !== "treasure-hunt") {
    throw new Error("Bots are only available for Bingo, BOOST, and Treasure Hunt right now.");
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

function removeSocketFromOtherRooms(socketId, targetRoomCode, targetPlayerId) {
  if (!socketId) {
    return [];
  }

  const cleanTargetRoomCode = cleanRoomCode(targetRoomCode);
  const removedRooms = [];

  for (const room of [...rooms.values()]) {
    let playerIndex = room.players.findIndex(
      (entry) =>
        entry.socketId === socketId &&
        !(room.roomCode === cleanTargetRoomCode && entry.playerId === targetPlayerId)
    );

    while (playerIndex !== -1) {
      const result = removePlayerAtIndex(room, playerIndex);
      removedRooms.push(result);

      if (result.deleted) {
        break;
      }

      playerIndex = room.players.findIndex(
        (entry) =>
          entry.socketId === socketId &&
          !(room.roomCode === cleanTargetRoomCode && entry.playerId === targetPlayerId)
      );
    }
  }

  return removedRooms;
}

export function resumeSession({ socketId, roomCode, playerId, sessionToken }) {
  const room = requireRoom(roomCode);
  const player = findPlayerById(room, playerId);

  if (!player) {
    throw new Error("Saved session was not found.");
  }

  if (!verifySessionToken(sessionToken, player.sessionTokenHash)) {
    throw new Error("Saved session is no longer valid.");
  }

  const previousSocketId = player.socketId || null;
  const leftRooms = removeSocketFromOtherRooms(socketId, room.roomCode, player.playerId);

  player.socketId = socketId;
  player.connected = true;
  player.lastSeen = Date.now();
  touch(room);

  return {
    room,
    player: publicSessionPlayer(player, room),
    board: room.boards[player.playerId] || [],
    previousSocketId,
    leftRooms
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

  if (room.gameType === "guess-number") {
    if (room.players.length !== GUESS_NUMBER_PLAYERS) {
      throw new Error("Guess Number needs exactly 2 players.");
    }

    room.calledNumbers = [];
    room.currentTurn = 1;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    room.guessNumber = {
      ...createGuessNumberState("secret", room.guessNumber?.max),
      startedAt: Date.now()
    };
    touch(room);

    return room;
  }

  if (room.gameType === "word-guess") {
    if (room.players.length !== WORD_GUESS_PLAYERS) {
      throw new Error("Word Guess needs exactly 2 players.");
    }

    const previousMatchWins = room.wordGuess?.matchWins || {};
    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    room.wordGuess = {
      ...createWordGuessState("selecting", previousMatchWins),
      wordPacks: createWordGuessWordPacks(room.players),
      startedAt: Date.now()
    };
    touch(room);

    return room;
  }

  if (room.gameType === "spy-word") {
    if (
      room.players.length < SPY_WORD_MIN_PLAYERS ||
      room.players.length > SPY_WORD_MAX_PLAYERS
    ) {
      throw new Error(
        `Spy Word needs ${SPY_WORD_MIN_PLAYERS}-${SPY_WORD_MAX_PLAYERS} players.`
      );
    }

    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    startSpyWordMatch(room);
    touch(room);

    return room;
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

  if (room.gameType === "boost") {
    if (room.players.length !== room.maxPlayers) {
      throw new Error(`BOOST needs exactly ${room.maxPlayers} players.`);
    }

    const categories = createBoostCategories(getBoostCategoryLabels(room), room.maxPlayers);
    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    room.boost = {
      ...createBoostState("selecting", categories),
      hands: createBoostHands(room.players, categories),
      startedAt: Date.now()
    };
    beginBoostTurn(room);
    touch(room);

    return room;
  }

  if (isThirudanPoliceGameType(room.gameType)) {
    if (room.players.length !== RAJA_RANI_PLAYERS) {
      throw new Error(`Thirudan Police needs exactly ${RAJA_RANI_PLAYERS} players.`);
    }

    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    room.rajaRani = createRajaRaniState("card-pick");
    startRajaRaniRound(room, 1);
    touch(room);

    return room;
  }

  if (room.gameType === "raja-rani-turns") {
    if (room.players.length !== RAJA_RANI_PLAYERS) {
      throw new Error(`Raja Rani needs exactly ${RAJA_RANI_PLAYERS} players.`);
    }

    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;
    room.rajaRaniTurns = createRajaRaniTurnsState("card-pick");
    startRajaRaniTurnsRound(room, 1);
    touch(room);

    return room;
  }

  if (room.gameType === "treasure-hunt") {
    if (
      room.players.length < TREASURE_HUNT_MIN_PLAYERS ||
      room.players.length > TREASURE_HUNT_MAX_PLAYERS
    ) {
      throw new Error(
        `Treasure Hunt needs ${TREASURE_HUNT_MIN_PLAYERS}-${TREASURE_HUNT_MAX_PLAYERS} players.`
      );
    }

    room.calledNumbers = [];
    room.currentTurn = 0;
    room.gameStarted = true;
    room.gameEnded = false;
    room.winner = null;

    room.players.forEach((player) => {
      resetTreasureHuntPlayer(player);
    });

    const now = Date.now();

    room.treasureHunt = {
      ...createTreasureHuntState(),
      currentTurnCount: 1,
      startedAt: now,
      turnStartedAt: now,
      turnDeadlineAt: now + TREASURE_HUNT_TURN_MS
    };

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

  if (room.gameType === "guess-number") {
    room.guessNumber = createGuessNumberState("waiting", room.guessNumber?.max);
    touch(room);

    return room;
  }

  if (room.gameType === "word-guess") {
    room.wordGuess = createWordGuessState("waiting", room.wordGuess?.matchWins || {});
    touch(room);

    return room;
  }

  if (room.gameType === "spy-word") {
    room.spyWord = createSpyWordState("waiting", room.spyWord?.difficulty || "easy");
    touch(room);

    return room;
  }

  if (room.gameType === "boost") {
    room.boost = createBoostState("waiting", createBoostCategories(getBoostCategoryLabels(room), room.maxPlayers));
    touch(room);

    return room;
  }

  if (room.gameType === "treasure-hunt") {
    room.players.forEach((entry) => {
      resetTreasureHuntPlayer(entry);
    });
    room.treasureHunt = createTreasureHuntState();
    touch(room);

    return room;
  }

  if (isThirudanPoliceGameType(room.gameType)) {
    room.rajaRani = createRajaRaniState("waiting");
    touch(room);

    return room;
  }

  if (room.gameType === "raja-rani-turns") {
    room.rajaRaniTurns = createRajaRaniTurnsState("waiting");
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

function selectBoostCardForPlayer(room, player, cardId) {
  const state = room.boost;

  if (state.phase !== "selecting") {
    throw new Error("Card drop is not active.");
  }

  processBoostDrop(room, player, cardId);
}

export function submitBoostSelection({ socketId, roomCode, cardId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.boost;

  if (room.gameType !== "boost" || !state) {
    throw new Error("BOOST is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game is not active.");
  }

  selectBoostCardForPlayer(room, player, cardId);
  touch(room);

  return room;
}

export function submitBoostBotSelections({ roomCode }) {
  const room = requireRoom(roomCode);
  const state = room.boost;
  let selectedCount = 0;

  if (room.gameType !== "boost" || !state || !room.gameStarted || room.gameEnded) {
    return {
      room,
      selectedCount
    };
  }

  if (state.phase !== "selecting") {
    return {
      room,
      selectedCount
    };
  }

  const activePlayer = room.players[state.currentTurnIndex] || null;

  if (!activePlayer?.isBot) {
    return {
      room,
      selectedCount
    };
  }

  const cardId = chooseBoostBotCardId(state.hands[activePlayer.playerId] || []);

  if (cardId) {
    processBoostDrop(room, activePlayer, cardId);
    selectedCount = 1;
  }

  if (selectedCount > 0) {
    touch(room);
  }

  return {
    room,
    selectedCount
  };
}

export function claimBoost({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.boost;
  const now = Date.now();

  if (room.gameType !== "boost" || !state) {
    throw new Error("BOOST is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game is not active.");
  }

  const cooldownUntil = state.falseBoostCooldowns[player.playerId] || 0;

  if (cooldownUntil > now) {
    return {
      room,
      valid: false,
      cooldownMs: cooldownUntil - now
    };
  }

  const categoryId = getBoostWinningCategory(
    state.hands[player.playerId] || [],
    getBoostRoomTargetCount(room)
  );

  if (categoryId) {
    finishBoostGame(room, player, categoryId, "claim");
    touch(room);

    return {
      room,
      valid: true,
      winner: room.winner
    };
  }

  const nextCooldownUntil = now + BOOST_FALSE_COOLDOWN_MS;
  state.falseBoostCooldowns[player.playerId] = nextCooldownUntil;
  state.falseBoosts = [
    ...(state.falseBoosts || []),
    {
      id: `${now}:${player.playerId}`,
      playerId: player.playerId,
      playerName: player.name,
      round: state.round,
      createdAt: now,
      cooldownUntil: nextCooldownUntil
    }
  ].slice(-8);
  touch(room);

  return {
    room,
    valid: false,
    cooldownMs: BOOST_FALSE_COOLDOWN_MS
  };
}

export function resolveBoostRoundTimeout({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.boost;

  if (room.gameType !== "boost" || !state || !room.gameStarted || room.gameEnded) {
    return {
      room,
      changed: false
    };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return {
      room,
      changed: false
    };
  }

  if (state.phase === "selecting") {
    if (!state.selectDeadlineAt || Date.now() < state.selectDeadlineAt) {
      return {
        room,
        changed: false
      };
    }

    const activePlayer = room.players[state.currentTurnIndex] || null;
    const cardId = activePlayer
      ? activePlayer.isBot
        ? chooseBoostBotCardId(state.hands[activePlayer.playerId] || [])
        : getRandomBoostCardId(state.hands[activePlayer.playerId] || [])
      : "";
    const changed = activePlayer ? processBoostDrop(room, activePlayer, cardId, { auto: true }) : false;
    touch(room);

    return {
      room,
      changed
    };
  }

  return {
    room,
    changed: false
  };
}

export function submitRajaRaniCardPick({ socketId, roomCode, cardId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.rajaRani;

  if (!isThirudanPoliceGameType(room.gameType) || !state) {
    throw new Error("Thirudan Police is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "card-pick") {
    throw new Error("Card selection is not active.");
  }

  const pick = processRajaRaniCardPick(room, state, player, cardId, () => beginRajaRaniPoliceTurn(room));
  autoPickRajaRaniBotCards(room, state, () => beginRajaRaniPoliceTurn(room));
  touch(room);

  return {
    room,
    pick: {
      completed: pick.completed
    }
  };
}

export function submitRajaRaniGuess({ socketId, roomCode, suspectPlayerId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.rajaRani;
  const suspectId = String(suspectPlayerId || "").trim();

  if (!isThirudanPoliceGameType(room.gameType) || !state) {
    throw new Error("Thirudan Police is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "police-turn") {
    throw new Error("Police turn is not active.");
  }

  if (state.rolesByPlayerId[player.playerId] !== "police") {
    throw new Error("Only Police can catch the Thirudan.");
  }

  if (suspectId === player.playerId) {
    throw new Error("Choose one of the other players.");
  }

  const suspect = room.players.find((entry) => entry.playerId === suspectId);

  if (!suspect) {
    throw new Error("Choose a player in this room.");
  }

  revealRajaRaniRound(room, player, suspect);
  touch(room);

  return {
    room,
    guess: state.lastGuess
  };
}

export function resolveRajaRaniReveal({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.rajaRani;

  if (!isThirudanPoliceGameType(room.gameType) || !state || !room.gameStarted || room.gameEnded) {
    return {
      room,
      changed: false
    };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return {
      room,
      changed: false
    };
  }

  if (state.phase !== "reveal" || !state.revealDeadlineAt || Date.now() < state.revealDeadlineAt) {
    return {
      room,
      changed: false
    };
  }

  if ((state.round || 0) >= RAJA_RANI_TOTAL_ROUNDS) {
    finishRajaRaniMatch(room);
  } else {
    startRajaRaniRound(room, (state.round || 0) + 1);
  }

  touch(room);

  return {
    room,
    changed: true
  };
}

export function submitRajaRaniTurnsCardPick({ socketId, roomCode, cardId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.rajaRaniTurns;

  if (room.gameType !== "raja-rani-turns" || !state) {
    throw new Error("Raja Rani is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "card-pick") {
    throw new Error("Card selection is not active.");
  }

  const pick = processRajaRaniCardPick(room, state, player, cardId, () => beginRajaRaniTurnsPlay(room));
  autoPickRajaRaniBotCards(room, state, () => beginRajaRaniTurnsPlay(room));
  touch(room);

  return {
    room,
    pick: {
      completed: pick.completed
    }
  };
}

export function submitRajaRaniTurnsSelection({ socketId, roomCode, suspectPlayerId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.rajaRaniTurns;
  const suspectId = String(suspectPlayerId || "").trim();

  if (room.gameType !== "raja-rani-turns" || !state) {
    throw new Error("Raja Rani is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "turn") {
    throw new Error("Turn is not active.");
  }

  if (state.activePlayerId !== player.playerId) {
    throw new Error("It is not your turn.");
  }

  if (state.turnDeadlineAt && Date.now() > state.turnDeadlineAt) {
    throw new Error("Time is up for this turn.");
  }

  if (suspectId === player.playerId) {
    throw new Error("Choose another player.");
  }

  const suspect = room.players.find((entry) => entry.playerId === suspectId);

  if (!suspect) {
    throw new Error("Choose a player in this room.");
  }

  const action = addRajaRaniTurnsAction(room, player, suspect);
  touch(room);

  return {
    room,
    action
  };
}

export function resolveRajaRaniTurnsTimer({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.rajaRaniTurns;

  if (room.gameType !== "raja-rani-turns" || !state || !room.gameStarted || room.gameEnded) {
    return {
      room,
      changed: false
    };
  }

  if (moveId !== undefined && state.moveId !== moveId) {
    return {
      room,
      changed: false
    };
  }

  if (state.phase === "turn") {
    if (!state.turnDeadlineAt || Date.now() < state.turnDeadlineAt) {
      return {
        room,
        changed: false
      };
    }

    const activePlayer = room.players[state.currentTurnIndex] || null;

    if (activePlayer) {
      addRajaRaniTurnsAction(room, activePlayer, null, { skipped: true });
      touch(room);
    }

    return {
      room,
      changed: Boolean(activePlayer)
    };
  }

  if (state.phase === "reveal") {
    if (!state.revealDeadlineAt || Date.now() < state.revealDeadlineAt) {
      return {
        room,
        changed: false
      };
    }

    if ((state.round || 0) >= RAJA_RANI_TOTAL_ROUNDS) {
      finishRajaRaniTurnsMatch(room);
    } else {
      startRajaRaniTurnsRound(room, (state.round || 0) + 1);
    }

    touch(room);

    return {
      room,
      changed: true
    };
  }

  return {
    room,
    changed: false
  };
}

export function setGuessNumberSecret({ socketId, roomCode, number }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.guessNumber;

  if (room.gameType !== "guess-number" || !state) {
    throw new Error("Guess Number is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "secret") {
    throw new Error("Secret numbers are not being set right now.");
  }

  const value = cleanGuessNumberValue(
    number,
    state.min || GUESS_NUMBER_MIN,
    state.max || GUESS_NUMBER_DEFAULT_MAX
  );

  if (state.secrets[player.playerId] !== undefined) {
    throw new Error("Your secret number is already locked.");
  }

  state.secrets[player.playerId] = value;

  if (room.players.every((entry) => state.secrets[entry.playerId] !== undefined)) {
    state.phase = "guessing";
    room.currentTurn = room.players.length > 1 ? 1 : 0;
  }

  touch(room);

  return room;
}

export function submitGuessNumberGuess({ socketId, roomCode, number }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.guessNumber;
  const currentPlayer = room.players[room.currentTurn];

  if (room.gameType !== "guess-number" || !state) {
    throw new Error("Guess Number is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "guessing") {
    throw new Error("Guessing is not active.");
  }

  if (!currentPlayer || currentPlayer.playerId !== player.playerId) {
    throw new Error("It is not your turn.");
  }

  const value = cleanGuessNumberValue(
    number,
    state.min || GUESS_NUMBER_MIN,
    state.max || GUESS_NUMBER_DEFAULT_MAX
  );

  const opponent = getOpponent(room, player.playerId);

  if (!opponent || state.secrets[opponent.playerId] === undefined) {
    throw new Error("Opponent secret is not ready.");
  }

  const target = state.secrets[opponent.playerId];
  const hint = value === target ? "correct" : value < target ? "low" : "high";
  const guess = {
    id: `${Date.now()}:${player.playerId}:${state.guesses.length}`,
    playerId: player.playerId,
    playerName: player.name,
    targetPlayerId: opponent.playerId,
    targetPlayerName: opponent.name,
    guess: value,
    hint,
    createdAt: Date.now()
  };

  state.guesses.push(guess);

  if (hint === "correct") {
    state.phase = "result";
    state.endedAt = Date.now();
    room.gameEnded = true;
    room.winner = {
      playerId: player.playerId,
      name: player.name,
      guess: value,
      attempts: state.guesses.filter((entry) => entry.playerId === player.playerId).length
    };
  } else {
    room.currentTurn = room.players.length > 0 ? (room.currentTurn + 1) % room.players.length : 0;
  }

  touch(room);

  return {
    room,
    guess
  };
}

export function setWordGuessSecret({ socketId, roomCode, word }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.wordGuess;
  const value = cleanWordGuessValue(word);

  if (room.gameType !== "word-guess" || !state) {
    throw new Error("Word Guess is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "selecting") {
    throw new Error("Words are not being selected right now.");
  }

  if (state.selectedWords[player.playerId] !== undefined) {
    throw new Error("Your word is already locked.");
  }

  if (!(state.wordPacks[player.playerId] || []).includes(value)) {
    throw new Error("Choose one of your word cards.");
  }

  state.selectedWords[player.playerId] = value;

  if (room.players.every((entry) => state.selectedWords[entry.playerId] !== undefined)) {
    const now = Date.now();
    state.phase = "locked";
    state.moveId = (state.moveId || 0) + 1;
    state.lockStartedAt = now;
    state.lockDeadlineAt = now + WORD_GUESS_LOCK_REVEAL_MS;
  }

  touch(room);

  return room;
}

export function shuffleWordGuessWords({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.wordGuess;

  if (room.gameType !== "word-guess" || !state) {
    throw new Error("Word Guess is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "selecting") {
    throw new Error("Words can only be shuffled while selecting.");
  }

  if (state.selectedWords[player.playerId] !== undefined) {
    throw new Error("Your word is already locked.");
  }

  state.wordPacks[player.playerId] = createWordGuessReplacementPack(state, player.playerId);
  state.moveId = (state.moveId || 0) + 1;
  touch(room);

  return room;
}

export function submitWordGuessGuess({ socketId, roomCode, word }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.wordGuess;
  const value = cleanWordGuessValue(word);

  if (room.gameType !== "word-guess" || !state) {
    throw new Error("Word Guess is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "guessing") {
    throw new Error("Guessing is not active.");
  }

  if (state.roundDeadlineAt && Date.now() > state.roundDeadlineAt) {
    throw new Error("Time is up for this guess.");
  }

  if (getWordGuessPlayerRoundEntry(state, player.playerId)) {
    throw new Error("You already guessed this attempt.");
  }

  const opponent = getOpponent(room, player.playerId);

  if (!opponent || state.selectedWords[opponent.playerId] === undefined) {
    throw new Error("Opponent word is not ready.");
  }

  const target = state.selectedWords[opponent.playerId];
  const feedback = scoreWordGuess(value, target);
  const guess = {
    id: `${Date.now()}:${player.playerId}:${state.guesses.length}`,
    round: state.round,
    playerId: player.playerId,
    playerName: player.name,
    targetPlayerId: opponent.playerId,
    targetPlayerName: opponent.name,
    guess: value,
    feedback,
    status: "submitted",
    correct: value === target,
    createdAt: Date.now()
  };

  state.guesses.push(guess);

  if (room.players.every((entry) => getWordGuessPlayerRoundEntry(state, entry.playerId))) {
    resolveWordGuessRound(room);
  }

  touch(room);

  return {
    room,
    guess
  };
}

export function resolveWordGuessTimeout({ roomCode, moveId }) {
  const room = requireRoom(roomCode);
  const state = room.wordGuess;

  if (room.gameType !== "word-guess" || !state || room.gameEnded || state.moveId !== moveId) {
    return {
      room,
      changed: false
    };
  }

  if (state.phase === "locked") {
    if (!state.lockDeadlineAt || Date.now() < state.lockDeadlineAt) {
      return {
        room,
        changed: false
      };
    }

    startWordGuessRound(room);
    touch(room);

    return {
      room,
      changed: true
    };
  }

  if (state.phase === "guessing") {
    if (!state.roundDeadlineAt || Date.now() < state.roundDeadlineAt) {
      return {
        room,
        changed: false
      };
    }

    for (const player of room.players) {
      if (getWordGuessPlayerRoundEntry(state, player.playerId)) {
        continue;
      }

      state.guesses.push(createWordGuessTimeoutEntry(room, player, getOpponent(room, player.playerId)));
    }

    resolveWordGuessRound(room);
    touch(room);

    return {
      room,
      changed: true
    };
  }

  return {
    room,
    changed: false
  };
}

export function submitSpyWordClue({ socketId, roomCode, clue }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.spyWord;
  const value = cleanSpyWordClue(clue);
  const activePlayer = Number.isInteger(state?.currentTurnIndex)
    ? room.players[state.currentTurnIndex] || null
    : null;

  if (room.gameType !== "spy-word" || !state) {
    throw new Error("Spy Word is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "clue") {
    throw new Error("Clue turns are not active.");
  }

  if (!activePlayer || activePlayer.playerId !== player.playerId) {
    throw new Error("It is not your turn.");
  }

  if (
    normalizeSpyWordValue(value) === normalizeSpyWordValue(state.detectiveWord) ||
    normalizeSpyWordValue(value) === normalizeSpyWordValue(state.spyWord)
  ) {
    throw new Error("Your clue cannot be one of the secret words.");
  }

  const now = Date.now();
  const clueEntry = {
    id: `${now}:${player.playerId}:${state.turnNumber}`,
    round: state.round,
    turnNumber: state.turnNumber,
    turnInRound: ((state.turnNumber - 1) % room.players.length) + 1,
    playerId: player.playerId,
    playerName: player.name,
    role: getSpyWordRole(state, player.playerId),
    clue: value,
    createdAt: now
  };

  state.clues.push(clueEntry);
  advanceSpyWordTurn(room);
  touch(room);

  return {
    room,
    clue: clueEntry
  };
}

export function submitSpyWordVote({ socketId, roomCode, suspectPlayerId }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.spyWord;
  const suspectId = String(suspectPlayerId || "").trim();

  if (room.gameType !== "spy-word" || !state) {
    throw new Error("Spy Word is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "voting") {
    throw new Error("Voting is not active.");
  }

  if (state.votes[player.playerId]) {
    throw new Error("Your vote is already locked.");
  }

  if (suspectId === player.playerId) {
    throw new Error("Choose another player.");
  }

  const suspect = findPlayerById(room, suspectId);

  if (!suspect) {
    throw new Error("Choose a player in this room.");
  }

  state.votes[player.playerId] = suspectId;

  if (room.players.every((entry) => state.votes[entry.playerId])) {
    resolveSpyWordVotes(room);
  }

  touch(room);

  return {
    room,
    vote: {
      voterId: player.playerId,
      voterName: player.name,
      suspectId: suspect.playerId,
      suspectName: suspect.name
    }
  };
}

export function submitSpyWordGuess({ socketId, roomCode, guess }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.spyWord;
  const value = cleanSpyWordGuess(guess);

  if (room.gameType !== "spy-word" || !state) {
    throw new Error("Spy Word is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "spy-guess") {
    throw new Error("The final guess is not active.");
  }

  if (player.playerId !== state.spyPlayerId) {
    throw new Error("Only the selected player can make the final guess.");
  }

  const correct =
    value &&
    normalizeSpyWordValue(value) === normalizeSpyWordValue(state.detectiveWord);
  const spyGuess = {
    playerId: player.playerId,
    playerName: player.name,
    guess: value,
    correct: Boolean(correct),
    skipped: !value,
    createdAt: Date.now()
  };

  state.spyGuess = spyGuess;
  finishSpyWordMatch(
    room,
    correct ? "spy" : "detectives",
    correct ? "spy-guessed-word" : value ? "spy-missed-word" : "spy-skipped-guess",
    {
      ...(state.result || {}),
      spyGuess
    }
  );
  touch(room);

  return {
    room,
    spyGuess
  };
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

  if (
    !room.gameStarted ||
    room.gameEnded ||
    (room.tag.phase !== "countdown" && room.tag.phase !== "playing")
  ) {
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

  if (room.tag.phase === "result") {
    return {
      room,
      active: false
    };
  }

  syncTagPlayers(room);

  if (room.tag.phase === "countdown") {
    room.tag.lastTickAt = now;

    if (room.tag.countdownEndAt && now >= room.tag.countdownEndAt) {
      beginTagPlaying(room, now);
      touch(room);
    }

    return {
      room,
      active: true
    };
  }

  if (room.tag.phase !== "playing") {
    return {
      room,
      active: false
    };
  }

  const map = getTagMap(room.tag.mapId, room.tag.specialLayoutId);
  const lastTickAt = room.tag.lastTickAt || now;
  const elapsed = Math.max(0.001, Math.min(0.08, (now - lastTickAt) / 1000));
  const stepCount = Math.max(1, Math.ceil(elapsed / TAG_PHYSICS_STEP_SECONDS));
  const dt = elapsed / stepCount;
  const platforms = getTagPlatforms(map, now);
  const players = Object.values(room.tag.players);

  room.tag.lastTickAt = now;

  for (let step = 0; step < stepCount; step += 1) {
    for (const player of players) {
      moveTagPlayer(player, platforms, map, dt, now);
      applyTagSpecialObjects(player, map, now);
    }

    processTagCollisions(room, players, now);
  }

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

export function requestHandCricketTeamChange({ socketId, roomCode }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.handCricket;

  if (room.gameType !== "hand-cricket" || !state || state.mode !== "team") {
    throw new Error("Team Hand Cricket is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded || state.phase !== "innings") {
    throw new Error("Changes can only be requested between active balls.");
  }

  const playerTeam = getHandCricketTeamKey(state, player.playerId);
  const isActiveCaptain =
    (playerTeam === state.battingTeam || playerTeam === state.bowlingTeam) &&
    state.teams?.[playerTeam]?.captainId === player.playerId;

  if (!isActiveCaptain) {
    throw new Error("Only the active captains can request a change.");
  }

  beginHandCricketTeamSelection(state, {
    reason: "change",
    requestedById: player.playerId
  });
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

    addHandCricketTeamSelectionAction(state, {
      captainId: player.playerId,
      playerId: requestedPlayerId,
      role: isBattingCaptain ? "bat" : "bowl",
      team: playerTeam
    });

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

    if (isOut) {
      beginHandCricketTeamSelection(state, { reason: "wicket" });
    } else {
      beginHandCricketMove(state);
    }
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

  if (room.gameType === "guess-number") {
    room.guessNumber = room.guessNumber || createGuessNumberState("result");

    if (room.guessNumber?.secrets) {
      delete room.guessNumber.secrets[player.playerId];
    }

    if (room.gameStarted && !room.gameEnded && room.players.length < GUESS_NUMBER_PLAYERS) {
      const remainingPlayer = room.players[0] || null;

      room.gameEnded = true;
      room.guessNumber.phase = "result";
      room.guessNumber.endedAt = Date.now();
      room.winner = remainingPlayer
        ? {
            playerId: remainingPlayer.playerId,
            name: remainingPlayer.name,
            byForfeit: true
          }
        : null;
    }
  }

  if (room.gameType === "word-guess") {
    room.wordGuess = room.wordGuess || createWordGuessState("result");

    delete room.wordGuess.wordPacks?.[player.playerId];
    delete room.wordGuess.selectedWords?.[player.playerId];

    if (room.gameStarted && !room.gameEnded && room.players.length < WORD_GUESS_PLAYERS) {
      const remainingPlayer = room.players[0] || null;

      room.gameEnded = true;
      room.wordGuess.phase = "result";
      room.wordGuess.endedAt = Date.now();
      room.wordGuess.result = {
        type: "forfeit",
        round: room.wordGuess.round || 0,
        winnerPlayerId: remainingPlayer?.playerId || null
      };
      room.winner = remainingPlayer
        ? {
            playerId: remainingPlayer.playerId,
            name: remainingPlayer.name,
            byForfeit: true
          }
        : null;
    }
  }

  if (room.gameType === "spy-word") {
    room.spyWord = room.spyWord || createSpyWordState("result");

    if (room.gameStarted && !room.gameEnded) {
      const leavingSpy = room.spyWord.spyPlayerId === player.playerId;

      finishSpyWordMatch(
        room,
        leavingSpy ? "detectives" : "spy",
        "forfeit",
        {
          forfeitingPlayerId: player.playerId,
          forfeitingPlayerName: player.name
        }
      );
    }
  }

  if (room.gameType === "boost") {
    room.boost = room.boost || createBoostState("result");

    delete room.boost.hands?.[player.playerId];
    delete room.boost.lastTransfers?.[player.playerId];
    delete room.boost.falseBoostCooldowns?.[player.playerId];

    if (room.gameStarted && !room.gameEnded && room.players.length < room.maxPlayers) {
      const remainingPlayer = room.players.find((entry) => !entry.isBot) || room.players[0] || null;

      room.gameEnded = true;
      room.boost.phase = "result";
      room.boost.endedAt = Date.now();
      room.boost.resultType = "forfeit";
      room.winner = remainingPlayer
        ? {
            playerId: remainingPlayer.playerId,
            name: remainingPlayer.name,
            byForfeit: true
          }
        : null;
    }
  }

  if (room.gameType === "treasure-hunt") {
    room.treasureHunt = room.treasureHunt || createTreasureHuntState();

    if (room.gameStarted && !room.gameEnded) {
      if (shouldEndTreasureHunt(room)) {
        endTreasureHuntGame(room);
      } else {
        const state = room.treasureHunt;

        if (leavingIndex < state.currentPlayerIndex) {
          state.currentPlayerIndex -= 1;
        }

        if (state.currentPlayerIndex >= room.players.length) {
          state.currentPlayerIndex = 0;
        }

        if (room.players[state.currentPlayerIndex]?.eliminated) {
          const nextIndex = getNextTreasureHuntPlayerIndex(room, state.currentPlayerIndex - 1);

          if (nextIndex !== -1) {
            state.currentPlayerIndex = nextIndex;
          }
        }

        room.currentTurn = state.currentPlayerIndex;
        state.turnStartedAt = Date.now();
        state.turnDeadlineAt = state.turnStartedAt + TREASURE_HUNT_TURN_MS;
      }
    }
  }

  if (isThirudanPoliceGameType(room.gameType)) {
    room.rajaRani = room.rajaRani || createRajaRaniState("complete");
    delete room.rajaRani.rolesByPlayerId?.[player.playerId];
    delete room.rajaRani.scores?.[player.playerId];
    delete room.rajaRani.roundScores?.[player.playerId];

    if (room.gameStarted && !room.gameEnded && room.players.length < RAJA_RANI_PLAYERS) {
      const remainingPlayer = getRajaRaniLeaderboard(room)[0] || room.players[0] || null;

      room.gameEnded = true;
      room.rajaRani.phase = "complete";
      room.rajaRani.endedAt = Date.now();
      room.winner = remainingPlayer
        ? {
            playerId: remainingPlayer.playerId,
            name: remainingPlayer.name,
            score: remainingPlayer.score || 0,
            byForfeit: true
          }
        : null;
    }
  }

  if (room.gameType === "raja-rani-turns") {
    room.rajaRaniTurns = room.rajaRaniTurns || createRajaRaniTurnsState("complete");
    delete room.rajaRaniTurns.rolesByPlayerId?.[player.playerId];
    delete room.rajaRaniTurns.scores?.[player.playerId];
    delete room.rajaRaniTurns.roundScores?.[player.playerId];

    if (room.gameStarted && !room.gameEnded && room.players.length < RAJA_RANI_PLAYERS) {
      const remainingPlayer = getRajaRaniTurnsLeaderboard(room)[0] || room.players[0] || null;

      room.gameEnded = true;
      room.rajaRaniTurns.phase = "complete";
      room.rajaRaniTurns.endedAt = Date.now();
      room.winner = remainingPlayer
        ? {
            playerId: remainingPlayer.playerId,
            name: remainingPlayer.name,
            score: remainingPlayer.score || 0,
            byForfeit: true
          }
        : null;
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

export function selectTreasureHuntCell({ socketId, roomCode, row, col }) {
  const room = requireRoom(roomCode);
  const player = findPlayerBySocket(room, socketId);
  const state = room.treasureHunt;

  if (room.gameType !== "treasure-hunt" || !state) {
    throw new Error("Treasure Hunt is not active.");
  }

  if (!player) {
    throw new Error("You are not in this room.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game has ended.");
  }

  const currentPlayer = room.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error("No active turn was found.");
  }

  if (currentPlayer.playerId !== player.playerId) {
    throw new Error("It is not your turn.");
  }

  if (currentPlayer.eliminated) {
    throw new Error("You have been eliminated.");
  }

  return revealTreasureHuntCell(room, currentPlayer, row, col);
}

export function selectTreasureHuntBotCell({ roomCode, playerId, turnNumber }) {
  const room = requireRoom(roomCode);
  const state = room.treasureHunt;

  if (room.gameType !== "treasure-hunt" || !state) {
    throw new Error("Treasure Hunt is not active.");
  }

  if (!room.gameStarted || room.gameEnded) {
    throw new Error("Game has ended.");
  }

  if (turnNumber !== undefined && state.currentTurnCount !== turnNumber) {
    throw new Error("This bot turn has already passed.");
  }

  const currentPlayer = room.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error("No active turn was found.");
  }

  if (!currentPlayer.isBot || currentPlayer.playerId !== playerId) {
    throw new Error("It is not this bot's turn.");
  }

  if (currentPlayer.eliminated) {
    throw new Error("The bot has been eliminated.");
  }

  const selection = chooseTreasureHuntBotCell(state);
  if (!selection) {
    endTreasureHuntGame(room);
    touch(room);

    return {
      room,
      cellType: TREASURE_HUNT_CELL_TYPES.EMPTY,
      message: "No cells left",
      selection: null,
      player: {
        playerId: currentPlayer.playerId,
        name: currentPlayer.name
      }
    };
  }

  return revealTreasureHuntCell(room, currentPlayer, selection.row, selection.col);
}

export function resolveTreasureHuntTimeout({ roomCode, turnNumber }) {
  const room = requireRoom(roomCode);
  const state = room.treasureHunt;

  if (
    room.gameType !== "treasure-hunt" ||
    !state ||
    !room.gameStarted ||
    room.gameEnded
  ) {
    return {
      room,
      changed: false
    };
  }

  if (turnNumber !== undefined && state.currentTurnCount !== turnNumber) {
    return {
      room,
      changed: false
    };
  }

  if (!state.turnDeadlineAt || Date.now() < state.turnDeadlineAt) {
    return {
      room,
      changed: false
    };
  }

  const skippedPlayer = room.players[state.currentPlayerIndex] || null;
  let message = "Turn skipped";

  if (skippedPlayer && !skippedPlayer.eliminated) {
    skippedPlayer.missedTurns = (skippedPlayer.missedTurns || 0) + 1;
    const livesLeft = changeTreasureHuntLives(skippedPlayer, -1);
    message = `Missed the turn! -1 life (${livesLeft} left)`;

    if (skippedPlayer.eliminated) {
      message = "Eliminated! No lives left";
    }
  }

  if (shouldEndTreasureHunt(room)) {
    endTreasureHuntGame(room);
  } else {
    advanceTreasureHuntTurn(room);
  }

  touch(room);

  return {
    room,
    changed: true,
    skippedPlayer: skippedPlayer
      ? {
          playerId: skippedPlayer.playerId,
          name: skippedPlayer.name,
          lives: getTreasureHuntLives(skippedPlayer)
        }
      : null,
    message
  };
}

function endTreasureHuntGame(room) {
  const activePlayers = getActiveTreasureHuntPlayers(room);

  let winner = null;
  if (activePlayers.length > 0) {
    winner = activePlayers.reduce((best, player) => {
      const playerTreasures = player.treasures || 0;
      const bestTreasures = best.treasures || 0;
      const playerLives = getTreasureHuntLives(player);
      const bestLives = getTreasureHuntLives(best);

      if (playerTreasures > bestTreasures) return player;
      if (playerTreasures === bestTreasures && playerLives > bestLives) {
        return player;
      }
      if (
        playerTreasures === bestTreasures &&
        playerLives === bestLives &&
        (player.bombs || 0) < (best.bombs || 0)
      ) {
        return player;
      }
      return best;
    });
  }

  const finalStats = room.players
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      treasures: player.treasures || 0,
      bombs: player.bombs || 0,
      lives: getTreasureHuntLives(player),
      missedTurns: player.missedTurns || 0,
      eliminated: Boolean(player.eliminated)
    }))
    .sort((a, b) => b.treasures - a.treasures || b.lives - a.lives || a.bombs - b.bombs);

  const publicWinner = winner
    ? {
        playerId: winner.playerId,
        name: winner.name,
        treasures: winner.treasures || 0,
        bombs: winner.bombs || 0,
        lives: getTreasureHuntLives(winner)
      }
    : null;

  room.treasureHunt.phase = "complete";
  room.treasureHunt.turnDeadlineAt = null;
  room.treasureHunt.winner = publicWinner;
  room.treasureHunt.finalStats = finalStats;
  room.treasureHunt.endedAt = Date.now();
  room.winner = publicWinner;
  room.gameEnded = true;
}
