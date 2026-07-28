import { courseLineKey } from '../src/lib/courseLineKey';

const startFen =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('courseLineKey', () => {
  it('ignores FEN clocks and normalizes UCI casing and whitespace', () => {
    const first = courseLineKey({
      startFen,
      movesUci: ['e2e4', 'e7e5'],
      trainSide: 'w',
    });
    const sameContent = courseLineKey({
      startFen:
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 14 22',
      movesUci: [' E2E4 ', 'E7E5'],
      trainSide: 'w',
    });
    expect(sameContent).toBe(first);
  });

  it('changes when the starting position or taught moves change', () => {
    const base = courseLineKey({
      startFen,
      movesUci: ['e2e4', 'e7e5'],
      trainSide: 'w',
    });
    expect(
      courseLineKey({
        startFen,
        movesUci: ['e2e4', 'c7c5'],
        trainSide: 'w',
      }),
    ).not.toBe(base);
    expect(
      courseLineKey({
        startFen:
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
        movesUci: ['e7e5'],
        trainSide: 'w',
      }),
    ).not.toBe(base);
    expect(
      courseLineKey({
        startFen,
        movesUci: ['e2e4', 'e7e5'],
        trainSide: 'b',
      }),
    ).not.toBe(base);
  });
});
