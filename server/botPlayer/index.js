import { generateBoard } from "../gameEngine/index.js";

const BOT_NAMES = [
  "Nova Bot",
  "Mira Bot",
  "Pixel Bot",
  "Zara Bot",
  "Neo Bot",
  "Ravi Bot",
  "Luna Bot",
  "Ace Bot"
];

export function generateBotBoard(boardSize) {
  return generateBoard(boardSize);
}

export function createBotName(existingNames) {
  const used = new Set(existingNames.map((name) => String(name).toLowerCase()));
  const availableName = BOT_NAMES.find((name) => !used.has(name.toLowerCase()));

  if (availableName) {
    return availableName;
  }

  let index = 1;

  while (used.has(`bot ${index}`)) {
    index += 1;
  }

  return `Bot ${index}`;
}

export function chooseBotNumber(board, calledNumbers) {
  const called = new Set(calledNumbers.map((value) => Number(value)));
  const availableNumbers = board.filter((value) => !called.has(Number(value)));

  if (availableNumbers.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * availableNumbers.length);
  return availableNumbers[index];
}
