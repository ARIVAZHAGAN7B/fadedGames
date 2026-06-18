export function normalizeRoomCode(roomCode) {
  return String(roomCode || "").trim().toUpperCase();
}

export function normalizeGameType(gameType) {
  const value = String(gameType || "").trim().toLowerCase();
  return (
    value === "bingo" ||
    value === "hand-cricket" ||
    value === "tag" ||
    value === "guess-number" ||
    value === "word-guess" ||
    value === "spy-word" ||
    value === "boost" ||
    value === "treasure-hunt" ||
    value === "raja-rani" ||
    value === "raja-rani-turns"
  )
    ? value
    : "";
}

export function getRoomCodeFromUrl() {
  const url = new URL(window.location.href);
  return normalizeRoomCode(url.searchParams.get("room"));
}

export function getGameTypeFromUrl() {
  const url = new URL(window.location.href);
  return normalizeGameType(url.searchParams.get("game"));
}

export function buildRoomLink(roomCode, gameType) {
  const url = new URL(window.location.href);
  const game = normalizeGameType(gameType);

  url.search = "";
  url.hash = "";

  if (game) {
    url.searchParams.set("game", game);
  }

  url.searchParams.set("room", normalizeRoomCode(roomCode));
  return url.toString();
}

export function setRoomCodeInUrl(roomCode, gameType) {
  const url = new URL(window.location.href);
  const code = normalizeRoomCode(roomCode);
  const game = normalizeGameType(gameType);

  if (code) {
    if (game) {
      url.searchParams.set("game", game);
    } else {
      url.searchParams.delete("game");
    }

    url.searchParams.set("room", code);
  } else {
    url.searchParams.delete("game");
    url.searchParams.delete("room");
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}
