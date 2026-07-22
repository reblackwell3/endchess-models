import {
  classifyMoveQuality,
  computeExpectedPointsLost,
} from '../src/analysis/classifyMoveQuality';
import {
  DEFAULT_MOVE_QUALITY_THRESHOLDS,
  getMoveQualityThresholds,
  MOVE_QUALITY_RATING_BANDS,
} from '../src/analysis/moveQualityThresholds';

describe('classifyMoveQuality', () => {
  const thresholds = getMoveQualityThresholds(1600);

  it('labels the engine top move best regardless of EPL', () => {
    expect(
      classifyMoveQuality({
        expectedPointsLost: 0,
        isTopMove: true,
        thresholds,
      }),
    ).toBe('best');
  });

  it('classifies non-top moves at tier boundaries', () => {
    const cases: Array<[number, string]> = [
      [thresholds.strongMax, 'strong'],
      [thresholds.strongMax + 0.001, 'inaccuracy'],
      [thresholds.inaccuracyMax, 'inaccuracy'],
      [thresholds.inaccuracyMax + 0.001, 'mistake'],
      [thresholds.mistakeMax, 'mistake'],
      [thresholds.mistakeMax + 0.001, 'blunder'],
    ];
    for (const [epl, expected] of cases) {
      expect(
        classifyMoveQuality({
          expectedPointsLost: epl,
          isTopMove: false,
          thresholds,
        }),
      ).toBe(expected);
    }
  });

  it('never returns negative EPL from computeExpectedPointsLost', () => {
    expect(computeExpectedPointsLost(100, 200)).toBe(0);
  });
});

describe('getMoveQualityThresholds', () => {
  it('selects the band containing the rating', () => {
    expect(getMoveQualityThresholds(1200)).toBe(
      MOVE_QUALITY_RATING_BANDS[3].thresholds,
    );
    expect(getMoveQualityThresholds(1400)).toBe(
      MOVE_QUALITY_RATING_BANDS[2].thresholds,
    );
    expect(getMoveQualityThresholds(1999)).toBe(
      MOVE_QUALITY_RATING_BANDS[1].thresholds,
    );
    expect(getMoveQualityThresholds(2650)).toBe(
      MOVE_QUALITY_RATING_BANDS[0].thresholds,
    );
  });

  it('is stricter at higher ratings', () => {
    const bands = [...MOVE_QUALITY_RATING_BANDS].sort(
      (a, b) => a.minRating - b.minRating,
    );
    for (let i = 1; i < bands.length; i += 1) {
      expect(bands[i].thresholds.inaccuracyMax).toBeLessThanOrEqual(
        bands[i - 1].thresholds.inaccuracyMax,
      );
      expect(bands[i].thresholds.mistakeMax).toBeLessThanOrEqual(
        bands[i - 1].thresholds.mistakeMax,
      );
    }
  });

  it('falls back to the default band for missing or invalid ratings', () => {
    expect(getMoveQualityThresholds(undefined)).toBe(
      DEFAULT_MOVE_QUALITY_THRESHOLDS,
    );
    expect(getMoveQualityThresholds(0)).toBe(DEFAULT_MOVE_QUALITY_THRESHOLDS);
    expect(getMoveQualityThresholds(NaN)).toBe(
      DEFAULT_MOVE_QUALITY_THRESHOLDS,
    );
  });
});
