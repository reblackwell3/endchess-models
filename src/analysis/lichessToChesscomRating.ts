/**
 * Approximate Lichess → Chess.com rating conversion for shared threshold bands.
 *
 * Rapid / classical / correspondence use the ChessDojo 2024 universal converter
 * (Lichess classical ↔ Chess.com rapid), piecewise-linear over published anchors.
 * Blitz / bullet use Elo+Chess same-time-control modal OLS fits.
 *
 * Sources:
 * - https://lichess.org/@/NoseKnowsAll/blog/introducing-a-universal-rating-converter-for-2024/X2QAH27t
 * - https://www.elopluschess.com/static/docs/research/en/cross-platform-elo-mapping-modal-method.pdf
 */

export type RatingTimeClass =
  | 'bullet'
  | 'blitz'
  | 'rapid'
  | 'classical'
  | 'correspondence';

/** ChessDojo 2024 anchors: [lichess classical, chess.com rapid]. */
const CHESSDOJO_LICHESS_TO_CHESSCOM: ReadonlyArray<readonly [number, number]> = [
  [1250, 550],
  [1310, 650],
  [1370, 750],
  [1435, 850],
  [1500, 950],
  [1550, 1050],
  [1600, 1150],
  [1665, 1250],
  [1730, 1350],
  [1795, 1450],
  [1850, 1550],
  [1910, 1650],
  [1970, 1750],
  [2030, 1850],
  [2090, 1950],
  [2150, 2050],
  [2225, 2165],
  [2310, 2275],
  [2370, 2360],
  [2410, 2425],
  [2440, 2485],
  [2470, 2550],
];

/** Elo+Chess modal maps, fitted ~650–1600 Lichess. */
const ELOPLUS_BULLET = { alpha: -531.71, beta: 0.9871 } as const;
const ELOPLUS_BLITZ = { alpha: -551.54, beta: 1.0853 } as const;

function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.max(100, Math.min(3200, Math.round(rating)));
}

function interpolateAnchors(
  lichessRating: number,
  anchors: ReadonlyArray<readonly [number, number]>,
): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (lichessRating <= first[0]) {
    const [l0, c0] = first;
    const [l1, c1] = anchors[1];
    const slope = (c1 - c0) / (l1 - l0);
    return c0 + slope * (lichessRating - l0);
  }
  if (lichessRating >= last[0]) {
    const [l0, c0] = anchors[anchors.length - 2];
    const [l1, c1] = last;
    const slope = (c1 - c0) / (l1 - l0);
    return c1 + slope * (lichessRating - l1);
  }
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const [l0, c0] = anchors[i];
    const [l1, c1] = anchors[i + 1];
    if (lichessRating >= l0 && lichessRating <= l1) {
      const t = (lichessRating - l0) / (l1 - l0);
      return c0 + t * (c1 - c0);
    }
  }
  return last[1];
}

function normalizeTimeClass(timeClass?: string): RatingTimeClass | undefined {
  if (!timeClass) return undefined;
  const key = timeClass.trim().toLowerCase();
  if (
    key === 'bullet' ||
    key === 'blitz' ||
    key === 'rapid' ||
    key === 'classical' ||
    key === 'correspondence'
  ) {
    return key;
  }
  return undefined;
}

/**
 * Convert a Lichess rating to an approximate Chess.com-equivalent rating.
 * Defaults to the ChessDojo classical/rapid map when time class is omitted.
 */
export function lichessToChesscomRating(
  lichessRating: number,
  timeClass?: string,
): number {
  const tc = normalizeTimeClass(timeClass);
  if (tc === 'bullet') {
    return clampRating(ELOPLUS_BULLET.alpha + ELOPLUS_BULLET.beta * lichessRating);
  }
  if (tc === 'blitz') {
    return clampRating(ELOPLUS_BLITZ.alpha + ELOPLUS_BLITZ.beta * lichessRating);
  }
  return clampRating(
    interpolateAnchors(lichessRating, CHESSDOJO_LICHESS_TO_CHESSCOM),
  );
}

function isLichessImport(importFrom: string): boolean {
  const key = importFrom.trim().toLowerCase();
  return key === 'lichess' || key.startsWith('lichess');
}

/**
 * Normalize a game rating onto the Chess.com scale used by threshold bands.
 * Chess.com ratings pass through unchanged.
 */
export function toChesscomEquivalentRating(
  rating: number,
  importFrom: string,
  timeClass?: string,
): number {
  if (!Number.isFinite(rating)) return 0;
  if (!isLichessImport(importFrom)) {
    return clampRating(rating);
  }
  return lichessToChesscomRating(rating, timeClass);
}
