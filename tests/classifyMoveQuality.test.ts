import {
  classifyMoveQualityFromEpl,
  computeExpectedPointsLost,
} from '../src/analysis/classifyMoveQuality';
import {
  EPL_BEST_MAX,
  EPL_INACCURACY_MAX,
  EPL_MISTAKE_MAX,
  EPL_STRONG_MAX,
} from '../src/analysis/moveQualityThresholds';

describe('classifyMoveQualityFromEpl', () => {
  it('classifies at tier boundaries', () => {
    expect(classifyMoveQualityFromEpl(EPL_BEST_MAX)).toBe('best');
    expect(classifyMoveQualityFromEpl(EPL_BEST_MAX + 0.001)).toBe('strong');
    expect(classifyMoveQualityFromEpl(EPL_STRONG_MAX)).toBe('strong');
    expect(classifyMoveQualityFromEpl(EPL_STRONG_MAX + 0.001)).toBe('inaccuracy');
    expect(classifyMoveQualityFromEpl(EPL_INACCURACY_MAX)).toBe('inaccuracy');
    expect(classifyMoveQualityFromEpl(EPL_INACCURACY_MAX + 0.001)).toBe('mistake');
    expect(classifyMoveQualityFromEpl(EPL_MISTAKE_MAX)).toBe('mistake');
    expect(classifyMoveQualityFromEpl(EPL_MISTAKE_MAX + 0.001)).toBe('blunder');
  });

  it('never returns negative EPL from computeExpectedPointsLost', () => {
    expect(computeExpectedPointsLost(100, 200)).toBe(0);
  });
});
