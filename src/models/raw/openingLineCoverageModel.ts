import { Document, Model, model, Schema } from 'mongoose';

/** Corpus openings that have at least one matching game (by openingLineId). */
export interface IOpeningLineCoverageFields {
  lineId: number;
  familyId: number;
  eco: string;
  opening: string;
  /** Total twic + lichess games classified to this line. */
  gameCount: number;
  twicGameCount: number;
  lichessGameCount: number;
}

export type IOpeningLineCoverage = IOpeningLineCoverageFields & { _id: unknown };

export interface IOpeningLineCoverageDocument
  extends IOpeningLineCoverageFields,
    Document {}

const openingLineCoverageSchema = new Schema<IOpeningLineCoverageDocument>(
  {
    lineId: { type: Number, required: true },
    familyId: { type: Number, required: true },
    eco: { type: String, required: true, default: '' },
    opening: { type: String, required: true },
    gameCount: { type: Number, required: true, default: 0 },
    twicGameCount: { type: Number, required: true, default: 0 },
    lichessGameCount: { type: Number, required: true, default: 0 },
  },
  {
    collection: 'opening_line_coverage',
    timestamps: true,
  },
);

openingLineCoverageSchema.index({ lineId: 1 }, { unique: true });
openingLineCoverageSchema.index({ gameCount: -1, lineId: 1 });
openingLineCoverageSchema.index({ familyId: 1, gameCount: -1 });

export const OpeningLineCoverage: Model<IOpeningLineCoverageDocument> =
  model<IOpeningLineCoverageDocument>(
    'OpeningLineCoverage',
    openingLineCoverageSchema,
  );
