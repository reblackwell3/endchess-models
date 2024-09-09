import { Document, model, Schema, Model } from 'mongoose';

export interface ChessComLink {
  url: string;
  isImported: boolean;
}

export interface LichessLink {
  since: number;
  until: number;
  isImported: boolean;
}

export interface ISystemImportDataDocument extends Document {
  providerId: string;
  chessComLinks: ChessComLink[];
  lichessLinks: LichessLink[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISystemImportData extends ISystemImportDataDocument {}

export interface ISystemImportDataModel extends Model<ISystemImportData> {
  findOrCreate: (providerId: string) => Promise<ISystemImportData>;
}

const schema = new Schema<ISystemImportData>(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    chessComLinks: [
      {
        url: {
          type: String,
          required: true,
        },
        isImported: {
          type: Boolean,
          required: true,
        },
      },
    ],
    lichessLinks: [
      {
        since: {
          type: Number,
          required: true,
        },
        until: {
          type: Number,
          required: true,
        },
        isImported: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

schema.statics.findOrCreate = async function (providerId: string) {
  let SystemImportData = await this.findOne({ providerId });
  if (!SystemImportData) {
    SystemImportData = await this.create({ providerId, chessComLinks: [] });
  }
  return SystemImportData;
};

const SystemImportData = model<ISystemImportData, ISystemImportDataModel>(
  'SystemImportData',
  schema,
);

export default SystemImportData;
