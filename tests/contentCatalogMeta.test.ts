import {
  ContentCatalogMeta,
  CONTENT_CATALOG_META_KEY,
} from '../src/models/raw/contentCatalogMetaModel';
import {
  bumpCoursesLatestPublishedAt,
  bumpGamesLatestImportedAt,
  getContentCatalogMeta,
} from '../src/lib/contentCatalogMeta';

describe('contentCatalogMeta', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('upserts coursesLatestPublishedAt on first bump', async () => {
    const updateOne = jest
      .spyOn(ContentCatalogMeta, 'updateOne')
      .mockResolvedValue({} as never);
    const at = new Date('2024-06-01T12:00:00.000Z');

    await bumpCoursesLatestPublishedAt(at);

    expect(updateOne).toHaveBeenCalledWith(
      { key: CONTENT_CATALOG_META_KEY },
      {
        $set: {
          key: CONTENT_CATALOG_META_KEY,
          coursesLatestPublishedAt: at,
        },
      },
      { upsert: true },
    );
  });

  it('upserts gamesLatestImportedAt', async () => {
    const updateOne = jest
      .spyOn(ContentCatalogMeta, 'updateOne')
      .mockResolvedValue({} as never);
    const at = new Date('2024-06-02T08:30:00.000Z');

    await bumpGamesLatestImportedAt(at);

    expect(updateOne).toHaveBeenCalledWith(
      { key: CONTENT_CATALOG_META_KEY },
      {
        $set: {
          key: CONTENT_CATALOG_META_KEY,
          gamesLatestImportedAt: at,
        },
      },
      { upsert: true },
    );
  });

  it('reads nullable catalog timestamps', async () => {
    const publishedAt = new Date('2024-06-01T12:00:00.000Z');
    const importedAt = new Date('2024-06-02T08:30:00.000Z');
    const chain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        coursesLatestPublishedAt: publishedAt,
        gamesLatestImportedAt: importedAt,
      }),
    };
    jest.spyOn(ContentCatalogMeta, 'findOne').mockReturnValue(chain as never);

    const meta = await getContentCatalogMeta();
    expect(meta.coursesLatestPublishedAt?.toISOString()).toBe(
      publishedAt.toISOString(),
    );
    expect(meta.gamesLatestImportedAt?.toISOString()).toBe(
      importedAt.toISOString(),
    );
  });

  it('returns null timestamps when meta document is missing', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(ContentCatalogMeta, 'findOne').mockReturnValue(chain as never);

    const meta = await getContentCatalogMeta();
    expect(meta).toEqual({
      coursesLatestPublishedAt: null,
      gamesLatestImportedAt: null,
    });
  });
});
