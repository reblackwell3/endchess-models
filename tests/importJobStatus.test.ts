import {
  expireStalePendingImportJob,
  PENDING_IMPORT_TIMEOUT_MS,
} from '../src/lib/importJobStatus';
import { SystemImportData } from '../src/models/system/systemImportDataModel';

jest.mock('../src/models/system/systemImportDataModel', () => ({
  SystemImportData: {
    updateOne: jest.fn(),
  },
}));

const updateOneMock = SystemImportData.updateOne as jest.Mock;

describe('expireStalePendingImportJob', () => {
  beforeEach(() => {
    updateOneMock.mockReset();
    updateOneMock.mockResolvedValue({ modifiedCount: 1 });
  });

  it('marks pending jobs older than 4 hours as failed with timed_out', async () => {
    const now = new Date('2026-07-10T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    await expireStalePendingImportJob('prov-1');

    expect(updateOneMock).toHaveBeenCalledWith(
      {
        providerId: 'prov-1',
        'importJob.status': 'pending',
        'importJob.updatedAt': {
          $lt: new Date(now.getTime() - PENDING_IMPORT_TIMEOUT_MS),
        },
      },
      {
        $set: {
          'importJob.status': 'failed',
          'importJob.error': 'timed_out',
          'importJob.updatedAt': now,
        },
      },
    );

    jest.useRealTimers();
  });
});
