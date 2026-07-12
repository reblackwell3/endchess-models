import mongoose, { Model, Schema } from 'mongoose';
import type { CourseTrainModeKey } from './courseLessonViewModel';
import { MASTERED_SKIP_COUNT } from '../../lib/courseLineMastery';

export type UserStemMasteryDoc = {
  providerId: string;
  stemKey: string;
  trainMode: CourseTrainModeKey;
  masteredSlots: boolean[];
  skipRemaining: number;
  skipInterval: number;
};

const userStemMasterySchema = new Schema<UserStemMasteryDoc>(
  {
    providerId: { type: String, required: true, index: true },
    stemKey: { type: String, required: true, index: true },
    trainMode: { type: String, required: true },
    masteredSlots: { type: [Boolean], required: true, default: [] },
    skipRemaining: { type: Number, required: true, default: 0 },
    skipInterval: {
      type: Number,
      required: true,
      default: MASTERED_SKIP_COUNT,
    },
  },
  { timestamps: true, versionKey: false, collection: 'user_stem_mastery' },
);

userStemMasterySchema.index(
  { providerId: 1, stemKey: 1, trainMode: 1 },
  { unique: true },
);

export const UserStemMastery: Model<UserStemMasteryDoc> =
  (mongoose.models.UserStemMastery as Model<UserStemMasteryDoc>) ??
  mongoose.model<UserStemMasteryDoc>(
    'UserStemMastery',
    userStemMasterySchema,
    'user_stem_mastery',
  );
