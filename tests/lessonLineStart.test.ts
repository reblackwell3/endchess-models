import {
  shiftLessonLineBeforeOpponentMove,
  sideToMoveFromFen,
} from '../src';

describe('shiftLessonLineBeforeOpponentMove', () => {
  it('prepends the setup move when the train side moves first', () => {
    const shifted = shiftLessonLineBeforeOpponentMove({
      startFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      setupFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      setupUci: 'e7e5',
      setupSan: 'e5',
      movesUci: ['g1f3', 'b8c6'],
      movesSan: ['Nf3', 'Nc6'],
      trainSide: 'w',
    });

    expect(shifted).toEqual({
      startFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      movesUci: ['e7e5', 'g1f3', 'b8c6'],
      movesSan: ['e5', 'Nf3', 'Nc6'],
      trainSide: 'w',
    });
    expect(sideToMoveFromFen(shifted!.startFen)).toBe('b');
  });

  it('returns null when the opponent already moves first', () => {
    expect(
      shiftLessonLineBeforeOpponentMove({
        startFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        setupFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        setupUci: 'e2e4',
        movesUci: ['e7e5', 'g1f3'],
        movesSan: ['e5', 'Nf3'],
        trainSide: 'w',
      }),
    ).toBeNull();
  });

  it('returns null without line-entry setup metadata', () => {
    expect(
      shiftLessonLineBeforeOpponentMove({
        startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        movesUci: ['e2e4', 'e7e5'],
        movesSan: ['e4', 'e5'],
        trainSide: 'w',
      }),
    ).toBeNull();
  });
});
