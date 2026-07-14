import {
  lichessToChesscomRating,
  toChesscomEquivalentRating,
} from '../src/analysis/lichessToChesscomRating';

describe('lichessToChesscomRating', () => {
  it('hits ChessDojo anchor points for classical/rapid', () => {
    expect(lichessToChesscomRating(1500)).toBe(950);
    expect(lichessToChesscomRating(1795, 'rapid')).toBe(1450);
    expect(lichessToChesscomRating(2310, 'classical')).toBe(2275);
  });

  it('interpolates between ChessDojo anchors', () => {
    // Midpoint between 1500→950 and 1550→1050.
    expect(lichessToChesscomRating(1525)).toBe(1000);
  });

  it('uses Elo+Chess blitz/bullet fits', () => {
    expect(lichessToChesscomRating(1200, 'blitz')).toBe(
      Math.round(-551.54 + 1.0853 * 1200),
    );
    expect(lichessToChesscomRating(1200, 'bullet')).toBe(
      Math.round(-531.71 + 0.9871 * 1200),
    );
  });
});

describe('toChesscomEquivalentRating', () => {
  it('passes Chess.com ratings through', () => {
    expect(toChesscomEquivalentRating(1175, 'chess.com', 'blitz')).toBe(1175);
  });

  it('converts Lichess ratings onto Chess.com scale', () => {
    expect(toChesscomEquivalentRating(1795, 'lichess', 'classical')).toBe(1450);
    expect(toChesscomEquivalentRating(1795, 'lichess_user')).toBe(1450);
  });
});
