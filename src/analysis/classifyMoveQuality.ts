import {
  EPL_BEST_MAX,
  EPL_INACCURACY_MAX,
  EPL_MISTAKE_MAX,
  EPL_STRONG_MAX,
  type MoveQuality,
} from './moveQualityThresholds';

/** Lichess-style win% from centipawns (0–100 scale). */
export function cpToWinPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Expected points (0–1) from user's perspective at a centipawn eval. */
export function cpToExpectedPoints(cp: number): number {
  return cpToWinPercent(cp) / 100;
}

export function classifyMoveQualityFromEpl(
  expectedPointsLost: number,
): MoveQuality {
  if (expectedPointsLost <= EPL_BEST_MAX) return 'best';
  if (expectedPointsLost <= EPL_STRONG_MAX) return 'strong';
  if (expectedPointsLost <= EPL_INACCURACY_MAX) return 'inaccuracy';
  if (expectedPointsLost <= EPL_MISTAKE_MAX) return 'mistake';
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
