// features/ai/services/DiagnosisDecisionService.ts
import type { DiagnosisEvidence, DiagnosisDecision } from "../types/diagnosis.types";

export class DiagnosisDecisionService {
  static evaluate(evidence: DiagnosisEvidence, confidenceScore: number): DiagnosisDecision {
    
    // 1. HARD EXCLUSION (Prioritas Tertinggi)
    if (evidence.excludedTriggers.length > 0) {
      return {
        status: 'ELIMINATED',
        primaryReasonCode: 'decision.hardExcluded',
        context: { trigger: evidence.excludedTriggers[0].name_id || evidence.excludedTriggers[0].name_en || evidence.excludedTriggers[0].id }
      };
    }

    // 2. MISSING MANDATORY
    const missingMandatory = evidence.missingRules.filter(r => r.rule_type === 'MANDATORY');
    if (missingMandatory.length > 0) {
      return {
        status: 'LOW_CONFIDENCE',
        primaryReasonCode: 'decision.missingMandatory'
      };
    }

    // 3. LOW SCORE AMBIGUITY
    if (confidenceScore < 40) {
      return { 
        status: 'AMBIGUOUS', 
        primaryReasonCode: 'decision.weakEvidence' 
      };
    }

    // 4. CLEAR MATCH
    return { 
      status: 'ACTIVE', 
      primaryReasonCode: 'decision.strongMatch' 
    };
  }
}