export function normalizeRoomCode(roomCode) {
  return String(roomCode || "").trim().toUpperCase();
}

export const ROOM_ROUTE_CHANGE_EVENT = "room-route-change";

const supportedGameTypes = new Set([
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

const gameTypeByRouteSlug = {
  "raja-rani": "raja-rani-turns"
};

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeGameType(gameType) {
  const value = normalizeSlug(gameType);
  return supportedGameTypes.has(value) ? value : "";
}

function normalizeGameTypeFromPath(gameType) {
  const slug = normalizeSlug(gameType);
  return gameTypeByRouteSlug[slug] || normalizeGameType(slug);
}

function setQueryRoute(url, gameType, roomCode = "") {
  const game = normalizeGameType(gameType);
  const code = normalizeRoomCode(roomCode);

  url.pathname = "/";
  url.search = "";
  url.hash = "";

  if (game) {
    url.searchParams.set("game", game);
  }

  if (code) {
    url.searchParams.set("room", code);
  }

  return url;
}

function readPathRoute(pathname) {
  const [gameSegment, roomSegment] = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  const gameType = normalizeGameTypeFromPath(gameSegment);

  return {
    gameType,
    roomCode: gameType ? normalizeRoomCode(roomSegment) : ""
  };
}

export function readRoomRouteFromUrl() {
  const url = new URL(window.location.href);
  const pathRoute = readPathRoute(url.pathname);

  return {
    gameType: pathRoute.gameType || normalizeGameType(url.searchParams.get("game")),
    roomCode: pathRoute.roomCode || normalizeRoomCode(url.searchParams.get("room"))
  };
}

export function getRoomCodeFromUrl() {
  return readRoomRouteFromUrl().roomCode;
}

export function getGameTypeFromUrl() {
  return readRoomRouteFromUrl().gameType;
}

export function buildRoomLink(roomCode, gameType) {
  const url = new URL(window.location.href);
  const game = normalizeGameType(gameType);
  const code = normalizeRoomCode(roomCode);

  return setQueryRoute(url, game, code).toString();
}

function updateRoute(url, mode) {
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) {
    return;
  }

  window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", nextUrl);
  window.dispatchEvent(new Event(ROOM_ROUTE_CHANGE_EVENT));
}

export function setGameRouteInUrl(gameType, roomCode = "", { replace = false } = {}) {
  const url = new URL(window.location.href);
  const game = normalizeGameType(gameType);
  const code = normalizeRoomCode(roomCode);

  setQueryRoute(url, game, code);

  updateRoute(url, replace ? "replace" : "push");
}

export function setRoomCodeInUrl(roomCode, gameType) {
  const url = new URL(window.location.href);
  const code = normalizeRoomCode(roomCode);
  const game = normalizeGameType(gameType);

  setQueryRoute(url, code || game ? game || "bingo" : "", code);

  updateRoute(url, "replace");
}
