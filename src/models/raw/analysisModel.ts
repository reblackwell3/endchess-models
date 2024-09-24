// src/models/raw/analysisModel.ts
import { Document, model, Schema, Types } from 'mongoose';

export interface IAnalysis extends Document {
  game: Types.ObjectId;
  moves: {
    moveNumber: number;
    move: string;
    lines: {
      lineNumber: number;
      isTopMove: boolean;
      diff: number;
      fen: string;
    }[];
  }[];
}

// Create the Analysis schema
const analysisSchema: Schema = new Schema({
  game: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  moves: [
    {
      moveNumber: { type: Number, required: true },
      move: { type: String, required: true },
      lines: [
        {
          lineNumber: { type: Number, required: true },
          isTopMove: { type: Boolean, required: true },
          diff: { type: Number, required: true },
          fen: { type: String, required: true },
        },
      ],
    },
  ],
});

// Create the Analysis model
export const Analysis = model<IAnalysis>('Analysis', analysisSchema);
