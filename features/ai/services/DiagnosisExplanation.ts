// features/ai/services/DiagnosisExplanation.ts
import { ENGINE_CONFIG } from "../config/diagnosis.config";
import type { DiagnosisExplanation, DiagnosisEvidence, DiagnosisDecision } from "../types/diagnosis.types";

export class DiagnosisExplanationGenerator {
  static generate(
    evidence: DiagnosisEvidence, 
    decision: DiagnosisDecision,
    recall: number, 
    precision: number, 
    aggregatedModifierScore: number, 
    alienPenalty: number
  ): DiagnosisExplanation[] {
    const explanations: DiagnosisExplanation[] = [];

    // --- 💡 1. TERJEMAHAN KEPUTUSAN UTAMA ---
    if (decision.status === 'ELIMINATED') {
      explanations.push({ severity: 'CRITICAL', code: decision.primaryReasonCode, variables: decision.context });
      return explanations; // Stop penjelasan lain jika sudah gugur mutlak
    }

    // --- 💡 2. REASONING CHAIN DENGAN SCORING PINTAR ---
    if (evidence.matchedRules.length > 0) {
      // Sorting: Hallmark (+100) -> Mandatory (+50) -> Weight
      const sortedEvidences = [...evidence.matchedRules].sort((a, b) => {
        const scoreA = (a.rule_type === 'HALLMARK' ? 100 : a.rule_type === 'MANDATORY' ? 50 : 0) + a.weight;
        const scoreB = (b.rule_type === 'HALLMARK' ? 100 : b.rule_type === 'MANDATORY' ? 50 : 0) + b.weight;
        return scoreB - scoreA;
      });

      const top3Names = sortedEvidences.slice(0, 3).map(s => s.name_id || s.name_en || s.id);
      explanations.unshift({ 
        severity: 'INFO', 
        code: 'diagnosis.reasoningChain', 
        variables: { evidences: top3Names } 
      });
    }

    // --- 💡 3. NEGATIVE & POSITIVE EVIDENCES ---
    const missingMandatory = evidence.missingRules.filter(r => r.rule_type === 'MANDATORY');
    const missingHallmarks = evidence.missingRules.filter(r => r.rule_type === 'HALLMARK');
    const matchedMandatory = evidence.matchedRules.filter(r => r.rule_type === 'MANDATORY');
    const matchedHallmarks = evidence.matchedRules.filter(r => r.rule_type === 'HALLMARK');

    if (missingMandatory.length > 0) {
      explanations.push({ severity: 'CRITICAL', code: 'diagnosis.mandatoryMissing', variables: { symptoms: missingMandatory.map(s => s.name_id || s.id) } });
    }
    if (missingHallmarks.length > 0) {
      explanations.push({ severity: 'WARNING', code: 'diagnosis.missingHallmarks', variables: { symptoms: missingHallmarks.map(s => s.name_id || s.id) } });
    }
    if (matchedMandatory.length > 0) {
      explanations.push({ severity: 'INFO', code: 'diagnosis.mandatoryMatched', variables: { symptoms: matchedMandatory.map(s => s.name_id || s.id) } });
    }
    if (matchedHallmarks.length > 0) {
      explanations.push({ severity: 'INFO', code: 'diagnosis.hallmarkMatchedDetailed', variables: { symptoms: matchedHallmarks.map(s => s.name_id || s.id) } });
    }

    // --- 💡 4. METRICS ---
    if (recall >= ENGINE_CONFIG.XAI_RECALL_HIGH_THRESHOLD) explanations.push({ severity: 'INFO', code: 'diagnosis.recallHigh' });
    if (precision >= ENGINE_CONFIG.XAI_PRECISION_HIGH_THRESHOLD) explanations.push({ severity: 'INFO', code: 'diagnosis.precisionHigh' });
    else if (precision < ENGINE_CONFIG.XAI_PRECISION_LOW_THRESHOLD) explanations.push({ severity: 'WARNING', code: 'diagnosis.precisionLow' });

    if (aggregatedModifierScore >= ENGINE_CONFIG.XAI_MODIFIER_HIGH_THRESHOLD) explanations.push({ severity: 'INFO', code: 'diagnosis.modifierHigh' });
    if (alienPenalty > ENGINE_CONFIG.XAI_ALIEN_PENALTY_CRITICAL) explanations.push({ severity: 'WARNING', code: 'diagnosis.highConflictingSymptoms' });

    return explanations;
  }
}