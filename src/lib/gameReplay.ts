import { Chess } from 'chess.js';
import { START_FEN } from './gameEnrichment';
import type { IGameMove } from '../models/raw/gameModel';

export type ReplayableGame = {
  initial_setup?: string;
  moves: Pick<IGameMove, 'uci'>[];
};

/** Apply one UCI move; throws when illegal. */
export function applyUciToChess(chess: Chess, uci: string): void {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = chess.move({ from, to, promotion });
  if (!move) {
    throw new Error(`Illegal UCI move: ${uci}`);
  }
}

export function chessAtInitialSetup(initialSetup: string | undefined): Chess {
  const setup = initialSetup || START_FEN;
  return new Chess(setup === START_FEN ? undefined : setup);
}

/** FEN after applying the first `ply` UCI moves (0 = initial position). */
export function fenAtPlyFromGame(game: ReplayableGame, ply: number): string {
  const chess = chessAtInitialSetup(game.initial_setup);
  const limit = Math.min(ply, game.moves.length);
  for (let i = 0; i < limit; i += 1) {
    applyUciToChess(chess, game.moves[i]!.uci);
  }
  return chess.fen();
}

/** FEN after all moves in the game. */
export function finalFenFromGame(game: ReplayableGame): string {
  return fenAtPlyFromGame(game, game.moves.length);
}
