import crypto from 'crypto';
import type { TrainSide } from '../models/course/courseTypes';
import { normalizeFen } from './positionUtils';

export type CourseLineKeyInput = {
  startFen: string;
  movesUci: readonly string[];
  trainSide: TrainSide;
};

/**
 * Content-addressed identity for a taught chess line.
 *
 * Presentation and source metadata are intentionally excluded so moving or
 * relabeling a lesson does not invalidate user progress.
 */
export function courseLineKey(input: CourseLineKeyInput): string {
  const canonical = JSON.stringify({
    version: 1,
    startFen: normalizeFen(input.startFen),
    movesUci: input.movesUci.map((move) => move.trim().toLowerCase()),
    trainSide: input.trainSide,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
