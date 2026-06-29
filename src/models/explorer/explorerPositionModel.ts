import mongoose, { Schema } from 'mongoose';
import type {
  ExplorerMoveStatByUciDoc,
  ExplorerPositionDoc,
} from './explorerDocTypes';

const moveStatByUciSchema = new Schema<ExplorerMoveStatByUciDoc>(
  {
    san: { type: String, required: true },
    games: { type: Number, default: 0 },
    whiteWins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    blackWins: { type: Number, default: 0 },
    eloSum: { type: Number, default: 0 },
  },
  { _id: false },
);

const explorerPositionSchema = new Schema<ExplorerPositionDoc>(
  {
    _id: { type: String, required: true },
    fen: { type: String, required: true },
    totalGames: { type: Number, default: 0 },
    movesByUci: {
      type: Map,
      of: moveStatByUciSchema,
      default: () => new Map(),
    },
  },
  { versionKey: false },
);

export const ExplorerPosition =
  mongoose.models.ExplorerPosition ??
  mongoose.model<ExplorerPositionDoc>(
    'ExplorerPosition',
    explorerPositionSchema,
    'positions',
  );
