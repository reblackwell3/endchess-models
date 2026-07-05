import { Document, Model, model, Schema, Types } from 'mongoose';

/** A single half-move, enriched by replaying the game through chess.js. */
export interface IGameMove {
  ply: number; // 1-based half-move index
  san: string; // standard algebraic notation, e.g. "Nf3"
  uci: string; // long algebraic / UCI, e.g. "g1f3"
  clk?: string; // clock remaining (from PGN %clk), e.g. "0:02:58"
  eval?: number; // engine evaluation in pawns (from PGN %eval), if present
}

/** Per-player game info, normalized across platforms. */
export interface IGamePlayer {
  rating: number;
  result: string; // 'win' | 'lose' | 'draw' | 'unknown'
  username: string;
  rating_diff?: number; // e.g. lichess WhiteRatingDiff (+8 / -8)
  title?: string; // e.g. 'GM', 'IM' (when provided)
}

/**
 * Unified, enriched representation of a single chess game, normalized across
 * import sources (lichess, chess.com). Field names are snake_case to match the
 * persisted collection.
 */
export interface IGame extends Document {
  _id: Types.ObjectId;
  import_from: string; // 'lichess' | 'chess.com'
  /** Lichess dump month tag, e.g. "2024-01" from lichess_db_standard_rated_2024-01.pgn.zst */
  import_batch?: string;
  url: string;
  uuid: string; // stable per-source id (lichess game id / chess.com uuid)
  pgn: string; // movetext (no header tags)

  result: string; // '1-0' | '0-1' | '1/2-1/2' | '*'
  eco?: string;
  opening?: string;
  termination?: string;

  end_time: number; // unix seconds
  played_at?: Date;
  utc_date?: string;
  utc_time?: string;

  time_control: string; // e.g. '600+0'
  time_class: string; // 'bullet' | 'blitz' | 'rapid' | 'classical' | 'correspondence'
  rules: string; // e.g. 'Standard'
  variant?: string;
  rated: boolean;

  fen: string; // final position FEN
  initial_setup: string; // starting position FEN
  tcn?: string; // chess.com move encoding (when available)
  ply: number; // number of half-moves

  white: IGamePlayer;
  black: IGamePlayer;
  moves: IGameMove[];
  /** Set when a user-requested engine analysis job is queued. */
  analysisRequestedAt?: Date;
  /** When daily cap is hit, analyze is deferred to the next quota window. */
  analysisScheduledFor?: Date;
}

const playerSchema = new Schema<IGamePlayer>(
  {
    rating: { type: Number, required: true, default: 0 },
    result: { type: String, required: true, default: 'unknown' },
    username: { type: String, required: true, default: 'UNKNOWN' },
    rating_diff: { type: Number },
    title: { type: String },
  },
  { _id: false },
);

const moveSchema = new Schema<IGameMove>(
  {
    ply: { type: Number, required: true },
    san: { type: String, required: true },
    uci: { type: String, required: true },
    clk: { type: String },
    eval: { type: Number },
  },
  { _id: false },
);

const gameSchema = new Schema<IGame>(
  {
    import_from: { type: String, required: true },
    import_batch: { type: String },
    url: { type: String, required: true },
    uuid: { type: String, required: true, default: 'UNKNOWN' },
    pgn: { type: String, required: true },

    result: { type: String, default: '*' },
    eco: { type: String },
    opening: { type: String },
    termination: { type: String },

    end_time: { type: Number, required: true, default: 0 },
    played_at: { type: Date },
    utc_date: { type: String },
    utc_time: { type: String },

    time_control: { type: String, required: true, default: 'UNKNOWN' },
    time_class: { type: String, required: true, default: 'UNKNOWN' },
    rules: { type: String, required: true, default: 'Standard' },
    variant: { type: String },
    rated: { type: Boolean, required: true, default: false },

    fen: { type: String, default: 'UNKNOWN' },
    initial_setup: { type: String, default: 'UNKNOWN' },
    tcn: { type: String },
    ply: { type: Number, default: 0 },

    white: { type: playerSchema, required: true },
    black: { type: playerSchema, required: true },
    moves: { type: [moveSchema], default: [] },
    analysisRequestedAt: { type: Date },
    analysisScheduledFor: { type: Date },
  },
  { timestamps: true },
);

// Dedup / resume key (matches the existing production index). Not unique:
// legacy lichess rows may share uuid 'UNKNOWN'.
gameSchema.index({ import_from: 1, uuid: 1 });
gameSchema.index({ uuid: 1 }, { background: true });
gameSchema.index({ import_from: 1, import_batch: 1 });
gameSchema.index({ import_from: 1, 'white.username': 1 });
gameSchema.index({ import_from: 1, 'black.username': 1 });
gameSchema.index({ end_time: 1 });

export const Game: Model<IGame> = model<IGame>('Game', gameSchema);
