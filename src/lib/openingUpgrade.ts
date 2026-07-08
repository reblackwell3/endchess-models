import {
  matchOpeningFromReferenceIndex,
  type OpeningReferenceRow,
} from './inferOpeningFromReference';

export function openingFamilyName(opening: string): string {
  const trimmed = opening.trim();
  const colonIndex = trimmed.indexOf(':');
  return colonIndex >= 0 ? trimmed.slice(0, colonIndex).trim() : trimmed;
}

function normalizeEco(eco?: string | null): string {
  return eco?.trim().toUpperCase() ?? '';
}

/** Longest reference UCI path length for an exact opening name (+ optional ECO). */
export function referencePathLengthForOpening(
  opening: string,
  eco: string | undefined,
  index: readonly OpeningReferenceRow[],
): number {
  const needle = opening.trim().toLowerCase();
  const ecoNorm = normalizeEco(eco);
  let best = 0;

  for (const row of index) {
    if (row.opening.trim().toLowerCase() !== needle) {
      continue;
    }
    if (ecoNorm && normalizeEco(row.eco) !== ecoNorm) {
      continue;
    }
    best = Math.max(best, row.uciPath.length);
  }

  return best;
}

function inferredPathLength(
  inferred: { opening: string; eco: string },
  index: readonly OpeningReferenceRow[],
): number {
  return referencePathLengthForOpening(inferred.opening, inferred.eco, index);
}

export type OpeningUpgradeClassification =
  | 'unchanged'
  | 'wouldUpgrade'
  | 'wouldFill'
  | 'noMatch';

export type OpeningUpgradeResult = {
  classification: OpeningUpgradeClassification;
  inferred: { eco: string; opening: string } | null;
  storedPathLength: number;
  inferredPathLength: number;
};

export function classifyOpeningUpgrade(
  stored: { opening?: string | null; eco?: string | null },
  movesUci: readonly string[],
  index: readonly OpeningReferenceRow[],
): OpeningUpgradeResult {
  const inferred = matchOpeningFromReferenceIndex(movesUci, index);
  const storedOpening = stored.opening?.trim() ?? '';
  const storedEco = stored.eco?.trim() ?? '';

  if (!inferred) {
    return {
      classification: storedOpening ? 'unchanged' : 'noMatch',
      inferred: null,
      storedPathLength: 0,
      inferredPathLength: 0,
    };
  }

  const inferredLen = inferredPathLength(inferred, index);

  if (!storedOpening) {
    return {
      classification: 'wouldFill',
      inferred,
      storedPathLength: 0,
      inferredPathLength: inferredLen,
    };
  }

  const storedLen = referencePathLengthForOpening(
    storedOpening,
    storedEco || undefined,
    index,
  );

  if (
    storedOpening.toLowerCase() === inferred.opening.toLowerCase() &&
    normalizeEco(storedEco) === normalizeEco(inferred.eco)
  ) {
    return {
      classification: 'unchanged',
      inferred,
      storedPathLength: storedLen,
      inferredPathLength: inferredLen,
    };
  }

  // Prefer the deepest move-matched lichess line; do not block on header family.
  if (inferredLen > storedLen) {
    return {
      classification: 'wouldUpgrade',
      inferred,
      storedPathLength: storedLen,
      inferredPathLength: inferredLen,
    };
  }

  return {
    classification: 'unchanged',
    inferred,
    storedPathLength: storedLen,
    inferredPathLength: inferredLen,
  };
}
