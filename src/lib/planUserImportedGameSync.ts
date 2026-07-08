import { Types } from 'mongoose';
import { Analysis } from '../models/raw/analysisModel';
import type { IAnalysis } from '../models/raw/analysisModel';
import { Game } from '../models/raw/gameModel';
import { SystemImportData } from '../models/system/systemImportDataModel';
import { isProtectedImportedGame } from './userImportedGameAnalysisStatus';

export type ImportCandidateRef = {
  uuid: string;
  end_time: number;
};

export type UserImportedGameSyncPlan = {
  keptExistingIds: Types.ObjectId[];
  evictedIds: Types.ObjectId[];
  /** Candidate uuids to insert (not already in the library). */
  keptNewCandidateUuids: string[];
};

type PoolItem =
  | { kind: 'existing'; id: Types.ObjectId; uuid: string; end_time: number }
  | { kind: 'new'; uuid: string; end_time: number };

function sortPoolByEndTimeDesc(items: PoolItem[]): PoolItem[] {
  return [...items].sort((a, b) => b.end_time - a.end_time);
}

function existingIdsFromPool(items: PoolItem[]): Types.ObjectId[] {
  return items
    .filter((item): item is Extract<PoolItem, { kind: 'existing' }> => item.kind === 'existing')
    .map((item) => item.id);
}

function newUuidsFromPool(items: PoolItem[]): string[] {
  return items
    .filter((item): item is Extract<PoolItem, { kind: 'new' }> => item.kind === 'new')
    .map((item) => item.uuid);
}

/**
 * Plan which library games to keep/evict and which platform candidates to insert
 * so the library matches a newest-N sync without insert-then-delete churn.
 */
export async function planUserImportedGameSync(
  providerId: string,
  limit: number,
  options: { candidates: ImportCandidateRef[] },
): Promise<UserImportedGameSyncPlan> {
  const importData = await SystemImportData.findOne({ providerId })
    .select('importedGames')
    .lean<{ importedGames: Types.ObjectId[] } | null>();

  const gameIds = importData?.importedGames ?? [];
  if (gameIds.length === 0 && options.candidates.length === 0) {
    return {
      keptExistingIds: [],
      evictedIds: [],
      keptNewCandidateUuids: [],
    };
  }

  const games = await Game.find({ _id: { $in: gameIds } })
    .select('_id uuid end_time analysisRequestedAt analysisScheduledFor')
    .lean<
      {
        _id: Types.ObjectId;
        uuid: string;
        end_time?: number;
        analysisRequestedAt?: Date;
        analysisScheduledFor?: Date;
      }[]
    >();

  const analyses = await Analysis.find({ game: { $in: gameIds } })
    .select('game moves')
    .lean<Pick<IAnalysis, 'game' | 'moves'>[]>();
  const analysisByGame = new Map(
    analyses.map((row) => [String(row.game), row]),
  );

  const gameById = new Map(games.map((game) => [String(game._id), game]));
  const existingByUuid = new Map(
    games.map((game) => [game.uuid, game]),
  );
  const existingUuids = new Set(games.map((game) => game.uuid));
  const hasCandidateOverlap = options.candidates.some((candidate) =>
    existingUuids.has(candidate.uuid),
  );

  const protectedIds: Types.ObjectId[] = [];
  const evictableExisting: Extract<PoolItem, { kind: 'existing' }>[] = [];

  for (const id of gameIds) {
    const game = gameById.get(String(id));
    if (!game) {
      continue;
    }
    const analysis = analysisByGame.get(String(id)) ?? null;
    if (isProtectedImportedGame(game, analysis)) {
      protectedIds.push(id);
    } else {
      evictableExisting.push({
        kind: 'existing',
        id,
        uuid: game.uuid,
        end_time: game.end_time ?? 0,
      });
    }
  }

  const candidateUuids = new Set(options.candidates.map((candidate) => candidate.uuid));
  const prioritizedPool: PoolItem[] = [];
  const otherPool: PoolItem[] = [];

  for (const candidate of options.candidates) {
    const existing = existingByUuid.get(candidate.uuid);
    const item: PoolItem = existing
      ? {
          kind: 'existing',
          id: existing._id,
          uuid: candidate.uuid,
          end_time: candidate.end_time,
        }
      : { kind: 'new', uuid: candidate.uuid, end_time: candidate.end_time };
    prioritizedPool.push(item);
  }

  for (const item of evictableExisting) {
    if (!candidateUuids.has(item.uuid)) {
      // Re-syncing the same account may keep spare unanalyzed games; switching
      // accounts (no uuid overlap) evicts all stale unanalyzed library games.
      if (hasCandidateOverlap) {
        otherPool.push(item);
      }
    }
  }

  const slots = Math.max(0, limit - protectedIds.length);
  const keptPrioritized = sortPoolByEndTimeDesc(prioritizedPool);
  const remainingSlots = Math.max(0, slots - keptPrioritized.length);
  const keptOther =
    remainingSlots > 0
      ? sortPoolByEndTimeDesc(otherPool).slice(0, remainingSlots)
      : [];

  const keptEvictableExisting = [
    ...existingIdsFromPool(keptPrioritized),
    ...existingIdsFromPool(keptOther),
  ];
  const keptExistingIdSet = new Set([
    ...protectedIds.map(String),
    ...keptEvictableExisting.map(String),
  ]);
  const keptExistingIds = gameIds.filter((id) => keptExistingIdSet.has(String(id)));

  const evictedIds = evictableExisting
    .filter((item) => !keptExistingIdSet.has(String(item.id)))
    .map((item) => item.id);

  const keptNewCandidateUuids = [
    ...newUuidsFromPool(keptPrioritized),
    ...newUuidsFromPool(keptOther),
  ];

  return {
    keptExistingIds,
    evictedIds,
    keptNewCandidateUuids,
  };
}

export async function evictUserImportedGames(
  providerId: string,
  evictedIds: Types.ObjectId[],
): Promise<void> {
  if (evictedIds.length === 0) {
    return;
  }

  await SystemImportData.updateOne(
    { providerId },
    { $pull: { importedGames: { $in: evictedIds } } },
  );
  await Analysis.deleteMany({ game: { $in: evictedIds } });
  await Game.deleteMany({ _id: { $in: evictedIds } });
}
