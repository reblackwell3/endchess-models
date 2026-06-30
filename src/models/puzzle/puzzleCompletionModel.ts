import mongoose, { Schema } from 'mongoose';
import type { PuzzleCompletionDoc } from './puzzleCompletionDocTypes';

const puzzleCompletionSchema = new Schema<PuzzleCompletionDoc>(
  {
    providerId: { type: String, required: true },
    puzzleId: { type: String, required: true },
    completedAt: { type: Date, default: () => new Date() },
    puzzle_elo_after: { type: Number },
  },
  { timestamps: false, versionKey: false },
);

puzzleCompletionSchema.index({ providerId: 1, puzzleId: 1 }, { unique: true });
puzzleCompletionSchema.index({ providerId: 1, completedAt: -1 });

export const PuzzleCompletion =
  mongoose.models.PuzzleCompletion ??
  mongoose.model<PuzzleCompletionDoc>(
    'PuzzleCompletion',
    puzzleCompletionSchema,
    'puzzle_completions',
  );
