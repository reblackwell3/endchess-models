import type { PipelineStage } from 'mongoose';
import { Game } from '../models/raw/gameModel';
import {
  CorpusPlayer,
  type CorpusPlayerImportFrom,
  type ICorpusPlayerFields,
} from '../models/raw/corpusPlayerModel';
import { playerNameKey, preferredDisplayUsername } from './playerNameUtils';
import { playerBrowseSlug } from './openingSeoSlugs';

export type CorpusPlayerAggregateRow = {
  _id: string;
  usernames: string[];
  title?: string;
  gameCount: number;
  avgRating: number;
  maxRating: number;
};

export type CorpusPlayerCatalogSnapshot = {
  twicCount: number;
  lichessCount: number;
  upserted: number;
  removed: number;
};

const CORPUS_SOURCES: CorpusPlayerImportFrom[] = ['twic', 'lichess'];
const BULK_CHUNK = 1_000;

function nameKeyAddFieldsStage(): PipelineStage {
  return {
    $addFields: {
      'players.nameKey': {
        $let: {
          vars: {
            parts: { $split: ['$players.username', ','] },
          },
          in: {
            $cond: {
              if: { $gte: [{ $size: '$$parts' }, 2] },
              then: {
                $concat: [
                  {
                    $toLower: {
                      $trim: { input: { $arrayElemAt: ['$$parts', 0] } },
                    },
                  },
                  ',',
                  {
                    $toLower: {
                      $substrCP: [
                        {
                          $trim: {
                            input: {
                              $replaceAll: {
                                input: { $arrayElemAt: ['$$parts', 1] },
                                find: '.',
                                replacement: '',
                              },
                            },
                          },
                        },
                        0,
                        1,
                      ],
                    },
                  },
                ],
              },
              else: {
                $toLower: { $trim: { input: '$players.username' } },
              },
            },
          },
        },
      },
    },
  };
}

function aggregateCorpusPlayersPipeline(
  importFrom: CorpusPlayerImportFrom,
  nameKeys?: string[],
): PipelineStage[] {
  const pipeline: PipelineStage[] = [{ $match: { import_from: importFrom } }];

  pipeline.push(
    {
      $project: {
        players: [
          {
            username: '$white.username',
            title: '$white.title',
            rating: '$white.rating',
          },
          {
            username: '$black.username',
            title: '$black.title',
            rating: '$black.rating',
          },
        ],
      },
    },
    { $unwind: '$players' },
    nameKeyAddFieldsStage(),
  );

  if (nameKeys?.length) {
    pipeline.push({
      $match: { 'players.nameKey': { $in: nameKeys } },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: '$players.nameKey',
        usernames: { $addToSet: '$players.username' },
        title: { $first: '$players.title' },
        gameCount: { $sum: 1 },
        avgRating: { $avg: '$players.rating' },
        maxRating: { $max: '$players.rating' },
      },
    },
    { $sort: { gameCount: -1, _id: 1 } },
  );

  return pipeline;
}

export async function aggregateCorpusPlayers(
  importFrom: CorpusPlayerImportFrom,
  nameKeys?: string[],
): Promise<CorpusPlayerAggregateRow[]> {
  return Game.aggregate<CorpusPlayerAggregateRow>(
    aggregateCorpusPlayersPipeline(importFrom, nameKeys),
  );
}

export function corpusPlayerRowFromAggregate(
  importFrom: CorpusPlayerImportFrom,
  row: CorpusPlayerAggregateRow,
): ICorpusPlayerFields {
  const username = preferredDisplayUsername(row.usernames);
  const slugAliases = [
    ...new Set(row.usernames.map((value) => playerBrowseSlug(value))),
  ].filter(Boolean);

  return {
    importFrom,
    nameKey: row._id,
    username,
    canonicalSlug: playerBrowseSlug(username),
    slugAliases: slugAliases.length > 0 ? slugAliases : [playerBrowseSlug(username)],
    title: row.title,
    gameCount: row.gameCount,
    avgRating: Math.round(row.avgRating ?? 0),
    maxRating: Math.round(row.maxRating ?? 0),
  };
}

export async function upsertCorpusPlayerRows(
  rows: ICorpusPlayerFields[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BULK_CHUNK) {
    const chunk = rows.slice(i, i + BULK_CHUNK);
    const result = await CorpusPlayer.bulkWrite(
      chunk.map((row) => ({
        updateOne: {
          filter: { importFrom: row.importFrom, nameKey: row.nameKey },
          update: { $set: row },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    upserted += result.upsertedCount + result.modifiedCount + result.matchedCount;
  }

  return upserted;
}

export async function countDistinctCorpusPlayers(
  importFrom: CorpusPlayerImportFrom,
): Promise<number> {
  const rows = await aggregateCorpusPlayers(importFrom);
  return rows.length;
}

export function collectNameKeysFromGames(
  games: Array<{
    import_from?: string | null;
    white?: { username?: string | null } | null;
    black?: { username?: string | null } | null;
  }>,
): Map<CorpusPlayerImportFrom, Set<string>> {
  const bySource = new Map<CorpusPlayerImportFrom, Set<string>>();

  for (const game of games) {
    const importFrom =
      game.import_from === 'twic' || game.import_from === 'lichess'
        ? game.import_from
        : null;
    if (!importFrom) {
      continue;
    }

    const keys = bySource.get(importFrom) ?? new Set<string>();
    for (const side of [game.white, game.black]) {
      const username = side?.username?.trim();
      if (username) {
        keys.add(playerNameKey(username));
      }
    }
    bySource.set(importFrom, keys);
  }

  return bySource;
}

export async function refreshCorpusPlayersForImportFrom(
  importFrom: CorpusPlayerImportFrom,
  nameKeys?: string[],
): Promise<{ upserted: number; removed: number; playerCount: number }> {
  const rows = await aggregateCorpusPlayers(importFrom, nameKeys);
  const documents = rows.map((row) => corpusPlayerRowFromAggregate(importFrom, row));
  const upserted = await upsertCorpusPlayerRows(documents);

  let removed = 0;
  if (!nameKeys?.length) {
    const activeNameKeys = new Set(rows.map((row) => row._id));
    const stale = await CorpusPlayer.find({ importFrom })
      .select('nameKey')
      .lean<Array<{ nameKey: string }>>();
    const staleKeys = stale
      .map((row) => row.nameKey)
      .filter((key) => !activeNameKeys.has(key));
    if (staleKeys.length > 0) {
      const deleteResult = await CorpusPlayer.deleteMany({
        importFrom,
        nameKey: { $in: staleKeys },
      });
      removed = deleteResult.deletedCount ?? 0;
    }
  }

  return { upserted, removed, playerCount: rows.length };
}

export async function refreshCorpusPlayerCatalogFromDb(): Promise<CorpusPlayerCatalogSnapshot> {
  let upserted = 0;
  let removed = 0;
  let twicCount = 0;
  let lichessCount = 0;

  for (const importFrom of CORPUS_SOURCES) {
    const result = await refreshCorpusPlayersForImportFrom(importFrom);
    upserted += result.upserted;
    removed += result.removed;
    if (importFrom === 'twic') {
      twicCount = result.playerCount;
    } else {
      lichessCount = result.playerCount;
    }
  }

  return { twicCount, lichessCount, upserted, removed };
}

export async function refreshCorpusPlayersForGames(
  games: Array<{
    import_from?: string | null;
    white?: { username?: string | null } | null;
    black?: { username?: string | null } | null;
  }>,
): Promise<{ upserted: number; playerCount: number }> {
  const bySource = collectNameKeysFromGames(games);
  let upserted = 0;
  let playerCount = 0;

  for (const importFrom of CORPUS_SOURCES) {
    const nameKeys = [...(bySource.get(importFrom) ?? [])];
    if (nameKeys.length === 0) {
      continue;
    }
    const result = await refreshCorpusPlayersForImportFrom(importFrom, nameKeys);
    upserted += result.upserted;
    playerCount += result.playerCount;
  }

  return { upserted, playerCount };
}
