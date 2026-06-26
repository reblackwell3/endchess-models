import {
  START_FEN,
  buildExplorerIndexFromGame,
  type EnrichedGame,
} from '../src';
import { normalizeFen, positionKey } from '../src/lib/positionUtils';

describe('positionUtils', () => {
  it('hashes normalized FEN consistently', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    expect(positionKey(fen)).toBe(positionKey(normalizeFen(fen)));
  });
});

describe('buildExplorerIndexFromGame', () => {
  const sampleGame: EnrichedGame = {
    import_from: 'lichess',
    url: 'https://lichess.org/testgame1',
    uuid: 'testgame1',
    pgn: '1. e4 e5',
    result: '1-0',
    end_time: 0,
    time_control: '600+0',
    time_class: 'rapid',
    rules: 'Standard',
    rated: true,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    initial_setup: START_FEN,
    ply: 2,
    white: { username: 'White', rating: 2000, result: 'win' },
    black: { username: 'Black', rating: 1900, result: 'lose' },
    moves: [
      { ply: 1, san: 'e4', uci: 'e2e4' },
      { ply: 2, san: 'e5', uci: 'e7e5' },
    ],
  };

  it('returns null when uuid is missing', () => {
    expect(
      buildExplorerIndexFromGame({ ...sampleGame, uuid: 'UNKNOWN' }),
    ).toBeNull();
  });

  it('indexes each ply with stable keys and occurrence rows', () => {
    const index = buildExplorerIndexFromGame(sampleGame);
    expect(index).not.toBeNull();
    expect(index!.occurrences).toHaveLength(2);
    expect(index!.positions).toHaveLength(2);
    expect(index!.occurrences[0]).toMatchObject({
      gameId: 'testgame1',
      nextUci: 'e2e4',
      nextSan: 'e4',
      whiteElo: 2000,
      blackElo: 1900,
    });
    expect(index!.positions[0]!.positionKey).toBe(positionKey(START_FEN));
    expect(index!.positions[0]!.move.whiteWin).toBe(1);
  });

  it('includes playedYear from utc_date on position move deltas', () => {
    const index = buildExplorerIndexFromGame({
      ...sampleGame,
      utc_date: '2025.06.15',
    });
    expect(index!.positions[0]!.move.playedYear).toBe(2025);
  });
});
