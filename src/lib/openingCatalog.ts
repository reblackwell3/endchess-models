import { OpeningBranchFen } from '../models/raw/openingBranchFenModel';
import { OpeningFamily } from '../models/raw/openingFamilyModel';
import {
  openingFamilyFromName,
  openingFamilySlug,
  openingVariationSlug,
} from './openingSeoSlugs';
import {
  loadOpeningReferenceIndex,
  matchOpeningFromReferenceIndex,
  type OpeningReferenceRow,
} from './inferOpeningFromReference';

export type OpeningFamilyRecord = {
  familyId: number;
  name: string;
  slug: string;
};

export type OpeningLineRecord = {
  lineId: number;
  familyId: number;
  eco: string;
  opening: string;
  familySlug: string;
  variationSlug: string;
};

export type ClassifiedGameOpening = {
  familyId: number;
  lineId?: number;
  eco?: string;
  opening: string;
  familyName: string;
};

export type OpeningCatalog = {
  familiesById: Map<number, OpeningFamilyRecord>;
  familiesBySlug: Map<string, OpeningFamilyRecord>;
  linesById: Map<number, OpeningLineRecord>;
  linesByFamilyId: Map<number, OpeningLineRecord[]>;
};

let cachedCatalog: OpeningCatalog | null = null;
let loadPromise: Promise<OpeningCatalog> | null = null;

export function resetOpeningCatalogForTests(): void {
  cachedCatalog = null;
  loadPromise = null;
}

function buildLineRecord(row: {
  lineId: number;
  familyId: number;
  eco: string;
  opening: string;
}): OpeningLineRecord {
  const opening = row.opening.trim();
  return {
    lineId: row.lineId,
    familyId: row.familyId,
    eco: row.eco?.trim() ?? '',
    opening,
    familySlug: openingFamilySlug(opening),
    variationSlug: openingVariationSlug(opening),
  };
}

export async function loadOpeningCatalog(): Promise<OpeningCatalog> {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  if (!loadPromise) {
    loadPromise = (async (): Promise<OpeningCatalog> => {
      const [familyRows, lineRows] = await Promise.all([
        OpeningFamily.find()
          .select('familyId name slug')
          .lean<OpeningFamilyRecord[]>(),
        OpeningBranchFen.find()
          .select('lineId familyId eco opening')
          .lean<
            {
              lineId: number;
              familyId: number;
              eco: string;
              opening: string;
            }[]
          >(),
      ]);

      const familiesById = new Map<number, OpeningFamilyRecord>();
      const familiesBySlug = new Map<string, OpeningFamilyRecord>();
      for (const family of familyRows) {
        familiesById.set(family.familyId, family);
        familiesBySlug.set(family.slug, family);
      }

      const linesById = new Map<number, OpeningLineRecord>();
      const linesByFamilyId = new Map<number, OpeningLineRecord[]>();
      for (const row of lineRows) {
        if (!row.lineId || !row.familyId) {
          continue;
        }
        const line = buildLineRecord(row);
        linesById.set(line.lineId, line);
        const familyLines = linesByFamilyId.get(line.familyId) ?? [];
        familyLines.push(line);
        linesByFamilyId.set(line.familyId, familyLines);
      }

      cachedCatalog = {
        familiesById,
        familiesBySlug,
        linesById,
        linesByFamilyId,
      };
      return cachedCatalog;
    })();
  }

  return loadPromise;
}

export function resolveFamilyBySlug(
  catalog: OpeningCatalog,
  slug: string,
): OpeningFamilyRecord | null {
  return catalog.familiesBySlug.get(slug.trim().toLowerCase()) ?? null;
}

export function resolveLineByPath(
  catalog: OpeningCatalog,
  familySlug: string,
  variationSlug: string,
  eco?: string,
): OpeningLineRecord | null {
  const family = resolveFamilyBySlug(catalog, familySlug);
  if (!family) {
    return null;
  }

  const normalizedVariation = variationSlug.trim().toLowerCase();
  const normalizedEco = eco?.trim().toLowerCase();
  const candidates =
    catalog.linesByFamilyId.get(family.familyId)?.filter(
      (line) => line.variationSlug === normalizedVariation,
    ) ?? [];

  if (candidates.length === 0) {
    return null;
  }
  if (candidates.length === 1) {
    return candidates[0] ?? null;
  }
  if (normalizedEco) {
    return (
      candidates.find((line) => line.eco.toLowerCase() === normalizedEco) ??
      null
    );
  }
  return candidates.sort((a, b) => a.eco.localeCompare(b.eco))[0] ?? null;
}

function resolveFamilyIdFromHeaders(
  catalog: OpeningCatalog,
  opening?: string,
): number | null {
  const trimmed = opening?.trim();
  if (!trimmed) {
    return null;
  }

  const familyName = openingFamilyFromName(trimmed);
  const slug = openingFamilySlug(familyName);
  const bySlug = catalog.familiesBySlug.get(slug);
  if (bySlug) {
    return bySlug.familyId;
  }

  for (const family of catalog.familiesById.values()) {
    if (family.name.toLowerCase() === familyName.toLowerCase()) {
      return family.familyId;
    }
  }

  return null;
}

function resolveLineIdFromHeaders(
  catalog: OpeningCatalog,
  opening?: string,
  eco?: string,
): number | null {
  const trimmedOpening = opening?.trim();
  if (!trimmedOpening) {
    return null;
  }

  const normalizedEco = eco?.trim().toUpperCase() ?? '';
  const familyId = resolveFamilyIdFromHeaders(catalog, trimmedOpening);
  if (familyId == null) {
    return null;
  }

  const candidates =
    catalog.linesByFamilyId.get(familyId)?.filter((line) => {
      if (normalizedEco && line.eco.toUpperCase() !== normalizedEco) {
        return false;
      }
      return line.opening.toLowerCase() === trimmedOpening.toLowerCase();
    }) ?? [];

  if (candidates.length === 1) {
    return candidates[0]?.lineId ?? null;
  }

  if (!normalizedEco) {
    const exactName = candidates.filter(
      (line) => line.opening.toLowerCase() === trimmedOpening.toLowerCase(),
    );
    if (exactName.length === 1) {
      return exactName[0]?.lineId ?? null;
    }
  }

  return null;
}

export async function classifyGameOpening(params: {
  movesUci: readonly string[];
  opening?: string;
  eco?: string;
}): Promise<ClassifiedGameOpening | null> {
  const catalog = await loadOpeningCatalog();
  if (catalog.familiesById.size === 0) {
    return null;
  }

  const index = await loadOpeningReferenceIndex();
  const inferred = matchOpeningFromReferenceIndex(params.movesUci, index);
  if (inferred) {
    const family = catalog.familiesById.get(inferred.familyId);
    return {
      familyId: inferred.familyId,
      lineId: inferred.lineId,
      eco: inferred.eco || undefined,
      opening: inferred.opening,
      familyName: family?.name ?? openingFamilyFromName(inferred.opening),
    };
  }

  const familyId = resolveFamilyIdFromHeaders(catalog, params.opening);
  if (familyId == null) {
    return null;
  }

  const family = catalog.familiesById.get(familyId);
  const lineId =
    resolveLineIdFromHeaders(catalog, params.opening, params.eco) ?? undefined;

  return {
    familyId,
    lineId,
    eco: params.eco?.trim() || undefined,
    opening: params.opening?.trim() || family?.name || '',
    familyName: family?.name ?? openingFamilyFromName(params.opening ?? ''),
  };
}

export async function applyOpeningClassification<
  T extends {
    eco?: string;
    opening?: string;
    openingFamilyId?: number;
    openingLineId?: number;
    moves: Array<{ uci: string }>;
  },
>(game: T): Promise<T> {
  const classified = await classifyGameOpening({
    movesUci: game.moves.map((move) => move.uci),
    opening: game.opening,
    eco: game.eco,
  });
  if (!classified) {
    return game;
  }

  game.openingFamilyId = classified.familyId;
  if (classified.lineId) {
    game.openingLineId = classified.lineId;
  }
  if (classified.eco) {
    game.eco = classified.eco;
  }
  if (classified.opening) {
    game.opening = classified.opening;
  }
  return game;
}
