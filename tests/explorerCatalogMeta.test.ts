import { ExplorerIndexedGame } from '../src/models/explorer/explorerIndexedGameModel';
import {
  ExplorerCatalogMeta,
  EXPLORER_CATALOG_META_KEY,
} from '../src/models/raw/explorerCatalogMetaModel';
import { ExplorerPosition } from '../src/models/explorer/explorerPositionModel';
import { PositionOccurrence } from '../src/models/explorer/positionOccurrenceModel';
import {
  getExplorerCatalogMeta,
  getExplorerNumGamesUsed,
  refreshExplorerCatalogMetaFromDb,
} from '../src/lib/explorerCatalogMeta';
import {
  findIndexedGameIds,
  registerIndexedGames,
  unregisterIndexedGames,
} from '../src/lib/explorerIndexedGames';

describe('explorerIndexedGames', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('findIndexedGameIds returns ids present in registry', async () => {
    jest.spyOn(ExplorerIndexedGame, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'game-a' }, { _id: 'game-b' }]),
    } as never);

    const indexed = await findIndexedGameIds(['game-a', 'game-c']);
    expect(indexed).toEqual(new Set(['game-a', 'game-b']));
  });

  it('registerIndexedGames bulk upserts game ids', async () => {
    const bulkWrite = jest
      .spyOn(ExplorerIndexedGame, 'bulkWrite')
      .mockResolvedValue({ upsertedCount: 2 } as never);

    const result = await registerIndexedGames(['game-a', 'game-b'], '2024-01');
    expect(result).toEqual({ newlyRegistered: 2 });
    expect(bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: 'game-a' },
          }),
        }),
      ]),
      { ordered: false },
    );
  });

  it('unregisterIndexedGames deletes registry rows in chunks', async () => {
    const deleteMany = jest
      .spyOn(ExplorerIndexedGame, 'deleteMany')
      .mockResolvedValue({ deletedCount: 1 } as never);

    const deleted = await unregisterIndexedGames(['game-a']);
    expect(deleted).toBe(1);
    expect(deleteMany).toHaveBeenCalledWith({ _id: { $in: ['game-a'] } });
  });
});

describe('explorerCatalogMeta', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshExplorerCatalogMetaFromDb writes counts from registry and collections', async () => {
    jest.spyOn(ExplorerIndexedGame, 'estimatedDocumentCount').mockResolvedValue(42);
    jest.spyOn(PositionOccurrence, 'estimatedDocumentCount').mockResolvedValue(900);
    jest.spyOn(ExplorerPosition, 'estimatedDocumentCount').mockResolvedValue(120);
    const updateOne = jest
      .spyOn(ExplorerCatalogMeta, 'updateOne')
      .mockResolvedValue({} as never);
    const at = new Date('2025-01-15T10:00:00.000Z');

    const snapshot = await refreshExplorerCatalogMetaFromDb(at);

    expect(snapshot).toEqual({
      numGamesUsed: 42,
      occurrenceCount: 900,
      positionCount: 120,
      updatedAt: at,
    });
    expect(updateOne).toHaveBeenCalledWith(
      { key: EXPLORER_CATALOG_META_KEY },
      {
        $set: {
          key: EXPLORER_CATALOG_META_KEY,
          numGamesUsed: 42,
          occurrenceCount: 900,
          positionCount: 120,
          updatedAt: at,
        },
      },
      { upsert: true },
    );
  });

  it('getExplorerNumGamesUsed reads catalog meta count', async () => {
    jest.spyOn(ExplorerCatalogMeta, 'findOne').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        numGamesUsed: 2500,
        occurrenceCount: 10000,
        positionCount: 5000,
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      }),
    } as never);

    await expect(getExplorerNumGamesUsed()).resolves.toBe(2500);
    await expect(getExplorerCatalogMeta()).resolves.toMatchObject({
      numGamesUsed: 2500,
      occurrenceCount: 10000,
      positionCount: 5000,
    });
  });
});
