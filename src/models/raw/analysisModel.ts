// src/models/raw/analysisModel.ts
import { Document, model, Schema, Types } from 'mongoose';

export interface IAnalysis extends Document {
  game: Types.ObjectId;
  isTopMove: boolean;
  diff: number;
  fen: string;
  move: string;
}

// Create the Analysis schema
const analysisSchema: Schema = new Schema({
  // I removed Schema<IAnalysis> because of game ref
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  isTopMove: { type: Boolean, required: true },
  diff: { type: Number, required: true },
  fen: { type: String, required: true },
  move: { type: String, required: true },
});

// Create the Analysis model
export const Analysis = model<IAnalysis>('Analysis', analysisSchema);
