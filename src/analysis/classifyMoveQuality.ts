import {
  type MoveQuality,
  type MoveQualityThresholds,
} from './moveQualityThresholds';

/** Lichess-style win% from centipawns (0–100 scale). */
export function cpToWinPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Expected points (0–1) from user's perspective at a centipawn eval. */
export function cpToExpectedPoints(cp: number): number {
  return cpToWinPercent(cp) / 100;
}

/**
 * 'best' is semantic (the engine's actual top move); every other label comes
 * from rating-banded EPL cutoffs (see `getMoveQualityThresholds`).
 */
export function classifyMoveQuality(params: {
  expectedPointsLost: number;
  isTopMove: boolean;
  thresholds: MoveQualityThresholds;
}): MoveQuality {
  const { expectedPointsLost, isTopMove, thresholds } = params;
  if (isTopMove) return 'best';
  if (expectedPointsLost <= thresholds.strongMax) return 'strong';
  if (expectedPointsLost <= thresholds.inaccuracyMax) return 'inaccuracy';
  if (expectedPointsLost <= thresholds.mistakeMax) return 'mistake';
  // TODO(prod): optionally require decisive-loss signal before blunder.
  return 'blunder';
}

export function computeExpectedPointsLost(
  setupEvalCpUser: number,
  afterEvalCpUser: number,
): number {
  const before = cpToExpectedPoints(setupEvalCpUser);
  const after = cpToExpectedPoints(afterEvalCpUser);
  return Math.max(0, before - after);
}

export function flipCpForUser(cp: number, userIsWhite: boolean): number {
  return userIsWhite ? cp : -cp;
}
