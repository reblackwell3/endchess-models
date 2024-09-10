import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the ItemEvent interface
interface IItemEvent {
  itemId: string;
  event: string;
  timestamp: Date;
}

// Define the PlayerData interface extending Document
interface IPlayerData extends Document {
  providerId: string;
  feature: string;
  rating: number;
  itemEvents: IItemEvent[];
}

// Create the ItemEvent schema
const itemEventSchema = new Schema<IItemEvent>({
  itemId: { type: String, required: true },
  event: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

// Define the PlayerData schema
const playerDataSchema = new Schema<IPlayerData>({
  providerId: { type: String, required: true },
  feature: { type: String, required: true },
  rating: { type: Number, required: true },
  itemEvents: { type: [itemEventSchema], required: true },
});

// Create the PlayerData model
const PlayerData: Model<IPlayerData> = mongoose.model<IPlayerData>(
  'PlayerData',
  playerDataSchema,
);
export { PlayerData, IPlayerData, IItemEvent };
