import Cell from "./Cell.jsx";

export default function Board({ board, boardSize, calledNumbers, isMyTurn, gameEnded, onCallNumber, animateCalls = true }) {
  const inferredBoardSize = Number.isInteger(boardSize) && boardSize > 0
    ? boardSize
    : Math.max(1, Math.round(Math.sqrt(board.length)));
  const called = new Set(calledNumbers.map((value) => Number(value)));
  const latestCalled = Number(calledNumbers[calledNumbers.length - 1]);

  return (
    <div
      className="mx-auto grid w-full max-w-[26rem] gap-1.5"
      style={{ gridTemplateColumns: `repeat(${inferredBoardSize}, minmax(0, 1fr))` }}
      aria-label="Bingo board"
    >
      {board.map((number, index) => {
        const hasBeenCalled = called.has(Number(number));
        const isLatest = hasBeenCalled && Number(number) === latestCalled;
        const clickable = Boolean(isMyTurn && !gameEnded && !hasBeenCalled);

        return (
          <Cell
            key={`${number}-${index}`}
            number={Number(number)}
            called={hasBeenCalled}
            latest={isLatest}
            clickable={clickable}
            onClick={onCallNumber}
            animateCall={animateCalls}
          />
        );
      })}
    </div>
  );
}
