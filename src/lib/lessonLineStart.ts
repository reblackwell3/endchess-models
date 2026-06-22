import { Chess } from 'chess.js';
import type { TrainSide } from '../models/course/courseTypes';

export type LessonLineStartFields = {
  startFen: string;
  setupFen?: string;
  setupUci?: string;
  movesUci: string[];
  movesSan: string[];
  trainSide: TrainSide;
};

export const sideToMoveFromFen = (fen: string): TrainSide =>
  fen.trim().split(/\s+/)[1] === 'b' ? 'b' : 'w';

/**
 * When a line starts with the train side to move, shift entry one ply earlier so
 * {@link startFen} is before the opponent's first move in the line and that move
 * becomes the first half-move in {@link movesUci}. Enables last-move indicators at
 * line entry and consistent auto-play into the first quiz.
 *
 * Returns `null` when no shift applies (opponent already to move, or no setup move).
 */
export function shiftLessonLineBeforeOpponentMove(
  line: LessonLineStartFields & { setupSan?: string },
): LessonLineStartFields | null {
  if (sideToMoveFromFen(line.startFen) !== line.trainSide) {
    return null;
  }
  if (!line.setupFen || !line.setupUci) {
    return null;
  }

  const setupSan = line.setupSan ?? sanFromUci(line.setupFen, line.setupUci) ?? line.setupUci;

  return {
    startFen: line.setupFen,
    movesUci: [line.setupUci, ...line.movesUci],
    movesSan: [setupSan, ...line.movesSan],
    trainSide: line.trainSide,
  };
}

function sanFromUci(fen: string, uci: string): string | undefined {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion });
    return move?.san;
  } catch {
    return undefined;
  }
}
