// features/treatments/types/treatment.types.ts
export type TreatmentStatus = "Active" | "Completed" | "Failed" | "Aborted";
export type ActionTaken = "Observed" | "Water Change" | "Redosed" | "Medication Changed";

export interface DbTreatmentSession {
  id: string;
  aquarium_id: string;
  disease_id: string;
  medication_id: string;
  status: TreatmentStatus;
  initial_severity_score: number;
  initial_symptoms: string[] | null;
  current_recovery_rate: number;
  outcome_reason: string | null;
  fish_lost_count: number;
  started_at: string;
  completed_at: string | null;
}

export interface DbTreatmentLog {
  id: string;
  session_id: string;
  log_date: string;
  day_number: number;
  severity_score: number;
  remaining_symptoms: string[]; 
  action_taken: ActionTaken;
  notes: string | null;
  photo_url: string | null;
  water_parameters: Record<string, unknown> | null;
  medication_dose: number;
}

export interface RecoveryAnalytics {
  isImproving: boolean;
  recoveryPercentage: number;
  aiRecommendationId: string;
  aiRecommendationEn: string;
}

export interface LogTreatmentResponse {
  success: boolean;
  analytics: RecoveryAnalytics | null;
  error?: string;
}