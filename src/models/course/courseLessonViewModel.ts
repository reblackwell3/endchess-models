import mongoose, { Model, Schema, Types } from 'mongoose';

export type CourseLessonViewDoc = {
  providerId: string;
  lessonId: Types.ObjectId;
  seenHalfMoves: number[];
  viewedAt: Date;
};

const courseLessonViewSchema = new Schema<CourseLessonViewDoc>(
  {
    providerId: { type: String, required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, required: true, index: true },
    seenHalfMoves: { type: [Number], default: [] },
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
