import type { ILesson } from '../src';
import {
  computeLessonTrainPositions,
  lessonTrainIndices,
  lessonTrainPosition,
} from '../src';

const lesson = {
  startFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  movesUci: ['e7e5', 'g1f3', 'b8c6'],
  movesSan: ['e5', 'Nf3', 'Nc6'],
  trainSide: 'w',
} as Pick<ILesson, 'startFen' | 'movesUci' | 'movesSan' | 'trainSide'>;

describe('lessonTrainPosition', () => {
  it('returns the white training position with setup move metadata', () => {
    const position = lessonTrainPosition(lesson, 2);

    expect(position).toMatchObject({
      halfMove: 2,
      expectedUci: 'g1f3',
      expectedSan: 'Nf3',
      sideToMove: 'w',
      setupUci: 'e7e5',
    });
    expect(position?.fen).toContain('4p3');
    expect(position?.setupFen).toContain('4P3');
  });

  it('returns null for opponent-only plies', () => {
    expect(lessonTrainPosition(lesson, 1)).toBeNull();
    expect(lessonTrainPosition(lesson, 3)).toBeNull();
  });

  it('lists only train-side move indices', () => {
    expect(lessonTrainIndices(lesson)).toEqual([1]);
  });

  it('reads from embedded trainPositions when present', () => {
    const embedded = computeLessonTrainPositions(lesson);
    const withEmbed = { ...lesson, trainPositions: embedded };

    expect(lessonTrainIndices(withEmbed)).toEqual([1]);
    expect(lessonTrainPosition(withEmbed, 2)).toEqual(embedded[0]);
  });

  it('includes line-entry setup move on the first train position', () => {
    const midGameLesson = {
      startFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      setupFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      setupUci: 'e2e4',
      movesUci: ['e7e5', 'g1f3'],
      movesSan: ['e5', 'Nf3'],
      trainSide: 'b',
    } as Pick<
      ILesson,
      'startFen' | 'setupFen' | 'setupUci' | 'movesUci' | 'movesSan' | 'trainSide'
    >;

    const position = lessonTrainPosition(midGameLesson, 1);

    expect(position).toMatchObject({
      halfMove: 1,
      expectedUci: 'e7e5',
      setupUci: 'e2e4',
    });
    expect(position?.setupFen).toContain('PPPPPPPP');
  });
});
