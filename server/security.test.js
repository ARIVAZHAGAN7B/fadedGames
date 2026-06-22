import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "bingo-security-"));

process.env.ANALYTICS_ADMIN_TOKEN = "security-test-admin-token";
process.env.ANALYTICS_STORAGE_PATH = path.join(tempDir, "analytics.json");
process.env.MONGODB_URI = "";
process.env.NODE_ENV = "test";
process.env.MAX_ACTIVE_ROOMS = "1000";

const [
  {
    createRoom,
    joinRoom,
    listActiveRooms,
    resumeSession,
    serializeRoom,
    startGame,
    updateRoomSettings
  },
  { createApp },
  { createCorsOriginChecker },
  { getAnalyticsSummary, recordVisit }
] = await Promise.all([
  import("./roomManager/index.js"),
  import("./app.js"),
  import("./config/cors.js"),
  import("./services/visitorAnalytics.js")
]);

async function listen(app) {
  const server = createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    server,
    url: `http://127.0.0.1:${server.address().port}`
  };
}

async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}

function allowAllOrigins(_origin, callback) {
  callback(null, true);
}

try {
  const privateRoom = createRoom({
    socketId: "host-socket",
    nickname: "Host",
    roomName: "Private Audit",
    gameType: "bingo",
    maxPlayers: 4
  });
  const joined = joinRoom({
    socketId: "attacker-socket",
    nickname: "Attacker",
    roomCode: privateRoom.room.roomCode
  });

  assert.ok(privateRoom.player.sessionToken, "create-room returns a private session token");
  assert.ok(joined.player.sessionToken, "join-room returns a private session token");
  assert.equal(privateRoom.player.socketId, undefined, "public player does not expose socketId");
  assert.equal(privateRoom.player.sessionTokenHash, undefined, "public player does not expose token hash");

  const serializedPrivateRoom = serializeRoom(privateRoom.room, privateRoom.player.playerId);
  assert.equal(serializedPrivateRoom.players[0].socketId, undefined);
  assert.equal(serializedPrivateRoom.players[0].sessionTokenHash, undefined);

  assert.throws(
    () =>
      resumeSession({
        socketId: "attacker-socket",
        roomCode: privateRoom.room.roomCode,
        playerId: privateRoom.player.playerId
      }),
    /Saved session is no longer valid/
  );

  assert.throws(
    () =>
      resumeSession({
        socketId: "attacker-socket",
        roomCode: privateRoom.room.roomCode,
        playerId: privateRoom.player.playerId,
        sessionToken: joined.player.sessionToken
      }),
    /Saved session is no longer valid/
  );

  resumeSession({
    socketId: "host-resume-socket",
    roomCode: privateRoom.room.roomCode,
    playerId: privateRoom.player.playerId,
    sessionToken: privateRoom.player.sessionToken
  });
  const updatedRoom = updateRoomSettings({
    socketId: "host-resume-socket",
    roomCode: privateRoom.room.roomCode,
    roomName: "Token Verified",
    maxPlayers: 4
  });
  assert.equal(updatedRoom.roomName, "Token Verified");

  const publicRoom = createRoom({
    socketId: "public-host-socket",
    nickname: "Public Host",
    roomName: "Public Audit",
    gameType: "bingo",
    maxPlayers: 4,
    discoverable: true
  });
  const activeRoomCodes = listActiveRooms().map((room) => room.roomCode);
  assert.ok(activeRoomCodes.includes(publicRoom.room.roomCode), "public rooms are discoverable");
  assert.ok(!activeRoomCodes.includes(privateRoom.room.roomCode), "private rooms stay out of discovery");

  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error("Math.random must not generate room codes.");
  };

  try {
    createRoom({
      socketId: "crypto-room-socket",
      nickname: "Crypto Host",
      gameType: "bingo",
      maxPlayers: 4
    });
  } finally {
    Math.random = originalRandom;
  }

  const firstResumeRoom = createRoom({
    socketId: "multi-room-socket",
    nickname: "First Host",
    gameType: "bingo",
    maxPlayers: 4
  });
  joinRoom({
    socketId: "first-room-keeper",
    nickname: "Keeper",
    roomCode: firstResumeRoom.room.roomCode
  });
  const secondResumeRoom = createRoom({
    socketId: "second-room-host",
    nickname: "Second Host",
    gameType: "bingo",
    maxPlayers: 4
  });

  resumeSession({
    socketId: "multi-room-socket",
    roomCode: secondResumeRoom.room.roomCode,
    playerId: secondResumeRoom.player.playerId,
    sessionToken: secondResumeRoom.player.sessionToken
  });

  assert.equal(
    firstResumeRoom.room.players.some((player) => player.socketId === "multi-room-socket"),
    false,
    "resuming another room removes the socket from its previous room"
  );
  assert.throws(
    () =>
      updateRoomSettings({
        socketId: "multi-room-socket",
        roomCode: firstResumeRoom.room.roomCode,
        roomName: "Should Not Work",
        maxPlayers: 4
      }),
    /Only the host can change room settings/
  );

  const wordRoom = createRoom({
    socketId: "word-host",
    nickname: "Word Host",
    gameType: "word-guess",
    maxPlayers: 2
  });
  const wordGuest = joinRoom({
    socketId: "word-guest",
    nickname: "Word Guest",
    roomCode: wordRoom.room.roomCode
  });
  startGame({
    socketId: "word-host",
    roomCode: wordRoom.room.roomCode
  });
  const wordHostView = serializeRoom(wordRoom.room, wordRoom.player.playerId);
  assert.deepEqual(
    Object.keys(wordHostView.wordGuess.wordPacks),
    [wordRoom.player.playerId],
    "Word Guess only serializes the viewer's word pack"
  );
  assert.equal(
    wordHostView.wordGuess.wordPacks[wordGuest.player.playerId],
    undefined,
    "Word Guess does not leak the opponent's word pack"
  );

  await recordVisit({
    visitorId: "security-redaction-visitor",
    pathname: "/?game=bingo&room=SECRET"
  });
  const analyticsSummary = await getAnalyticsSummary();
  assert.ok(
    analyticsSummary.topPaths.every((entry) => !entry.path.includes("SECRET")),
    "analytics paths do not retain room codes"
  );

  const app = createApp({ allowOrigin: allowAllOrigins });
  const { server, url } = await listen(app);

  try {
    const unauthorized = await fetch(`${url}/analytics/summary`);
    assert.equal(unauthorized.status, 401);
    assert.ok(unauthorized.headers.get("content-security-policy"));
    assert.equal(unauthorized.headers.get("x-content-type-options"), "nosniff");

    const authorized = await fetch(`${url}/analytics/summary`, {
      headers: {
        Authorization: "Bearer security-test-admin-token"
      }
    });
    assert.equal(authorized.status, 200);

    process.env.ANALYTICS_ADMIN_TOKEN = "change-this-long-random-admin-token";
    const defaultTokenResponse = await fetch(`${url}/analytics/summary`, {
      headers: {
        Authorization: "Bearer change-this-long-random-admin-token"
      }
    });
    assert.equal(defaultTokenResponse.status, 503);
    process.env.ANALYTICS_ADMIN_TOKEN = "security-test-admin-token";

    let rateLimited = null;

    for (let index = 0; index < 31; index += 1) {
      rateLimited = await fetch(`${url}/analytics/visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          visitorId: "security-test-visitor",
          path: "/?room=SECRET"
        })
      });
    }

    assert.equal(rateLimited.status, 429);
  } finally {
    await close(server);
  }

  const allowOrigin = createCorsOriginChecker({
    clientOrigin: "https://game.example",
    nodeEnv: "test"
  });
  await new Promise((resolve, reject) => {
    allowOrigin("https://evil.example", (error, allowed) => {
      try {
        assert.ok(error);
        assert.equal(allowed, undefined);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });

  const defaultCors = createCorsOriginChecker({
    clientOrigin: "https://game.example"
  });
  await new Promise((resolve, reject) => {
    defaultCors("http://192.168.1.10:5173", (error, allowed) => {
      try {
        assert.ok(error);
        assert.equal(allowed, undefined);
        resolve();
      } catch (assertionError) {
        reject(assertionError);
      }
    });
  });

  console.log("Security smoke checks passed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
