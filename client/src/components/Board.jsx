import Cell from "./Cell.jsx";

export default function Board({ board, calledNumbers, isMyTurn, gameEnded, onCallNumber }) {
  const called = new Set(calledNumbers.map((value) => Number(value)));
  const latestCalled = Number(calledNumbers[calledNumbers.length - 1]);

  return (
    <div className="mx-auto grid w-full max-w-[26rem] bingo-grid gap-1.5" aria-label="Bingo board">
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
          />
        );
      })}
    </div>
  );
}
