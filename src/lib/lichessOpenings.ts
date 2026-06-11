import { Chess } from 'chess.js';

export type LichessOpeningRow = {
  eco: string;
  name: string;
  pgn: string;
};

export const LICHESS_OPENINGS_VOLUME_FILES = [
  'a.tsv',
  'b.tsv',
  'c.tsv',
  'd.tsv',
  'e.tsv',
] as const;

/** Parse lichess-org/chess-openings TSV (eco, name, pgn). */
export function parseLichessOpeningsTsv(content: string): LichessOpeningRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return [];
  }

  const rows: LichessOpeningRow[] = [];
  for (const line of lines.slice(1)) {
    const tab = line.indexOf('\t');
    if (tab < 0) {
      continue;
    }
    const eco = line.slice(0, tab).trim();
    const rest = line.slice(tab + 1);
    const secondTab = rest.indexOf('\t');
    if (secondTab < 0) {
      continue;
    }
    const name = rest.slice(0, secondTab).trim();
    const pgn = rest.slice(secondTab + 1).trim();
    if (!eco || !name || !pgn) {
      continue;
    }
    rows.push({ eco: eco.toUpperCase(), name, pgn });
  }
  return rows;
}

export function pgnMovetextToSans(pgn: string): string[] {
  return pgn
    .replace(/\d+\.\s*/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token));
}

export function fenAtSansPly(sans: string[], ply: number): string | null {
  const chess = new Chess();
  for (let i = 0; i < ply && i < sans.length; i += 1) {
    const move = chess.move(sans[i]!);
    if (!move) {
      return null;
    }
  }
  return chess.fen();
}

/** FEN after playing through a lichess opening movetext line. */
export function fenFromOpeningPgn(pgn: string): string | null {
  const sans = pgnMovetextToSans(pgn);
  if (sans.length === 0) {
    return null;
  }
  return fenAtSansPly(sans, sans.length);
}
