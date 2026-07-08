// src/models/raw/analysisModel.ts
import { Document, model, Schema, Types } from 'mongoose';
import type { MoveQuality } from '../../analysis/moveQualityThresholds';

export interface IAnalysisMove {
  plyIndex: number;
  fen: string;
  playedUci: string;
  diff: number;
  setupEvalCp: number;
  analysisDepth: number;
  isTopMove: boolean;
  quality: MoveQuality;
  expectedPointsLost: number;
  bestUci?: string;
  refutationUci?: string;
}

export interface IAnalysis extends Document {
  game: Types.ObjectId;
  moves: IAnalysisMove[];
  /** When the flat analysis was completed (used for import retention). */
  analyzedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const analysisMoveSchema = new Schema<IAnalysisMove>(
  {
    plyIndex: { type: Number, required: true },
    fen: { type: String, required: true },
    playedUci: { type: String, required: true },
    diff: { type: Number, required: true },
    setupEvalCp: { type: Number, required: true },
    analysisDepth: { type: Number, required: true },
    isTopMove: { type: Boolean, required: true },
    quality: {
      type: String,
      required: true,
      enum: ['best', 'strong', 'inaccuracy', 'mistake', 'blunder'],
    },
    expectedPointsLost: { type: Number, required: true },
    bestUci: { type: String },
    refutationUci: { type: String },
  },
  { _id: false },
);

const analysisSchema: Schema = new Schema(
  {
    game: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    moves: [analysisMoveSchema],
    analyzedAt: { type: Date },
  },
  { timestamps: true },
);

export const Analysis = model<IAnalysis>('Analysis', analysisSchema);

/** New flat shape has `quality` on each row; legacy nested docs have `lines`. */
export function isFlatAnalysisDoc(
  analysis: Pick<IAnalysis, 'moves'> | null | undefined,
): boolean {
  const first = analysis?.moves?.[0];
  if (!first) return analysis != null;
  return 'quality' in first && !('lines' in first);
}
