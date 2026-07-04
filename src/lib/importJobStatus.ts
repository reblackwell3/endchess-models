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
  await SystemImportData.updateOne(
    { providerId, 'importJob.status': 'pending' },
    {
      $set: {
        'importJob.status': 'complete',
        'importJob.updatedAt': new Date(),
      },
    },
  );
}
