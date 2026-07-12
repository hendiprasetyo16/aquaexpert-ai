// features/ai/services/DiagnosisStrategies.ts
import { ENGINE_CONFIG } from "../config/diagnosis.config";

// 💡 5. PENALTY STRATEGY: Memudahkan komparasi metode A/B Testing saat penelitian
export class AlienPenaltyStrategy {
  static calculate(alienSymptomCount: number, precision: number, coverage: number): number {
    const adaptiveFactor = Math.max(0, 1 - ((precision + coverage) / 2)); 
    return Math.sqrt(alienSymptomCount) * adaptiveFactor * ENGINE_CONFIG.SQRT_PENALTY_FACTOR; 
  }
}

export class MandatoryLimiterStrategy {
  static apply(confidence: number, missingMandatoryRatio: number): number {
    if (missingMandatoryRatio <= 0) return confidence;
    if (missingMandatoryRatio <= 0.34) return Math.min(confidence, ENGINE_CONFIG.LIMITER_LEVEL_1);
    if (missingMandatoryRatio <= 0.67) return Math.min(confidence, ENGINE_CONFIG.LIMITER_LEVEL_2);
    return Math.min(confidence, ENGINE_CONFIG.LIMITER_LEVEL_3);
  }
}