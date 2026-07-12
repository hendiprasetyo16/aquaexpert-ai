// features/diseases/types/disease.types.ts

import type { 
  DiagnosisMetrics, 
  DiagnosisExplanation, 
  DifferentialDiagnosisAlert,
  DiagnosisStatus 
} from "@/features/ai/types/diagnosis.types";

export type DiseaseCategory = "Parasitic" | "Bacterial" | "Fungal" | "Viral" | "Environmental" | "Nutritional" | "Protozoan" | "Genetic" | string;
export type BodyRegion = "General" | "Fins" | "Eyes" | "Gills" | "Belly" | "Skin/Scales" | "Mouth";
export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface Disease {
  id: string;
  slug?: string | null;
  name_id: string;
  name_en: string;
  scientific_name?: string | null;
  description_id?: string | null;
  description_en?: string | null;
  symptoms_id?: string | null;
  symptoms_en?: string | null;
  treatments_id?: string | null;
  treatments_en?: string | null;
  prevention_id?: string | null;
  prevention_en?: string | null;
  severity?: number | null;
  difficulty?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;
  is_active?: boolean;
  created_at?: string; 
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  affected_species?: string[] | null;
  mortality_risk?: number | null; 
  contagious?: boolean | null;
  diagnostic_tags?: string[] | null;
  disease_stage?: string | null; 
  treatment_duration_days?: number | null; 
  recovery_probability?: number | null; 
  emergency_actions?: string[] | null;  
  visual_tags?: string[] | null;       
  affected_body_parts?: string[] | null;
  urgency_level?: string | null; 
  medication_tags?: string[] | null;   
  disease_category?: DiseaseCategory | null; 
  transmissible?: boolean | null; 
  quarantine_required?: boolean | null;
  symptom_tags?: string[] | null;
  water_trigger_tags?: string[] | null; 
  relapse_window_days?: number | null;
  prevalence_prior?: number | null;
}

export interface Symptom {
  id: string;
  name_id: string;
  name_en: string;
  body_region: BodyRegion; 
  description_id?: string | null;
  description_en?: string | null;
  created_at?: string;
}

export interface DiseaseMatchResult {
  disease: Disease;
  confidenceScore: number; 
  matchedSymptoms: any[]; // Toleransi untuk SymptomRuleInput agar UI tidak komplain
  hasHallmarkMatch?: boolean; 
  environmentalTrigger?: string | null; 
  susceptibilityWarning?: string | null; 
  differentialDiagnosis?: DifferentialDiagnosisAlert; 
  aiMetrics?: DiagnosisMetrics; 
  explanations?: DiagnosisExplanation[];
  status?: DiagnosisStatus; // 💡 The Source of Truth
}