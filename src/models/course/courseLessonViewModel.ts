import mongoose, { Model, Schema, Types } from 'mongoose';
import type { CourseLineMasteryState } from '../../lib/courseLineMastery';

export type { CourseLineMasteryState } from '../../lib/courseLineMastery';

export type CourseTrainModeKey = 'w' | 'b' | 'both';

export type CourseLessonViewDoc = {
  providerId: string;
  lessonId: Types.ObjectId;
  seenHalfMoves: number[];
  lineMasteryByMode?: Partial<Record<CourseTrainModeKey, CourseLineMasteryState>>;
  viewedAt: Date;
};

const courseLineMasteryStateSchema = new Schema<CourseLineMasteryState>(
  {
    masteredSlots: { type: [Boolean], required: true, default: [] },
    skipRemaining: { type: Number, required: true, default: 0 },
    skipInterval: { type: Number, default: undefined },
    slotRepetitionsRemaining: { type: [Number], default: undefined },
    recoveryTrainSlot: { type: Number, default: undefined },
  },
  { _id: false },
);

const courseLessonViewSchema = new Schema<CourseLessonViewDoc>(
  {
    providerId: { type: String, required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, required: true, index: true },
    seenHalfMoves: { type: [Number], default: [] },
    lineMasteryByMode: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false, collection: 'course_lesson_views' },
);

courseLessonViewSchema.index({ providerId: 1, lessonId: 1 }, { unique: true });

export const CourseLessonView: Model<CourseLessonViewDoc> =
  (mongoose.models.CourseLessonView as Model<CourseLessonViewDoc>) ??
  mongoose.model<CourseLessonViewDoc>(
    'CourseLessonView',
    courseLessonViewSchema,
    'course_lesson_views',
  );

// Keep schema reference for tooling; Mixed stores validated objects at write time.
void courseLineMasteryStateSchema;
