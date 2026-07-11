import { ExplorerIndexedGame } from '../models/explorer/explorerIndexedGameModel';
import { ExplorerPosition } from '../models/explorer/explorerPositionModel';
import { PositionOccurrence } from '../models/explorer/positionOccurrenceModel';
import {
  ExplorerCatalogMeta,
  EXPLORER_CATALOG_META_KEY,
  type IExplorerCatalogMetaFields,
} from '../models/raw/explorerCatalogMetaModel';

export type ExplorerCatalogMetaSnapshot = {
  numGamesUsed: number;
  occurrenceCount: number;
  positionCount: number;
  updatedAt: Date | null;
};

export async function refreshExplorerCatalogMetaFromDb(
  at: Date = new Date(),
): Promise<ExplorerCatalogMetaSnapshot> {
  const [numGamesUsed, occurrenceCount, positionCount] = await Promise.all([
    ExplorerIndexedGame.estimatedDocumentCount(),
    PositionOccurrence.estimatedDocumentCount(),
    ExplorerPosition.estimatedDocumentCount(),
  ]);

  await ExplorerCatalogMeta.updateOne(
    { key: EXPLORER_CATALOG_META_KEY },
    {
      $set: {
        key: EXPLORER_CATALOG_META_KEY,
        numGamesUsed,
        occurrenceCount,
        positionCount,
        updatedAt: at,
      },
    },
    { upsert: true },
  );

  return { numGamesUsed, occurrenceCount, positionCount, updatedAt: at };
}

export async function getExplorerCatalogMeta(): Promise<ExplorerCatalogMetaSnapshot> {
  const meta = await ExplorerCatalogMeta.findOne({
    key: EXPLORER_CATALOG_META_KEY,
  })
    .select('numGamesUsed occurrenceCount positionCount updatedAt')
    .lean<
      Pick<
        IExplorerCatalogMetaFields,
        'numGamesUsed' | 'occurrenceCount' | 'positionCount' | 'updatedAt'
      >
    >();

  return {
    numGamesUsed: meta?.numGamesUsed ?? 0,
    occurrenceCount: meta?.occurrenceCount ?? 0,
    positionCount: meta?.positionCount ?? 0,
    updatedAt: meta?.updatedAt ?? null,
  };
}

export async function getExplorerNumGamesUsed(): Promise<number> {
  const meta = await getExplorerCatalogMeta();
  return meta.numGamesUsed;
}
