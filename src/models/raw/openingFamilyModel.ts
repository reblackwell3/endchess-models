import { Document, Model, model, Schema } from 'mongoose';

/** Canonical opening family (text before the first colon in a lichess line name). */
export interface IOpeningFamily extends Document {
  familyId: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const openingFamilySchema = new Schema<IOpeningFamily>(
  {
    familyId: { type: Number, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  {
    collection: 'opening_families',
    timestamps: true,
  },
);

openingFamilySchema.index({ familyId: 1 }, { unique: true });
openingFamilySchema.index({ slug: 1 }, { unique: true });
openingFamilySchema.index({ name: 1 }, { unique: true });

export const OpeningFamily: Model<IOpeningFamily> = model<IOpeningFamily>(
  'OpeningFamily',
  openingFamilySchema,
);
