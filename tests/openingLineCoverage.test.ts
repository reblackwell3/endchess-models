import {
  collectOpeningLineIdsFromGames,
  openingLineCoverageRowFromAggregate,
} from '../src/lib/openingLineCoverage';

describe('collectOpeningLineIdsFromGames', () => {
  it('returns unique positive line ids', () => {
    expect(
      collectOpeningLineIdsFromGames([
        { openingLineId: 3 },
        { openingLineId: null },
        { openingLineId: 1 },
        { openingLineId: 3 },
        {},
        { openingLineId: 0 },
      ]),
    ).toEqual([1, 3]);
  });
});

describe('openingLineCoverageRowFromAggregate', () => {
  it('maps aggregate counts onto branch metadata', () => {
    expect(
      openingLineCoverageRowFromAggregate(
        {
          _id: 42,
          gameCount: 10,
          twicGameCount: 7,
          lichessGameCount: 3,
        },
        {
          familyId: 5,
          eco: 'B90',
          opening: 'Sicilian Defense: Najdorf Variation',
        },
      ),
    ).toEqual({
      lineId: 42,
      familyId: 5,
      eco: 'B90',
      opening: 'Sicilian Defense: Najdorf Variation',
      gameCount: 10,
      twicGameCount: 7,
      lichessGameCount: 3,
    });
  });
});
