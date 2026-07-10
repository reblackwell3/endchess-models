import type {
  ImportJobError,
  ImportJobStatus,
  ImportPlatform,
} from 'endchess-contracts';
import { SystemImportData } from '../models/system/systemImportDataModel';

export type ImportJobRecord = {
  status: ImportJobStatus;
  platform?: ImportPlatform;
  username?: string;
  error?: ImportJobError;
  updatedAt: Date;
};

export async function setImportJobPending(
  providerId: string,
  platform: ImportPlatform,
  username: string,
): Promise<void> {
  await SystemImportData.findOneAndUpdate(
    { providerId },
    {
      $set: {
        importJob: {
          status: 'pending',
          platform,
          username,
          updatedAt: new Date(),
        },
      },
    },
    { upsert: true },
  );
}

export async function setImportJobFailed(
  providerId: string,
  error: ImportJobError,
  platform?: ImportPlatform,
  username?: string,
): Promise<void> {
  await SystemImportData.findOneAndUpdate(
    { providerId },
    {
      $set: {
        importJob: {
          status: 'failed',
          platform,
          username,
          error,
          updatedAt: new Date(),
        },
      },
    },
    { upsert: true },
  );
}

export async function setImportJobComplete(providerId: string): Promise<void> {
  const result = await SystemImportData.updateOne(
    { providerId, 'importJob.status': 'pending' },
    {
      $set: {
        'importJob.status': 'complete',
        'importJob.updatedAt': new Date(),
      },
    },
  );

  if ((result.modifiedCount ?? 0) === 0) {
    console.warn(
      `setImportJobComplete: no pending import job updated for providerId=${providerId}`,
    );
  }
}

export const PENDING_IMPORT_TIMEOUT_MS = 4 * 60 * 60 * 1000;

export async function expireStalePendingImportJob(
  providerId: string,
): Promise<void> {
  const staleBefore = new Date(Date.now() - PENDING_IMPORT_TIMEOUT_MS);
  await SystemImportData.updateOne(
    {
      providerId,
      'importJob.status': 'pending',
      'importJob.updatedAt': { $lt: staleBefore },
    },
    {
      $set: {
        'importJob.status': 'failed',
        'importJob.error': 'timed_out',
        'importJob.updatedAt': new Date(),
      },
    },
  );
}
