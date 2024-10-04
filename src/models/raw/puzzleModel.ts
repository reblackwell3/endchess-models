import mongoose, { Document, Schema, Model } from 'mongoose';

// Define the Puzzle interface extending Document
export interface IPuzzle extends Document {
  puzzleId: string;
  fen: string;
  moves: string[];
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string;
  gameUrl: string;
  openingTags: string;
}

// Define the Puzzle schema
const puzzleSchema = new Schema({
  puzzleId: { type: String, required: true },
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  rating: { type: Number, required: true },
  ratingDeviation: { type: Number, required: true },
  popularity: { type: Number, required: true },
  nbPlays: { type: Number, required: true },
  themes: { type: String, required: true },
  gameUrl: { type: String, required: true },
  openingTags: { type: String, required: true },
});

// Create the Puzzle model
export const Puzzle: Model<IPuzzle> = mongoose.model<IPuzzle>(
  'Puzzle',
  puzzleSchema,
);
