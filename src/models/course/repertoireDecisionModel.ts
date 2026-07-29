import { Document, Model, model, Schema, Types } from 'mongoose';
import type { CourseMetadata, TrainSide } from './courseTypes';

/** A settings choice and the lesson location it hands training off to. */
export type RepertoireDecisionOption = {
  settingsValue: string;
  title: string;
  courseSlug: string;
  courseId?: Types.ObjectId;
  targetLessonId?: Types.ObjectId;
  /** Stable target used before, or instead of, resolving a lesson ObjectId. */
  targetLineKey?: string;
  /** Target lesson ply at which training resumes. */
  targetPly: number;
};

export interface IRepertoireDecisionFields {
  /** Stable across builds and versions of the same decision. */
  decisionId: string;
  /** Repertoire/settings collection this decision belongs to. */
  collectionKey: string;
  trainSide: TrainSide;
  /** Normalized chess-position identity used for runtime lookup. */
  positionKey: string;
  displayPathUci?: string[];
  displayPathSan?: string[];
  options: RepertoireDecisionOption[];
  /** Builder-supplied content version. */
  version: string;
  generatedAt: Date;
  /** Build provenance, matching course publish metadata. */
  metadata?: CourseMetadata;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Plain repertoire decision shape for builders and lean backend reads. */
export type IRepertoireDecision = IRepertoireDecisionFields & { _id: unknown };

export interface IRepertoireDecisionDocument
  extends IRepertoireDecisionFields,
    Document {}

const repertoireDecisionOptionSchema = new Schema<RepertoireDecisionOption>(
  {
    settingsValue: { type: String, required: true },
    title: { type: String, required: true },
    courseSlug: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId },
    targetLessonId: { type: Schema.Types.ObjectId },
    targetLineKey: { type: String },
    targetPly: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const repertoireDecisionSchema = new Schema<IRepertoireDecisionDocument>(
  {
    decisionId: { type: String, required: true },
    collectionKey: { type: String, required: true },
    trainSide: { type: String, enum: ['w', 'b'], required: true },
    positionKey: { type: String, required: true },
    displayPathUci: { type: [String], default: undefined },
    displayPathSan: { type: [String], default: undefined },
    options: {
      type: [repertoireDecisionOptionSchema],
      required: true,
      validate: [
        {
          validator: (options: RepertoireDecisionOption[]) => options.length > 0,
          message: 'A repertoire decision must have at least one option',
        },
        {
          validator: (options: RepertoireDecisionOption[]) =>
            new Set(options.map((option) => option.settingsValue)).size ===
            options.length,
          message: 'Repertoire decision settingsValue values must be unique',
        },
      ],
    },
    version: { type: String, required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    metadata: {
      generatedAt: { type: Date },
      algorithm: { type: String },
      filters: {
        minElo: { type: Number },
        maxElo: { type: Number },
        sources: { type: [String] },
        numGamesUsed: { type: Number },
      },
      builderCommitSha: { type: String },
      builderSourceHash: { type: String },
    },
    published: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date },
  },
  {
    collection: 'repertoire_decisions',
    timestamps: true,
  },
);

/** Preserve every version while preventing duplicate stable decisions in one build. */
repertoireDecisionSchema.index(
  { collectionKey: 1, decisionId: 1, version: 1 },
  { unique: true },
);
/** A build can contain at most one decision for a train-side position. */
repertoireDecisionSchema.index(
  { collectionKey: 1, trainSide: 1, positionKey: 1, version: 1 },
  { unique: true },
);
/** Direct runtime lookup from compact lesson handoff metadata. */
repertoireDecisionSchema.index({
  decisionId: 1,
  positionKey: 1,
  published: 1,
  publishedAt: -1,
});

export const RepertoireDecision: Model<IRepertoireDecisionDocument> =
  model<IRepertoireDecisionDocument>(
    'RepertoireDecision',
    repertoireDecisionSchema,
  );
