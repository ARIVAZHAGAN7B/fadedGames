import "../config/env.js";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_QUEUE_PATH = path.resolve(__dirname, "../data/player-game-stats-queue.json");

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "viewCount";
const PLAYER_GAME_STATS_COLLECTION_NAME =
  process.env.PLAYER_GAME_STATS_COLLECTION_NAME || "userGameStats";
const PLAYER_GAME_STATS_QUEUE_PATH =
  process.env.PLAYER_GAME_STATS_QUEUE_PATH || DEFAULT_QUEUE_PATH;
const PLAYER_GAME_STATS_RETRY_MS = Number(process.env.PLAYER_GAME_STATS_RETRY_MS || 15000);
const PLAYER_GAME_STATS_EVENT_ID_LIMIT = Number(
  process.env.PLAYER_GAME_STATS_EVENT_ID_LIMIT || 500
);
const MONGODB_SERVER_SELECTION_TIMEOUT_MS = Number(
  process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000
);
const MAX_USERNAME_LENGTH = 24;

const GAME_NAMES = {
  bingo: "Bingo",
  "hand-cricket": "Hand Cricket",
  tag: "Tag",
  "guess-number": "Guess Number",
  "word-guess": "Word Guess",
  "spy-word": "Spy Word",
  "thirudan-police": "Thirudan Police",
  "raja-rani": "Thirudan Police",
  "raja-rani-turns": "Raja Rani",
  boost: "Boost",
  "treasure-hunt": "Treasure Hunt"
};

let mongoClientPromise = null;
let mongoIndexPromise = null;
let statsFailureLogged = false;
let retryTimer = null;
let queueOperationPromise = Promise.resolve();

function hasMongoConfig() {
  return Boolean(MONGODB_URI);
}

function getMongoClient() {
  if (!mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT_MS
    });

    mongoClientPromise = client.connect().then(() => client).catch((error) => {
      mongoClientPromise = null;
      throw error;
    });
  }

  return mongoClientPromise;
}

async function getStatsCollection() {
  const client = await getMongoClient();
  const collection = client.db(MONGODB_DB_NAME).collection(PLAYER_GAME_STATS_COLLECTION_NAME);

  if (!mongoIndexPromise) {
    mongoIndexPromise = Promise.all([
      collection.createIndex({ usernameKey: 1 }, { unique: true }),
      collection.createIndex({ "gamesPlayed.gameName": 1 }),
      collection.createIndex({ totalGamesPlayed: -1 })
    ])
      .then(() => undefined)
      .catch((error) => {
        mongoIndexPromise = null;
        throw error;
      });
  }

  await mongoIndexPromise;
  return collection;
}

function cleanUsername(username) {
  const clean = String(username || "").trim().replace(/\s+/g, " ");

  if (!clean) {
    return null;
  }

  return clean.slice(0, MAX_USERNAME_LENGTH);
}

function cleanGameType(gameType) {
  return String(gameType || "bingo").trim().toLowerCase() || "bingo";
}

function getUsernameKey(username) {
  return username.toLowerCase();
}

function getGameName(gameType) {
  const cleanType = cleanGameType(gameType);
  return GAME_NAMES[cleanType] || cleanType || "Unknown Game";
}

function normalizeCounter(value) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

function logStatsFailure(error) {
  if (statsFailureLogged) {
    return;
  }

  statsFailureLogged = true;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`MongoDB player game stats failed: ${message}`);
}

function readQueuedEntries() {
  if (!existsSync(PLAYER_GAME_STATS_QUEUE_PATH)) {
    return [];
  }

  try {
    const entries = JSON.parse(readFileSync(PLAYER_GAME_STATS_QUEUE_PATH, "utf8"));
    return Array.isArray(entries)
      ? entries.map(normalizeQueuedEntry).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function writeQueuedEntries(entries) {
  mkdirSync(path.dirname(PLAYER_GAME_STATS_QUEUE_PATH), { recursive: true });
  const temporaryPath = `${PLAYER_GAME_STATS_QUEUE_PATH}.tmp`;

  writeFileSync(temporaryPath, `${JSON.stringify(entries, null, 2)}\n`);
  renameSync(temporaryPath, PLAYER_GAME_STATS_QUEUE_PATH);
}

function withQueueLock(operation) {
  const nextOperation = queueOperationPromise.then(operation, operation);
  queueOperationPromise = nextOperation.catch(() => undefined);
  return nextOperation;
}

function normalizeQueuedEntry(entry) {
  const username = cleanUsername(entry?.username);

  if (!username) {
    return null;
  }

  const recordedAt = new Date(entry?.recordedAt || Date.now());

  return {
    eventId: String(entry?.eventId || randomUUID()),
    username,
    gameType: cleanGameType(entry?.gameType),
    recordedAt: Number.isFinite(recordedAt.getTime())
      ? recordedAt.toISOString()
      : new Date().toISOString()
  };
}

function createGameEntries(room, now = new Date()) {
  if (!room?.gameType || !Array.isArray(room.players)) {
    return [];
  }

  const recordedAt = now.toISOString();
  const roomCode = String(room.roomCode || "room").trim() || "room";
  const gameType = cleanGameType(room.gameType);
  const startKey = String(room.updatedAt || now.getTime());

  return room.players
    .filter((player) => !player.isBot)
    .map((player) => {
      const username = cleanUsername(player.name);

      if (!username) {
        return null;
      }

      return {
        eventId: `game-played:${roomCode}:${gameType}:${startKey}:${player.playerId || username}`,
        username,
        gameType,
        recordedAt
      };
    })
    .filter(Boolean);
}

async function enqueueGameEntries(entries) {
  const normalizedEntries = entries.map(normalizeQueuedEntry).filter(Boolean);

  if (normalizedEntries.length === 0) {
    return { queued: 0, pending: 0 };
  }

  return withQueueLock(async () => {
    const currentEntries = readQueuedEntries();
    const existingIds = new Set(currentEntries.map((entry) => entry.eventId));
    const nextEntries = [...currentEntries];

    for (const entry of normalizedEntries) {
      if (!existingIds.has(entry.eventId)) {
        nextEntries.push(entry);
        existingIds.add(entry.eventId);
      }
    }

    writeQueuedEntries(nextEntries);
    return {
      queued: nextEntries.length - currentEntries.length,
      pending: nextEntries.length
    };
  });
}

async function incrementPlayerGame(entry) {
  const cleanName = cleanUsername(entry.username);

  if (!cleanName || !hasMongoConfig()) {
    return;
  }

  const normalizedEntry = normalizeQueuedEntry({
    ...entry,
    username: cleanName
  });
  const collection = await getStatsCollection();
  const usernameKey = getUsernameKey(cleanName);
  const gameName = getGameName(normalizedEntry.gameType);
  const timestamp = normalizedEntry.recordedAt;
  const alreadyRecorded = {
    $in: [normalizedEntry.eventId, { $ifNull: ["$playedEventIds", []] }]
  };
  const existingGames = { $ifNull: ["$gamesPlayed", []] };
  const updatedGames = {
    $let: {
      vars: {
        existingGames
      },
      in: {
        $cond: [
          {
            $in: [
              gameName,
              {
                $map: {
                  input: "$$existingGames",
                  as: "game",
                  in: "$$game.gameName"
                }
              }
            ]
          },
          {
            $map: {
              input: "$$existingGames",
              as: "game",
              in: {
                $cond: [
                  { $eq: ["$$game.gameName", gameName] },
                  {
                    gameName: "$$game.gameName",
                    gameType: normalizedEntry.gameType,
                    timesPlayed: {
                      $add: [{ $ifNull: ["$$game.timesPlayed", 0] }, 1]
                    },
                    lastPlayedAt: timestamp
                  },
                  "$$game"
                ]
              }
            }
          },
          {
            $concatArrays: [
              "$$existingGames",
              [
                {
                  gameName,
                  gameType: normalizedEntry.gameType,
                  timesPlayed: 1,
                  lastPlayedAt: timestamp
                }
              ]
            ]
          }
        ]
      }
    }
  };

  await collection.updateOne(
    { _id: `user:${usernameKey}` },
    [
      {
        $set: {
          username: cleanName,
          usernameKey,
          createdAt: { $ifNull: ["$createdAt", timestamp] },
          updatedAt: { $cond: [alreadyRecorded, "$updatedAt", timestamp] },
          totalGamesPlayed: {
            $cond: [
              alreadyRecorded,
              { $ifNull: ["$totalGamesPlayed", 0] },
              { $add: [{ $ifNull: ["$totalGamesPlayed", 0] }, 1] }
            ]
          },
          gamesPlayed: {
            $cond: [alreadyRecorded, { $ifNull: ["$gamesPlayed", []] }, updatedGames]
          },
          playedEventIds: {
            $cond: [
              alreadyRecorded,
              { $ifNull: ["$playedEventIds", []] },
              {
                $slice: [
                  {
                    $concatArrays: [
                      { $ifNull: ["$playedEventIds", []] },
                      [normalizedEntry.eventId]
                    ]
                  },
                  -PLAYER_GAME_STATS_EVENT_ID_LIMIT
                ]
              }
            ]
          }
        }
      }
    ],
    { upsert: true }
  );
}

async function writeGameEntries(entries) {
  if (!hasMongoConfig()) {
    return;
  }

  for (const entry of entries) {
    await incrementPlayerGame(entry);
  }

  statsFailureLogged = false;
}

function scheduleStatsRetry(delayMs = PLAYER_GAME_STATS_RETRY_MS) {
  if (retryTimer || !hasMongoConfig()) {
    return;
  }

  retryTimer = setTimeout(async () => {
    retryTimer = null;

    try {
      await flushPendingGameStats();
    } catch (error) {
      logStatsFailure(error);
    }

    if (readQueuedEntries().length > 0) {
      scheduleStatsRetry();
    }
  }, Math.max(1000, Number(delayMs) || PLAYER_GAME_STATS_RETRY_MS));

  retryTimer.unref?.();
}

export async function recordGamePlayedForRoom(room, now = new Date()) {
  const entries = createGameEntries(room, now);

  if (entries.length === 0 || !hasMongoConfig()) {
    return;
  }

  try {
    await flushPendingGameStats();
    await writeGameEntries(entries);
  } catch (error) {
    await enqueueGameEntries(entries);
    scheduleStatsRetry();
    throw error;
  }
}

export async function flushPendingGameStats() {
  if (!hasMongoConfig()) {
    return { flushed: 0, pending: readQueuedEntries().length };
  }

  return withQueueLock(async () => {
    const queuedEntries = readQueuedEntries();

    if (queuedEntries.length === 0) {
      return { flushed: 0, pending: 0 };
    }

    let flushed = 0;

    for (const entry of queuedEntries) {
      await incrementPlayerGame(entry);
      flushed += 1;
    }

    writeQueuedEntries([]);
    statsFailureLogged = false;

    return {
      flushed,
      pending: 0
    };
  });
}

function getLatestTimestamp(firstValue, secondValue) {
  const firstTime = Date.parse(firstValue || "");
  const secondTime = Date.parse(secondValue || "");

  if (!Number.isFinite(firstTime)) {
    return Number.isFinite(secondTime) ? secondValue : null;
  }

  if (!Number.isFinite(secondTime)) {
    return firstValue;
  }

  return firstTime >= secondTime ? firstValue : secondValue;
}

function summarizeGameStatsDocuments(documents) {
  const gameTotals = new Map();
  let totalGamesPlayed = 0;
  let updatedAt = null;

  const players = documents
    .map((document) => {
      const gamesPlayed = Array.isArray(document.gamesPlayed) ? document.gamesPlayed : [];
      const playerGames = gamesPlayed
        .map((game) => ({
          gameName: String(game?.gameName || getGameName(game?.gameType)),
          gameType: cleanGameType(game?.gameType),
          timesPlayed: normalizeCounter(game?.timesPlayed),
          lastPlayedAt: game?.lastPlayedAt || null
        }))
        .filter((game) => game.timesPlayed > 0)
        .sort((first, second) => second.timesPlayed - first.timesPlayed);
      const playerTotal =
        normalizeCounter(document.totalGamesPlayed) ||
        playerGames.reduce((sum, game) => sum + game.timesPlayed, 0);
      const playerUpdatedAt = document.updatedAt || null;

      totalGamesPlayed += playerTotal;
      updatedAt = getLatestTimestamp(updatedAt, playerUpdatedAt);

      for (const game of playerGames) {
        const gameKey = `${game.gameType}:${game.gameName}`;
        const existingGame = gameTotals.get(gameKey) || {
          gameName: game.gameName,
          gameType: game.gameType,
          timesPlayed: 0,
          playerCount: 0,
          lastPlayedAt: null
        };

        existingGame.timesPlayed += game.timesPlayed;
        existingGame.playerCount += 1;
        existingGame.lastPlayedAt = getLatestTimestamp(existingGame.lastPlayedAt, game.lastPlayedAt);
        gameTotals.set(gameKey, existingGame);
      }

      return {
        username: document.username || "",
        totalGamesPlayed: playerTotal,
        gamesPlayed: playerGames,
        updatedAt: playerUpdatedAt
      };
    })
    .filter((player) => player.username)
    .sort(
      (first, second) =>
        second.totalGamesPlayed - first.totalGamesPlayed ||
        first.username.localeCompare(second.username)
    );

  const topGames = [...gameTotals.values()].sort(
    (first, second) =>
      second.timesPlayed - first.timesPlayed || first.gameName.localeCompare(second.gameName)
  );

  return {
    updatedAt,
    pendingSync: readQueuedEntries().length,
    totals: {
      players: players.length,
      totalGamesPlayed,
      gamesTracked: topGames.length
    },
    topGames,
    players,
    recentPlayers: [...players]
      .sort((first, second) => Date.parse(second.updatedAt || "") - Date.parse(first.updatedAt || ""))
      .slice(0, 10)
  };
}

export async function getPlayerGameStatsSummary() {
  if (!hasMongoConfig()) {
    return summarizeGameStatsDocuments([]);
  }

  await flushPendingGameStats();

  const collection = await getStatsCollection();
  const documents = await collection
    .find(
      {},
      {
        projection: {
          username: 1,
          totalGamesPlayed: 1,
          gamesPlayed: 1,
          updatedAt: 1
        }
      }
    )
    .sort({ totalGamesPlayed: -1, username: 1 })
    .toArray();

  return summarizeGameStatsDocuments(documents);
}

export function recordGamePlayedForRoomSafely(room) {
  recordGamePlayedForRoom(room).catch((error) => {
    logStatsFailure(error);
    scheduleStatsRetry();
  });
}

export async function closePlayerGameStatsStore() {
  mongoIndexPromise = null;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  if (!mongoClientPromise) {
    return;
  }

  const clientPromise = mongoClientPromise;
  mongoClientPromise = null;
  const client = await clientPromise.catch(() => null);

  if (client) {
    await client.close();
  }
}

if (hasMongoConfig() && readQueuedEntries().length > 0) {
  scheduleStatsRetry(1000);
}
