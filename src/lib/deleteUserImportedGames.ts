import { Types } from 'mongoose';
import { Analysis } from '../models/raw/analysisModel';
import type { IAnalysis } from '../models/raw/analysisModel';
import { Game } from '../models/raw/gameModel';
import { SystemImportData } from '../models/system/systemImportDataModel';
import { isReadyAnalyzedImportedGame } from './userImportedGameAnalysisStatus';

export type DeleteImportedGamesResult = {
  deletedCount: number;
};

type AnalysisAgeFields = Pick<
  IAnalysis,
  'game' | 'moves' | 'analyzedAt' | 'updatedAt' | 'createdAt'
> & {
  _id?: Types.ObjectId;
};

function analysisCompletedAt(analysis: AnalysisAgeFields): Date | null {
  if (analysis.analyzedAt) {
    return analysis.analyzedAt;
  }
  if (analysis.updatedAt) {
    return analysis.updatedAt;
  }
  if (analysis.createdAt) {
    return analysis.createdAt;
  }
  if (analysis._id instanceof Types.ObjectId) {
    return analysis._id.getTimestamp();
  }
  return null;
}

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

  const analyses = await Analysis.find({ game: { $in: gameIds } })
    .select('game moves analyzedAt updatedAt createdAt')
    .lean<AnalysisAgeFields[]>();

  return analyses
    .filter((row) => {
      if (!isReadyAnalyzedImportedGame(row)) {
        return false;
      }
      const completedAt = analysisCompletedAt(row);
      if (completedAt == null) {
        return false;
      }
      return completedAt < olderThan;
    })
    .map((row) => row.game as Types.ObjectId);
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
