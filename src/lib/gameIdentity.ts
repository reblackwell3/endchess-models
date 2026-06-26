import type { PipelineStage } from 'mongoose';

export const UNKNOWN_GAME_UUID = 'UNKNOWN';

/** True when uuid is a non-empty stable game id (not the legacy UNKNOWN sentinel). */
export function isStableGameUuid(
  uuid: string | undefined | null,
): uuid is string {
  return Boolean(uuid && uuid !== UNKNOWN_GAME_UUID);
}

export function gameFilterByUuid(gameId: string): { uuid: string } {
  return { uuid: gameId };
}

export function gameFilterByUuids(gameIds: string[]): { uuid: { $in: string[] } } {
  return { uuid: { $in: gameIds } };
}

/** Mongo filter for games rows with missing or legacy UNKNOWN uuid. */
export function unstableUuidGameFilter(): {
  $or: Array<{ uuid: { $exists: false } } | { uuid: '' } | { uuid: typeof UNKNOWN_GAME_UUID }>;
} {
  return {
    $or: [
      { uuid: { $exists: false } },
      { uuid: '' },
      { uuid: UNKNOWN_GAME_UUID },
    ],
  };
}

/** Join position_occurrences.gameId to games.uuid (index-friendly). */
export function gameLookupByUuidStage(): PipelineStage {
  return {
    $lookup: {
      from: 'games',
      localField: 'gameId',
      foreignField: 'uuid',
      as: 'game',
    },
  };
}
