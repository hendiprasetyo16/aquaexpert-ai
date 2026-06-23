export type WaterParameterKey = "ph" | "temperature" | "ammonia" | "nitrite" | "nitrate";

export interface DbMedication {
  id: string;
  name: string;
  active_ingredient: string;
  description_id: string;
  description_en: string;
  base_dosage_per_100l: number;
  dosage_unit: string;
  treatment_duration_days: number;
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