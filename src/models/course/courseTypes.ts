export type TrainSide = 'w' | 'b';
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
