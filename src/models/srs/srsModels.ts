import mongoose, { Schema } from 'mongoose';
import type { SrsCardDoc, SrsLineDoc } from './srsDocTypes';

const srsCardSchema = new Schema<SrsCardDoc>(
  {
    providerId: { type: String, required: true },
    kind: { type: String, enum: ['position', 'puzzle'], required: true },
    refId: { type: String, required: true },
    fen: { type: String },
    sideToMove: { type: String, enum: ['w', 'b'] },
    expectedUci: { type: String },
    expectedSan: { type: String },
    setupFen: { type: String },
    setupUci: { type: String },
    white: { type: String },
    black: { type: String },
    whiteElo: { type: Number },
    blackElo: { type: Number },
    timeControl: { type: String },
    timeClass: { type: String },
    date: { type: String },
    result: { type: String },
    eco: { type: String },
    opening: { type: String },
    event: { type: String },
    openingSans: { type: [String] },
    movesUci: { type: [String] },
    reviewStartIndex: { type: Number },
    quizAtIndices: { type: [Number] },
    courseSlug: { type: String },
    courseTitle: { type: String },
    courseId: { type: String },
    phase: { type: String },
    lessonId: { type: String },
    lessonTitle: { type: String },
    source: {
      type: String,
      enum: ['auto', 'manual', 'line'],
      default: 'auto',
    },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, default: () => new Date() },
    lastReviewedAt: { type: Date },
    status: {
      type: String,
      enum: ['new', 'learning', 'review'],
      default: 'new',
    },
  },
  { timestamps: true, versionKey: false },
);

srsCardSchema.index({ providerId: 1, kind: 1, refId: 1 }, { unique: true });
srsCardSchema.index({ providerId: 1, kind: 1, courseSlug: 1 });
srsCardSchema.index({ providerId: 1, kind: 1, dueAt: 1 });

export const SrsCard =
  mongoose.models.SrsCard ??
  mongoose.model<SrsCardDoc>('SrsCard', srsCardSchema, 'srs_cards');

const srsLineSchema = new Schema<SrsLineDoc>(
  {
    providerId: { type: String, required: true },
    name: { type: String, required: true },
    startFen: { type: String, required: true },
    movesUci: { type: [String], default: [] },
    movesSan: { type: [String], default: [] },
    trainSide: { type: String, enum: ['w', 'b'], required: true },
    sourceGameId: { type: String },
    lastScorePct: { type: Number, default: null },
    bestScorePct: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    lastDrilledAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

srsLineSchema.index({ providerId: 1 });
srsLineSchema.index({ providerId: 1, lastScorePct: 1, lastDrilledAt: 1 });

export const SrsLine =
  mongoose.models.SrsLine ??
  mongoose.model<SrsLineDoc>('SrsLine', srsLineSchema, 'srs_lines');
