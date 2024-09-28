import { Document, model, Schema, Model, Types } from 'mongoose';
import { IGame } from '../raw/gameModel';

export interface Link {
  site: string;
  url: string;
  isImported: boolean;
}

export interface ISystemImportDataDocument extends Document {
  providerId: string;
  links: Link[];
  importedGames: Types.ObjectId[] | IGame[];
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
