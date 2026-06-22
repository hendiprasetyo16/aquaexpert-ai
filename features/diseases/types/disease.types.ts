// features/diseases/types/disease.types.ts

export type DiseaseCategory = "Parasitic" | "Bacterial" | "Fungal" | "Viral" | "Environmental" | "Nutritional" | "Protozoan" | "Genetic";
export type BodyRegion = "General" | "Fins" | "Eyes" | "Gills" | "Belly" | "Skin/Scales" | "Mouth";
export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface Disease {
  id: string;
  slug?: string | null;
  name_id: string;
  name_en: string;
  scientific_name?: string | null;
  disease_category?: DiseaseCategory | null; 
  severity_level?: SeverityLevel | null; 
  severity_score?: number | null; 
  mortality_risk?: number | null; 
  urgency_level?: string | null; 
  difficulty?: string | null; 
  contagious?: boolean | null;
  transmissible?: boolean | null; 
  quarantine_required?: boolean | null;
  symptom_tags?: string[] | null;
  visual_tags?: string[] | null;       
  water_trigger_tags?: string[] | null; 
  affected_body_parts?: string[] | null;
  affected_species?: string[] | null;
  medication_tags?: string[] | null;   
  disease_stage?: string | null;       
  treatment_duration_days?: number | null; 
  recovery_probability?: number | null; 
  emergency_actions?: string[] | null;  
  description_id?: string | null;
  description_en?: string | null;
  symptoms_id?: string | null;
  symptoms_en?: string | null;
  treatments_id?: string | null;
  treatments_en?: string | null;
  prevention_id?: string | null;
  prevention_en?: string | null;
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  is_active?: boolean;
  created_at: string; 
  updated_at?: string | null;
}

export interface Symptom {
  id: string;
  name_id: string;
  name_en: string;
  body_region: BodyRegion; // FIX TEMUAN 1: Buka ke string dihapus (Strict Typing)
  description_id?: string | null;
  description_en?: string | null;
  created_at?: string;
}

export interface DiseaseSymptom {
  disease_id: string;
  symptom_id: string;
  weight: number; 
  is_hallmark?: boolean; 
}

export interface FishDiseaseRelation {
  fish_id: string;
  disease_id: string;
  susceptibility_score: number; 
}

export interface DiseaseMatchRequest {
  aquariumId: string;
  selectedSymptomIds: string[];
  source?: "manual" | "vision" | "sensor";
  environmentalContext?: {
    ammonia?: number;
    nitrite?: number;
    nitrate?: number;
    ph?: number;
    temperature?: number;
  };
}

export interface DiseaseMatchResult {
  disease: Disease;
  confidenceScore: number; 
  matchedSymptoms: Symptom[];
  hasHallmarkMatch?: boolean; // FIX TEMUAN #1: Passthrough data tanda mutlak dari backend
  environmentalTrigger?: string | null; 
  susceptibilityWarning?: string | null; 
}