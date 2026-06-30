export type PuzzleCompletionDoc = {
  _id: unknown;
  providerId: string;
  puzzleId: string;
  completedAt: Date;
  puzzle_elo_after?: number;
};
