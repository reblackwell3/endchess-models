import { Types } from 'mongoose';
import { Analysis } from '../models/raw/analysisModel';
import { Game } from '../models/raw/gameModel';
import { SystemImportData } from '../models/system/systemImportDataModel';

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
    .select('_id end_time')
    .lean<{ _id: Types.ObjectId; end_time?: number }[]>();

  const endTimeById = new Map(
    games.map((game) => [String(game._id), game.end_time ?? 0]),
  );

  const prioritizeSet = new Set(
    (options?.prioritizeIds ?? []).map((id) => String(id)),
  );
  const validPrioritize = gameIds.filter((id) => prioritizeSet.has(String(id)));

  let keptIds: Types.ObjectId[];
  if (validPrioritize.length > 0) {
    const prioritizedKept = sortByEndTimeDesc(validPrioritize, endTimeById).slice(
      0,
      limit,
    );
    const remainingSlots = limit - prioritizedKept.length;
    const otherIds = gameIds.filter((id) => !prioritizeSet.has(String(id)));
    const otherKept =
      remainingSlots > 0
        ? sortByEndTimeDesc(otherIds, endTimeById).slice(0, remainingSlots)
        : [];
    keptIds = [...prioritizedKept, ...otherKept];
  } else {
    keptIds = sortByEndTimeDesc(gameIds, endTimeById).slice(0, limit);
  }

  const keptIdSet = new Set(keptIds.map((id) => String(id)));
  const evictedIds = gameIds.filter((id) => !keptIdSet.has(String(id)));

  await SystemImportData.updateOne(
    { providerId },
    { $set: { importedGames: keptIds } },
  );

  if (evictedIds.length > 0) {
    await Analysis.deleteMany({ game: { $in: evictedIds } });
    await Game.deleteMany({ _id: { $in: evictedIds } });
  }

  return {
    trimmed: true,
    keptCount: keptIds.length,
    evictedCount: evictedIds.length,
  };
}
