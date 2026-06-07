import mongoose, { Document, Schema, Model, Types } from 'mongoose';

/** Puzzle fields as stored in Mongo (Lichess CSV import). */
export interface IPuzzleFields {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  RatingDeviation: number;
  Popularity: number;
  NbPlays: number;
  Themes: string;
  GameUrl: string;
  OpeningTags: string;
}

/** Lean puzzle document returned from queries. */
export type IPuzzle = IPuzzleFields & { _id: Types.ObjectId };

export interface IPuzzleDocument extends IPuzzleFields, Document {}

const puzzleSchema = new Schema<IPuzzleDocument>({
  PuzzleId: { type: String, required: true },
  FEN: { type: String, required: true },
  Moves: { type: String, required: true },
  Rating: { type: Number, required: true },
  RatingDeviation: { type: Number, required: true },
  Popularity: { type: Number, required: true },
  NbPlays: { type: Number, required: true },
  Themes: { type: String, required: true },
  GameUrl: { type: String, required: true },
  OpeningTags: { type: String, required: true },
});

// Backs the rating-range $match in the puzzle fetch (puzzleRepo.findRandomPuzzle).
puzzleSchema.index({ Rating: 1 });

export const Puzzle: Model<IPuzzleDocument> = mongoose.model<IPuzzleDocument>(
  'Puzzle',
  puzzleSchema,
);
