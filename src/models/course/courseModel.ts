import { Document, Model, model, Schema, Types } from 'mongoose';
import type {
  CoursePhase,
  CoursePreviewThumbnail,
  GamePool,
  LessonType,
  ParentOpening,
  SectionKind,
  TrainSide,
} from './courseTypes';

export interface ICourse extends Document {
  slug: string;
  title: string;
  description: string;
  phase: CoursePhase;
  parentOpening?: ParentOpening;
  gamePool: GamePool;
  trainSide?: TrainSide;
  sectionCount: number;
  lessonCount: number;
  avgElo: number;
  generatedAt: Date;
  version: string;
  scanDepth: number;
  confirmDepth: number;
  cpThreshold: number;
  filters: {
    minElo: number;
    maxElo: number;
    sources: string[];
    gameBudget: number;
  };
  previewThumbnails?: CoursePreviewThumbnail[];
}

const courseSchema = new Schema<ICourse>(
  {
    slug: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    phase: { type: String, required: true },
    parentOpening: { type: String },
    gamePool: { type: String, required: true },
    trainSide: { type: String },
    sectionCount: { type: Number, required: true, default: 0 },
    lessonCount: { type: Number, required: true, default: 0 },
    avgElo: { type: Number, required: true, default: 0 },
    generatedAt: { type: Date, required: true, default: Date.now },
    version: { type: String, required: true },
    scanDepth: { type: Number, required: true },
    confirmDepth: { type: Number, required: true },
    cpThreshold: { type: Number, required: true },
    filters: {
      minElo: { type: Number, required: true },
      maxElo: { type: Number, required: true },
      sources: { type: [String], required: true },
      gameBudget: { type: Number, required: true },
    },
    previewThumbnails: {
      type: [
        {
          pgn: { type: String, required: true },
          startFen: { type: String },
        },
      ],
      default: undefined,
    },
  },
  { collection: 'courses' },
);

courseSchema.index({ slug: 1, scanDepth: 1, confirmDepth: 1, cpThreshold: 1 }, { unique: true });

export const Course: Model<ICourse> = model<ICourse>('Course', courseSchema);

export interface ICourseSection extends Document {
  courseId: Types.ObjectId;
  slug: string;
  title: string;
  order: number;
  sectionKind: SectionKind;
  lessonCount: number;
}

const courseSectionSchema = new Schema<ICourseSection>(
  {
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    sectionKind: { type: String, required: true },
    lessonCount: { type: Number, required: true, default: 0 },
  },
  { collection: 'course_sections' },
);

courseSectionSchema.index({ courseId: 1, slug: 1 }, { unique: true });

export const CourseSection: Model<ICourseSection> = model<ICourseSection>(
  'CourseSection',
  courseSectionSchema,
);

export interface ILesson extends Document {
  courseId: Types.ObjectId;
  sectionId: Types.ObjectId;
  order: number;
  title: string;
  type: LessonType;
  startFen: string;
  movesUci: string[];
  movesSan: string[];
  trainSide: TrainSide;
  sourceGameId: string;
  sourceMeta: {
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    eco?: string;
    opening?: string;
    result: string;
    date?: string;
  };
  window: { fromPly: number; toPly: number };
  materialSignature?: string;
  quality: {
    avgCpLoss: number;
    maxCpLoss: number;
    halfMoveCount: number;
    confirmDepth: number;
  };
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, required: true, index: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true, default: 'line' },
    startFen: { type: String, required: true },
    movesUci: { type: [String], required: true },
    movesSan: { type: [String], required: true },
    trainSide: { type: String, required: true },
    sourceGameId: { type: String, required: true },
    sourceMeta: {
      white: { type: String, required: true },
      black: { type: String, required: true },
      whiteElo: { type: Number, required: true },
      blackElo: { type: Number, required: true },
      eco: { type: String },
      opening: { type: String },
      result: { type: String, required: true },
      date: { type: String },
    },
    window: {
      fromPly: { type: Number, required: true },
      toPly: { type: Number, required: true },
    },
    materialSignature: { type: String },
    quality: {
      avgCpLoss: { type: Number, required: true },
      maxCpLoss: { type: Number, required: true },
      halfMoveCount: { type: Number, required: true },
      confirmDepth: { type: Number, required: true },
    },
  },
  { collection: 'lessons' },
);

lessonSchema.index({ courseId: 1, sectionId: 1, order: 1 }, { unique: true });

export const Lesson: Model<ILesson> = model<ILesson>('Lesson', lessonSchema);

/** Per-user course progress (written by backend, not course-builder). */
export interface ICourseProgress extends Document {
  providerId: string;
  courseId: Types.ObjectId;
  completedLessonIds: Types.ObjectId[];
  completedSectionIds: Types.ObjectId[];
  ignoredLessonIds: Types.ObjectId[];
  lastLessonId?: Types.ObjectId;
  updatedAt: Date;
}

const courseProgressSchema = new Schema<ICourseProgress>(
  {
    providerId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true },
    completedLessonIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    completedSectionIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    ignoredLessonIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    lastLessonId: { type: Schema.Types.ObjectId },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'course_progress' },
);

courseProgressSchema.index({ providerId: 1, courseId: 1 }, { unique: true });

export const CourseProgress: Model<ICourseProgress> = model<ICourseProgress>(
  'CourseProgress',
  courseProgressSchema,
);
