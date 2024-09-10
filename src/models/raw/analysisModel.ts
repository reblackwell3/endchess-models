import { Schema, model, Document } from 'mongoose';
import { Types } from 'mongoose';
import { IGame } from './gameModel';

// Define the MoveAnalysis interface
interface IMoveAnalysis {
  isTopMove: boolean;
  diff: number;
  fen: string;
  move: string;
}

// Define the Analysis interface
interface IAnalysis extends Document {
  gameId: Types.ObjectId | IGame;
  analysis: IMoveAnalysis[];
}

// Create the MoveAnalysis schema
const MoveAnalysisSchema = new Schema<IMoveAnalysis>({
  isTopMove: { type: Boolean, required: true },
  diff: { type: Number, required: true },
  fen: { type: String, required: true },
  move: { type: String, required: true },
});

// Create the Analysis schema
const AnalysisSchema = new Schema<IAnalysis>({
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  analysis: { type: [MoveAnalysisSchema], required: true },
});

// Create the Analysis model
const Analysis = model<IAnalysis>('Analysis', AnalysisSchema);

export { IMoveAnalysis, IAnalysis, Analysis };
