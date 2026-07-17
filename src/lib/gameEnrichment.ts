import { Chess } from 'chess.js';
import { parse, type PgnHeader, type PgnMove } from 'pgn-parser';
import type { IGameMove, IGamePlayer } from '../models/raw/gameModel';

export const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** A plain (non-Mongoose) enriched game object, ready to persist as a `Game`. */
export interface EnrichedGame {
  import_from: string;
  import_batch?: string;
  url: string;
  uuid: string;
  pgn: string;
  result: string;
  eco?: string;
  opening?: string;
  /** Canonical opening family id from opening_families. */
  openingFamilyId?: number;
  /** Canonical lichess opening line id from opening_branch_fens. */
  openingLineId?: number;
  termination?: string;
  end_time: number;
  played_at?: Date;
  utc_date?: string;
  utc_time?: string;
  time_control: string;
  time_class: string;
  rules: string;
  variant?: string;
  rated: boolean;
  fen: string;
  initial_setup: string;
  tcn?: string;
  ply: number;
  white: IGamePlayer;
  black: IGamePlayer;
  moves: IGameMove[];
}

/** Platform-authoritative values that should override anything parsed from PGN. */
export interface EnrichOverrides {
  importFrom: string; // required: 'lichess' | 'chess.com'
  url?: string;
  uuid?: string;
  end_time?: number;
  time_control?: string;
  time_class?: string;
  rated?: boolean;
  rules?: string;
  tcn?: string;
  eco?: string;
  opening?: string;
}

export class GameEnrichmentError extends Error {}

function headerMap(headers: PgnHeader[] | null): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { name, value } of headers ?? []) map[name] = value;
  return map;
}

function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const t = value.trim();
  return t === '' || t === '?' ? undefined : t;
}

function toInt(value: string | undefined): number | undefined {
  const c = clean(value);
  if (c === undefined) return undefined;
  const n = Number.parseInt(c, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Lichess-style speed classification from a "base+inc" time control. */
export function deriveTimeClass(timeControl: string | undefined): string {
  const tc = clean(timeControl);
  if (!tc || tc === '-') return 'correspondence';
  // Correspondence dumps can look like "1/259200" (days per move).
  if (tc.includes('/')) return 'correspondence';
  const [baseStr, incStr] = tc.split('+');
  const base = Number.parseInt(baseStr ?? '', 10);
  const inc = Number.parseInt(incStr ?? '0', 10);
  if (!Number.isFinite(base)) return 'UNKNOWN';
  const estimated = base + 40 * (Number.isFinite(inc) ? inc : 0);
  if (estimated < 180) return 'bullet';
  if (estimated < 480) return 'blitz';
  if (estimated < 1500) return 'rapid';
  return 'classical';
}

/** Map a PGN result token to per-color win/lose/draw. */
export function perColorResults(result: string | undefined): {
  white: string;
  black: string;
} {
  switch (result) {
    case '1-0':
      return { white: 'win', black: 'lose' };
    case '0-1':
      return { white: 'lose', black: 'win' };
    case '1/2-1/2':
      return { white: 'draw', black: 'draw' };
    default:
      return { white: 'unknown', black: 'unknown' };
  }
}

/** Extract the lichess game id from a game URL (e.g. .../n0s2a3yv -> n0s2a3yv). */
export function gameIdFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const m = url.match(/(?:lichess\.org|chess\.com\/game\/(?:live|daily))\/(\w+)/i);
  if (m) return m[1];
  const tail = url.split('/').filter(Boolean).pop();
  return tail || undefined;
}

function unixSeconds(
  utcDate: string | undefined,
  utcTime: string | undefined,
): number | undefined {
  const d = clean(utcDate);
  if (!d) return undefined;
  const iso = `${d.replace(/\./g, '-')}T${clean(utcTime) ?? '00:00:00'}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
}

/** Prefer Lichess-style UTCDate; fall back to standard PGN Date for OTB imports. */
function pgnDateHeader(h: Record<string, string>): string | undefined {
  return clean(h['UTCDate']) ?? clean(h['Date']);
}

function commentText(comments: PgnMove['comments']): string {
  if (!comments) return '';
  return comments
    .map((c) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object' && 'text' in c && typeof (c as { text?: unknown }).text === 'string') {
        return (c as { text: string }).text;
      }
      return '';
    })
    .join(' ');
}

function extractClk(text: string): string | undefined {
  const m = text.match(/\[%clk\s+([0-9:.]+)\]/);
  return m ? m[1] : undefined;
}

function extractEval(text: string): number | undefined {
  const m = text.match(/\[%eval\s+(#?-?[0-9.]+)\]/);
  if (!m) return undefined;
  const raw = m[1]!;
  if (raw.startsWith('#')) {
    // Mate score -> large signed pawn value.
    const mateIn = Number.parseInt(raw.slice(1), 10);
    return mateIn >= 0 ? 1000 : -1000;
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Strip PGN header tag-pairs, returning normalized single-line movetext. */
export function extractMovetext(pgn: string): string {
  return pgn
    .split('\n')
    .filter((line) => !line.trim().startsWith('['))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rebuild clean, comment-free movetext from SAN moves + result. */
export function buildMovetext(moves: IGameMove[], result: string): string {
  const parts: string[] = [];
  moves.forEach((m, i) => {
    if (i % 2 === 0) parts.push(`${i / 2 + 1}.`);
    parts.push(m.san);
  });
  if (result && result !== '*') parts.push(result);
  return parts.join(' ');
}

/**
 * Parse + replay a PGN into a fully enriched, persist-ready game object.
 * Platform-authoritative fields in `overrides` win over anything in the PGN.
 */
export function enrichGameFromPgn(
  pgn: string,
  overrides: EnrichOverrides,
): EnrichedGame {
  let parsed;
  try {
    parsed = parse(pgn);
  } catch (err) {
    throw new GameEnrichmentError(
      `Failed to parse PGN: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const game = parsed[0];
  if (!game) throw new GameEnrichmentError('PGN contained no game');

  const h = headerMap(game.headers);
  const result = clean(h['Result']) ?? game.result ?? '*';
  const colorResults = perColorResults(result);

  const initialSetup = clean(h['FEN']) ?? START_FEN;
  const chess = new Chess(initialSetup === START_FEN ? undefined : initialSetup);

  const moves: IGameMove[] = [];
  game.moves.forEach((m, i) => {
    let moveResult;
    try {
      moveResult = chess.move(m.move);
    } catch (err) {
      throw new GameEnrichmentError(
        `Illegal move "${m.move}" at ply ${i + 1}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const text = commentText(m.comments);
    const move: IGameMove = {
      ply: i + 1,
      san: moveResult.san,
      uci: `${moveResult.from}${moveResult.to}${moveResult.promotion ?? ''}`,
    };
    const clk = extractClk(text);
    if (clk) move.clk = clk;
    const ev = extractEval(text);
    if (ev !== undefined) move.eval = ev;
    moves.push(move);
  });

  const url = overrides.url ?? clean(h['Site']) ?? clean(h['LichessURL']) ?? '';
  const timeControl = overrides.time_control ?? clean(h['TimeControl']) ?? 'UNKNOWN';
  const pgnDate = pgnDateHeader(h);
  const pgnTime = clean(h['UTCTime']);
  const endTime =
    overrides.end_time ?? unixSeconds(pgnDate, pgnTime) ?? 0;
  const rated =
    overrides.rated ?? /rated/i.test(clean(h['Event']) ?? '') ? true : false;

  const white: IGamePlayer = {
    rating: toInt(h['WhiteElo']) ?? 0,
    result: colorResults.white,
    username: clean(h['White']) ?? 'UNKNOWN',
  };
  const black: IGamePlayer = {
    rating: toInt(h['BlackElo']) ?? 0,
    result: colorResults.black,
    username: clean(h['Black']) ?? 'UNKNOWN',
  };
  const wDiff = toInt(h['WhiteRatingDiff']);
  if (wDiff !== undefined) white.rating_diff = wDiff;
  const bDiff = toInt(h['BlackRatingDiff']);
  if (bDiff !== undefined) black.rating_diff = bDiff;
  const wTitle = clean(h['WhiteTitle']);
  if (wTitle) white.title = wTitle;
  const bTitle = clean(h['BlackTitle']);
  if (bTitle) black.title = bTitle;

  const enriched: EnrichedGame = {
    import_from: overrides.importFrom,
    url,
    uuid: overrides.uuid ?? gameIdFromUrl(url) ?? 'UNKNOWN',
    pgn: buildMovetext(moves, result),
    result,
    end_time: endTime,
    time_control: timeControl,
    time_class: overrides.time_class ?? deriveTimeClass(timeControl),
    rules: overrides.rules ?? 'Standard',
    rated,
    fen: chess.fen(),
    initial_setup: initialSetup,
    ply: moves.length,
    white,
    black,
    moves,
  };

  const eco = clean(h['ECO']) ?? clean(overrides.eco);
  if (eco) enriched.eco = eco;
  const opening = clean(h['Opening']) ?? clean(overrides.opening);
  if (opening) enriched.opening = opening;
  const termination = clean(h['Termination']);
  if (termination) enriched.termination = termination;
  const variant = clean(h['Variant']);
  if (variant) enriched.variant = variant;
  if (overrides.tcn) enriched.tcn = overrides.tcn;
  if (pgnDate) enriched.utc_date = pgnDate;
  if (pgnTime) enriched.utc_time = pgnTime;
  if (endTime) enriched.played_at = new Date(endTime * 1000);

  return enriched;
}
