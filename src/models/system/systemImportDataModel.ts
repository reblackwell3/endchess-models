import { Document, model, Schema, Model, Types } from 'mongoose';
import { IGame } from '../raw/gameModel';

export interface Link {
  site: string;
  url: string;
  isImported: boolean;
}

export type ImportJobStatus = 'pending' | 'failed' | 'complete';
export type ImportJobError = 'user_not_found' | 'unknown';
export type ImportJobPlatform = 'chesscom' | 'lichess';

export interface ImportJob {
  status: ImportJobStatus;
  platform?: ImportJobPlatform;
  username?: string;
  error?: ImportJobError;
  updatedAt: Date;
}

export interface ISystemImportDataDocument extends Document {
  providerId: string;
  links: Link[];
  importedGames: Types.ObjectId[] | IGame[];
  importJob?: ImportJob;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISystemImportData extends ISystemImportDataDocument {}

export interface ISystemImportDataModel extends Model<ISystemImportData> {
  findOrCreate: (providerId: string) => Promise<ISystemImportData>;
}

const LinkSchema = new Schema<Link>({
  site: { type: String, required: true },
  url: { type: String, required: true },
  isImported: { type: Boolean, required: true, default: false },
});

const ImportJobSchema = new Schema<ImportJob>(
  {
    status: {
      type: String,
      enum: ['pending', 'failed', 'complete'],
      required: true,
    },
    platform: { type: String, enum: ['chesscom', 'lichess'] },
    username: { type: String },
    error: { type: String, enum: ['user_not_found', 'unknown'] },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const schema = new Schema<ISystemImportData>(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    links: [LinkSchema],
    importedGames: [
      { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    ],
    importJob: { type: ImportJobSchema },
  },
  { timestamps: true },
);

schema.statics.findOrCreate = async function (providerId: string) {
  let SystemImportData = await this.findOne({ providerId });
  if (!SystemImportData) {
    SystemImportData = await this.create({ providerId, links: [] });
  }
  return SystemImportData;
};

export const SystemImportData = model<
  ISystemImportData,
  ISystemImportDataModel
>('SystemImportData', schema);
