import {
  computeDrillPlan,
  contiguousMasteredCount,
  defaultLineMastery,
  MASTERED_SKIP_COUNT,
  updateLineMastery,
  type CourseLineMasteryState,
} from '../src/lib/courseLineMastery';

const TRAIN_INDICES = [0, 2, 4, 6];
const REPETITIONS = 2;

function run(
  state: CourseLineMasteryState,
  perMove: Array<{ index: number; isCorrect: boolean }>,
): CourseLineMasteryState {
  return updateLineMastery(TRAIN_INDICES, state, perMove, {
    repetitions: REPETITIONS,
  });
}

describe('courseLineMastery walkthrough', () => {
  it('covers runs 1-3 from the plan with repetitions=2', () => {
    let state = defaultLineMastery(4);

    state = run(state, [
      { index: 0, isCorrect: true },
      { index: 2, isCorrect: true },
      { index: 4, isCorrect: false },
    ]);
    expect(state.masteredSlots).toEqual([true, true, false, false]);
    expect(state.slotRepetitionsRemaining?.[2]).toBe(2);
    expect(state.skipRemaining).toBe(0);

    state = run(state, [
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    expect(state.masteredSlots).toEqual([true, true, false, true]);
    expect(state.slotRepetitionsRemaining?.[2]).toBe(1);

    state = run(state, [{ index: 4, isCorrect: true }]);
    expect(state.masteredSlots).toEqual([true, true, true, true]);
    expect(state.skipRemaining).toBe(MASTERED_SKIP_COUNT);
  });

  it('auto-plays during skip when the full prefix is mastered', () => {
    const state: CourseLineMasteryState = {
      masteredSlots: [true, true, true, true],
      skipRemaining: 5,
    };
    const plan = computeDrillPlan(TRAIN_INDICES, state);
    expect(plan.drillAtIndices).toEqual([]);
    expect(plan.startMoveIndex).toBe(0);
  });

  it('quizzes only pending slot 2 after run 2 in the walkthrough', () => {
    const state: CourseLineMasteryState = {
      masteredSlots: [true, true, false, true],
      skipRemaining: 0,
      slotRepetitionsRemaining: [0, 0, 1, 0],
    };
    const plan = computeDrillPlan(TRAIN_INDICES, state);
    expect(plan.drillAtIndices).toEqual([4]);
    expect(plan.startMoveIndex).toBe(4);
  });
});

describe('courseLineMastery recovery', () => {
  it('demotes only the missed slot and keeps mastered tail during revalidate', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, true, true, true],
      skipRemaining: 0,
    };

    state = run(state, [
      { index: 0, isCorrect: true },
      { index: 2, isCorrect: false },
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);

    expect(state.masteredSlots).toEqual([true, false, true, true]);
    expect(state.recoveryTrainSlot).toBe(1);
    expect(state.slotRepetitionsRemaining?.[1]).toBe(2);
  });

  it('clears recovery after consecutive successful runs on the demoted slot', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, false, true, true],
      skipRemaining: 0,
      slotRepetitionsRemaining: [0, 2, 0, 0],
      recoveryTrainSlot: 1,
    };

    state = run(state, [
      { index: 2, isCorrect: true },
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    expect(state.slotRepetitionsRemaining?.[1]).toBe(1);
    expect(state.recoveryTrainSlot).toBe(1);

    state = run(state, [
      { index: 2, isCorrect: true },
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    expect(state.masteredSlots[1]).toBe(true);
    expect(state.recoveryTrainSlot).toBeUndefined();
    expect(state.skipRemaining).toBe(MASTERED_SKIP_COUNT);
  });
});

describe('contiguousMasteredCount', () => {
  it('counts only the prefix without holes', () => {
    expect(contiguousMasteredCount([true, true, false, true])).toBe(2);
  });
});
