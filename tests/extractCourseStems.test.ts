import { extractCourseStems } from '../src/lib/extractCourseStems';

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
    expect(lessonStemIds[0]?.length).toBeGreaterThan(0);
    expect(lessonStemIds[1]?.length).toBeGreaterThan(0);
    expect(lessonStemIds[0]?.[0]).toBe(lessonStemIds[1]?.[0]);
  });
});
