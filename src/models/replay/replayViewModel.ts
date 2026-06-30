import mongoose, { Schema } from 'mongoose';
import type { ReplayViewDoc } from './replayDocTypes';

const replayViewSchema = new Schema<ReplayViewDoc>(
  {
    providerId: { type: String, required: true },
    gameId: { type: String, required: true },
    viewedAt: { type: Date, default: () => new Date() },
    seenHalfMoves: { type: [Number], default: [] },
  },
  { timestamps: false, versionKey: false },
);

replayViewSchema.index({ providerId: 1, gameId: 1 }, { unique: true });
replayViewSchema.index({ providerId: 1, viewedAt: -1 });

export const ReplayView =
  mongoose.models.ReplayView ??
  mongoose.model<ReplayViewDoc>('ReplayView', replayViewSchema, 'replay_views');
