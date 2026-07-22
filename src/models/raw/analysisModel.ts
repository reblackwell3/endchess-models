// src/models/raw/analysisModel.ts
import { Document, model, Schema, Types } from 'mongoose';
import type { MoveQuality } from '../../analysis/moveQualityThresholds';

export interface IAnalysisMoveQualityCounts {
  best: number;
  strong: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
}

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
  /** Precomputed counts for summary views; absent on analysis written before this field existed. */
  moveQualityCounts?: IAnalysisMoveQualityCounts;
  /** True when this document contains completed analysis in the current flat move format. */
  isReady?: boolean;
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
    moveQualityCounts: {
      best: { type: Number, required: true },
      strong: { type: Number, required: true },
      inaccuracy: { type: Number, required: true },
      mistake: { type: Number, required: true },
      blunder: { type: Number, required: true },
    },
    isReady: { type: Boolean },
    analyzedAt: { type: Date },
  },
  { timestamps: true },
);

export function summarizeAnalysisMoves(
  moves: readonly IAnalysisMove[],
): {
  moveQualityCounts: IAnalysisMoveQualityCounts;
  isReady: true;
} {
  const moveQualityCounts: IAnalysisMoveQualityCounts = {
    best: 0,
    strong: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  for (const move of moves) {
    moveQualityCounts[move.quality] += 1;
  }

  return { moveQualityCounts, isReady: true };
}

analysisSchema.pre('validate', function () {
  if (this.isModified('moves')) {
    const moves = this.get('moves') as IAnalysisMove[] | undefined;
    this.set(summarizeAnalysisMoves(moves ?? []));
  }
});

function addSummaryToMovesUpdate(this: {
  getUpdate(): unknown;
  setUpdate(update: unknown): void;
}): void {
  const update = this.getUpdate();
  if (update == null || Array.isArray(update) || typeof update !== 'object') {
    return;
  }

  const updateRecord = update as Record<string, unknown>;
  const setRecord =
    updateRecord.$set != null && typeof updateRecord.$set === 'object'
      ? (updateRecord.$set as Record<string, unknown>)
      : undefined;
  const moves = setRecord?.moves ?? updateRecord.moves;
  if (!Array.isArray(moves)) {
    return;
  }

  const summary = summarizeAnalysisMoves(moves as IAnalysisMove[]);
  if (setRecord) {
    Object.assign(setRecord, summary);
  } else {
    Object.assign(updateRecord, summary);
  }
  this.setUpdate(updateRecord);
}

analysisSchema.pre('findOneAndUpdate', addSummaryToMovesUpdate);
analysisSchema.pre('findOneAndReplace', addSummaryToMovesUpdate);
analysisSchema.pre('replaceOne', addSummaryToMovesUpdate);
analysisSchema.pre('updateOne', addSummaryToMovesUpdate);
analysisSchema.pre('updateMany', addSummaryToMovesUpdate);

analysisSchema.index({ game: 1 });

export const Analysis = model<IAnalysis>('Analysis', analysisSchema);

/** New flat shape has `quality` on each row; legacy nested docs have `lines`. */
export function isFlatAnalysisDoc(
  analysis:
    | (Pick<IAnalysis, 'moves'> & Partial<Pick<IAnalysis, 'isReady'>>)
    | null
    | undefined,
): boolean {
  if (analysis?.isReady != null) return analysis.isReady;
  const first = analysis?.moves?.[0];
  if (!first) return analysis != null;
  return 'quality' in first && !('lines' in first);
}
