import { ExplorerIndexedGame } from '../models/explorer/explorerIndexedGameModel';

const LOOKUP_CHUNK = 5_000;
const REGISTER_CHUNK = 1_000;

export type RegisterIndexedGamesResult = {
  newlyRegistered: number;
};

/** Returns game IDs already present in the explorer index registry. */
export async function findIndexedGameIds(gameIds: string[]): Promise<Set<string>> {
  const uniqueIds = [...new Set(gameIds.filter((id) => id.length > 0))];
  if (uniqueIds.length === 0) {
    return new Set();
  }

  const indexed = new Set<string>();
  for (let i = 0; i < uniqueIds.length; i += LOOKUP_CHUNK) {
    const chunk = uniqueIds.slice(i, i + LOOKUP_CHUNK);
    const rows = await ExplorerIndexedGame.find({ _id: { $in: chunk } })
      .select('_id')
      .lean<Array<{ _id: string }>>();
    for (const row of rows) {
      indexed.add(String(row._id));
    }
  }

  return indexed;
}

export async function isGameIndexed(gameId: string): Promise<boolean> {
  if (!gameId) {
    return false;
  }
  const row = await ExplorerIndexedGame.findById(gameId).select('_id').lean();
  return row != null;
}

/** Upsert registry rows for games successfully written to the explorer index. */
export async function registerIndexedGames(
  gameIds: string[],
  importBatch?: string,
): Promise<RegisterIndexedGamesResult> {
  const uniqueIds = [...new Set(gameIds.filter((id) => id.length > 0))];
  if (uniqueIds.length === 0) {
    return { newlyRegistered: 0 };
  }

  const indexedAt = new Date();
  let newlyRegistered = 0;

  for (let i = 0; i < uniqueIds.length; i += REGISTER_CHUNK) {
    const chunk = uniqueIds.slice(i, i + REGISTER_CHUNK);
    const ops = chunk.map((gameId) => ({
      updateOne: {
        filter: { _id: gameId },
        update: {
          $setOnInsert: {
            _id: gameId,
            indexedAt,
          },
          ...(importBatch ? { $set: { importBatch } } : {}),
        },
        upsert: true,
      },
    }));

    const result = await ExplorerIndexedGame.bulkWrite(ops, { ordered: false });
    newlyRegistered += result.upsertedCount ?? 0;
  }

  return { newlyRegistered };
}

/** Remove registry rows when games are purged from the explorer index. */
export async function unregisterIndexedGames(gameIds: string[]): Promise<number> {
  const uniqueIds = [...new Set(gameIds.filter((id) => id.length > 0))];
  if (uniqueIds.length === 0) {
    return 0;
  }

  let deleted = 0;
  for (let i = 0; i < uniqueIds.length; i += LOOKUP_CHUNK) {
    const chunk = uniqueIds.slice(i, i + LOOKUP_CHUNK);
    const result = await ExplorerIndexedGame.deleteMany({ _id: { $in: chunk } });
    deleted += result.deletedCount ?? 0;
  }

  return deleted;
}
