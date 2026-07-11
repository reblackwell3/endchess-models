import mongoose, { Schema } from 'mongoose';

export type ExplorerIndexedGameDoc = {
  _id: string;
  indexedAt: Date;
  importBatch?: string;
};

const explorerIndexedGameSchema = new Schema<ExplorerIndexedGameDoc>(
  {
    _id: { type: String, required: true },
    indexedAt: { type: Date, required: true },
    importBatch: { type: String },
  },
  { versionKey: false },
);

export const ExplorerIndexedGame =
  mongoose.models.ExplorerIndexedGame ??
  mongoose.model<ExplorerIndexedGameDoc>(
    'ExplorerIndexedGame',
    explorerIndexedGameSchema,
    'explorer_indexed_games',
  );
