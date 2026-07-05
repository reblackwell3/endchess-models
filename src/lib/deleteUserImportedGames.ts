import { Types } from 'mongoose';
import { Analysis } from '../models/raw/analysisModel';
import type { IAnalysis } from '../models/raw/analysisModel';
import { Game } from '../models/raw/gameModel';
import { SystemImportData } from '../models/system/systemImportDataModel';
import { isReadyAnalyzedImportedGame } from './userImportedGameAnalysisStatus';

export type DeleteImportedGamesResult = {
  deletedCount: number;
};

async function findReadyAnalyzedGameIdsOlderThan(
  providerId: string,
  olderThan: Date,
): Promise<Types.ObjectId[]> {
  const importData = await SystemImportData.findOne({ providerId })
    .select('importedGames')
    .lean<{ importedGames: Types.ObjectId[] } | null>();

  const gameIds = importData?.importedGames ?? [];
  if (gameIds.length === 0) {
    return [];
  }

  const olderThanSeconds = Math.floor(olderThan.getTime() / 1000);

  const candidateGames = await Game.find({
    _id: { $in: gameIds },
    end_time: { $lt: olderThanSeconds },
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId }[]>();

  if (candidateGames.length === 0) {
    return [];
  }

  const candidateIds = candidateGames.map((game) => game._id);
  const analyses = await Analysis.find({ game: { $in: candidateIds } })
    .select('game moves')
    .lean<Pick<IAnalysis, 'game' | 'moves'>[]>();

  const analysisByGame = new Map(
    analyses.map((row) => [String(row.game), row]),
  );

  return candidateIds.filter((id) =>
    isReadyAnalyzedImportedGame(analysisByGame.get(String(id)) ?? null),
  );
}

export async function countAnalyzedUserGamesOlderThan(
  providerId: string,
  olderThan: Date,
): Promise<number> {
  const ids = await findReadyAnalyzedGameIdsOlderThan(providerId, olderThan);
  return ids.length;
}

async function hardDeleteImportedGames(
  providerId: string,
  gameObjectIds: Types.ObjectId[],
): Promise<number> {
  if (gameObjectIds.length === 0) {
    return 0;
  }

  await SystemImportData.updateOne(
    { providerId },
    { $pull: { importedGames: { $in: gameObjectIds } } },
  );
  await Analysis.deleteMany({ game: { $in: gameObjectIds } });
  const result = await Game.deleteMany({ _id: { $in: gameObjectIds } });
  return result.deletedCount ?? 0;
}

export async function deleteUserImportedGame(
  providerId: string,
  gameObjectId: Types.ObjectId,
): Promise<{ deleted: boolean }> {
  const importData = await SystemImportData.findOne({ providerId })
    .select('importedGames')
    .lean<{ importedGames: Types.ObjectId[] } | null>();

  const owned = importData?.importedGames?.some(
    (id) => String(id) === String(gameObjectId),
  );
  if (!owned) {
    return { deleted: false };
  }

  const deletedCount = await hardDeleteImportedGames(providerId, [gameObjectId]);
  return { deleted: deletedCount > 0 };
}

export async function deleteAnalyzedUserGamesOlderThan(
  providerId: string,
  olderThan: Date,
): Promise<DeleteImportedGamesResult> {
  const toDelete = await findReadyAnalyzedGameIdsOlderThan(providerId, olderThan);
  const deletedCount = await hardDeleteImportedGames(providerId, toDelete);
  return { deletedCount };
}
