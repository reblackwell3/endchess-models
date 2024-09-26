// src/models/user/playerDataModel.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IItemEvent } from './itemEventModel';

// Define the PlayerData interface extending Document
export interface IPlayerData extends Document {
  providerId: string;
  feature: string;
  rating: number;
  itemEvents: Types.ObjectId[] | IItemEvent[];
}

export interface IPlayerDataModel extends Model<IPlayerData> {
  findOrCreate: (providerId: string, feature: string) => Promise<IPlayerData>;
}
// Define the PlayerData schema
const playerDataSchema = new Schema<IPlayerData>({
  providerId: { type: String, required: true },
  feature: { type: String, required: true },
  rating: { type: Number, required: true },
  itemEvents: [
    { type: Schema.Types.ObjectId, ref: 'ItemEvent', required: true },
  ],
});

playerDataSchema.statics.findOrCreate = async function (
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
      rating: 1200,
      itemEvents: [],
    });
  }
  return playerData;
};

// Create the PlayerData model
export const PlayerData: Model<IPlayerData> = mongoose.model<IPlayerData>(
  'PlayerData',
  playerDataSchema,
);
