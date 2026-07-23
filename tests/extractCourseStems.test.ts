import { extractCourseStems } from '../src/lib/extractCourseStems';
import { positionKey } from '../src/lib/positionUtils';

describe('extractCourseStems', () => {
  it('emits shared prefixes and lesson stem id chains', () => {
    const { stems, lessonStemIds } = extractCourseStems([
      {
        movesUci: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
        trainSide: 'w',
      },
      {
        movesUci: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
        trainSide: 'w',
      },
    ]);

    expect(stems.length).toBeGreaterThan(0);
    expect(stems.some((stem) => stem.stemKey === 'e2e4')).toBe(true);
    expect(stems.every((stem) => stem.endKey && stem.endKey.length === 64)).toBe(
      true,
    );
    expect(stems.every((stem) => Array.isArray(stem.trainUcis))).toBe(true);
    expect(lessonStemIds[0]?.length).toBeGreaterThan(0);
    expect(lessonStemIds[1]?.length).toBeGreaterThan(0);
    expect(lessonStemIds[0]?.[0]).toBe(lessonStemIds[1]?.[0]);
  });

  it('emits stems for transposed move orders that share an end position', () => {
    const { stems, lessonStemIds } = extractCourseStems([
      {
        // 1.d4 e6 2.c4 Nf6
        movesUci: ['d2d4', 'e7e6', 'c2c4', 'g8f6', 'g1f3'],
        trainSide: 'w',
      },
      {
        // 1.d4 Nf6 2.c4 e6
        movesUci: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g1f3'],
        trainSide: 'w',
      },
    ]);

    const depth4 = stems.filter((stem) => stem.depth === 4);
    expect(depth4.length).toBeGreaterThanOrEqual(2);
    const endKeys = new Set(depth4.map((stem) => stem.endKey));
    expect(endKeys.size).toBe(1);

    const pathA = 'd2d4|e7e6|c2c4|g8f6';
    const pathB = 'd2d4|g8f6|c2c4|e7e6';
    expect(depth4.some((stem) => stem.stemKey === pathA)).toBe(true);
    expect(depth4.some((stem) => stem.stemKey === pathB)).toBe(true);

    const idsA = lessonStemIds[0] ?? [];
    const idsB = lessonStemIds[1] ?? [];
    expect(idsA.some((id) => stems[id]?.stemKey === pathA)).toBe(true);
    expect(idsB.some((id) => stems[id]?.stemKey === pathB)).toBe(true);

    const sharedEndKey = depth4[0]!.endKey;
    expect(positionKey(depth4[0]!.endFen)).toBe(sharedEndKey);
  });

  it('keeps identical UCI paths from different start FENs as distinct stems', () => {
    // After 1.e4 e5 vs after 1.d4 d5, the same knight-developing UCI text
    // reaches different boards — stems must not share an endKey.
    const afterE4E5 =
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
    const afterD4D5 =
      'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2';

    const { stems, lessonStemIds } = extractCourseStems([
      {
        movesUci: ['g1f3', 'b8c6', 'f1c4'],
        trainSide: 'w',
        startFen: afterE4E5,
      },
      {
        movesUci: ['g1f3', 'b8c6', 'f1b5'],
        trainSide: 'w',
        startFen: afterE4E5,
      },
      {
        movesUci: ['g1f3', 'b8c6', 'c2c4'],
        trainSide: 'w',
        startFen: afterD4D5,
      },
      {
        movesUci: ['g1f3', 'b8c6', 'e2e3'],
        trainSide: 'w',
        startFen: afterD4D5,
      },
    ]);

    const depth1 = stems.filter(
      (stem) => stem.depth === 1 && stem.stemKey === 'g1f3',
    );
    expect(depth1).toHaveLength(2);
    expect(new Set(depth1.map((stem) => stem.endKey)).size).toBe(2);
    expect(positionKey(depth1[0]!.endFen)).toBe(depth1[0]!.endKey);
    expect(positionKey(depth1[1]!.endFen)).toBe(depth1[1]!.endKey);

    const idsE4 = new Set([...(lessonStemIds[0] ?? []), ...(lessonStemIds[1] ?? [])]);
    const idsD4 = new Set([...(lessonStemIds[2] ?? []), ...(lessonStemIds[3] ?? [])]);
    const sharedIds = [...idsE4].filter((id) => idsD4.has(id));
    expect(sharedIds).toEqual([]);
  });
});
