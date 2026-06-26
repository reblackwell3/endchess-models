import {
  UNKNOWN_GAME_UUID,
  gameFilterByUuid,
  gameFilterByUuids,
  gameLookupByUuidStage,
  isStableGameUuid,
  unstableUuidGameFilter,
} from '../src/lib/gameIdentity';

describe('isStableGameUuid', () => {
  it('accepts non-empty ids', () => {
    expect(isStableGameUuid('abc123')).toBe(true);
    expect(isStableGameUuid('twic1648-deadbeef')).toBe(true);
  });

  it('rejects missing, empty, and UNKNOWN', () => {
    expect(isStableGameUuid(undefined)).toBe(false);
    expect(isStableGameUuid(null)).toBe(false);
    expect(isStableGameUuid('')).toBe(false);
    expect(isStableGameUuid(UNKNOWN_GAME_UUID)).toBe(false);
  });
});

describe('gameFilterByUuid', () => {
  it('matches on games.uuid', () => {
    expect(gameFilterByUuid('x1')).toEqual({ uuid: 'x1' });
    expect(gameFilterByUuids(['a', 'b'])).toEqual({ uuid: { $in: ['a', 'b'] } });
  });
});

describe('gameLookupByUuidStage', () => {
  it('uses localField/foreignField equality join', () => {
    expect(gameLookupByUuidStage()).toEqual({
      $lookup: {
        from: 'games',
        localField: 'gameId',
        foreignField: 'uuid',
        as: 'game',
      },
    });
  });
});

describe('unstableUuidGameFilter', () => {
  it('matches missing, empty, and UNKNOWN uuids', () => {
    expect(unstableUuidGameFilter()).toEqual({
      $or: [
        { uuid: { $exists: false } },
        { uuid: '' },
        { uuid: UNKNOWN_GAME_UUID },
      ],
    });
  });
});
