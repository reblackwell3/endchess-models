import mongoose, { Model, Schema } from 'mongoose';
import type { CourseTrainModeKey } from './courseLessonViewModel';
import { MASTERED_SKIP_COUNT } from '../../lib/courseLineMastery';

export type UserStemMasteryDoc = {
  providerId: string;
  /** positionKey of the stem end FEN — primary identity (transposition-aware). */
  endKey?: string;
  /** Legacy / diagnostic UCI path key of the stem that last wrote this row. */
  stemKey?: string;
  trainMode: CourseTrainModeKey;
  /** Train-side UCIs mastered for this position. */
  masteredUcis: string[];
  /**
   * @deprecated Prefer masteredUcis. Kept for migration of legacy rows.
   */
  masteredSlots?: boolean[];
  skipRemaining: number;
  skipInterval: number;
};

const userStemMasterySchema = new Schema<UserStemMasteryDoc>(
  {
    providerId: { type: String, required: true, index: true },
    // Optional during migration; require after migrateStemMasteryToPositionKeys.
    endKey: { type: String, index: true },
    stemKey: { type: String, index: true },
    trainMode: { type: String, required: true },
    masteredUcis: { type: [String], required: true, default: [] },
    masteredSlots: { type: [Boolean], default: undefined },
    skipRemaining: { type: Number, required: true, default: 0 },
    skipInterval: {
      type: Number,
      required: true,
      default: MASTERED_SKIP_COUNT,
    },
  },
  { timestamps: true, versionKey: false, collection: 'user_stem_mastery' },
);

// Partial unique index so legacy rows without endKey do not collide on null.
userStemMasterySchema.index(
  { providerId: 1, endKey: 1, trainMode: 1 },
  {
    unique: true,
    partialFilterExpression: { endKey: { $type: 'string' } },
  },
);

export const UserStemMastery: Model<UserStemMasteryDoc> =
  (mongoose.models.UserStemMastery as Model<UserStemMasteryDoc>) ??
  mongoose.model<UserStemMasteryDoc>(
    'UserStemMastery',
    userStemMasterySchema,
    'user_stem_mastery',
  );
