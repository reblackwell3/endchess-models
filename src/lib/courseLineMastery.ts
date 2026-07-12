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
  /** Line completions left before re-quizzing mastered prefix. */
  skipRemaining: number;
  /**
   * Skip batch size after a clean revalidation (starts at {@link MASTERED_SKIP_COUNT},
   * doubles uncapped; resets to {@link MASTERED_SKIP_COUNT} on miss).
   */
  skipInterval?: number;
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

export const MASTERED_SKIP_COUNT = 2;

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
    skipInterval: MASTERED_SKIP_COUNT,
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
  options?: { stemSkipDepth?: number },
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
    // Skip budget exhausted: the mastered prefix is due for revalidation, so
    // quiz it again alongside the slots that still need work.
    for (let slot = 0; slot < slotCount; slot += 1) {
      if (
        slot < contiguous ||
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

  let drillAtIndices = quizSlots.map((slot) => trainIndices[slot]!);
  let startMoveIndex =
    drillAtIndices.length > 0 ? drillAtIndices[0]! : 0;

  const stemSkipDepth = Math.max(0, options?.stemSkipDepth ?? 0);
  if (stemSkipDepth > 0) {
    drillAtIndices = drillAtIndices.filter((index) => index >= stemSkipDepth);
    startMoveIndex =
      drillAtIndices.length > 0
        ? drillAtIndices[0]!
        : Math.min(stemSkipDepth, trainIndices[trainIndices.length - 1] ?? 0);
  }

  return { startMoveIndex, drillAtIndices };
}

export type StemMasterySkipState = {
  masteredSlots: boolean[];
  skipRemaining?: number;
  skipInterval?: number;
};

export function stemMasteryComplete(
  stemTrainSlots: number,
  masteredSlots: readonly boolean[] | undefined,
): boolean {
  if (!masteredSlots || stemTrainSlots <= 0) {
    return false;
  }
  if (masteredSlots.length < stemTrainSlots) {
    return false;
  }
  return masteredSlots.slice(0, stemTrainSlots).every(Boolean);
}

/** Next persisted stem skip state after a drill that touches this stem. */
export function nextStemMasterySkipState(args: {
  prefixMastered: boolean;
  prefixSlots: readonly boolean[];
  existing: StemMasterySkipState | undefined;
  trainSlots: number;
}): StemMasterySkipState | null {
  const {
    prefixMastered,
    prefixSlots,
    existing,
    trainSlots,
  } = args;
  const wasComplete = stemMasteryComplete(trainSlots, existing?.masteredSlots);
  const priorSkipRemaining = existing?.skipRemaining ?? 0;
  const priorSkipInterval = Math.max(
    MASTERED_SKIP_COUNT,
    existing?.skipInterval ?? MASTERED_SKIP_COUNT,
  );

  if (!prefixMastered) {
    if (!existing) {
      return null;
    }
    return {
      masteredSlots: [...prefixSlots],
      skipRemaining: 0,
      skipInterval: MASTERED_SKIP_COUNT,
    };
  }

  if (!wasComplete) {
    return {
      masteredSlots: [...prefixSlots],
      skipRemaining: MASTERED_SKIP_COUNT,
      skipInterval: MASTERED_SKIP_COUNT,
    };
  }

  if (priorSkipRemaining > 0) {
    return {
      masteredSlots: [...prefixSlots],
      skipRemaining: Math.max(0, priorSkipRemaining - 1),
      skipInterval: priorSkipInterval,
    };
  }

  const nextInterval = priorSkipInterval * 2;
  return {
    masteredSlots: [...prefixSlots],
    skipRemaining: nextInterval,
    skipInterval: nextInterval,
  };
}

export function longestMasteredStemDepth(
  stems: readonly { depth: number; trainSlots: number; stemKey: string }[],
  stemIds: readonly number[],
  stemMasteryByKey: ReadonlyMap<string, StemMasterySkipState>,
): number {
  let depth = 0;
  for (const stemId of stemIds) {
    const stem = stems[stemId];
    if (!stem) {
      break;
    }
    const mastery = stemMasteryByKey.get(stem.stemKey);
    if (!stemMasteryComplete(stem.trainSlots, mastery?.masteredSlots)) {
      break;
    }
    if ((mastery?.skipRemaining ?? 0) <= 0) {
      break;
    }
    depth = stem.depth;
  }
  return depth;
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
  const priorSkipInterval = Math.max(
    MASTERED_SKIP_COUNT,
    state.skipInterval ?? MASTERED_SKIP_COUNT,
  );
  let skipInterval = priorSkipInterval;

  const resultByMove = new Map<number, boolean>();
  for (const entry of perMove) {
    resultByMove.set(entry.index, entry.isCorrect);
  }

  let hadPrefixMiss = false;

  for (let slot = 0; slot < slotCount; slot += 1) {
    const moveIndex = trainIndices[slot]!;
    const outcome = resultByMove.get(moveIndex);
    if (outcome === undefined) {
      continue;
    }

    if (!outcome) {
      const wasMastered = priorMastered[slot] === true;
      const inMasteredPrefix = slot < priorContiguous;
      if (inMasteredPrefix) {
        hadPrefixMiss = true;
      }
      state.masteredSlots[slot] = false;
      state.slotRepetitionsRemaining[slot] = repetitions;

      if (
        wasMastered &&
        inMasteredPrefix &&
        priorSkipRemaining === 0 &&
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
  // A clean revalidation means every slot of the prior mastered prefix was
  // quizzed this run and answered correctly.
  let prefixRevalidatedClean = priorContiguous > 0 && !hadPrefixMiss;
  if (prefixRevalidatedClean) {
    for (let slot = 0; slot < priorContiguous; slot += 1) {
      if (resultByMove.get(trainIndices[slot]!) !== true) {
        prefixRevalidatedClean = false;
        break;
      }
    }
  }

  if (hadPrefixMiss) {
    skipInterval = MASTERED_SKIP_COUNT;
    state.skipRemaining = 0;
  } else if (priorSkipRemaining === 0 && prefixRevalidatedClean) {
    skipInterval = priorSkipInterval * 2;
    state.skipRemaining = skipInterval;
  } else if (nextContiguous > priorContiguous) {
    state.skipRemaining = skipInterval;
  } else if (priorSkipRemaining > 0) {
    state.skipRemaining = Math.max(0, priorSkipRemaining - 1);
  }

  return {
    masteredSlots: state.masteredSlots,
    skipRemaining: state.skipRemaining,
    skipInterval,
    slotRepetitionsRemaining: state.slotRepetitionsRemaining.some((value) => value > 0)
      ? state.slotRepetitionsRemaining
      : undefined,
    recoveryTrainSlot: state.recoveryTrainSlot,
  };
}
