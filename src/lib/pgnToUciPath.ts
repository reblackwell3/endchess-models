import { Chess } from 'chess.js';
import { pgnMovetextToSans } from './lichessOpenings';

export function sanMovesToUciPath(sans: readonly string[]): string[] | null {
  const chess = new Chess();
  const uciPath: string[] = [];

  for (const san of sans) {
    const move = chess.move(san);
    if (!move) return null;
    uciPath.push(`${move.from}${move.to}${move.promotion ?? ''}`);
  }

  return uciPath;
}

export function openingPgnToUciPath(pgn: string): string[] | null {
  const sans = pgnMovetextToSans(pgn);
  if (sans.length === 0) return null;
  return sanMovesToUciPath(sans);
}
