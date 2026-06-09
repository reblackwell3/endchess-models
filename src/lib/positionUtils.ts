import crypto from 'crypto';

/** Normalize a FEN to the first four fields (piece placement + side + castling + en passant). */
export function normalizeFen(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) {
    throw new Error(`Invalid FEN: ${fen}`);
  }
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/** Stable position id used by explorer `positions` and `position_occurrences`. */
export function positionKey(fen: string): string {
  const normalized = normalizeFen(fen);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
