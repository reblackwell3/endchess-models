// src/models/user/itemEventModel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the ItemEvent interface
interface IItemEvent extends Document {
  providerId: string;
  feature: string;
  itemId: string;
  eventType: string;
  event: string;
  timestamp: Date;
}

// Create the ItemEvent schema
const itemEventSchema = new Schema<IItemEvent>({
  providerId: { type: String, required: true },
  feature: { type: String, required: true },
  itemId: { type: String, required: true },
  eventType: { type: String, required: true },
  event: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

itemEventSchema.index({ providerId: 1, feature: 1, timestamp: -1 });
itemEventSchema.index({ providerId: 1, feature: 1, eventType: 1, timestamp: -1 });
itemEventSchema.index({ providerId: 1, feature: 1, itemId: 1, eventType: 1 });
itemEventSchema.index({
  providerId: 1,
  feature: 1,
  itemId: 1,
  eventType: 1,
  timestamp: 1,
});
itemEventSchema.index({ itemId: 1, eventType: 1, _id: -1 });

// Create the ItemEvent model
const ItemEvent: Model<IItemEvent> = mongoose.model<IItemEvent>(
  'ItemEvent',
  itemEventSchema,
);

export { ItemEvent, IItemEvent };
