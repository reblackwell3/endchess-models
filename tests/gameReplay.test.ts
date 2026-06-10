import {
  START_FEN,
  fenAtPlyFromGame,
  finalFenFromGame,
  normalizeFen,
} from '../src';

describe('fenAtPlyFromGame', () => {
  const game = {
    initial_setup: START_FEN,
    moves: [
      { ply: 1, san: 'e4', uci: 'e2e4' },
      { ply: 2, san: 'e5', uci: 'e7e5' },
    ],
  };

  it('returns the initial position at ply 0', () => {
    expect(normalizeFen(fenAtPlyFromGame(game, 0))).toBe(normalizeFen(START_FEN));
  });

  it('returns FEN after each applied move', () => {
    expect(fenAtPlyFromGame(game, 1)).toContain('4P3');
    expect(fenAtPlyFromGame(game, 2)).toContain('4p3');
  });

  it('returns the final position from finalFenFromGame', () => {
    expect(finalFenFromGame(game)).toBe(fenAtPlyFromGame(game, 2));
  });
});
