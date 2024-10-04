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
  findOrCreatePopulated: (
    providerId: string,
    feature: string,
  ) => Promise<IPlayerData>;
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

playerDataSchema.statics.findOrCreatePopulated = async function (
  providerId: string,
  feature: string,
): Promise<IPlayerData> {
  let playerData = await this.findOne({
    providerId,
    feature,
  }).populate({
    path: 'itemEvents',
    match: { eventType: 'solved' },
  });
  if (!playerData) {
    playerData = await this.create({
      providerId,
      feature,
      rating: 1200,
      itemEvents: [],
    }); // this is populated because [] will be []
  }
  return playerData;
};

// Create the PlayerData model
export const PlayerData = mongoose.model<IPlayerData, IPlayerDataModel>(
  'PlayerData',
  playerDataSchema,
);
