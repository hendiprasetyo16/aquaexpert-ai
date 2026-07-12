import { ENGINE_CONFIG } from "@/features/ai/config/diagnosis.config";
import { DiagnosisMath } from "@/features/ai/services/DiagnosisMath"; 
import { DiagnosisModifierAggregator } from "@/features/ai/services/DiagnosisModifierAggregator"; 
import { DiagnosisExplanationGenerator } from "@/features/ai/services/DiagnosisExplanation"; 
import { evaluateDifferentialDiagnosis } from "@/features/ai/services/DiagnosisDifferentialService";
import { AlienPenaltyStrategy, MandatoryLimiterStrategy } from "@/features/ai/services/DiagnosisStrategies"; 
import { DiagnosisDecisionService } from "@/features/ai/services/DiagnosisDecisionService";

import type { DiseaseInput, DiagnosisModifier, DiagnosisEngineConfig, DiagnosisResultV7, DiagnosisEvidence } from "@/features/ai/types/diagnosis.types";

export function runDiagnosisEngine(
  userSelectedSymptomIds: string[],
  diseaseCandidates: DiseaseInput[],
  modifiers: DiagnosisModifier[],
  config: DiagnosisEngineConfig
): DiagnosisResultV7[] {

  const results: DiagnosisResultV7[] = [];
  if (!userSelectedSymptomIds || userSelectedSymptomIds.length === 0) return results;

  const N = config.totalDiseasesCount || 85;
  const sysWeights = { recall: config.weights?.recall ?? ENGINE_CONFIG.DEFAULT_RECALL_WEIGHT, precision: config.weights?.precision ?? ENGINE_CONFIG.DEFAULT_PRECISION_WEIGHT, coverage: config.weights?.coverage ?? ENGINE_CONFIG.DEFAULT_COVERAGE_WEIGHT };

  const idfMap = config.globalIdfCache || new Map<string, number>();
  if (!config.globalIdfCache) {
    userSelectedSymptomIds.forEach(sId => idfMap.set(sId, DiagnosisMath.calculateIDF(config.allSymptomOccurrences[sId] || 1, N)));
    diseaseCandidates.forEach(d => { d.rules.forEach(rule => { if (!idfMap.has(rule.id)) idfMap.set(rule.id, DiagnosisMath.calculateIDF(config.allSymptomOccurrences[rule.id] || 1, N)); }); });
  }

  const modifierMap = new Map<string, DiagnosisModifier[]>();
  modifiers.forEach(m => { const existing = modifierMap.get(m.diseaseId) || []; existing.push(m); modifierMap.set(m.diseaseId, existing); });

  const selectedSet = new Set(userSelectedSymptomIds);
  const totalUserSelectedIDF = userSelectedSymptomIds.reduce((sum, sId) => sum + (idfMap.get(sId) || 1), 0);

  for (const disease of diseaseCandidates) {
    let totalPossibleWeight = 0, matchedWeight = 0;
    let totalHallmarkWeight = 0, matchedHallmarkWeight = 0;
    let matchedUserIDF = 0; 
    
    const evidence: DiagnosisEvidence = {
      matchedRules: [], missingRules: [], excludedTriggers: []
    };

    for (const rule of disease.rules) {
      let idf = idfMap.get(rule.id) || 1;
      const tfIdfWeight = rule.weight * idf;

      if (rule.rule_type !== 'EXCLUDED') {
        totalPossibleWeight += tfIdfWeight;
        if (rule.rule_type === 'HALLMARK') totalHallmarkWeight += tfIdfWeight;
      }

      if (selectedSet.has(rule.id)) {
        if (rule.rule_type === 'EXCLUDED') {
          evidence.excludedTriggers.push(rule);
        } else {
          matchedWeight += tfIdfWeight;
          matchedUserIDF += idf; 
          evidence.matchedRules.push(rule);
          if (rule.rule_type === 'HALLMARK') matchedHallmarkWeight += tfIdfWeight;
        }
      } else {
        if (rule.rule_type !== 'EXCLUDED') {
          evidence.missingRules.push(rule);
        }
      }
    }

    if (evidence.matchedRules.length === 0 && evidence.excludedTriggers.length === 0) continue;

    const metrics = DiagnosisMath.calculateBaseMetrics(matchedWeight, totalPossibleWeight, matchedUserIDF, totalUserSelectedIDF, matchedHallmarkWeight, totalHallmarkWeight, sysWeights);
    let currentConfidence = metrics.baseConfidence;
    
    let modifierBonus = 0;
    let alienPenalty = 0;
    let missingMandatoryRatio = 0;
    let hallmarkBonusMultiplier = 1;
    let priorMultiplier = 1;

    if (evidence.excludedTriggers.length === 0) {
      hallmarkBonusMultiplier = DiagnosisMath.calculateHallmarkBonus(matchedHallmarkWeight, totalHallmarkWeight);
      currentConfidence *= hallmarkBonusMultiplier;
      priorMultiplier = DiagnosisMath.calculatePriorMultiplier(disease.prevalence_prior || 0, currentConfidence);
      currentConfidence *= priorMultiplier;
      
      const diseaseModifiers = modifierMap.get(disease.id) || [];
      const { score: aggregatedModifierScore, warnings: modifierWarnings } = DiagnosisModifierAggregator.aggregate(diseaseModifiers);
      modifierBonus = DiagnosisMath.calculateModifierBonus(aggregatedModifierScore, currentConfidence);
      currentConfidence += modifierBonus;
      
      const alienSymptomCount = selectedSet.size - evidence.matchedRules.length;
      alienPenalty = AlienPenaltyStrategy.calculate(alienSymptomCount, metrics.precision, metrics.coverage);
      currentConfidence -= alienPenalty;

      const totalMandatory = disease.rules.filter(r => r.rule_type === 'MANDATORY').length;
      const missingMandatory = evidence.missingRules.filter(r => r.rule_type === 'MANDATORY').length;
      missingMandatoryRatio = totalMandatory > 0 ? (missingMandatory / totalMandatory) : 0;
      
      currentConfidence = MandatoryLimiterStrategy.apply(currentConfidence, missingMandatoryRatio);
      currentConfidence = Math.max(0, Math.min(100, Math.round(currentConfidence)));
    } else {
      currentConfidence = 0; 
    }

    const decision = DiagnosisDecisionService.evaluate(evidence, currentConfidence);

    // 💡 V7 FIX: Lepas Palang Pintu Threshold!
    // Biarkan semua penyakit yang memiliki kecocokan gejala (atau dieliminasi mutlak)
    // masuk ke daftar hasil. Biarkan UI yang menempelkan lencana merah "Bukti Lemah".
    if (evidence.matchedRules.length > 0 || decision.status === 'ELIMINATED') {
      const modifierWarnings = DiagnosisModifierAggregator.aggregate(modifierMap.get(disease.id) || []).warnings;
      
      results.push({
        diseaseId: disease.id, diseaseName: disease.name,
        confidenceScore: decision.status === 'ELIMINATED' ? 0 : currentConfidence, 
        confidenceLabel: DiagnosisMath.getConfidenceLabel(currentConfidence),
        status: decision.status, 
        decision: decision,
        evidence: evidence,
        matchedSymptoms: evidence.matchedRules,
        modifierWarnings,
        explanations: DiagnosisExplanationGenerator.generate(evidence, decision, metrics.recall, metrics.precision, 0, alienPenalty),
        metrics: { 
          engineVersion: "v7.1.0", 
          rulesetVersion: "v2026.07", 
          recall: metrics.recall, 
          precision: metrics.precision, 
          coverage: metrics.coverage, 
          modifierBonus, 
          priorMultiplier, 
          hallmarkMultiplier: hallmarkBonusMultiplier,
          alienPenalty, 
          missingMandatoryRatio, 
          relativeProbability: 0 
        }
      });
    }
  }

  const sortedResults = results.sort((a, b) => b.confidenceScore - a.confidenceScore);
  
  const validResults = sortedResults.filter(r => r.status !== 'ELIMINATED');
  if (validResults.length > 0) {
    const T = 8.0; 
    const maxScore = validResults[0].confidenceScore;
    const expScores = validResults.map(res => Math.exp((res.confidenceScore - maxScore) / T));
    const sumExpScores = expScores.reduce((a, b) => a + b, 0);

    validResults.forEach((res, index) => {
      res.metrics.relativeProbability = sumExpScores > 0 ? Number(((expScores[index] / sumExpScores) * 100).toFixed(2)) : 0;
    });
  }

  if (typeof evaluateDifferentialDiagnosis === 'function') evaluateDifferentialDiagnosis(sortedResults); 

  return sortedResults;
}