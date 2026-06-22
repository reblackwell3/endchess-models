import { Chess } from 'chess.js';
import {
  COURSE_PREVIEW_LINE_PLIES,
  type CoursePreviewThumbnail,
} from '../models/course/courseTypes';

export type LessonPreviewLine = {
  startFen: string;
  setupUci?: string;
  movesSan: readonly string[];
  movesUci?: readonly string[];
};

/** Build an animated preview snippet for a lesson or segment line. */
export function previewFromLessonLine(
  line: LessonPreviewLine,
): CoursePreviewThumbnail | undefined {
  if (line.movesSan.length === 0) {
    return undefined;
  }

  const playCount = Math.min(COURSE_PREVIEW_LINE_PLIES, line.movesSan.length);
  const maxStart = Math.max(0, line.movesSan.length - playCount);
  const startIdx = Math.min(Math.floor(line.movesSan.length / 2), maxStart);

  const chess = new Chess(line.startFen);
  for (let i = 0; i < startIdx; i += 1) {
    const move = chess.move(line.movesSan[i]!);
    if (!move) {
      return undefined;
    }
  }

  const windowSans = line.movesSan.slice(startIdx, startIdx + playCount);
  if (windowSans.length === 0) {
    return undefined;
  }

  const thumbnail: CoursePreviewThumbnail = {
    pgn: windowSans.join(' '),
  };

  const previewStartFen = chess.fen();
  if (previewStartFen !== new Chess().fen()) {
    thumbnail.startFen = previewStartFen;
  }

  const setupUci =
    startIdx > 0 ? line.movesUci?.[startIdx - 1] : line.setupUci;
  if (setupUci) {
    thumbnail.setupUci = setupUci;
  }

  return thumbnail;
}
