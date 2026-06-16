import { enrichGameFromPgn } from '../src/lib/gameEnrichment';

const TWIC_PGN = `[Event "Wch Candidates"]
[Site "Toronto CAN"]
[Date "2024.04.18"]
[Round "1"]
[White "Carlsen, M"]
[Black "Nepomniachtchi, I"]
[WhiteElo "2840"]
[BlackElo "2785"]
[Result "1-0"]
[ECO "A01"]
[Opening "Nimzovich-Larsen attack"]

1. b3 e5 2. Bb2 1-0`;

describe('gameEnrichment date fields', () => {
  it('maps TWIC Date header into utc_date during import', () => {
    const game = enrichGameFromPgn(TWIC_PGN, {
      importFrom: 'twic',
      uuid: 'twic-test-1',
    });

    expect(game.utc_date).toBe('2024.04.18');
    expect(game.end_time).toBeGreaterThan(0);
    expect(game.played_at?.toISOString()).toBe('2024-04-18T00:00:00.000Z');
  });
});
