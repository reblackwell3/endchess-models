import { Types } from 'mongoose';
import { Analysis } from '../models/raw/analysisModel';
import { Game } from '../models/raw/gameModel';
import { SystemImportData } from '../models/system/systemImportDataModel';

const DEFAULT_USER_IMPORTED_GAMES_LIMIT = 1000;

type TrimResult = {
  trimmed: boolean;
  keptCount: number;
  evictedCount: number;
};

export async function trimUserImportedGames(
  providerId: string,
  limit: number = DEFAULT_USER_IMPORTED_GAMES_LIMIT,
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

  const sortedIds = [...gameIds].sort((a, b) => {
    const aTime = endTimeById.get(String(a)) ?? 0;
    const bTime = endTimeById.get(String(b)) ?? 0;
    return bTime - aTime;
  });

  const keptIds = sortedIds.slice(0, limit);
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
