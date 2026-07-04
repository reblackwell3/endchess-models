import mongoose, { Document, Model, Schema } from 'mongoose';

export interface SettingChangeEventDoc extends Document {
  providerId: string;
  settingKey: string;
  previousValue: unknown;
  newValue: unknown;
  source?: string;
  occurredAt: Date;
}

const settingChangeEventSchema = new Schema<SettingChangeEventDoc>(
  {
    providerId: { type: String, required: true },
    settingKey: { type: String, required: true },
    previousValue: { type: Schema.Types.Mixed, required: true },
    newValue: { type: Schema.Types.Mixed, required: true },
    source: { type: String },
    occurredAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
);

settingChangeEventSchema.index({ providerId: 1, occurredAt: -1 });
settingChangeEventSchema.index({ settingKey: 1, occurredAt: -1 });

export const SettingChangeEvent: Model<SettingChangeEventDoc> =
  (mongoose.models.SettingChangeEvent as Model<SettingChangeEventDoc>) ??
  mongoose.model<SettingChangeEventDoc>(
    'SettingChangeEvent',
    settingChangeEventSchema,
    'setting_change_events',
  );
