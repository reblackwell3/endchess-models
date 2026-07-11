import mongoose, { Document, Schema, Model } from 'mongoose';

export const EXPLORER_CATALOG_META_KEY = 'catalog';

export interface IExplorerCatalogMetaFields {
  key: string;
  numGamesUsed: number;
  occurrenceCount: number;
  positionCount: number;
  updatedAt: Date;
}

export type IExplorerCatalogMeta = IExplorerCatalogMetaFields & { _id: unknown };

export interface IExplorerCatalogMetaDocument
  extends IExplorerCatalogMetaFields,
    Document {}

const explorerCatalogMetaSchema = new Schema<IExplorerCatalogMetaDocument>({
  key: { type: String, required: true, unique: true },
  numGamesUsed: { type: Number, required: true, default: 0 },
  occurrenceCount: { type: Number, required: true, default: 0 },
  positionCount: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, required: true },
});

export const ExplorerCatalogMeta: Model<IExplorerCatalogMetaDocument> =
  mongoose.model<IExplorerCatalogMetaDocument>(
    'ExplorerCatalogMeta',
    explorerCatalogMetaSchema,
  );
