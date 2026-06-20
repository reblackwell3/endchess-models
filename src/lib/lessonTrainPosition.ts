import { Chess } from 'chess.js';
import type { ILesson } from '../models/course/courseModel';
import type { LessonTrainPosition, TrainSide } from '../models/course/courseTypes';

export type { LessonTrainPosition };

type LessonLine = Pick<
  ILesson,
  'startFen' | 'movesUci' | 'movesSan' | 'trainSide' | 'trainPositions'
>;

function applyUci(chess: Chess, uci: string) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci.slice(4) : undefined;
  return chess.move({ from, to, promotion });
}

/** Derive all trainable positions from a lesson line (used at course publish). */
export function computeLessonTrainPositions(
  lesson: Pick<
    ILesson,
    'startFen' | 'movesUci' | 'movesSan' | 'trainSide' | 'setupFen' | 'setupUci'
  >,
): LessonTrainPosition[] {
  const positions: LessonTrainPosition[] = [];
  const chess = new Chess(lesson.startFen);
  let prevFen: string | undefined = lesson.setupFen;
  let prevUci: string | undefined = lesson.setupUci;

  for (let index = 0; index < lesson.movesUci.length; index++) {
    const halfMove = index + 1;
    const sideToMove = chess.turn() as TrainSide;

    if (sideToMove === lesson.trainSide) {
      const position: LessonTrainPosition = {
        halfMove,
        fen: chess.fen(),
        expectedUci: lesson.movesUci[index],
        expectedSan: lesson.movesSan?.[index] ?? lesson.movesUci[index],
        sideToMove,
      };
      if (prevFen && prevUci) {
        position.setupFen = prevFen;
        position.setupUci = prevUci;
      }
      positions.push(position);
    }

    const fenBefore = chess.fen();
    const move = applyUci(chess, lesson.movesUci[index]);
    if (!move) {
      break;
    }
    prevFen = fenBefore;
    prevUci = lesson.movesUci[index];
  }

  return positions;
}

function embeddedTrainPositions(
  lesson: LessonLine,
): LessonTrainPosition[] | undefined {
  if (!lesson.trainPositions || lesson.trainPositions.length === 0) {
    return undefined;
  }
  return lesson.trainPositions;
}

/** 1-based half move in the lesson line (same convention as replay plies). */
export function lessonTrainPosition(
  lesson: LessonLine,
  halfMove: number,
): LessonTrainPosition | null {
  if (!Number.isInteger(halfMove) || halfMove < 1) {
    return null;
  }

  const embedded = embeddedTrainPositions(lesson);
  if (embedded) {
    return embedded.find((position) => position.halfMove === halfMove) ?? null;
  }

  return (
    computeLessonTrainPositions(lesson).find(
      (position) => position.halfMove === halfMove,
    ) ?? null
  );
}

/** 0-based indices into {@link ILesson.movesUci} where the trainer is to move. */
export function lessonTrainIndices(lesson: LessonLine): number[] {
  const embedded = embeddedTrainPositions(lesson);
  if (embedded) {
    return embedded.map((position) => position.halfMove - 1);
  }

  return computeLessonTrainPositions(lesson).map(
    (position) => position.halfMove - 1,
  );
}
