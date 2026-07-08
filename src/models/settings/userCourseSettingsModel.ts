import mongoose, { Document, Model, Schema } from 'mongoose';
import { MAX_OPENING_LINE_MAX_MOVE, MIN_OPENING_LINE_MAX_MOVE } from 'endchess-contracts';

/**
 * Per-user preferences for a single course (keyed by stable slug).
 * Distinct from course_progress (completion / ignored lines).
 */
export interface UserCourseSettingsDoc extends Document {
  providerId: string;
  courseSlug: string;
  /** Opening repertoire: hide lines with fewer than this many elite-DB games. */
  openingLineMinN?: 0 | 2 | 5 | 10 | 25 | 50;
  /** Opening repertoire: how deep (full moves) to train / count distinct lines. */
  openingLineMaxMove?: number;
}

const userCourseSettingsSchema = new Schema<UserCourseSettingsDoc>(
  {
    providerId: { type: String, required: true, index: true },
    courseSlug: { type: String, required: true, index: true },
    openingLineMinN: { type: Number },
    openingLineMaxMove: { type: Number, min: MIN_OPENING_LINE_MAX_MOVE, max: MAX_OPENING_LINE_MAX_MOVE },
  },
  { timestamps: true, versionKey: false, collection: 'user_course_settings' },
);

userCourseSettingsSchema.index(
  { providerId: 1, courseSlug: 1 },
  { unique: true },
);

export const UserCourseSettings: Model<UserCourseSettingsDoc> =
  (mongoose.models.UserCourseSettings as Model<UserCourseSettingsDoc>) ??
  mongoose.model<UserCourseSettingsDoc>(
    'UserCourseSettings',
    userCourseSettingsSchema,
    'user_course_settings',
  );
