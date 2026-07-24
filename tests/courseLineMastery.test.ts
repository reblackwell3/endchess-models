import {
  computeDrillPlan,
  contiguousMasteredCount,
  creditStemSkipToLineMastery,
  defaultLineMastery,
  longestMasteredStemDepth,
  MASTERED_SKIP_COUNT,
  mergeStemPrefixSlots,
  mergeStemPrefixUcis,
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

describe('creditStemSkipToLineMastery', () => {
  it('credits fresh false slots below stemSkipDepth and arms skip', () => {
    const trainIndices = [0, 2, 4, 6, 8];
    const credited = creditStemSkipToLineMastery(
      trainIndices,
      defaultLineMastery(5),
      6,
    );
    expect(credited.masteredSlots).toEqual([true, true, true, false, false]);
    expect(credited.skipRemaining).toBe(MASTERED_SKIP_COUNT);
    expect(credited.skipInterval).toBe(MASTERED_SKIP_COUNT);
  });

  it('does not credit demoted slots with pending repetitions', () => {
    const trainIndices = [0, 2, 4, 6];
    const credited = creditStemSkipToLineMastery(
      trainIndices,
      {
        masteredSlots: [false, true, true, true],
        skipRemaining: 0,
        skipInterval: 4,
        slotRepetitionsRemaining: [2, 0, 0, 0],
      },
      8,
    );
    expect(credited.masteredSlots[0]).toBe(false);
    expect(credited.slotRepetitionsRemaining?.[0]).toBe(2);
    expect(credited.skipRemaining).toBe(0);
  });

  it('does not overwrite the recovery train slot', () => {
    const trainIndices = [0, 2, 4];
    const credited = creditStemSkipToLineMastery(
      trainIndices,
      {
        masteredSlots: [false, true, true],
        skipRemaining: 0,
        recoveryTrainSlot: 0,
      },
      4,
    );
    expect(credited.masteredSlots[0]).toBe(false);
    expect(credited.recoveryTrainSlot).toBe(0);
  });
});

describe('computeDrillPlan stem skip with line holes', () => {
  it('keeps a demoted slot below stemSkipDepth in the drill list', () => {
    const trainIndices = [0, 2, 4, 6, 8];
    const plan = computeDrillPlan(
      trainIndices,
      {
        masteredSlots: [false, true, true, true, false],
        skipRemaining: 2,
        skipInterval: 2,
        slotRepetitionsRemaining: [2, 0, 0, 0, 0],
      },
      { stemSkipDepth: 6 },
    );
    expect(plan.drillAtIndices).toEqual([0, 8]);
    expect(plan.startMoveIndex).toBe(0);
  });

  it('after crediting, skips stem-covered slots on a fresh line', () => {
    const trainIndices = [1, 3, 5, 7, 9];
    const credited = creditStemSkipToLineMastery(
      trainIndices,
      defaultLineMastery(5),
      6,
    );
    const plan = computeDrillPlan(trainIndices, credited, {
      stemSkipDepth: 6,
    });
    expect(credited.masteredSlots).toEqual([true, true, true, false, false]);
    expect(plan.drillAtIndices).toEqual([7, 9]);
    expect(plan.startMoveIndex).toBe(7);
  });

  it('quizzes false holes and jumps mastered middle without stem credit', () => {
    const trainIndices = [0, 2, 4, 6, 8];
    const plan = computeDrillPlan(trainIndices, {
      masteredSlots: [false, true, true, true, false],
      skipRemaining: 0,
    });
    expect(plan.drillAtIndices).toEqual([0, 8]);
    expect(plan.startMoveIndex).toBe(0);
  });
});

describe('longestMasteredStemDepth', () => {
  const stems = [
    {
      stemKey: 'a',
      endKey: 'end-a',
      depth: 2,
      trainSlots: 1,
      trainUcis: ['a'],
    },
    {
      stemKey: 'a|b',
      endKey: 'end-ab',
      depth: 4,
      trainSlots: 2,
      trainUcis: ['a', 'b'],
    },
  ];

  it('stops at stems due for revalidation (skipRemaining 0)', () => {
    const mastery = new Map([
      [
        'end-a',
        { masteredUcis: ['a'], skipRemaining: 1, skipInterval: 2 },
      ],
      [
        'end-ab',
        { masteredUcis: ['a', 'b'], skipRemaining: 0, skipInterval: 2 },
      ],
    ]);
    expect(longestMasteredStemDepth(stems, [0, 1], mastery)).toBe(2);
  });

  it('includes stems with active skipRemaining', () => {
    const mastery = new Map([
      [
        'end-a',
        { masteredUcis: ['a'], skipRemaining: 1, skipInterval: 2 },
      ],
      [
        'end-ab',
        { masteredUcis: ['a', 'b'], skipRemaining: 2, skipInterval: 2 },
      ],
    ]);
    expect(longestMasteredStemDepth(stems, [0, 1], mastery)).toBe(4);
  });

  it('passes through vacuous trainSlots=0 stems without requiring mastery', () => {
    const withVacuous = [
      {
        stemKey: 'd2d4',
        endKey: 'end-d4',
        depth: 1,
        trainSlots: 0,
        trainUcis: [] as string[],
      },
      {
        stemKey: 'd2d4|d7d5',
        endKey: 'end-d4d5',
        depth: 2,
        trainSlots: 1,
        trainUcis: ['d2d4'],
      },
      {
        stemKey: 'd2d4|d7d5|c2c4|e7e6',
        endKey: 'end-qg',
        depth: 4,
        trainSlots: 2,
        trainUcis: ['d2d4', 'c2c4'],
      },
    ];
    const mastery = new Map([
      [
        'end-d4d5',
        { masteredUcis: ['d2d4'], skipRemaining: 4, skipInterval: 4 },
      ],
      [
        'end-qg',
        {
          masteredUcis: ['d2d4', 'c2c4'],
          skipRemaining: 4,
          skipInterval: 4,
        },
      ],
    ]);
    expect(longestMasteredStemDepth(withVacuous, [0, 1, 2], mastery)).toBe(4);
  });

  it('credits transposed stems that share endKey', () => {
    const transposed = [
      {
        stemKey: 'd2d4|e7e6|c2c4|g8f6',
        endKey: 'shared',
        depth: 4,
        trainSlots: 2,
        trainUcis: ['d2d4', 'c2c4'],
      },
    ];
    const mastery = new Map([
      [
        'shared',
        {
          masteredUcis: ['d2d4', 'c2c4'],
          skipRemaining: 2,
          skipInterval: 2,
        },
      ],
    ]);
    expect(longestMasteredStemDepth(transposed, [0], mastery)).toBe(4);
  });
});

describe('mergeStemPrefixUcis', () => {
  const trainIndices = [0, 2, 4, 6];
  const movesUci = ['d2d4', 'e7e6', 'c2c4', 'g8f6', 'g1f3', 'b8c6', 'b1c3'];

  it('preserves existing mastery for undrilled stem-skip slots', () => {
    expect(
      mergeStemPrefixUcis({
        trainSlots: 3,
        lineMasteredSlots: [false, false, false, true],
        existingMasteredUcis: ['d2d4', 'c2c4', 'g1f3'],
        drilledMoveIndices: new Set([6]),
        trainIndices,
        movesUci,
      }),
    ).toEqual(['d2d4', 'c2c4', 'g1f3']);
  });

  it('records an explicit miss on a drilled stem slot', () => {
    expect(
      mergeStemPrefixUcis({
        trainSlots: 3,
        lineMasteredSlots: [true, false, true],
        existingMasteredUcis: ['d2d4', 'c2c4', 'g1f3'],
        drilledMoveIndices: new Set([0, 2, 4]),
        trainIndices,
        movesUci,
      }),
    ).toEqual(['d2d4', 'g1f3']);
  });

  it('preserves mastered UCIs from an alternate transposition path', () => {
    // Path A previously mastered d2d4 + g1f3; path B drills c2c4 instead.
    const pathBMoves = ['c2c4', 'e7e6', 'g1f3', 'g8f6', 'd2d4', 'b8c6', 'b1c3'];
    const pathBTrainIndices = [0, 2, 4, 6];
    expect(
      mergeStemPrefixUcis({
        trainSlots: 2,
        lineMasteredSlots: [true, true, false, false],
        existingMasteredUcis: ['d2d4', 'g1f3'],
        drilledMoveIndices: new Set([0, 2]),
        trainIndices: pathBTrainIndices,
        movesUci: pathBMoves,
      }).sort(),
    ).toEqual(['c2c4', 'd2d4', 'g1f3'].sort());
  });
});

describe('mergeStemPrefixSlots', () => {
  const trainIndices = [1, 3, 5, 7];

  it('preserves existing mastery for undrilled stem-skip slots', () => {
    expect(
      mergeStemPrefixSlots({
        trainSlots: 3,
        lineMasteredSlots: [false, false, false, true],
        existingMasteredSlots: [true, true, true],
        drilledMoveIndices: new Set([7]),
        trainIndices,
      }),
    ).toEqual([true, true, true]);
  });

  it('records an explicit miss on a drilled stem slot', () => {
    expect(
      mergeStemPrefixSlots({
        trainSlots: 3,
        lineMasteredSlots: [true, false, true],
        existingMasteredSlots: [true, true, true],
        drilledMoveIndices: new Set([1, 3, 5]),
        trainIndices,
      }),
    ).toEqual([true, false, true]);
  });
});

describe('nextStemMasterySkipState', () => {
  const ucis = ['d2d4', 'c2c4'];

  it('arms 2 on first mastery', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: true,
        masteredUcis: ucis,
        existing: undefined,
        requiredUcis: ucis,
      }),
    ).toEqual({
      masteredUcis: ucis,
      skipRemaining: 2,
      skipInterval: 2,
    });
  });

  it('decrements when already skipping', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: true,
        masteredUcis: ucis,
        existing: {
          masteredUcis: ucis,
          skipRemaining: 2,
          skipInterval: 2,
        },
        requiredUcis: ucis,
      }),
    ).toEqual({
      masteredUcis: ucis,
      skipRemaining: 1,
      skipInterval: 2,
    });
  });

  it('doubles on clean revalidate', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: true,
        masteredUcis: ucis,
        existing: {
          masteredUcis: ucis,
          skipRemaining: 0,
          skipInterval: 2,
        },
        requiredUcis: ucis,
      }),
    ).toEqual({
      masteredUcis: ucis,
      skipRemaining: 4,
      skipInterval: 4,
    });
  });

  it('demotes on miss and resets interval', () => {
    expect(
      nextStemMasterySkipState({
        prefixMastered: false,
        masteredUcis: ['d2d4'],
        existing: {
          masteredUcis: ucis,
          skipRemaining: 3,
          skipInterval: 4,
        },
        requiredUcis: ucis,
      }),
    ).toEqual({
      masteredUcis: ['d2d4'],
      skipRemaining: 0,
      skipInterval: 2,
    });
  });
});
