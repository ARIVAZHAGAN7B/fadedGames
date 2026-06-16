const BOARD_SIZE = 5;
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;
const MIN_NUMBER = 1;
const MAX_NUMBER = 25;

export function generateBoard() {
  const values = Array.from({ length: BOARD_CELLS }, (_value, index) => index + 1);

  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values;
}

export function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== BOARD_CELLS) {
    return {
      valid: false,
      message: "Board must contain exactly 25 cells."
    };
  }

  const normalized = board.map((value) => Number(value));
  const seen = new Set();

  for (const value of normalized) {
    if (!Number.isInteger(value) || value < MIN_NUMBER || value > MAX_NUMBER) {
      return {
        valid: false,
        message: "Board values must be whole numbers from 1 to 25."
      };
    }

    if (seen.has(value)) {
      return {
        valid: false,
        message: "Board values cannot repeat."
      };
    }

    seen.add(value);
  }

  return {
    valid: true,
    normalized
  };
}

export function countCompletedLines(board, calledNumbers) {
  const validation = validateBoard(board);

  if (!validation.valid) {
    return 0;
  }

  const called = new Set(calledNumbers.map((value) => Number(value)));
  const values = validation.normalized;
  let completed = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const rowStart = row * BOARD_SIZE;
    const isComplete = values
      .slice(rowStart, rowStart + BOARD_SIZE)
      .every((value) => called.has(value));

    if (isComplete) {
      completed += 1;
    }
  }

  for (let column = 0; column < BOARD_SIZE; column += 1) {
    let isComplete = true;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (!called.has(values[row * BOARD_SIZE + column])) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) {
      completed += 1;
    }
  }

  const firstDiagonal = [0, 6, 12, 18, 24].every((index) => called.has(values[index]));
  const secondDiagonal = [4, 8, 12, 16, 20].every((index) => called.has(values[index]));

  if (firstDiagonal) {
    completed += 1;
  }

  if (secondDiagonal) {
    completed += 1;
  }

  return completed;
}

export function hasWinningBingo(board, calledNumbers) {
  return countCompletedLines(board, calledNumbers) >= BOARD_SIZE;
}
