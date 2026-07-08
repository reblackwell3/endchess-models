import {
  classifyOpeningUpgrade,
  openingFamilyName,
  referencePathLengthForOpening,
} from '../src/lib/openingUpgrade';
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
  ids: { lineId: number; familyId: number },
): OpeningReferenceRow {
  const uciPath = openingPgnToUciPath(pgn);
  if (!uciPath) {
    throw new Error(`Invalid fixture PGN: ${pgn}`);
  }
  return { eco, opening, uciPath, ...ids };
}

describe('openingFamilyName', () => {
  it('strips variation suffix', () => {
    expect(openingFamilyName('Sicilian Defense: Najdorf Variation')).toBe(
      'Sicilian Defense',
    );
  });
});

describe('classifyOpeningUpgrade', () => {
  const index: OpeningReferenceRow[] = [
    row('B20', 'Sicilian Defense', '1. e4 c5', { lineId: 1, familyId: 1 }),
    row('B90', 'Sicilian Defense: Najdorf Variation', NAJDORF_PGN, {
      lineId: 2,
      familyId: 1,
    }),
    row('B50', 'Sicilian Defense: Modern Variations', SICILIAN_PGN, {
      lineId: 3,
      familyId: 1,
    }),
  ];

  it('wouldUpgrade generic Sicilian header when moves match Najdorf', () => {
    const najdorfUci = openingPgnToUciPath(NAJDORF_PGN)!;
    const result = classifyOpeningUpgrade(
      { opening: 'Sicilian Defense', eco: 'B20' },
      najdorfUci,
      index,
    );

    expect(result.classification).toBe('wouldUpgrade');
    expect(result.inferred?.opening).toBe('Sicilian Defense: Najdorf Variation');
    expect(result.inferredPathLength).toBeGreaterThan(result.storedPathLength);
  });

  it('wouldUpgrade TWIC "Sicilian" when moves match Najdorf', () => {
    const najdorfUci = openingPgnToUciPath(NAJDORF_PGN)!;
    const result = classifyOpeningUpgrade(
      { opening: 'Sicilian', eco: 'B90' },
      najdorfUci,
      index,
    );

    expect(result.classification).toBe('wouldUpgrade');
    expect(result.inferred?.opening).toBe('Sicilian Defense: Najdorf Variation');
  });

  it('wouldUpgrade when header family differs from inferred (cross-family ok)', () => {
    const najdorfUci = openingPgnToUciPath(NAJDORF_PGN)!;
    const result = classifyOpeningUpgrade(
      { opening: 'French', eco: 'C00' },
      najdorfUci,
      index,
    );

    expect(result.classification).toBe('wouldUpgrade');
    expect(result.inferred?.opening).toBe('Sicilian Defense: Najdorf Variation');
  });

  it('unchanged when stored already matches inferred', () => {
    const najdorfUci = openingPgnToUciPath(NAJDORF_PGN)!;
    const result = classifyOpeningUpgrade(
      { opening: 'Sicilian Defense: Najdorf Variation', eco: 'B90' },
      najdorfUci,
      index,
    );

    expect(result.classification).toBe('unchanged');
  });

  it('wouldFill when opening header missing', () => {
    const result = classifyOpeningUpgrade({}, ['e2e4', 'c7c5'], index);

    expect(result.classification).toBe('wouldFill');
    expect(result.inferred?.opening).toBe('Sicilian Defense');
  });
});

describe('matchOpeningFromReferenceIndex integration', () => {
  it('returns Najdorf for Najdorf moves', () => {
    const index: OpeningReferenceRow[] = [
      row('B20', 'Sicilian Defense', '1. e4 c5', { lineId: 1, familyId: 1 }),
      row('B90', 'Sicilian Defense: Najdorf Variation', NAJDORF_PGN, {
        lineId: 2,
        familyId: 1,
      }),
    ];
    const najdorfUci = openingPgnToUciPath(NAJDORF_PGN)!;

    expect(matchOpeningFromReferenceIndex(najdorfUci, index)?.opening).toBe(
      'Sicilian Defense: Najdorf Variation',
    );
    expect(
      referencePathLengthForOpening('Sicilian Defense', 'B20', index),
    ).toBe(2);
  });
});
