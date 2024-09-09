// backend/puzzles/puzzleModel.js
import mongoose from 'mongoose';

export interface GameData {
  uuid: string;
  isImported: boolean;
  isAnalyzed: boolean;
  // isViewed: boolean; // I think games will not be viewed, mistakes will be viewed
}

export interface ISystemGameData extends Document {
  providerId: string;
  gameDataArray: GameData[];
}

const schema = new mongoose.Schema({
  providerId: { type: String, required: true, unique: true },
  gameDataArray: { type: Array<GameData>, required: true, default: [] },
});

const Puzzle = mongoose.model<ISystemGameData>('SystemGameData', schema);

export default Puzzle;
