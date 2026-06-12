// lib/expert-engine/scorer.ts
import { RawEvaluation, CoreExpertResult } from "./types";
import { calculateConfidence } from "./confidence";

export function processExpertResults<T>(
  evaluations: RawEvaluation<T>[],
  minThreshold = 20
): CoreExpertResult<T>[] {
  return evaluations
    .map((e) => {
      const finalScore = Math.min(Math.max(e.rawScore, 10), 100);
      return {
        item: e.item,
        matchScore: finalScore,
        matchReasons: e.reasons,
        matchConfidenceKey: calculateConfidence(finalScore),
      };
    })
    .filter((r) => r.matchScore >= minThreshold)
    .sort((a, b) => b.matchScore - a.matchScore);
}