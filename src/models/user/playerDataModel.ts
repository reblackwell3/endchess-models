// src/models/user/playerDataModel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export const DEFAULT_PUZZLE_ELO = 1500;

export interface IPlayerData extends Document {
  providerId: string;
  feature: string;
  /** User puzzle rating; only set when feature is "puzzles". */
  puzzle_elo?: number;
}

export interface IPlayerDataModel extends Model<IPlayerData> {
  findOrCreatePopulated: (
    providerId: string,
    feature: string,
  ) => Promise<IPlayerData>;
}

const playerDataSchema = new Schema<IPlayerData>({
  providerId: { type: String, required: true },
  feature: { type: String, required: true },
  puzzle_elo: { type: Number, required: false },
});

// Kept non-unique because legacy accounts may contain duplicate feature rows.
playerDataSchema.index({ providerId: 1, feature: 1 });

playerDataSchema.statics.findOrCreatePopulated = async function (
  providerId: string,
  feature: string,
): Promise<IPlayerData> {
  let playerData = await this.findOne({
    providerId,
    feature,
  });
  if (!playerData) {
    playerData = await this.create({
      providerId,
      feature,
      ...(feature === 'puzzles' ? { puzzle_elo: DEFAULT_PUZZLE_ELO } : {}),
    });
  }
  return playerData;
};

export const PlayerData = mongoose.model<IPlayerData, IPlayerDataModel>(
  'PlayerData',
  playerDataSchema,
);
