export type TrainSide = 'w' | 'b';

/** Precomputed train position embedded on a lesson at publish time. */
export type LessonTrainPosition = {
  /** 1-based half move in the lesson line. */
  halfMove: number;
  fen: string;
  expectedUci: string;
  expectedSan: string;
  sideToMove: TrainSide;
  /** Position before the opponent setup move leading into this train position. */
  setupFen?: string;
  /** Opponent move leading into this train position. */
  setupUci?: string;
};

export type CoursePhase = 'opening' | 'middlegame' | 'endgame';

/** Half-moves played on each course list thumbnail preview. */
export const COURSE_PREVIEW_LINE_PLIES = 8;

/** Animated line snippet stored on a course for list previews. */
export type CoursePreviewThumbnail = {
  /** Up to {@link COURSE_PREVIEW_LINE_PLIES} SAN half-moves from `startFen`. */
  pgn: string;
  startFen?: string;
};
export type GamePool = 'repertoire' | 'supplemental' | 'combined';
export type ParentOpening = 'e4' | 'caro-kann' | 'grunfeld';
export type SectionKind = 'line-branch' | 'structure' | 'material';
export type LessonType = 'line' | 'replay';
