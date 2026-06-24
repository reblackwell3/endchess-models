import mongoose, { Document, Schema, Model } from 'mongoose';

export const CONTENT_CATALOG_META_KEY = 'catalog';

export interface IContentCatalogMetaFields {
  key: string;
  coursesLatestPublishedAt: Date | null;
  gamesLatestImportedAt: Date | null;
}

export type IContentCatalogMeta = IContentCatalogMetaFields & { _id: unknown };

export interface IContentCatalogMetaDocument
  extends IContentCatalogMetaFields,
    Document {}

const contentCatalogMetaSchema = new Schema<IContentCatalogMetaDocument>({
  key: { type: String, required: true, unique: true },
  coursesLatestPublishedAt: { type: Date, default: null },
  gamesLatestImportedAt: { type: Date, default: null },
});

export const ContentCatalogMeta: Model<IContentCatalogMetaDocument> =
  mongoose.model<IContentCatalogMetaDocument>(
    'ContentCatalogMeta',
    contentCatalogMetaSchema,
  );
