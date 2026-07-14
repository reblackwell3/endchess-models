export type MoveQuality =
  | 'best'
  | 'strong'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export const EPL_BEST_MAX = 0.01;
export const EPL_STRONG_MAX = 0.05;
export const EPL_INACCURACY_MAX = 0.11;
export const EPL_MISTAKE_MAX = 0.21;

export const DEEP_UPGRADE_QUALITIES: MoveQuality[] = [
  'inaccuracy',
  'mistake',
  'blunder',
];

export const DRILL_QUALITIES: MoveQuality[] = ['mistake', 'blunder'];

export const SHALLOW_ANALYSIS_DEPTH = 12;
export const DEEP_ANALYSIS_DEPTH = 22;
