// features/diseases/types/medication.types.ts

export type WaterParameterKey = "ph" | "temperature" | "ammonia" | "nitrite" | "nitrate";

// 💡 SEKARANG DIUPDATE: Menyamakan 100% dengan tabel public.medications terbaru
export interface DbMedication {
  id: string;                               // uuid not null
  name_id: string | null;                   // character varying(255) null
  name_en: string;                          // character varying(255) not null
  active_ingredient: string;               // character varying(255) not null
  description_id: string;                   // text not null
  description_en: string;                   // text not null
  base_dosage_per_100l: number;             // numeric not null
  dosage_unit: string;                      // character varying(50) not null
  treatment_duration_days: number;          // integer not null
  created_at?: string | null;               // timestamp with time zone null
  clinical_score_baseline: number | null;   // numeric null
  success_rate_baseline_pct: number | null; // numeric null
  avg_recovery_days_baseline: number | null;// integer null
  safe_for_plants: boolean | null;          // boolean null
  safe_for_inverts: boolean | null;         // boolean null
  is_active?: boolean | null;
}

export interface DbDiseaseMedication {
  priority: "Primary" | "Alternative";
  medication: DbMedication;
}

export interface DbFaunaSafetyRule {
  medication_id: string;
  fish_id: string | null;
  fauna_group: string | null;
  is_safe: boolean;
  note_id: string;
  note_en: string;
}

export interface DbEnvironmentRule {
  medication_id: string;
  parameter: string; // Akan di-cast ke WaterParameterKey
  operator: string;
  threshold: number;
  note_id: string;
  note_en: string;
}

export interface DbMedicationInteraction {
  medication_id: string;
  interacting_medication_id: string;
  severity: string;
  note_id: string;
  note_en: string;
}

export interface DbAquariumTreatment {
  medication_id: string;
  started_at: string;
  status: string;
  medication: { name: string };
}

export type AlertType = "FAUNA" | "ENVIRONMENT" | "INTERACTION" | "HISTORY";

export interface SafetyAlert {
  type: AlertType;
  target: string;
  isSafe: boolean;
  reason: string;
}

export interface MedicationRecommendation {
  medicationId: string;
  name: string;
  activeIngredient: string;
  priority: "Primary" | "Alternative";
  description: string;
  calculatedDosage: number;
  dosageUnit: string;
  durationDays: number;
  safetyAlerts: SafetyAlert[];
  isSafeToUse: boolean; 
}

export interface MedicationEngineResponse {
  success: boolean;
  netVolumeLiters: number;
  recommendations: MedicationRecommendation[];
  error?: string;
}

// Helper types untuk menghilangkan 'any' di Action
export interface TypedTankFish {
  fish_id: string;
  fish: {
    name_id: string;
    name_en: string;
    fauna_group?: string | null;
  } | null;
}

export type TypedWaterParameters = Partial<Record<WaterParameterKey, number>>;