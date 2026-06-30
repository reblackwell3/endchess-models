import mongoose, { Schema } from 'mongoose';
import type { PositionOccurrenceDoc } from './explorerDocTypes';

const positionOccurrenceSchema = new Schema<PositionOccurrenceDoc>(
  {
    positionKey: { type: String, required: true },
    gameId: { type: String, required: true },
    nextUci: { type: String, required: true },
    nextSan: { type: String, required: true },
    whiteElo: { type: Number, required: true },
    blackElo: { type: Number, required: true },
  },
  { versionKey: false },
);

positionOccurrenceSchema.index(
  { positionKey: 1, nextUci: 1, whiteElo: 1, blackElo: 1, gameId: 1 },
  { background: true },
);
positionOccurrenceSchema.index(
  { positionKey: 1, whiteElo: 1, blackElo: 1, gameId: 1 },
  { background: true },
);

export const PositionOccurrence =
  mongoose.models.PositionOccurrence ??
  mongoose.model<PositionOccurrenceDoc>(
    'PositionOccurrence',
    positionOccurrenceSchema,
    'position_occurrences',
  );
