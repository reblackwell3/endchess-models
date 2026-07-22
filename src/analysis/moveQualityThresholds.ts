export type MoveQuality =
  | 'best'
  | 'strong'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

/** Expected-points-lost cutoffs for non-top moves within a rating band. */
export type MoveQualityThresholds = {
  /** EPL at or below this is 'strong' (when not the engine top move). */
  strongMax: number;
  /** EPL at or below this (and above strongMax) is 'inaccuracy'. */
  inaccuracyMax: number;
  /** EPL at or below this (and above inaccuracyMax) is 'mistake'; above is 'blunder'. */
  mistakeMax: number;
};

/**
 * Cutoffs fitted July 2026 on 428 analyzed sample games (~14k player moves)
 * so a typical game yields ~8 inaccuracies, ~5 mistakes, and ~2 blunders per
 * 50 player moves (EPL percentiles 70 / 86 / 96 within each band).
 * Ratings are on the Chess.com scale — convert Lichess ratings first via
 * `toChesscomEquivalentRating`. Ordered by descending `minRating`.
 */
export const MOVE_QUALITY_RATING_BANDS: ReadonlyArray<{
  minRating: number;
  thresholds: MoveQualityThresholds;
}> = [
  {
    minRating: 2200,
    thresholds: { strongMax: 0.005, inaccuracyMax: 0.022, mistakeMax: 0.079 },
  },
  {
    minRating: 1800,
    thresholds: { strongMax: 0.006, inaccuracyMax: 0.025, mistakeMax: 0.104 },
  },
  {
    minRating: 1400,
    thresholds: { strongMax: 0.008, inaccuracyMax: 0.033, mistakeMax: 0.114 },
  },
  {
    minRating: 0,
    thresholds: { strongMax: 0.008, inaccuracyMax: 0.034, mistakeMax: 0.12 },
  },
];

/** Used when the player's rating is missing or invalid (1400–1800 band). */
export const DEFAULT_MOVE_QUALITY_THRESHOLDS: MoveQualityThresholds =
  MOVE_QUALITY_RATING_BANDS[2].thresholds;

/**
 * Resolve EPL cutoffs for a Chess.com-equivalent rating. Missing or
 * non-positive ratings fall back to the default (1400–1800) band.
 */
export function getMoveQualityThresholds(
  chesscomEquivalentRating?: number,
): MoveQualityThresholds {
  if (
    chesscomEquivalentRating == null ||
    !Number.isFinite(chesscomEquivalentRating) ||
    chesscomEquivalentRating <= 0
  ) {
    return DEFAULT_MOVE_QUALITY_THRESHOLDS;
  }
  for (const band of MOVE_QUALITY_RATING_BANDS) {
    if (chesscomEquivalentRating >= band.minRating) {
      return band.thresholds;
    }
  }
  return DEFAULT_MOVE_QUALITY_THRESHOLDS;
}

export const DEEP_UPGRADE_QUALITIES: MoveQuality[] = ['mistake', 'blunder'];

export const DRILL_QUALITIES: MoveQuality[] = ['mistake', 'blunder'];

export const SHALLOW_ANALYSIS_DEPTH = 12;
export const DEEP_ANALYSIS_DEPTH = 22;
