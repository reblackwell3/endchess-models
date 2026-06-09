import type { EnrichedGame } from './gameEnrichment';
import { START_FEN } from './gameEnrichment';
import { normalizeFen, positionKey } from './positionUtils';

export type ExplorerOutcomeDelta = {
  whiteWin: number;
  draw: number;
  blackWin: number;
};

export type ExplorerMoveIndexDelta = ExplorerOutcomeDelta & {
  san: string;
  uci: string;
  eloSum: number;
};

export type ExplorerPositionIndexDelta = {
  positionKey: string;
  fen: string;
  move: ExplorerMoveIndexDelta;
  gameId: string;
};

export type ExplorerOccurrenceIndexDelta = {
  positionKey: string;
  gameId: string;
  nextUci: string;
  nextSan: string;
  whiteElo: number;
  blackElo: number;
};

export type ExplorerGameIndex = {
  gameId: string;
  positions: ExplorerPositionIndexDelta[];
  occurrences: ExplorerOccurrenceIndexDelta[];
};

export function explorerGameIdFromEnriched(game: EnrichedGame): string | null {
  if (!game.uuid || game.uuid === 'UNKNOWN') {
    return null;
  }
  return game.uuid;
}

export function outcomeDeltaFromResult(result: string): ExplorerOutcomeDelta {
  if (result === '1-0') {
    return { whiteWin: 1, draw: 0, blackWin: 0 };
  }
  if (result === '0-1') {
    return { whiteWin: 0, draw: 0, blackWin: 1 };
  }
  if (result === '1/2-1/2') {
    return { whiteWin: 0, draw: 1, blackWin: 0 };
  }
  return { whiteWin: 0, draw: 0, blackWin: 0 };
}

/** Build explorer index rows from an enriched game already replayed at import time. */
export function buildExplorerIndexFromGame(
  game: EnrichedGame,
): ExplorerGameIndex | null {
  const gameId = explorerGameIdFromEnriched(game);
  if (!gameId || game.moves.length === 0) {
    return null;
  }

  const whiteElo = game.white.rating;
  const blackElo = game.black.rating;
  const eloSum = Math.round((whiteElo + blackElo) / 2);
  const outcome = outcomeDeltaFromResult(game.result);

  const positions: ExplorerPositionIndexDelta[] = [];
  const occurrences: ExplorerOccurrenceIndexDelta[] = [];

  for (let i = 0; i < game.moves.length; i++) {
    const move = game.moves[i]!;
    const fenBefore = i === 0 ? game.initial_setup || START_FEN : game.moves[i - 1]!.fen;
    const key = positionKey(fenBefore);

    positions.push({
      positionKey: key,
      fen: normalizeFen(fenBefore),
      move: {
        san: move.san,
        uci: move.uci,
        eloSum,
        ...outcome,
      },
      gameId,
    });

    occurrences.push({
      positionKey: key,
      gameId,
      nextUci: move.uci,
      nextSan: move.san,
      whiteElo,
      blackElo,
    });
  }

  return { gameId, positions, occurrences };
}
