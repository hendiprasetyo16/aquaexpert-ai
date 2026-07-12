// features/ai/services/DiagnosisDifferentialService.ts
import { ENGINE_CONFIG } from "../config/diagnosis.config";
import type { DiagnosisResultV7, DifferentialMatch } from "../types/diagnosis.types";

export function evaluateDifferentialDiagnosis(sortedResults: DiagnosisResultV7[]): void {
  if (sortedResults.length < 2) return;
  
  const top1 = sortedResults[0];
  if (top1.confidenceScore < ENGINE_CONFIG.PRIOR_ACTIVATION_THRESHOLD || top1.decision.status === 'ELIMINATED') return; 

  const closestMatches: DifferentialMatch[] = [];
  
  for (let i = 1; i < sortedResults.length; i++) {
    const candidate = sortedResults[i];
    if (candidate.decision.status === 'ELIMINATED') continue;

    const gap = top1.confidenceScore - candidate.confidenceScore;
    
    // 💡 DISEASE ELIMINATION: Murni Membaca Bukti Mentah (Evidence Layer)
    if (i <= 2) { 
      const missingMandatory = candidate.evidence.missingRules.filter(r => r.rule_type === 'MANDATORY');
      const missingHallmarks = candidate.evidence.missingRules.filter(r => r.rule_type === 'HALLMARK');

      if (missingMandatory.length > 0) {
        top1.explanations.push({
          severity: 'INFO', code: 'diagnosis.diseaseEliminated',
          variables: { rivalName: candidate.diseaseName, missingSymptoms: missingMandatory.map(s => s.name_id || s.id) }
        });
      } else if (missingHallmarks.length > 0) {
        top1.explanations.push({
          severity: 'INFO', code: 'diagnosis.diseaseEliminated',
          variables: { rivalName: candidate.diseaseName, missingSymptoms: missingHallmarks.map(s => s.name_id || s.id) }
        });
      }
    }

    if (gap <= ENGINE_CONFIG.DIFFERENTIAL_GAP_TOLERANCE) {
      const top1SymptomIds = new Set(top1.matchedSymptoms.map(s => s.id));
      const candidateSymptomIds = new Set(candidate.matchedSymptoms.map(s => s.id));
      
      let intersection = 0;
      candidateSymptomIds.forEach(id => {
        if (top1SymptomIds.has(id)) intersection++;
      });

      const union = new Set([...top1SymptomIds, ...candidateSymptomIds]).size;
      const jaccardRatio = union > 0 ? (intersection / union) : 0;

      if (jaccardRatio >= ENGINE_CONFIG.DIFFERENTIAL_OVERLAP_THRESHOLD) {
        closestMatches.push({ diseaseId: candidate.diseaseId, diseaseName: candidate.diseaseName, confidenceGap: gap, symptomOverlapRatio: jaccardRatio });
      }
    }
  }

  if (closestMatches.length > 0) {
    top1.differentialDiagnosis = { isAmbiguous: true, closestMatches };
  }
}