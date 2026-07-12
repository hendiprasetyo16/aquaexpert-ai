// features/ai/types/diagnosis.types.ts

export type DiagnosisStatus = 'ACTIVE' | 'ELIMINATED' | 'LOW_CONFIDENCE' | 'AMBIGUOUS';
export type ExplanationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type ConfidenceLabel = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "VERY_LOW";
export type RuleType = 'HALLMARK' | 'MANDATORY' | 'SUPPORTING' | 'EXCLUDED';
export type DiagnosisModifierType = 'SPECIES_GENETICS' | 'WATER_QUALITY' | 'TEMPERATURE' | 'STRESS';

export interface SymptomRuleInput {
  id: string;
  rule_type: RuleType;
  weight: number;
  name_id?: string;
  name_en?: string;
  reason?: string;
}

export interface DiseaseInput {
  id: string;
  name: string;
  prevalence_prior?: number; 
  rules: SymptomRuleInput[];
}

export interface DiagnosisModifier {
  diseaseId: string;
  type: DiagnosisModifierType; 
  score: number; 
  warningCode?: string;
}

export interface DiagnosisWeights {
  recall?: number;        
  precision?: number;     
  coverage?: number;      
}

export interface DiagnosisEngineConfig {
  totalDiseasesCount: number; 
  allSymptomOccurrences: Record<string, number>; 
  weights?: DiagnosisWeights;
  globalIdfCache?: Map<string, number>; 
}

export interface DifferentialMatch {
  diseaseId: string;
  diseaseName: string;
  confidenceGap: number;
  symptomOverlapRatio: number; 
}

export interface DifferentialDiagnosisAlert {
  isAmbiguous: boolean;
  closestMatches: DifferentialMatch[]; 
}

export interface DiagnosisExplanation {
  severity: ExplanationSeverity; 
  code: string;
  variables?: Record<string, string | number | string[]>;
}

export interface DiagnosisEvidence {
  matchedRules: SymptomRuleInput[];
  missingRules: SymptomRuleInput[];
  excludedTriggers: SymptomRuleInput[];
}

export interface DiagnosisDecision {
  status: DiagnosisStatus;
  primaryReasonCode: string;
  context?: Record<string, string | number | string[]>;
}

export interface DiagnosisMetrics {
  engineVersion: string;  
  rulesetVersion: string; 
  recall: number;
  precision: number;
  coverage: number;
  modifierBonus: number; 
  priorMultiplier: number;
  hallmarkMultiplier: number;
  alienPenalty: number; 
  missingMandatoryRatio: number; 
  relativeProbability: number; 
}

// 💡 100% Type-Safe, NO `any`
export interface DiagnosisResultV7 {
  diseaseId: string;
  diseaseName: string;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  status: DiagnosisStatus;           // 💡 Fix Error: Added status
  matchedSymptoms: SymptomRuleInput[]; 
  modifierWarnings: string[]; 
  differentialDiagnosis?: DifferentialDiagnosisAlert; 
  explanations: DiagnosisExplanation[];
  metrics: DiagnosisMetrics; 
  evidence: DiagnosisEvidence;
  decision: DiagnosisDecision;
}