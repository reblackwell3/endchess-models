import mongoose, { Document, Schema, Model } from 'mongoose';

export const PUZZLE_CATALOG_META_KEY = 'catalog';

export interface IPuzzleCatalogMetaFields {
  key: string;
  minRating: number;
  maxRating: number;
  puzzleCount: number;
  updatedAt: Date;
}

export type IPuzzleCatalogMeta = IPuzzleCatalogMetaFields & { _id: unknown };

export interface IPuzzleCatalogMetaDocument
  extends IPuzzleCatalogMetaFields,
    Document {}

const puzzleCatalogMetaSchema = new Schema<IPuzzleCatalogMetaDocument>({
  key: { type: String, required: true, unique: true },
  minRating: { type: Number, required: true },
  maxRating: { type: Number, required: true },
  puzzleCount: { type: Number, required: true },
  updatedAt: { type: Date, required: true },
});

export const PuzzleCatalogMeta: Model<IPuzzleCatalogMetaDocument> =
  mongoose.model<IPuzzleCatalogMetaDocument>(
    'PuzzleCatalogMeta',
    puzzleCatalogMetaSchema,
  );
