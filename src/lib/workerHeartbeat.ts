import {
  WorkerHeartbeat,
  WORKER_HEARTBEAT_KEY,
  type IWorkerHeartbeatFields,
} from '../models/system/workerHeartbeatModel';

/** Workers should call touchWorkerHeartbeat at least this often. */
export const WORKER_HEARTBEAT_INTERVAL_MS = 30_000;

/** Health treats workers as stale after this many ms without a heartbeat. */
export const WORKER_HEARTBEAT_STALE_MS = 90_000;

export type WorkerHeartbeatSnapshot = {
  lastSeenAt: Date | null;
};

export async function touchWorkerHeartbeat(
  at: Date = new Date(),
): Promise<void> {
  await WorkerHeartbeat.updateOne(
    { key: WORKER_HEARTBEAT_KEY },
    {
      $set: {
        key: WORKER_HEARTBEAT_KEY,
        lastSeenAt: at,
      },
    },
    { upsert: true },
  );
}

export async function getWorkerHeartbeat(): Promise<WorkerHeartbeatSnapshot> {
  const meta = await WorkerHeartbeat.findOne({ key: WORKER_HEARTBEAT_KEY })
    .select('lastSeenAt')
    .lean<Pick<IWorkerHeartbeatFields, 'lastSeenAt'>>();

  return {
    lastSeenAt: meta?.lastSeenAt ?? null,
  };
}

export function isWorkerHeartbeatFresh(
  lastSeenAt: Date | null,
  now: Date = new Date(),
  staleAfterMs: number = WORKER_HEARTBEAT_STALE_MS,
): boolean {
  if (!lastSeenAt) {
    return false;
  }
  return now.getTime() - lastSeenAt.getTime() <= staleAfterMs;
}
