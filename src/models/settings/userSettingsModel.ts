import mongoose, { Document, Model, Schema } from 'mongoose';

export interface UserSettingsDoc extends Document {
  providerId: string;
  addMissedPuzzlesToSrs: boolean;
  addMissedPositionsToSrs: boolean;
  autoShowReplayWrongMoves?: boolean;
  autoShowTopReplayGame?: boolean;
  /** Re-run an import from the last saved username when My Games loads. */
  autoTopUpImports?: boolean;
  boardTheme?: string;
  replayAutoplaySpeed?: 'fast' | 'normal' | 'slow';
  /** Consecutive successful line reviews before a mastered prefix is skipped. */
  courseSrsRepetitions?: 1 | 2 | 3;
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
  /** Per-fork white opening system choices (fork id → course slug or sentinel). */
  whiteRepertoireForks?: Record<string, string>;
  /** Per-fork black opening system choices (fork id → course slug). */
  blackRepertoireForks?: Record<string, string>;
}

const userSettingsSchema = new Schema<UserSettingsDoc>(
  {
    providerId: { type: String, required: true, unique: true },
    addMissedPuzzlesToSrs: { type: Boolean, default: true },
    addMissedPositionsToSrs: { type: Boolean, default: true },
    autoShowReplayWrongMoves: { type: Boolean, default: true },
    autoShowTopReplayGame: { type: Boolean, default: true },
    autoTopUpImports: { type: Boolean, default: false },
    boardTheme: { type: String, default: 'classic' },
    replayAutoplaySpeed: { type: String, default: 'fast' },
    courseSrsRepetitions: { type: Number, default: 2, min: 1, max: 3 },
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
    whiteRepertoireForks: { type: Schema.Types.Mixed },
    blackRepertoireForks: { type: Schema.Types.Mixed },
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
