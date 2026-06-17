const MIN_NUMBER = 1;

export function getBoardSize(numPlayers) {
  return Math.max(2, numPlayers + 2);
}

export function generateBoard(boardSize = 5) {
  const BOARD_CELLS = boardSize * boardSize;
  const MAX_NUMBER = BOARD_CELLS;
  const values = Array.from({ length: BOARD_CELLS }, (_value, index) => index + 1);

  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values;
}

export function validateBoard(board, boardSize = 5) {
  const BOARD_CELLS = boardSize * boardSize;
  const MAX_NUMBER = BOARD_CELLS;

  if (!Array.isArray(board) || board.length !== BOARD_CELLS) {
    return {
      valid: false,
      message: `Board must contain exactly ${BOARD_CELLS} cells.`
    };
  }

  const normalized = board.map((value) => Number(value));
  const seen = new Set();

  for (const value of normalized) {
    if (!Number.isInteger(value) || value < MIN_NUMBER || value > MAX_NUMBER) {
      return {
        valid: false,
        message: `Board values must be whole numbers from ${MIN_NUMBER} to ${MAX_NUMBER}.`
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

export function countCompletedLines(board, calledNumbers, boardSize = 5) {
  const validation = validateBoard(board, boardSize);

  if (!validation.valid) {
    return 0;
  }

  const called = new Set(calledNumbers.map((value) => Number(value)));
  const values = validation.normalized;
  let completed = 0;

  // Count completed rows
  for (let row = 0; row < boardSize; row += 1) {
    const rowStart = row * boardSize;
    const isComplete = values
      .slice(rowStart, rowStart + boardSize)
      .every((value) => called.has(value));

    if (isComplete) {
      completed += 1;
    }
  }

  // Count completed columns
  for (let column = 0; column < boardSize; column += 1) {
    let isComplete = true;

    for (let row = 0; row < boardSize; row += 1) {
      if (!called.has(values[row * boardSize + column])) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) {
      completed += 1;
    }
  }

  // Check main diagonal (top-left to bottom-right)
  let mainDiagonalComplete = true;
  for (let i = 0; i < boardSize; i += 1) {
    if (!called.has(values[i * boardSize + i])) {
      mainDiagonalComplete = false;
      break;
    }
  }

  if (mainDiagonalComplete) {
    completed += 1;
  }

  // Check anti-diagonal (top-right to bottom-left)
  let antiDiagonalComplete = true;
  for (let i = 0; i < boardSize; i += 1) {
    if (!called.has(values[i * boardSize + (boardSize - 1 - i)])) {
      antiDiagonalComplete = false;
      break;
    }
  }

  if (antiDiagonalComplete) {
    completed += 1;
  }

  return completed;
}

export function hasWinningBingo(board, calledNumbers, boardSize = 5) {
  return countCompletedLines(board, calledNumbers, boardSize) >= boardSize;
}
