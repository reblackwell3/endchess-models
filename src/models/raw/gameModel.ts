import { Document, Model, model, Schema, Types } from 'mongoose';

export interface IGame extends Document {
  _id: Types.ObjectId;
  importFrom: string; // 'chess.com' or 'lichess'
  url: string;
  pgn: string;
  timeControl: string;
  endTime: number;
  rated: boolean;
  tcn?: string;
  uuid: string;
  initialSetup: string;
  fen: string;
  timeClass: string;
  rules: string;
  eco?: string;
  white: {
    rating: number;
    result: string;
    username: string;
  };
  black: {
    rating: number;
    result: string;
    username: string;
  };
  result: string;
}

const gameSchema = new Schema<IGame>({
  importFrom: { type: String, required: true },
  url: { type: String, required: true },
  pgn: { type: String, required: true },
  timeControl: { type: String, required: true },
  endTime: { type: Number, required: true },
  rated: { type: Boolean, required: true },
  tcn: { type: String },
  uuid: { type: String, required: true },
  initialSetup: { type: String },
  fen: { type: String },
  timeClass: { type: String, required: true },
  rules: { type: String, required: true },
  eco: { type: String },
  white: {
    rating: { type: Number, required: true },
    result: { type: String, required: true },
    username: { type: String, required: true },
  },
  black: {
    rating: { type: Number, required: true },
    result: { type: String, required: true },
    username: { type: String, required: true },
  },
  result: { type: String },
});

const Game: Model<IGame> = model<IGame>('Game', gameSchema);

export default Game;
