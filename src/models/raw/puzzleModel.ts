// backend/puzzles/puzzleModel.js
import mongoose from 'mongoose';

const puzzleSchema = new mongoose.Schema({
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

export const Puzzle = mongoose.model('Puzzle', puzzleSchema);
