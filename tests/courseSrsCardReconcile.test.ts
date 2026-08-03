import {
  buildCourseSrsPositionCandidates,
  commonSanPrefixLength,
  resolveCourseSrsOwner,
  type CourseSrsLessonLike,
} from '../src/lib/courseSrsCardReconcile';
import { positionKey } from '../src/lib/positionUtils';

const startFen =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function lesson(
  id: string,
  sectionId: string,
  order: number,
  movesUci: string[],
  movesSan: string[],
): CourseSrsLessonLike {
  return {
    _id: id,
    sectionId,
    order,
    lineKey: `line-${id}`,
    title: `Lesson ${id}`,
    startFen,
    movesUci,
    movesSan,
    trainSide: 'w',
  };
}

describe('courseSrsCardReconcile', () => {
  it('counts the common SAN prefix', () => {
    expect(
      commonSanPrefixLength(
        ['d4', 'e6', 'c4', 'd5'],
        ['d4', 'e6', 'c4', 'c5'],
      ),
    ).toBe(3);
    expect(commonSanPrefixLength(undefined, ['d4'])).toBe(0);
  });

  it('keeps a shortened line attached to its closest historical continuation', () => {
    const close = lesson(
      'close',
      'section-a',
      2,
      ['d2d4', 'e7e6', 'c2c4', 'c7c5'],
      ['d4', 'e6', 'c4', 'c5'],
    );
    const distant = lesson(
      'distant',
      'section-a',
      1,
      ['d2d4', 'b7b6', 'e2e4', 'c8b7'],
      ['d4', 'b6', 'e4', 'Bb7'],
    );
    const candidates = buildCourseSrsPositionCandidates([distant, close]);
    const initialRefId = positionKey(startFen);

    const owner = resolveCourseSrsOwner(
      {
        expectedUci: 'd2d4',
        openingSans: ['d4', 'e6', 'c4', 'd5', 'Nc3', 'Nf6'],
      },
      candidates.get(initialRefId) ?? [],
    );

    expect(owner?.lesson._id).toBe('close');
  });

  it('breaks equivalent ties by section order, lesson order, then id', () => {
    const laterSection = lesson(
      'a-id',
      'section-b',
      1,
      ['d2d4', 'd7d6'],
      ['d4', 'd6'],
    );
    const laterLesson = lesson(
      'z-id',
      'section-a',
      2,
      ['d2d4', 'g8f6'],
      ['d4', 'Nf6'],
    );
    const first = lesson(
      'b-id',
      'section-a',
      1,
      ['d2d4', 'b7b6'],
      ['d4', 'b6'],
    );
    const candidates = buildCourseSrsPositionCandidates(
      [laterSection, laterLesson, first],
      new Map([
        ['section-a', 1],
        ['section-b', 2],
      ]),
    );

    const owner = resolveCourseSrsOwner(
      { expectedUci: 'd2d4', openingSans: ['d4', 'e6'] },
      candidates.get(positionKey(startFen)) ?? [],
    );

    expect(owner?.lesson._id).toBe('b-id');
  });

  it('returns no owner when active lessons teach a different move', () => {
    const d4 = lesson(
      'd4',
      'section-a',
      1,
      ['d2d4', 'd7d5'],
      ['d4', 'd5'],
    );
    const candidates = buildCourseSrsPositionCandidates([d4]);

    expect(
      resolveCourseSrsOwner(
        { expectedUci: 'e2e4', openingSans: ['e4', 'e5'] },
        candidates.get(positionKey(startFen)) ?? [],
      ),
    ).toBeUndefined();
  });

  it('falls back to stable catalog order for legacy cards without a move', () => {
    const second = lesson(
      'second',
      'section-a',
      2,
      ['d2d4', 'd7d5'],
      ['d4', 'd5'],
    );
    const first = lesson(
      'first',
      'section-a',
      1,
      ['e2e4', 'e7e5'],
      ['e4', 'e5'],
    );
    const candidates = buildCourseSrsPositionCandidates([second, first]);

    const owner = resolveCourseSrsOwner(
      {},
      candidates.get(positionKey(startFen)) ?? [],
    );

    expect(owner?.lesson._id).toBe('first');
  });
});
