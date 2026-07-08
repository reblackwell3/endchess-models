import { Document, Model, model, Schema } from 'mongoose';

export interface ITopMove {
  uci: string;
  scoreCp: number;
  /** Full UCI principal variation from Stockfish MultiPV (optional on legacy cache rows). */
  pv?: string;
}

/** Cached Stockfish eval for a normalized position at a given search depth. */
export interface IPositionEval extends Document {
  fenKey: string;
  depth: number;
  bestMoveUci: string;
  bestScoreCp: number;
  topMoves: ITopMove[];
  analyzedAt: Date;
}

const topMoveSchema = new Schema<ITopMove>(
  {
    uci: { type: String, required: true },
    scoreCp: { type: Number, required: true },
    pv: { type: String },
  },
  { _id: false },
);

const positionEvalSchema = new Schema<IPositionEval>(
  {
    fenKey: { type: String, required: true, index: true },
    depth: { type: Number, required: true, index: true },
    bestMoveUci: { type: String, required: true },
    bestScoreCp: { type: Number, required: true },
    topMoves: { type: [topMoveSchema], required: true },
    analyzedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'position_evals' },
);

positionEvalSchema.index({ fenKey: 1, depth: 1 }, { unique: true });

export const PositionEval: Model<IPositionEval> = model<IPositionEval>(
  'PositionEval',
  positionEvalSchema,
);
