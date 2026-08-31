import { Document, Model, model, Schema } from 'mongoose';

export type CorpusPlayerImportFrom = 'twic' | 'lichess';

export interface ICorpusPlayerFields {
  importFrom: CorpusPlayerImportFrom;
  nameKey: string;
  username: string;
  canonicalSlug: string;
  slugAliases: string[];
  title?: string;
  gameCount: number;
  avgRating: number;
  maxRating: number;
}

export type ICorpusPlayer = ICorpusPlayerFields & { _id: unknown };

export interface ICorpusPlayerDocument extends ICorpusPlayerFields, Document {}

const corpusPlayerSchema = new Schema<ICorpusPlayerDocument>(
  {
    importFrom: { type: String, required: true, enum: ['twic', 'lichess'] },
    nameKey: { type: String, required: true },
    username: { type: String, required: true },
    canonicalSlug: { type: String, required: true },
    slugAliases: { type: [String], required: true },
    title: { type: String },
    gameCount: { type: Number, required: true },
    avgRating: { type: Number, required: true },
    maxRating: { type: Number, required: true },
  },
  {
    collection: 'corpus_players',
    timestamps: true,
  },
);

corpusPlayerSchema.index({ importFrom: 1, nameKey: 1 }, { unique: true });
corpusPlayerSchema.index({ importFrom: 1, slugAliases: 1 }, { unique: true });
corpusPlayerSchema.index({ importFrom: 1, avgRating: -1, gameCount: -1 });
corpusPlayerSchema.index({
  importFrom: 1,
  avgRating: -1,
  gameCount: -1,
  nameKey: 1,
});
corpusPlayerSchema.index({
  importFrom: 1,
  maxRating: -1,
  gameCount: -1,
  nameKey: 1,
});

export const CorpusPlayer: Model<ICorpusPlayerDocument> =
  model<ICorpusPlayerDocument>('CorpusPlayer', corpusPlayerSchema);
