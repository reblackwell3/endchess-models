import {
  buildCourseMetadataDocument,
  courseNeedsMetadataBackfill,
  resolveCourseMetadata,
} from '../src/lib/courseMetadata';

describe('courseMetadata', () => {
  it('resolves from legacy top-level fields', () => {
    const generatedAt = new Date('2026-01-01T00:00:00.000Z');
    expect(
      resolveCourseMetadata({
        generatedAt,
        algorithm: 'popularity',
        filters: {
          minElo: 2400,
          maxElo: 2800,
          sources: ['twic'],
          numGamesUsed: 100,
        },
      }),
    ).toEqual({
      generatedAt,
      algorithm: 'popularity',
      filters: {
        minElo: 2400,
        maxElo: 2800,
        sources: ['twic'],
        numGamesUsed: 100,
      },
    });
  });

  it('maps gameBudget to numGamesUsed when numGamesUsed is absent', () => {
    expect(
      resolveCourseMetadata({
        filters: {
          minElo: 2400,
          maxElo: 2800,
          sources: ['twic', 'lichess'],
          gameBudget: 50,
        },
      }),
    ).toEqual({
      filters: {
        minElo: 2400,
        maxElo: 2800,
        sources: ['twic', 'lichess'],
        numGamesUsed: 50,
      },
    });
  });

  it('prefers nested metadata over legacy top-level fields', () => {
    const nestedAt = new Date('2026-02-01T00:00:00.000Z');
    expect(
      resolveCourseMetadata({
        generatedAt: new Date('2026-01-01T00:00:00.000Z'),
        algorithm: 'popularity',
        filters: {
          minElo: 0,
          maxElo: 3000,
          sources: ['twic'],
          numGamesUsed: 0,
        },
        metadata: {
          generatedAt: nestedAt,
          builderCommitSha: 'abc123',
        },
      }),
    ).toEqual({
      generatedAt: nestedAt,
      algorithm: 'popularity',
      filters: {
        minElo: 0,
        maxElo: 3000,
        sources: ['twic'],
        numGamesUsed: 0,
      },
      builderCommitSha: 'abc123',
    });
  });

  it('detects rows needing metadata backfill', () => {
    expect(
      courseNeedsMetadataBackfill({
        generatedAt: new Date(),
        filters: { minElo: 0, maxElo: 0, sources: [], numGamesUsed: 0 },
      }),
    ).toBe(true);
    expect(
      courseNeedsMetadataBackfill({
        generatedAt: new Date(),
        metadata: {
          generatedAt: new Date(),
          filters: { minElo: 0, maxElo: 0, sources: [], numGamesUsed: 0 },
        },
      }),
    ).toBe(false);
  });

  it('falls back to provided generatedAt when course has no timestamp', () => {
    const fallbackAt = new Date('2026-03-01T00:00:00.000Z');
    expect(
      buildCourseMetadataDocument({ algorithm: 'popularity' }, fallbackAt),
    ).toEqual({
      generatedAt: fallbackAt,
      algorithm: 'popularity',
    });
  });

  it('uses top-level generatedAt over fallback param', () => {
    const topLevelAt = new Date('2026-01-01T00:00:00.000Z');
    const fallbackAt = new Date('2026-03-01T00:00:00.000Z');
    expect(
      buildCourseMetadataDocument({ generatedAt: topLevelAt }, fallbackAt),
    ).toEqual({ generatedAt: topLevelAt });
  });

  it('prefers nested metadata generatedAt over top-level and fallback', () => {
    const nestedAt = new Date('2026-02-01T00:00:00.000Z');
    const topLevelAt = new Date('2026-01-01T00:00:00.000Z');
    const fallbackAt = new Date('2026-03-01T00:00:00.000Z');
    expect(
      buildCourseMetadataDocument(
        {
          generatedAt: topLevelAt,
          metadata: { generatedAt: nestedAt },
        },
        fallbackAt,
      ),
    ).toEqual({ generatedAt: nestedAt });
  });
});
