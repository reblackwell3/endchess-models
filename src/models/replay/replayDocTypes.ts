export type ReplayViewDoc = {
  _id: string;
  providerId: string;
  gameId: string;
  viewedAt: Date;
  /** 1-based half moves the user has reached while replaying this game. */
  seenHalfMoves?: number[];
};
