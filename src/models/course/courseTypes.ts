export type TrainSide = 'w' | 'b';
export type CoursePhase = 'opening' | 'middlegame' | 'endgame';

/** One trainable half-move in a lesson line (precomputed at course publish). */
export type LessonTrainPosition = {
  /** 1-based half move in the lesson line (same convention as replay plies). */
  halfMove: number;
  fen: string;
  expectedUci: string;
  expectedSan: string;
  sideToMove: TrainSide;
  setupFen?: string;
  setupUci?: string;
};

/** Half-moves played on each course list thumbnail preview. */
export const COURSE_PREVIEW_LINE_PLIES = 8;

/** Animated line snippet stored on a course for list previews. */
export type CoursePreviewThumbnail = {
  /** Up to {@link COURSE_PREVIEW_LINE_PLIES} SAN half-moves from `startFen`. */
  pgn: string;
  startFen?: string;
};
/** How explorer opening repertoire lines were selected at build time. */
export type CourseAlgorithm = 'score' | 'popularity';

export type GamePool = 'repertoire' | 'supplemental' | 'combined';
export type ParentOpening = 'e4' | 'caro-kann' | 'grunfeld';
export type SectionKind = 'line-branch' | 'structure' | 'material';
export type LessonType = 'line' | 'replay';
