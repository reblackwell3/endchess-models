import {
  computeDrillPlan,
  contiguousMasteredCount,
  defaultLineMastery,
  longestMasteredStemDepth,
  MASTERED_SKIP_COUNT,
  nextStemMasterySkipState,
  updateLineMastery,
  type CourseLineMasteryState,
} from '../src/lib/courseLineMastery';

const TRAIN_INDICES = [0, 2, 4, 6];
const REPETITIONS = 2;
const ALL_CORRECT = [
  { index: 0, isCorrect: true },
  { index: 2, isCorrect: true },
  { index: 4, isCorrect: true },
  { index: 6, isCorrect: true },
];

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
    // The newly mastered prefix arms skips even though the line has misses.
    expect(state.skipRemaining).toBe(MASTERED_SKIP_COUNT);

    state = run(state, [
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    expect(state.masteredSlots).toEqual([true, true, false, true]);
    expect(state.slotRepetitionsRemaining?.[2]).toBe(1);
    expect(state.skipRemaining).toBe(1);

    state = run(state, [{ index: 4, isCorrect: true }]);
    expect(state.masteredSlots).toEqual([true, true, true, true]);
    expect(state.skipRemaining).toBe(MASTERED_SKIP_COUNT);
    expect(state.skipInterval).toBe(MASTERED_SKIP_COUNT);
  });

  it('auto-plays during skip when the full prefix is mastered', () => {
    const state: CourseLineMasteryState = {
      masteredSlots: [true, true, true, true],
      skipRemaining: 2,
    };
    const plan = computeDrillPlan(TRAIN_INDICES, state);
    expect(plan.drillAtIndices).toEqual([]);
    expect(plan.startMoveIndex).toBe(0);
  });

  it('quizzes only pending slot 2 while the prefix skip budget is active', () => {
    const state: CourseLineMasteryState = {
      masteredSlots: [true, true, false, true],
      skipRemaining: 1,
      slotRepetitionsRemaining: [0, 0, 1, 0],
    };
    const plan = computeDrillPlan(TRAIN_INDICES, state);
    expect(plan.drillAtIndices).toEqual([4]);
    expect(plan.startMoveIndex).toBe(4);
  });

  it('re-quizzes the mastered prefix for revalidation when skips run out', () => {
    const state: CourseLineMasteryState = {
      masteredSlots: [true, true, false, true],
      skipRemaining: 0,
      slotRepetitionsRemaining: [0, 0, 1, 0],
    };
    const plan = computeDrillPlan(TRAIN_INDICES, state);
    expect(plan.drillAtIndices).toEqual([0, 2, 4]);
    expect(plan.startMoveIndex).toBe(0);
  });

  it('re-quizzes a fully mastered line for revalidation when skips run out', () => {
    const state: CourseLineMasteryState = {
      masteredSlots: [true, true, true, true],
      skipRemaining: 0,
    };
    const plan = computeDrillPlan(TRAIN_INDICES, state);
    expect(plan.drillAtIndices).toEqual([0, 2, 4, 6]);
    expect(plan.startMoveIndex).toBe(0);
  });
});

describe('courseLineMastery partial-prefix skips', () => {
  it('keeps the skip counter through tail misses and decrements per run', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, true, false, false],
      skipRemaining: 4,
      skipInterval: 4,
      slotRepetitionsRemaining: [0, 0, 2, 0],
    };

    state = run(state, [
      { index: 4, isCorrect: false },
      { index: 6, isCorrect: true },
    ]);
    expect(state.skipRemaining).toBe(3);
    expect(state.skipInterval).toBe(4);
    expect(state.masteredSlots).toEqual([true, true, false, true]);
  });

  it('arms the skip counter from the current interval, not hardcoded 2', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [false, false, false, false],
      skipRemaining: 0,
      skipInterval: 8,
    };

    state = run(state, ALL_CORRECT);
    expect(state.masteredSlots).toEqual([true, true, true, true]);
    expect(state.skipRemaining).toBe(8);
    expect(state.skipInterval).toBe(8);

    state = run(state, [{ index: 6, isCorrect: true }]);
    expect(state.skipRemaining).toBe(7);
  });

  it('doubles the interval on clean partial-prefix revalidation despite a tail miss', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, true, false, false],
      skipRemaining: 0,
      skipInterval: 2,
    };

    state = run(state, [
      { index: 0, isCorrect: true },
      { index: 2, isCorrect: true },
      { index: 4, isCorrect: false },
      { index: 6, isCorrect: false },
    ]);
    expect(state.masteredSlots).toEqual([true, true, false, false]);
    expect(state.skipRemaining).toBe(4);
    expect(state.skipInterval).toBe(4);
  });

  it('resets skips and interval on a prefix miss', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, true, false, false],
      skipRemaining: 0,
      skipInterval: 4,
    };

    state = run(state, [
      { index: 0, isCorrect: true },
      { index: 2, isCorrect: false },
      { index: 4, isCorrect: true },
    ]);
    expect(state.masteredSlots).toEqual([true, false, true, false]);
    expect(state.skipRemaining).toBe(0);
    expect(state.skipInterval).toBe(MASTERED_SKIP_COUNT);
    expect(state.recoveryTrainSlot).toBe(1);
  });
});

describe('courseLineMastery doubling skips', () => {
  it('arms 2, burns skips, doubles to 4 on clean revalidate, then 8', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, true, true, true],
      skipRemaining: 2,
      skipInterval: 2,
    };

    for (let i = 0; i < 2; i += 1) {
      state = run(state, ALL_CORRECT);
    }
    expect(state.skipRemaining).toBe(0);
    expect(state.skipInterval).toBe(2);

    state = run(state, ALL_CORRECT);
    expect(state.skipRemaining).toBe(4);
    expect(state.skipInterval).toBe(4);

    for (let i = 0; i < 4; i += 1) {
      state = run(state, ALL_CORRECT);
    }
    expect(state.skipRemaining).toBe(0);

    state = run(state, ALL_CORRECT);
    expect(state.skipRemaining).toBe(8);
    expect(state.skipInterval).toBe(8);
  });

  it('resets interval to 2 on miss and remasters to 2 again', () => {
    let state: CourseLineMasteryState = {
      masteredSlots: [true, true, true, true],
      skipRemaining: 0,
      skipInterval: 4,
    };

    state = run(state, [
      { index: 0, isCorrect: true },
      { index: 2, isCorrect: false },
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    expect(state.skipRemaining).toBe(0);
    expect(state.skipInterval).toBe(MASTERED_SKIP_COUNT);
    expect(state.masteredSlots[1]).toBe(false);

    state = run(state, [
      { index: 2, isCorrect: true },
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    state = run(state, [
      { index: 2, isCorrect: true },
      { index: 4, isCorrect: true },
      { index: 6, isCorrect: true },
    ]);
    expect(state.masteredSlots).toEqual([true, true, true, true]);
    expect(state.skipRemaining).toBe(MASTERED_SKIP_COUNT);
    expect(state.skipInterval).toBe(MASTERED_SKIP_COUNT);

    for (let i = 0; i < 2; i += 1) {
      state = run(state, ALL_CORRECT);
    }
    state = run(state, ALL_CORRECT);
    expect(state.skipRemaining).toBe(4);
    expect(state.skipInterval).toBe(4);
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
    expect(state.skipInterval).toBe(MASTERED_SKIP_COUNT);
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
    expect(state.skipInterval).toBe(MASTERED_SKIP_COUNT);
  });
});

describe('contiguousMasteredCount', () => {
  it('counts only the prefix without holes', () => {
    expect(contiguousMasteredCount([true, true, false, true])).toBe(2);
  });
});

describe('longestMasteredStemDepth', () => {
  const stems = [
    { stemKey: 'a', depth: 2, trainSlots: 1 },
    { stemKey: 'a|b', depth: 4, trainSlots: 2 },
  ];

  it('stops at stems due for revalidation (skipRemaining 0)', () => {
    const mastery = new Map([
      [
        'a',
        { masteredSlots: [true], skipRemaining: 1, skipInterval: 2 },
      ],
      [
        'a|b',
        { masteredSlots: [true, true], skipRemaining: 0, skipInterval: 2 },
      ],
    ]);
    expect(longestMasteredStemDepth(stems, [0, 1], mastery)).toBe(2);
  });

  it('includes stems with active skipRemaining', () => {
    const mastery = new Map([
      [
        'a',
        { masteredSlots: [true], skipRemaining: 1, skipInterval: 2 },
      ],
      [
        'a|b',
        { masteredSlots: [true, true], skipRemaining: 2, skipInterval: 2 },
      ],
    ]);
    expect(longestMasteredStemDepth(stems, [0, 1], mastery)).toBe(4);
  });

  it('passes through vacuous trainSlots=0 stems without requiring mastery', () => {
    const withVacuous = [
      { stemKey: 'd2d4', depth: 1, trainSlots: 0 },
      { stemKey: 'd2d4|d7d5', depth: 2, trainSlots: 1 },
      { stemKey: 'd2d4|d7d5|c2c4|e7e6', depth: 4, trainSlots: 2 },
    ];
    const mastery = new Map([
      [
        'd2d4|d7d5',
        { masteredSlots: [true], skipRemaining: 4, skipInterval: 4 },
      ],
      [
        'd2d4|d7d5|c2c4|e7e6',
        { masteredSlots: [true, true], skipRemaining: 4, skipInterval: 4 },
      ],
    ]);
    expect(longestMasteredStemDepth(withVacuous, [0, 1, 2], mastery)).toBe(4);
  });
});

describe('nextStemMasterySkipState', () => {
  const slots = [true, true];

  it('arms 2 on first mastery', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: true,
        prefixSlots: slots,
        existing: undefined,
        trainSlots: 2,
      }),
    ).toEqual({
      masteredSlots: slots,
      skipRemaining: 2,
      skipInterval: 2,
    });
  });

  it('decrements when already skipping', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: true,
        prefixSlots: slots,
        existing: {
          masteredSlots: slots,
          skipRemaining: 2,
          skipInterval: 2,
        },
        trainSlots: 2,
      }),
    ).toEqual({
      masteredSlots: slots,
      skipRemaining: 1,
      skipInterval: 2,
    });
  });

  it('doubles on clean revalidate', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: true,
        prefixSlots: slots,
        existing: {
          masteredSlots: slots,
          skipRemaining: 0,
          skipInterval: 2,
        },
        trainSlots: 2,
      }),
    ).toEqual({
      masteredSlots: slots,
      skipRemaining: 4,
      skipInterval: 4,
    });
  });

  it('demotes on miss and resets interval', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: false,
        prefixSlots: [true, false],
        existing: {
          masteredSlots: slots,
          skipRemaining: 3,
          skipInterval: 4,
        },
        trainSlots: 2,
      }),
    ).toEqual({
      masteredSlots: [true, false],
      skipRemaining: 0,
      skipInterval: 2,
    });
  });
});
