import type { PipelineStage } from 'mongoose';
import { Game } from '../models/raw/gameModel';
import { OpeningBranchFen } from '../models/raw/openingBranchFenModel';
import {
  OpeningLineCoverage,
  type IOpeningLineCoverageFields,
} from '../models/raw/openingLineCoverageModel';

export type CorpusOpeningImportFrom = 'twic' | 'lichess';

const CORPUS_SOURCES: CorpusOpeningImportFrom[] = ['twic', 'lichess'];
const BULK_CHUNK = 1_000;

export type OpeningLineCoverageAggregateRow = {
  _id: number;
  gameCount: number;
  twicGameCount: number;
  lichessGameCount: number;
};

export type OpeningLineCoverageSnapshot = {
  coveredLines: number;
  upserted: number;
  removed: number;
};

function aggregateOpeningLineCoveragePipeline(
  lineIds?: number[],
): PipelineStage[] {
  const match: Record<string, unknown> = {
    import_from: { $in: CORPUS_SOURCES },
    openingLineId: { $exists: true, $ne: null },
  };
  if (lineIds?.length) {
    match.openingLineId = { $in: lineIds };
  }

  return [
    { $match: match },
    {
      $group: {
        _id: '$openingLineId',
        gameCount: { $sum: 1 },
        twicGameCount: {
          $sum: { $cond: [{ $eq: ['$import_from', 'twic'] }, 1, 0] },
        },
        lichessGameCount: {
          $sum: { $cond: [{ $eq: ['$import_from', 'lichess'] }, 1, 0] },
        },
      },
    },
  ];
}

export async function aggregateOpeningLineCoverage(
  lineIds?: number[],
): Promise<OpeningLineCoverageAggregateRow[]> {
  if (lineIds && lineIds.length === 0) {
    return [];
  }
  return Game.aggregate<OpeningLineCoverageAggregateRow>(
    aggregateOpeningLineCoveragePipeline(lineIds),
  );
}

export function collectOpeningLineIdsFromGames(
  games: Array<{ openingLineId?: number | null }>,
): number[] {
  const ids = new Set<number>();
  for (const game of games) {
    if (typeof game.openingLineId === 'number' && game.openingLineId > 0) {
      ids.add(game.openingLineId);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

async function loadBranchMeta(
  lineIds: number[],
): Promise<
  Map<number, { familyId: number; eco: string; opening: string }>
> {
  if (lineIds.length === 0) {
    return new Map();
  }
  const rows = await OpeningBranchFen.find({ lineId: { $in: lineIds } })
    .select('lineId familyId eco opening')
    .lean<
      Array<{
        lineId: number;
        familyId: number;
        eco: string;
        opening: string;
      }>
    >();
  return new Map(
    rows.map((row) => [
      row.lineId,
      {
        familyId: row.familyId,
        eco: row.eco?.trim() ?? '',
        opening: row.opening?.trim() ?? '',
      },
    ]),
  );
}

export function openingLineCoverageRowFromAggregate(
  row: OpeningLineCoverageAggregateRow,
  meta: { familyId: number; eco: string; opening: string },
): IOpeningLineCoverageFields {
  return {
    lineId: row._id,
    familyId: meta.familyId,
    eco: meta.eco,
    opening: meta.opening,
    gameCount: row.gameCount,
    twicGameCount: row.twicGameCount,
    lichessGameCount: row.lichessGameCount,
  };
}

export async function upsertOpeningLineCoverageRows(
  rows: IOpeningLineCoverageFields[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BULK_CHUNK) {
    const chunk = rows.slice(i, i + BULK_CHUNK);
    const result = await OpeningLineCoverage.bulkWrite(
      chunk.map((row) => ({
        updateOne: {
          filter: { lineId: row.lineId },
          update: { $set: row },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    upserted +=
      result.upsertedCount + result.modifiedCount + result.matchedCount;
  }
  return upserted;
}

export async function refreshOpeningLineCoverage(
  lineIds?: number[],
): Promise<{ upserted: number; removed: number; coveredLines: number }> {
  const aggregates = await aggregateOpeningLineCoverage(lineIds);
  const metaByLineId = await loadBranchMeta(aggregates.map((row) => row._id));

  const documents: IOpeningLineCoverageFields[] = [];
  for (const row of aggregates) {
    const meta = metaByLineId.get(row._id);
    if (!meta || !meta.opening) {
      continue;
    }
    documents.push(openingLineCoverageRowFromAggregate(row, meta));
  }

  const upserted = await upsertOpeningLineCoverageRows(documents);

  let removed = 0;
  if (!lineIds?.length) {
    const activeLineIds = new Set(documents.map((row) => row.lineId));
    const stale = await OpeningLineCoverage.find({})
      .select('lineId')
      .lean<Array<{ lineId: number }>>();
    const staleIds = stale
      .map((row) => row.lineId)
      .filter((id) => !activeLineIds.has(id));
    if (staleIds.length > 0) {
      const deleteResult = await OpeningLineCoverage.deleteMany({
        lineId: { $in: staleIds },
      });
      removed = deleteResult.deletedCount ?? 0;
    }
  } else {
    const activeLineIds = new Set(documents.map((row) => row.lineId));
    const zeroed = lineIds.filter((id) => !activeLineIds.has(id));
    if (zeroed.length > 0) {
      const deleteResult = await OpeningLineCoverage.deleteMany({
        lineId: { $in: zeroed },
      });
      removed = deleteResult.deletedCount ?? 0;
    }
  }

  return { upserted, removed, coveredLines: documents.length };
}

export async function refreshOpeningLineCoverageFromDb(): Promise<OpeningLineCoverageSnapshot> {
  return refreshOpeningLineCoverage();
}

export async function refreshOpeningLineCoverageForGames(
  games: Array<{ openingLineId?: number | null }>,
): Promise<{ upserted: number; coveredLines: number }> {
  const lineIds = collectOpeningLineIdsFromGames(games);
  if (lineIds.length === 0) {
    return { upserted: 0, coveredLines: 0 };
  }
  const result = await refreshOpeningLineCoverage(lineIds);
  return { upserted: result.upserted, coveredLines: result.coveredLines };
}

/** Line ids with at least one corpus game. */
export async function listCoveredOpeningLineIds(): Promise<number[]> {
  const rows = await OpeningLineCoverage.find({ gameCount: { $gte: 1 } })
    .select('lineId')
    .lean<Array<{ lineId: number }>>();
  return rows.map((row) => row.lineId);
}

export async function listCoveredOpeningRows(): Promise<
  Array<{ eco: string; opening: string; lineId: number; familyId: number }>
> {
  return OpeningLineCoverage.find({ gameCount: { $gte: 1 } })
    .select('eco opening lineId familyId')
    .lean<
      Array<{
        eco: string;
        opening: string;
        lineId: number;
        familyId: number;
      }>
    >();
}
