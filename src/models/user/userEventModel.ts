import mongoose, { Schema } from 'mongoose';

// Define the UserEvent interface extending Document
export interface IUserEvent extends Document {
  providerId: string;
  feature: string;
  itemId: string; // See below
  event: string;
}

// Define the UserEvent schema
const userEventSchema = new Schema<IUserEvent>({
  providerId: { type: String, required: true },
  feature: { type: String, required: true },
  itemId: { type: String, required: true }, // I was not able to use an ObjectId here
  event: { type: String, required: true }, //This will be things like complete... can query this table and system data tables to know what content to show
});

const UserEvent = mongoose.model<IUserEvent>('UserEvent', userEventSchema);

export default IUserEvent;
