import {
  WorkerHeartbeat,
  WORKER_HEARTBEAT_KEY,
} from '../src/models/system/workerHeartbeatModel';
import {
  getWorkerHeartbeat,
  isWorkerHeartbeatFresh,
  touchWorkerHeartbeat,
  WORKER_HEARTBEAT_STALE_MS,
} from '../src/lib/workerHeartbeat';

describe('workerHeartbeat', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('upserts lastSeenAt on touch', async () => {
    const updateOne = jest
      .spyOn(WorkerHeartbeat, 'updateOne')
      .mockResolvedValue({} as never);
    const at = new Date('2024-06-01T12:00:00.000Z');

    await touchWorkerHeartbeat(at);

    expect(updateOne).toHaveBeenCalledWith(
      { key: WORKER_HEARTBEAT_KEY },
      {
        $set: {
          key: WORKER_HEARTBEAT_KEY,
          lastSeenAt: at,
        },
      },
      { upsert: true },
    );
  });

  it('returns null lastSeenAt when no document exists', async () => {
    jest.spyOn(WorkerHeartbeat, 'findOne').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    } as never);

    await expect(getWorkerHeartbeat()).resolves.toEqual({ lastSeenAt: null });
  });

  it('treats missing and stale heartbeats as not fresh', () => {
    const now = new Date('2024-06-01T12:00:00.000Z');
    expect(isWorkerHeartbeatFresh(null, now)).toBe(false);

    const stale = new Date(now.getTime() - WORKER_HEARTBEAT_STALE_MS - 1);
    expect(isWorkerHeartbeatFresh(stale, now)).toBe(false);

    const fresh = new Date(now.getTime() - WORKER_HEARTBEAT_STALE_MS);
    expect(isWorkerHeartbeatFresh(fresh, now)).toBe(true);
  });
});
