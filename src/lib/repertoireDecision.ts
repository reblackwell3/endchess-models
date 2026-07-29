import type { RepertoireDecisionOption } from '../models/course/repertoireDecisionModel';

export type RepertoireDecisionWithOptions = {
  options: readonly RepertoireDecisionOption[];
};

/** Resolve a published decision's target for the user's stored settings value. */
export function resolveRepertoireDecisionOption(
  decision: RepertoireDecisionWithOptions,
  settingsValue: string,
): RepertoireDecisionOption | undefined {
  return decision.options.find(
    (option) => option.settingsValue === settingsValue,
  );
}
