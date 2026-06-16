const BOARD_SIZE = 5;
const BOARD_CELLS = 25;

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
      message: "Use all 25 cells."
    };
  }

  const normalized = board.map((value) => Number(value));
  const seen = new Set();

  for (const value of normalized) {
    if (!Number.isInteger(value) || value < 1 || value > 25) {
      return {
        valid: false,
        message: "Use numbers 1 to 25."
      };
    }

    if (seen.has(value)) {
      return {
        valid: false,
        message: "Remove duplicate numbers."
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
    const complete = values
      .slice(rowStart, rowStart + BOARD_SIZE)
      .every((value) => called.has(value));

    if (complete) {
      completed += 1;
    }
  }

  for (let column = 0; column < BOARD_SIZE; column += 1) {
    let complete = true;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (!called.has(values[row * BOARD_SIZE + column])) {
        complete = false;
        break;
      }
    }

    if (complete) {
      completed += 1;
    }
  }

  if ([0, 6, 12, 18, 24].every((index) => called.has(values[index]))) {
    completed += 1;
  }

  if ([4, 8, 12, 16, 20].every((index) => called.has(values[index]))) {
    completed += 1;
  }

  return completed;
}

