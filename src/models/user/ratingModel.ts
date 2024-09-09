import mongoose, { Schema } from 'mongoose';

// Define the Rating interface extending Document
interface IRating extends Document {
  providerId: string;
  feature: string;
  rating: number;
}

// Define the Rating schema
const ratingSchema = new Schema<IRating>({
  providerId: { type: String, required: true },
  feature: { type: String, required: true },
  rating: { type: Number, required: true },
});

const Rating = mongoose.model<IRating>('Rating', ratingSchema);

export default IRating;
