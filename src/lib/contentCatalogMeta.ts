import {
  ContentCatalogMeta,
  CONTENT_CATALOG_META_KEY,
  type IContentCatalogMetaFields,
} from '../models/raw/contentCatalogMetaModel';

export type ContentCatalogMetaSnapshot = {
  coursesLatestPublishedAt: Date | null;
  gamesLatestImportedAt: Date | null;
};

export async function bumpCoursesLatestPublishedAt(
  at: Date = new Date(),
): Promise<void> {
  await ContentCatalogMeta.updateOne(
    { key: CONTENT_CATALOG_META_KEY },
    {
      $set: {
        key: CONTENT_CATALOG_META_KEY,
        coursesLatestPublishedAt: at,
      },
    },
    { upsert: true },
  );
}

export async function bumpGamesLatestImportedAt(
  at: Date = new Date(),
): Promise<void> {
  await ContentCatalogMeta.updateOne(
    { key: CONTENT_CATALOG_META_KEY },
    {
      $set: {
        key: CONTENT_CATALOG_META_KEY,
        gamesLatestImportedAt: at,
      },
    },
    { upsert: true },
  );
}

export async function getContentCatalogMeta(): Promise<ContentCatalogMetaSnapshot> {
  const meta = await ContentCatalogMeta.findOne({
    key: CONTENT_CATALOG_META_KEY,
  })
    .select('coursesLatestPublishedAt gamesLatestImportedAt')
    .lean<Pick<IContentCatalogMetaFields, 'coursesLatestPublishedAt' | 'gamesLatestImportedAt'>>();

  return {
    coursesLatestPublishedAt: meta?.coursesLatestPublishedAt ?? null,
    gamesLatestImportedAt: meta?.gamesLatestImportedAt ?? null,
  };
}
