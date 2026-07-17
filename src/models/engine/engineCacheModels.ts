import { Document, Model, model, Schema } from 'mongoose';

/** One MultiPV line from a completed browser Stockfish search. */
export interface IEngineCacheLine {
  multipv: number;
  depth: number;
  centipawns: number | null;
  mate: number | null;
  pv: string[];
}

/**
 * Crowdsourced browser MultiPV analysis for a trainer setup position.
 * One document per position (`fenKey`); upserts only upgrade
 * `(depth, multiPv)`, never downgrade.
 */
export interface IEnginePositionAnalysis extends Document {
  fenKey: string;
  fen: string;
  depth: number;
  multiPv: number;
  lines: IEngineCacheLine[];
  analyzedAt: Date;
}

/**
 * Crowdsourced refutation: the engine reply to a wrong move from a setup
 * position. Keyed by setup position + wrong move.
 */
export interface IEngineRefutation extends Document {
  setupFenKey: string;
  setupFen: string;
  wrongUci: string;
  refutationUci: string;
  refutationSan?: string;
  depth?: number;
  analyzedAt: Date;
}

const engineCacheLineSchema = new Schema<IEngineCacheLine>(
  {
    multipv: { type: Number, required: true },
    depth: { type: Number, required: true },
    centipawns: { type: Number, default: null },
    mate: { type: Number, default: null },
    pv: { type: [String], required: true },
  },
  { _id: false },
);

const enginePositionAnalysisSchema = new Schema<IEnginePositionAnalysis>(
  {
    fenKey: { type: String, required: true, unique: true },
    fen: { type: String, required: true },
    depth: { type: Number, required: true },
    multiPv: { type: Number, required: true },
    lines: { type: [engineCacheLineSchema], required: true },
    analyzedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'engine_position_analyses' },
);

export const EnginePositionAnalysis: Model<IEnginePositionAnalysis> =
  model<IEnginePositionAnalysis>(
    'EnginePositionAnalysis',
    enginePositionAnalysisSchema,
  );

const engineRefutationSchema = new Schema<IEngineRefutation>(
  {
    setupFenKey: { type: String, required: true },
    setupFen: { type: String, required: true },
    wrongUci: { type: String, required: true },
    refutationUci: { type: String, required: true },
    refutationSan: { type: String },
    depth: { type: Number },
    analyzedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'engine_refutations' },
);

engineRefutationSchema.index({ setupFenKey: 1, wrongUci: 1 }, { unique: true });

export const EngineRefutation: Model<IEngineRefutation> =
  model<IEngineRefutation>('EngineRefutation', engineRefutationSchema);
