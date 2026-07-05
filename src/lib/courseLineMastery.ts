import { Chess } from 'chess.js';
import type { TrainSide } from '../models/course/courseTypes';

export type LineTrainMode = TrainSide | 'both';

const turnFromFen = (fen: string): TrainSide =>
  fen.trim().split(/\s+/)[1] === 'b' ? 'b' : 'w';

function applyUci(chess: Chess, uci: string): void {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move = chess.move({ from, to, promotion });
  if (!move) {
    throw new Error(`Illegal UCI move: ${uci}`);
  }
}

/** 0-based move indices to quiz for the chosen train mode. */
export function lineTrainIndicesForMode(
  startFen: string,
  movesUci: readonly string[],
  mode: LineTrainMode,
): number[] {
  if (mode === 'both') {
    return movesUci.map((_, index) => index);
  }

  const indices: number[] = [];
  const chess = new Chess(startFen);
  for (let index = 0; index < movesUci.length; index += 1) {
    if (turnFromFen(chess.fen()) === mode) {
      indices.push(index);
    }
    try {
      applyUci(chess, movesUci[index]!);
    } catch {
      break;
    }
  }
  return indices;
}

export type CourseLineMasteryState = {
  /** Per train-slot mastery (index aligns with trainIndices for this mode). */
  masteredSlots: boolean[];
  /** Line completions left before re-quizzing mastered prefix (0–5). */
  skipRemaining: number;
  /** Successful line runs still required before a missed slot becomes mastered. */
  slotRepetitionsRemaining?: number[];
  /** Train slot in recovery (only this slot was demoted on miss during revalidate). */
  recoveryTrainSlot?: number;
};

export type CourseLineDrillMove = {
  /** 0-based move index in the lesson line. */
  index: number;
  isCorrect: boolean;
};

export const MASTERED_SKIP_COUNT = 5;

export function contiguousMasteredCount(masteredSlots: readonly boolean[]): number {
  let count = 0;
  for (const mastered of masteredSlots) {
    if (!mastered) {
      break;
    }
    count += 1;
  }
  return count;
}

export function defaultLineMastery(slotCount: number): CourseLineMasteryState {
  return {
    masteredSlots: Array.from({ length: slotCount }, () => false),
    skipRemaining: 0,
  };
}

function normalizeState(
  mastery: CourseLineMasteryState,
  slotCount: number,
): Required<Pick<CourseLineMasteryState, 'masteredSlots' | 'slotRepetitionsRemaining'>> &
  CourseLineMasteryState {
  const masteredSlots = [...mastery.masteredSlots];
  while (masteredSlots.length < slotCount) {
    masteredSlots.push(false);
  }
  masteredSlots.length = slotCount;

  const slotRepetitionsRemaining = [...(mastery.slotRepetitionsRemaining ?? [])];
  while (slotRepetitionsRemaining.length < slotCount) {
    slotRepetitionsRemaining.push(0);
  }
  slotRepetitionsRemaining.length = slotCount;

  return {
    ...mastery,
    masteredSlots,
    slotRepetitionsRemaining,
  };
}

function slotNeedsQuiz(
  masteredSlots: readonly boolean[],
  slotRepetitionsRemaining: readonly number[],
  slot: number,
): boolean {
  if (!masteredSlots[slot]) {
    return true;
  }
  return (slotRepetitionsRemaining[slot] ?? 0) > 0;
}

function moveIndexToSlot(
  trainIndices: readonly number[],
  moveIndex: number,
): number | undefined {
  const slot = trainIndices.indexOf(moveIndex);
  return slot >= 0 ? slot : undefined;
}

export function computeDrillPlan(
  trainIndices: readonly number[],
  mastery: CourseLineMasteryState,
): { startMoveIndex: number; drillAtIndices: number[] } {
  const slotCount = trainIndices.length;
  if (slotCount === 0) {
    return { startMoveIndex: 0, drillAtIndices: [] };
  }

  const state = normalizeState(mastery, slotCount);
  const contiguous = contiguousMasteredCount(state.masteredSlots);
  const quizSlots: number[] = [];

  if (state.recoveryTrainSlot !== undefined) {
    const recoverySlot = state.recoveryTrainSlot;
    for (let slot = recoverySlot; slot < slotCount; slot += 1) {
      if (
        slotNeedsQuiz(
          state.masteredSlots,
          state.slotRepetitionsRemaining,
          slot,
        )
      ) {
        quizSlots.push(slot);
      }
    }
  } else if (state.skipRemaining > 0 && contiguous > 0) {
    for (let slot = 0; slot < slotCount; slot += 1) {
      const inContiguousPrefix = slot < contiguous;
      if (inContiguousPrefix && state.masteredSlots[slot]) {
        continue;
      }
      if (
        slotNeedsQuiz(
          state.masteredSlots,
          state.slotRepetitionsRemaining,
          slot,
        )
      ) {
        quizSlots.push(slot);
      }
    }
  } else {
    for (let slot = 0; slot < slotCount; slot += 1) {
      if (
        slotNeedsQuiz(
          state.masteredSlots,
          state.slotRepetitionsRemaining,
          slot,
        )
      ) {
        quizSlots.push(slot);
      }
    }
  }

  const drillAtIndices = quizSlots.map((slot) => trainIndices[slot]!);
  const startMoveIndex =
    drillAtIndices.length > 0 ? drillAtIndices[0]! : 0;

  return { startMoveIndex, drillAtIndices };
}

export function updateLineMastery(
  trainIndices: readonly number[],
  mastery: CourseLineMasteryState,
  perMove: readonly CourseLineDrillMove[],
  options: { repetitions: number },
): CourseLineMasteryState {
  const slotCount = trainIndices.length;
  if (slotCount === 0) {
    return mastery;
  }

  const repetitions = Math.max(1, options.repetitions);
  const state = normalizeState(mastery, slotCount);
  const priorMastered = [...state.masteredSlots];
  const priorContiguous = contiguousMasteredCount(priorMastered);
  const priorSkipRemaining = state.skipRemaining;
  const fullLineMastered = priorContiguous === slotCount;

  const resultByMove = new Map<number, boolean>();
  for (const entry of perMove) {
    resultByMove.set(entry.index, entry.isCorrect);
  }

  let hadMiss = false;

  for (let slot = 0; slot < slotCount; slot += 1) {
    const moveIndex = trainIndices[slot]!;
    const outcome = resultByMove.get(moveIndex);
    if (outcome === undefined) {
      continue;
    }

    if (!outcome) {
      hadMiss = true;
      const wasMastered = priorMastered[slot] === true;
      state.masteredSlots[slot] = false;
      state.slotRepetitionsRemaining[slot] = repetitions;

      if (
        wasMastered &&
        priorSkipRemaining === 0 &&
        fullLineMastered &&
        state.recoveryTrainSlot === undefined
      ) {
        state.recoveryTrainSlot = slot;
        state.skipRemaining = 0;
      } else if (
        state.recoveryTrainSlot !== undefined &&
        slot >= state.recoveryTrainSlot
      ) {
        state.slotRepetitionsRemaining[slot] = repetitions;
      }
      continue;
    }

    const remaining = state.slotRepetitionsRemaining[slot] ?? 0;
    if (remaining > 0) {
      const nextRemaining = remaining - 1;
      state.slotRepetitionsRemaining[slot] = nextRemaining;
      if (nextRemaining === 0) {
        state.masteredSlots[slot] = true;
      }
    } else if (!state.masteredSlots[slot]) {
      state.masteredSlots[slot] = true;
    }
  }

  if (
    state.recoveryTrainSlot !== undefined &&
    state.masteredSlots[state.recoveryTrainSlot] === true &&
    (state.slotRepetitionsRemaining[state.recoveryTrainSlot] ?? 0) === 0
  ) {
    state.recoveryTrainSlot = undefined;
  }

  const nextContiguous = contiguousMasteredCount(state.masteredSlots);
  if (nextContiguous === slotCount && priorContiguous < slotCount) {
    state.skipRemaining = MASTERED_SKIP_COUNT;
  } else if (priorSkipRemaining > 0 && !hadMiss) {
    state.skipRemaining = Math.max(0, priorSkipRemaining - 1);
  }

  return {
    masteredSlots: state.masteredSlots,
    skipRemaining: state.skipRemaining,
    slotRepetitionsRemaining: state.slotRepetitionsRemaining.some((value) => value > 0)
      ? state.slotRepetitionsRemaining
      : undefined,
    recoveryTrainSlot: state.recoveryTrainSlot,
  };
}
