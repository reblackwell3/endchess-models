import { Types } from 'mongoose';
import { Analysis } from '../models/raw/analysisModel';
import type { IAnalysis } from '../models/raw/analysisModel';
import { Game } from '../models/raw/gameModel';
import { SystemImportData } from '../models/system/systemImportDataModel';
import { isProtectedImportedGame } from './userImportedGameAnalysisStatus';

type TrimResult = {
  trimmed: boolean;
  keptCount: number;
  evictedCount: number;
};

export type TrimUserImportedGamesOptions = {
  /** When over cap, keep these games first (e.g. a batch just imported). */
  prioritizeIds?: Types.ObjectId[];
};

function sortByEndTimeDesc(
  ids: Types.ObjectId[],
  endTimeById: Map<string, number>,
): Types.ObjectId[] {
  return [...ids].sort((a, b) => {
    const aTime = endTimeById.get(String(a)) ?? 0;
    const bTime = endTimeById.get(String(b)) ?? 0;
    return bTime - aTime;
  });
}

export async function trimUserImportedGames(
  providerId: string,
  limit: number,
  options?: TrimUserImportedGamesOptions,
): Promise<TrimResult> {
  const importData = await SystemImportData.findOne({ providerId })
    .select('importedGames')
    .lean<{ importedGames: Types.ObjectId[] } | null>();

  if (!importData?.importedGames?.length || importData.importedGames.length <= limit) {
    return {
      trimmed: false,
      keptCount: importData?.importedGames?.length ?? 0,
      evictedCount: 0,
    };
  }

  const gameIds = importData.importedGames;
  const games = await Game.find({ _id: { $in: gameIds } })
    .select('_id end_time analysisRequestedAt analysisScheduledFor')
    .lean<
      {
        _id: Types.ObjectId;
        end_time?: number;
        analysisRequestedAt?: Date;
        analysisScheduledFor?: Date;
      }[]
    >();

  const endTimeById = new Map(
    games.map((game) => [String(game._id), game.end_time ?? 0]),
  );
  const gameById = new Map(games.map((game) => [String(game._id), game]));

  const analyses = await Analysis.find({ game: { $in: gameIds } })
    .select('game moves')
    .lean<Pick<IAnalysis, 'game' | 'moves'>[]>();
  const analysisByGame = new Map(
    analyses.map((row) => [String(row.game), row]),
  );

  const protectedIds: Types.ObjectId[] = [];
  const evictableIds: Types.ObjectId[] = [];

  for (const id of gameIds) {
    const game = gameById.get(String(id));
    const analysis = analysisByGame.get(String(id)) ?? null;
    if (game && isProtectedImportedGame(game, analysis)) {
      protectedIds.push(id);
    } else {
      evictableIds.push(id);
    }
  }

  const prioritizeSet = new Set(
    (options?.prioritizeIds ?? []).map((id) => String(id)),
  );
  const prioritizedEvictable = evictableIds.filter((id) =>
    prioritizeSet.has(String(id)),
  );
  const otherEvictable = evictableIds.filter(
    (id) => !prioritizeSet.has(String(id)),
  );

  const slots = limit - protectedIds.length;
  const keptPrioritized = sortByEndTimeDesc(prioritizedEvictable, endTimeById);
  const remainingSlots = Math.max(0, slots - keptPrioritized.length);
  const keptOther =
    remainingSlots > 0
      ? sortByEndTimeDesc(otherEvictable, endTimeById).slice(0, remainingSlots)
      : [];

  const keptIds = [...protectedIds, ...keptPrioritized, ...keptOther];
  const keptIdSet = new Set(keptIds.map((id) => String(id)));
  const evictedIds = gameIds.filter((id) => !keptIdSet.has(String(id)));

  if (evictedIds.length === 0) {
    return {
      trimmed: false,
      keptCount: gameIds.length,
      evictedCount: 0,
    };
  }

  await SystemImportData.updateOne(
    { providerId },
    { $set: { importedGames: keptIds } },
  );

  await Analysis.deleteMany({ game: { $in: evictedIds } });
  await Game.deleteMany({ _id: { $in: evictedIds } });

  return {
    trimmed: true,
    keptCount: keptIds.length,
    evictedCount: evictedIds.length,
  };
}
