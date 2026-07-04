import mongoose, { Document, Model, Schema } from 'mongoose';

export interface UserSettingsDoc extends Document {
  providerId: string;
  addMissedPuzzlesToSrs: boolean;
  addMissedPositionsToSrs: boolean;
  autoShowReplayWrongMoves?: boolean;
  autoShowTopReplayGame?: boolean;
  boardTheme?: string;
  replayAutoplaySpeed?: 'fast' | 'normal' | 'slow';
  trainingHintSplashCount?: number;
  trainingHintLastShownAt?: Date;
  explorerSplashCount?: number;
  explorerSplashLastShownAt?: Date;
  trainingPlaySplashCount?: number;
  trainingPlayLastShownAt?: Date;
  gamesSplashCount?: number;
  gamesSplashLastShownAt?: Date;
  replaySplashCount?: number;
  replaySplashLastShownAt?: Date;
  replayAutoplaySettingsSplashCount?: number;
  replayAutoplaySettingsLastShownAt?: Date;
}

const userSettingsSchema = new Schema<UserSettingsDoc>(
  {
    providerId: { type: String, required: true, unique: true },
    addMissedPuzzlesToSrs: { type: Boolean, default: true },
    addMissedPositionsToSrs: { type: Boolean, default: true },
    autoShowReplayWrongMoves: { type: Boolean, default: true },
    autoShowTopReplayGame: { type: Boolean, default: true },
    boardTheme: { type: String, default: 'classic' },
    replayAutoplaySpeed: { type: String, default: 'fast' },
    trainingHintSplashCount: { type: Number, default: 0 },
    trainingHintLastShownAt: { type: Date },
    explorerSplashCount: { type: Number, default: 0 },
    explorerSplashLastShownAt: { type: Date },
    trainingPlaySplashCount: { type: Number, default: 0 },
    trainingPlayLastShownAt: { type: Date },
    gamesSplashCount: { type: Number, default: 0 },
    gamesSplashLastShownAt: { type: Date },
    replaySplashCount: { type: Number, default: 0 },
    replaySplashLastShownAt: { type: Date },
    replayAutoplaySettingsSplashCount: { type: Number, default: 0 },
    replayAutoplaySettingsLastShownAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export const UserSettings: Model<UserSettingsDoc> =
  (mongoose.models.UserSettings as Model<UserSettingsDoc>) ??
  mongoose.model<UserSettingsDoc>(
    'UserSettings',
    userSettingsSchema,
    'user_settings',
  );
