import { OpeningBranchFen } from '../models/raw/openingBranchFenModel';
import { openingPgnToUciPath } from './pgnToUciPath';

export const OPENING_INFER_MAX_FULL_MOVE = 12;

export type OpeningReferenceRow = {
  eco: string;
  opening: string;
  uciPath: readonly string[];
  lineId: number;
  familyId: number;
};

let cachedIndex: OpeningReferenceRow[] | null = null;
let loadPromise: Promise<OpeningReferenceRow[]> | null = null;

/** Clear cached index (tests only). */
export function resetOpeningReferenceIndexForTests(): void {
  cachedIndex = null;
  loadPromise = null;
}

export async function loadOpeningReferenceIndex(): Promise<OpeningReferenceRow[]> {
  if (cachedIndex) {
    return cachedIndex;
  }

  if (!loadPromise) {
    loadPromise = (async (): Promise<OpeningReferenceRow[]> => {
      const rows = await OpeningBranchFen.find()
        .select('lineId familyId opening eco pgn')
        .lean<
          {
            lineId: number;
            familyId: number;
            opening: string;
            eco: string;
            pgn: string;
          }[]
        >();

      const index: OpeningReferenceRow[] = [];
      for (const row of rows) {
        const uciPath = openingPgnToUciPath(row.pgn);
        if (!uciPath || uciPath.length === 0 || !row.lineId || !row.familyId) {
          continue;
        }
        index.push({
          eco: row.eco?.trim() ?? '',
          opening: row.opening.trim(),
          uciPath,
          lineId: row.lineId,
          familyId: row.familyId,
        });
      }

      cachedIndex = index;
      return index;
    })();
  }

  return loadPromise;
}

function uciPrefixMatches(
  prefix: readonly string[],
  gamePrefix: readonly string[],
): boolean {
  if (prefix.length > gamePrefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i += 1) {
    if (prefix[i] !== gamePrefix[i]) {
      return false;
    }
  }
  return true;
}

/** Longest matching reference line within the move cap (pure, testable). */
export function matchOpeningFromReferenceIndex(
  movesUci: readonly string[],
  index: readonly OpeningReferenceRow[],
  options?: { maxFullMove?: number },
): { eco: string; opening: string; lineId: number; familyId: number } | null {
  if (movesUci.length === 0 || index.length === 0) {
    return null;
  }

  const maxFullMove = options?.maxFullMove ?? OPENING_INFER_MAX_FULL_MOVE;
  const maxPlies = maxFullMove * 2;
  const gamePrefix = movesUci.slice(0, Math.min(movesUci.length, maxPlies));

  let best: OpeningReferenceRow | null = null;
  let bestLen = -1;

  for (const row of index) {
    if (!uciPrefixMatches(row.uciPath, gamePrefix)) {
      continue;
    }
    if (row.uciPath.length > bestLen) {
      best = row;
      bestLen = row.uciPath.length;
    }
  }

  if (!best?.opening) {
    return null;
  }

  return {
    eco: best.eco,
    opening: best.opening,
    lineId: best.lineId,
    familyId: best.familyId,
  };
}

export async function inferOpeningFromReference(
  movesUci: readonly string[],
  options?: { maxFullMove?: number },
): Promise<{
  eco: string;
  opening: string;
  lineId: number;
  familyId: number;
} | null> {
  const index = await loadOpeningReferenceIndex();
  return matchOpeningFromReferenceIndex(movesUci, index, options);
}
