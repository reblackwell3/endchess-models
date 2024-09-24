// src/models/user/playerDataModel.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IItemEvent } from './itemEventModel';

// Define the PlayerData interface extending Document
interface IPlayerData extends Document {
  providerId: string;
  feature: string;
  rating: number;
  itemEvents: Types.ObjectId[] | IItemEvent[];
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

// Create the PlayerData model
const PlayerData: Model<IPlayerData> = mongoose.model<IPlayerData>(
  'PlayerData',
  playerDataSchema,
);

export { PlayerData, IPlayerData };
