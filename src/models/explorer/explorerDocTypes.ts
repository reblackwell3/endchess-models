/** Per-UCI move stats stored on explorer `positions` documents. */
export type ExplorerMoveStatByUciDoc = {
  san: string;
  games: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  eloSum: number;
  lastPlayedYear?: number;
};

/** Mongo shape written by endchess-batch-import explorer index. */
export type ExplorerPositionDoc = {
  _id: string;
  fen: string;
  totalGames: number;
  movesByUci:
    | Record<string, ExplorerMoveStatByUciDoc>
    | Map<string, ExplorerMoveStatByUciDoc>;
};

export type PositionOccurrenceDoc = {
  positionKey: string;
  gameId: string;
  nextUci: string;
  nextSan: string;
  whiteElo: number;
  blackElo: number;
};
