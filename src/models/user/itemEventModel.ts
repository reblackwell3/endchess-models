// src/models/user/itemEventModel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the ItemEvent interface
interface IItemEvent extends Document {
  itemId: string;
  eventType: string;
  event: string;
  timestamp: Date;
}

// Create the ItemEvent schema
const itemEventSchema = new Schema<IItemEvent>({
  itemId: { type: String, required: true },
  eventType: { type: String, required: true },
  event: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

// Create the ItemEvent model
const ItemEvent: Model<IItemEvent> = mongoose.model<IItemEvent>(
  'ItemEvent',
  itemEventSchema,
);

export { ItemEvent, IItemEvent };
