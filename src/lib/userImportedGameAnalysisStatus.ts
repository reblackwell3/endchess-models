import type { IAnalysis } from '../models/raw/analysisModel';
import { isFlatAnalysisDoc } from '../models/raw/analysisModel';

type GameAnalysisFields = {
  analysisRequestedAt?: Date | null;
  analysisScheduledFor?: Date | null;
};

/** True when auto-trim must not evict this game (ready, pending, or scheduled). */
export function isProtectedImportedGame(
  game: GameAnalysisFields,
  analysis: Pick<IAnalysis, 'moves'> | null | undefined,
): boolean {
  if (isFlatAnalysisDoc(analysis)) {
    return true;
  }
  if (game.analysisRequestedAt != null) {
    return true;
  }
  if (game.analysisScheduledFor != null) {
    return true;
  }
  return false;
}

/** True when a completed flat analysis doc exists (import checkbox prune scope). */
export function isReadyAnalyzedImportedGame(
  analysis: Pick<IAnalysis, 'moves'> | null | undefined,
): boolean {
  return isFlatAnalysisDoc(analysis);
}
