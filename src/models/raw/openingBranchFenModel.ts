import { Document, Model, model, Schema } from 'mongoose';

/** Lichess opening reference line for an opening variation (ECO + name). */
export interface IOpeningBranchFen extends Document {
  /** Stable reference id for this lichess opening line (1-based). */
  lineId: number;
  /** Parent opening family id. */
  familyId: number;
  opening: string;
  /** Empty string when the corpus row has no ECO tag. */
  eco: string;
  pgn: string;
  createdAt: Date;
  updatedAt: Date;
}

const openingBranchFenSchema = new Schema<IOpeningBranchFen>(
  {
    lineId: { type: Number, required: true },
    familyId: { type: Number, required: true },
    opening: { type: String, required: true },
    eco: { type: String, required: true, default: '' },
    pgn: { type: String, required: true },
  },
  {
    collection: 'opening_branch_fens',
    timestamps: true,
  },
);

openingBranchFenSchema.index({ lineId: 1 }, { unique: true });
openingBranchFenSchema.index({ familyId: 1, lineId: 1 });
openingBranchFenSchema.index({ opening: 1, eco: 1 }, { unique: true });

export const OpeningBranchFen: Model<IOpeningBranchFen> =
  model<IOpeningBranchFen>('OpeningBranchFen', openingBranchFenSchema);
