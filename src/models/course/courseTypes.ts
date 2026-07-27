export type TrainSide = 'w' | 'b';

/** Precomputed train position embedded on a lesson at publish time. */
export type LessonTrainPosition = {
  /** 1-based half move in the lesson line (same convention as replay plies). */
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

export type CoursePhase =
  | 'opening'
  | 'middlegame'
  | 'endgame'
  | 'mistakes';

/** Half-moves played on each course list thumbnail preview. */
export const COURSE_PREVIEW_LINE_PLIES = 8;

/** Animated line snippet stored on a course for list previews. */
export type CoursePreviewThumbnail = {
  /** Up to {@link COURSE_PREVIEW_LINE_PLIES} SAN half-moves from `startFen`. */
  pgn: string;
  startFen?: string;
  /** Move leading into {@link startFen} for the last-move indicator on ply 0. */
  setupUci?: string;
};
/** How explorer opening repertoire lines were selected at build time. */
export type CourseAlgorithm = 'popularity';

/** Build-time metadata stamped on courses when the course-builder publishes. */
export type CourseMetadata = {
  /** When this course version was published. */
  generatedAt?: Date;
  /** Opening line selection strategy (omitted on engine-built courses). */
  algorithm?: CourseAlgorithm;
  filters?: {
    minElo: number;
    maxElo: number;
    sources: string[];
    /** Games pulled from the master pool when built (0 for opening explorer walks). */
    numGamesUsed: number;
  };
  /** Git commit of endchess-course-builder at publish time. */
  builderCommitSha?: string;
  /**
   * Content-stable hash of course-builder at publish time
   * (`git rev-parse HEAD^{tree}`, or sha256 of `src/` when git is unavailable).
   */
  builderSourceHash?: string;
};

export type GamePool = 'repertoire' | 'supplemental' | 'combined';
export type ParentOpening = 'e4' | 'caro-kann' | 'grunfeld';
export type SectionKind = 'line-branch' | 'structure' | 'material';
export type LessonType = 'line' | 'replay' | 'mistake';

/** Shared opening prefix catalog entry (index = stem id on the course). */
export type CourseStem = {
  stemKey: string;
  depth: number;
  endFen: string;
  /** positionKey(endFen) — shared across transposed move orders. */
  endKey: string;
  trainSlots: number;
  /** Train-side UCIs along this path prefix (mastery identity for the stem). */
  trainUcis: string[];
  /** Elite-DB game count at this prefix (opening popularity walks only). */
  N?: number;
};
