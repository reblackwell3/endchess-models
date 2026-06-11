import {
  fenFromOpeningPgn,
  parseLichessOpeningsTsv,
} from '../src/lib/lichessOpenings';

describe('lichessOpenings', () => {
  it('parses TSV rows', () => {
    const rows = parseLichessOpeningsTsv(
      'eco\tname\tpgn\nB90\tSicilian Defense: Najdorf Variation\t1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6\n',
    );

    expect(rows).toEqual([
      {
        eco: 'B90',
        name: 'Sicilian Defense: Najdorf Variation',
        pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
      },
    ]);
  });

  it('derives the tabiya FEN from a lichess opening PGN', () => {
    const fen = fenFromOpeningPgn(
      '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
    );

    expect(fen).toBe(
      'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    );
  });
});
