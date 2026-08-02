import type { LessonTrainPosition, TrainSide } from '../models/course/courseTypes';
import { computeLessonTrainPositions } from './lessonTrainPosition';
import { positionKey } from './positionUtils';

export type CourseSrsLessonLike = {
  _id: unknown;
  sectionId: unknown;
  order: number;
  lineKey: string;
  title: string;
  startFen: string;
  setupFen?: string;
  setupUci?: string;
  movesUci: string[];
  movesSan: string[];
  trainSide: TrainSide;
};

export type CourseSrsOwnerCandidate<
  TLesson extends CourseSrsLessonLike = CourseSrsLessonLike,
> = {
  lesson: TLesson;
  position: LessonTrainPosition;
  sectionOrder: number;
  lessonOrder: number;
  lessonId: string;
};

export type CourseSrsCardContext = {
  expectedUci?: string;
  openingSans?: string[];
};

function compareCandidates(
  a: CourseSrsOwnerCandidate,
  b: CourseSrsOwnerCandidate,
): number {
  if (a.sectionOrder !== b.sectionOrder) {
    return a.sectionOrder - b.sectionOrder;
  }
  if (a.lessonOrder !== b.lessonOrder) {
    return a.lessonOrder - b.lessonOrder;
  }
  return a.lessonId.localeCompare(b.lessonId);
}

export function commonSanPrefixLength(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): number {
  if (!left || !right) return 0;
  const length = Math.min(left.length, right.length);
  let index = 0;
  while (index < length && left[index] === right[index]) {
    index += 1;
  }
  return index;
}

/**
 * Build all active lesson owners for each trainable position.
 *
 * A position can occur in many lessons. Candidates remain sorted in stable
 * catalog order so equivalent ties resolve consistently.
 */
export function buildCourseSrsPositionCandidates<
  TLesson extends CourseSrsLessonLike,
>(
  lessons: readonly TLesson[],
  sectionOrder: ReadonlyMap<string, number> = new Map(),
): Map<string, CourseSrsOwnerCandidate<TLesson>[]> {
  const fallbackSectionOrder = new Map<string, number>();
  for (const lesson of lessons) {
    const sectionId = String(lesson.sectionId);
    if (!fallbackSectionOrder.has(sectionId)) {
      fallbackSectionOrder.set(sectionId, fallbackSectionOrder.size);
    }
  }
  const sortedLessons = [...lessons].sort((a, b) => {
    const aSection =
      sectionOrder.get(String(a.sectionId)) ??
      fallbackSectionOrder.get(String(a.sectionId)) ??
      Number.MAX_SAFE_INTEGER;
    const bSection =
      sectionOrder.get(String(b.sectionId)) ??
      fallbackSectionOrder.get(String(b.sectionId)) ??
      Number.MAX_SAFE_INTEGER;
    if (aSection !== bSection) return aSection - bSection;
    if (a.order !== b.order) return a.order - b.order;
    return String(a._id).localeCompare(String(b._id));
  });

  const candidatesByRefId = new Map<
    string,
    CourseSrsOwnerCandidate<TLesson>[]
  >();
  for (const lesson of sortedLessons) {
    const candidateSectionOrder =
      sectionOrder.get(String(lesson.sectionId)) ??
      fallbackSectionOrder.get(String(lesson.sectionId)) ??
      Number.MAX_SAFE_INTEGER;
    for (const position of computeLessonTrainPositions(lesson)) {
      const refId = positionKey(position.fen);
      const candidates = candidatesByRefId.get(refId) ?? [];
      candidates.push({
        lesson,
        position,
        sectionOrder: candidateSectionOrder,
        lessonOrder: lesson.order,
        lessonId: String(lesson._id),
      });
      candidatesByRefId.set(refId, candidates);
    }
  }

  for (const candidates of candidatesByRefId.values()) {
    candidates.sort(compareCandidates);
  }
  return candidatesByRefId;
}

/**
 * Select the active owner closest to the card's prior line context.
 *
 * The existing expected move is authoritative. Among lessons teaching that
 * move, the longest SAN-prefix match wins; equivalent candidates use stable
 * catalog order.
 */
export function resolveCourseSrsOwner<
  TLesson extends CourseSrsLessonLike,
>(
  card: CourseSrsCardContext,
  candidates: readonly CourseSrsOwnerCandidate<TLesson>[],
): CourseSrsOwnerCandidate<TLesson> | undefined {
  const moveMatches = card.expectedUci
    ? candidates.filter(
        (candidate) => candidate.position.expectedUci === card.expectedUci,
      )
    : [...candidates];
  if (moveMatches.length === 0) return undefined;

  return [...moveMatches].sort((a, b) => {
    const prefixDelta =
      commonSanPrefixLength(card.openingSans, b.lesson.movesSan) -
      commonSanPrefixLength(card.openingSans, a.lesson.movesSan);
    return prefixDelta !== 0 ? prefixDelta : compareCandidates(a, b);
  })[0];
}
