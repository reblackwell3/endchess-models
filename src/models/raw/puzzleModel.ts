import mongoose from 'mongoose';

export interface IPuzzle {
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

const puzzleSchema = new mongoose.Schema<IPuzzle>({
  PuzzleId: String,
  FEN: String,
  Moves: String,
  Rating: Number,
  RatingDeviation: Number,
  Popularity: Number,
  NbPlays: Number,
  Themes: String,
  GameUrl: String,
  OpeningTags: String,
});

const Puzzle = mongoose.model<IPuzzle>('Puzzle', puzzleSchema);

export default Puzzle;
