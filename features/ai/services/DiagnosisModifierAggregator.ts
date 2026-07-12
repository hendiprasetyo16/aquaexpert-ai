// features/ai/services/DiagnosisModifierAggregator.ts
import { ENGINE_CONFIG } from "../config/diagnosis.config";
import type { DiagnosisModifier } from "../types/diagnosis.types";

export class DiagnosisModifierAggregator {
  static aggregate(modifiers: DiagnosisModifier[]): { score: number; warnings: string[] } {
    let totalWeight = 0;
    let weightedSum = 0;
    const warnings: string[] = [];
    
    // 💡 Untuk deteksi efek Domino
    let hasHighWaterPenalty = false;
    let hasHighTempPenalty = false;
    
    modifiers.forEach(mod => {
      const weight = ENGINE_CONFIG.MODIFIER_WEIGHTS[mod.type] ?? 0.1;
      
      if (mod.type === 'WATER_QUALITY' && mod.score >= 3) hasHighWaterPenalty = true;
      if (mod.type === 'TEMPERATURE' && mod.score >= 3) hasHighTempPenalty = true;
      
      weightedSum += (mod.score * weight);
      totalWeight += weight;
      
      if (mod.warningCode) {
        warnings.push(mod.warningCode);
      }
    });
    
    // 💡 NEW: EKSEKUSI SINERGI EFEK DOMINO
    if (hasHighWaterPenalty && hasHighTempPenalty) {
       weightedSum *= ENGINE_CONFIG.SYNERGY_MULTIPLIERS.WATER_AND_TEMP;
       warnings.push("DOMINO EFFECT: Suhu ekstrem memperparah toksisitas air (Ammonia/Nitrite spike) dan menghancurkan imunitas!");
    }

    const aggregatedScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    return { score: aggregatedScore, warnings };
  }
}