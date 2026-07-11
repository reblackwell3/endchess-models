import {
  CorpusPlayer,
  type CorpusPlayerImportFrom,
  type ICorpusPlayerFields,
} from '../models/raw/corpusPlayerModel';
import { playerBrowseSlug } from './openingSeoSlugs';
import { playerNameKey } from './playerNameUtils';

export type CorpusPlayerRecord = ICorpusPlayerFields;

export type PlayerCatalog = {
  bySlug: Map<string, CorpusPlayerRecord>;
  byNameKey: Map<string, CorpusPlayerRecord>;
};

const catalogs = new Map<CorpusPlayerImportFrom, PlayerCatalog>();
const loadPromises = new Map<CorpusPlayerImportFrom, Promise<PlayerCatalog>>();

export function resetPlayerCatalogForTests(): void {
  catalogs.clear();
  loadPromises.clear();
}

function buildCatalog(rows: CorpusPlayerRecord[]): PlayerCatalog {
  const bySlug = new Map<string, CorpusPlayerRecord>();
  const byNameKey = new Map<string, CorpusPlayerRecord>();

  for (const row of rows) {
    byNameKey.set(row.nameKey, row);
    for (const slug of row.slugAliases) {
      bySlug.set(slug, row);
    }
    bySlug.set(row.canonicalSlug, row);
  }

  return { bySlug, byNameKey };
}

export async function loadPlayerCatalog(
  importFrom: CorpusPlayerImportFrom,
): Promise<PlayerCatalog> {
  const cached = catalogs.get(importFrom);
  if (cached) {
    return cached;
  }

  let promise = loadPromises.get(importFrom);
  if (!promise) {
    promise = (async () => {
      const rows = await CorpusPlayer.find({ importFrom })
        .select(
          'importFrom nameKey username canonicalSlug slugAliases title gameCount avgRating maxRating',
        )
        .lean<CorpusPlayerRecord[]>();
      const catalog = buildCatalog(rows);
      catalogs.set(importFrom, catalog);
      return catalog;
    })();
    loadPromises.set(importFrom, promise);
  }

  return promise;
}

export function invalidatePlayerCatalog(importFrom?: CorpusPlayerImportFrom): void {
  if (importFrom) {
    catalogs.delete(importFrom);
    loadPromises.delete(importFrom);
    return;
  }
  catalogs.clear();
  loadPromises.clear();
}

export async function resolvePlayerBySlug(
  importFrom: CorpusPlayerImportFrom,
  slug: string,
): Promise<CorpusPlayerRecord | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return CorpusPlayer.findOne({
    importFrom,
    slugAliases: normalized,
  })
    .select(
      'importFrom nameKey username canonicalSlug slugAliases title gameCount avgRating maxRating',
    )
    .lean<CorpusPlayerRecord | null>();
}

export async function slugForUsername(
  importFrom: CorpusPlayerImportFrom,
  username: string,
): Promise<string | null> {
  const trimmed = username.trim();
  if (!trimmed) {
    return null;
  }

  const row = await CorpusPlayer.findOne({
    importFrom,
    nameKey: playerNameKey(trimmed),
  })
    .select('canonicalSlug slugAliases')
    .lean<{ canonicalSlug: string; slugAliases: string[] } | null>();

  if (row) {
    return row.canonicalSlug;
  }

  return playerBrowseSlug(trimmed);
}
