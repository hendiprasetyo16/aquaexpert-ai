// features/ai/services/DiagnosisMath.ts
import { ENGINE_CONFIG } from "../config/diagnosis.config";
import type { ConfidenceLabel } from "../types/diagnosis.types";

export class DiagnosisMath {
  static calculateIDF(df: number, totalDocs: number): number {
    return Math.log((totalDocs + 1) / (df + 1)) + 1;
  }

  static getConfidenceLabel(score: number): ConfidenceLabel {
    if (score >= 90) return "VERY_HIGH";
    if (score >= 75) return "HIGH";
    if (score >= 55) return "MODERATE";
    if (score >= 40) return "LOW";
    return "VERY_LOW";
  }

  // 💡 4. IMMUTABLE BATCH RETURN: Menghitung dasar secara bersamaan
  static calculateBaseMetrics(
    matchedWeight: number, 
    totalPossibleWeight: number,
    matchedUserIDF: number,
    totalUserSelectedIDF: number,
    matchedHallmarkWeight: number,
    totalHallmarkWeight: number,
    weights: { recall: number, precision: number, coverage: number }
  ) {
    const recall = totalPossibleWeight > 0 ? (matchedWeight / totalPossibleWeight) : 0;
    const precision = matchedUserIDF / (totalUserSelectedIDF + Number.EPSILON);
    const coverage = totalHallmarkWeight > 0 ? (matchedHallmarkWeight / totalHallmarkWeight) : recall;
    
    const baseConfidence = ((weights.recall * recall) + (weights.precision * precision) + (weights.coverage * coverage)) * 100;

    return { recall, precision, coverage, baseConfidence };
  }

  static calculateHallmarkBonus(matchedHallmarkWeight: number, totalHallmarkWeight: number): number {
    const ratio = totalHallmarkWeight > 0 ? (matchedHallmarkWeight / totalHallmarkWeight) : 0;
    return 1 + (ratio * ENGINE_CONFIG.MAX_HALLMARK_BONUS);
  }

  static calculatePriorMultiplier(prevalencePrior: number, baseConfidence: number): number {
    if (baseConfidence < ENGINE_CONFIG.PRIOR_ACTIVATION_THRESHOLD) return 1;
    return 1 + (prevalencePrior * ENGINE_CONFIG.MAX_PRIOR_BONUS);
  }

  static calculateModifierBonus(modifierScore: number, baseConfidence: number): number {
    const ratio = modifierScore / 10;
    return baseConfidence * Math.pow(ratio, 2) * ENGINE_CONFIG.MAX_MODIFIER_BONUS;
  }
}