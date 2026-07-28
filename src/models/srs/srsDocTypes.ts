import type { TrainSide } from '../course/courseTypes';

export type SrsDeck = 'position' | 'puzzle';
export type CardSource = 'auto' | 'manual' | 'line';
export type CardStatus = 'new' | 'learning' | 'review';
export type { TrainSide };

/** Persisted shape of an SRS card (Mongo). */
export type SrsCardDoc = {
  _id: unknown;
  providerId: string;
  kind: SrsDeck;
  /** positionKey for kind 'position', puzzleId for kind 'puzzle'. */
  refId: string;
  fen?: string;
  sideToMove?: TrainSide;
  expectedUci?: string;
  expectedSan?: string;
  setupFen?: string;
  setupUci?: string;
  white?: string;
  black?: string;
  whiteElo?: number;
  blackElo?: number;
  timeControl?: string;
  timeClass?: string;
  date?: string;
  result?: string;
  eco?: string;
  opening?: string;
  event?: string;
  openingSans?: string[];
  movesUci?: string[];
  reviewStartIndex?: number;
  quizAtIndices?: number[];
  courseSlug?: string;
  courseTitle?: string;
  courseId?: string;
  phase?: string;
  lessonId?: string;
  /** Content-addressed course-line identity, scoped by courseSlug. */
  lineKey?: string;
  lessonTitle?: string;
  source: CardSource;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt?: Date;
  status: CardStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Persisted shape of an SRS line (Mongo). */
export type SrsLineDoc = {
  _id: unknown;
  providerId: string;
  name: string;
  startFen: string;
  movesUci: string[];
  movesSan: string[];
  trainSide: TrainSide;
  sourceGameId?: string;
  lastScorePct: number | null;
  bestScorePct: number;
  attempts: number;
  lastDrilledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
