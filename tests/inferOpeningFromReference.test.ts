import {
  matchOpeningFromReferenceIndex,
  type OpeningReferenceRow,
} from '../src/lib/inferOpeningFromReference';
import { openingPgnToUciPath } from '../src/lib/pgnToUciPath';

const NAJDORF_PGN =
  '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6';
const SICILIAN_PGN = '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3';

function row(
  eco: string,
  opening: string,
  pgn: string,
  lineId: number,
  familyId: number,
): OpeningReferenceRow {
  const uciPath = openingPgnToUciPath(pgn);
  if (!uciPath) {
    throw new Error(`Invalid fixture PGN: ${pgn}`);
  }
  return { eco, opening, uciPath, lineId, familyId };
}

describe('matchOpeningFromReferenceIndex', () => {
  const index: OpeningReferenceRow[] = [
    row('B20', 'Sicilian Defense', '1. e4 c5', 1, 1),
    row('B90', 'Sicilian Defense: Najdorf Variation', NAJDORF_PGN, 2, 1),
    row('B50', 'Sicilian Defense: Modern Variations', SICILIAN_PGN, 3, 1),
  ];

  it('returns the deepest matching named line (Najdorf)', () => {
    const najdorfUci = openingPgnToUciPath(NAJDORF_PGN)!;
    const extraMove = [...najdorfUci, 'e7e5'];

    const match = matchOpeningFromReferenceIndex(extraMove, index);

    expect(match).toEqual({
      eco: 'B90',
      opening: 'Sicilian Defense: Najdorf Variation',
      lineId: 2,
      familyId: 1,
    });
  });

  it('falls back to a shorter book line when the game deviates later', () => {
    const sicilianUci = openingPgnToUciPath(SICILIAN_PGN)!;
    const offBook = [...sicilianUci, 'e7e5'];

    const match = matchOpeningFromReferenceIndex(offBook, index);

    expect(match).toEqual({
      eco: 'B50',
      opening: 'Sicilian Defense: Modern Variations',
      lineId: 3,
      familyId: 1,
    });
  });

  it('returns null when no reference line matches', () => {
    expect(matchOpeningFromReferenceIndex(['d2d4', 'd7d5'], index)).toBeNull();
  });

  it('returns null for empty moves', () => {
    expect(matchOpeningFromReferenceIndex([], index)).toBeNull();
  });

  it('respects the move-12 cap', () => {
    const longGame = Array.from({ length: 30 }, () => 'e2e4');
    longGame[0] = 'e2e4';
    longGame[1] = 'c7c5';

    const match = matchOpeningFromReferenceIndex(longGame, index, {
      maxFullMove: 1,
    });

    expect(match).toEqual({
      eco: 'B20',
      opening: 'Sicilian Defense',
      lineId: 1,
      familyId: 1,
    });
  });
});

describe('openingPgnToUciPath', () => {
  it('converts Najdorf PGN to UCI', () => {
    expect(openingPgnToUciPath(NAJDORF_PGN)).toEqual([
      'e2e4',
      'c7c5',
      'g1f3',
      'd7d6',
      'd2d4',
      'c5d4',
      'f3d4',
      'g8f6',
      'b1c3',
      'a7a6',
    ]);
  });
});
