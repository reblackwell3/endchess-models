import { Document, Model, model, Schema } from 'mongoose';

export interface IMistakeLessonExclusion extends Document {
  providerId: string;
  gameId: string;
  plyIndex: number;
}

const mistakeLessonExclusionSchema = new Schema<IMistakeLessonExclusion>(
  {
    providerId: { type: String, required: true, index: true },
    gameId: { type: String, required: true },
    plyIndex: { type: Number, required: true },
  },
  { collection: 'mistake_lesson_exclusions' },
);

mistakeLessonExclusionSchema.index(
  { providerId: 1, gameId: 1, plyIndex: 1 },
  { unique: true },
);

export const MistakeLessonExclusion: Model<IMistakeLessonExclusion> =
  model<IMistakeLessonExclusion>(
    'MistakeLessonExclusion',
    mistakeLessonExclusionSchema,
  );
