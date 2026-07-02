// features/analytics/types/analytics.types.ts
export type EvidenceGrade = "High" | "Medium" | "Low" | "Experimental";

export interface MedicationEfficacyStat {
  diseaseId: string;
  diseaseNameId: string;
  diseaseNameEn: string;
  medicationId: string;
  //medicationName: string;
  medicationNameId: string; // 💡 FIX: name_id
  medicationNameEn: string; // 💡 FIX: name_en
  
  totalCases: number;
  successRatePct: number;
  medianRecoveryDays: number;
  mortalityRatePct: number;
  relapseRatePct: number;
  clinicalScore: number;
  
  evidenceGrade: EvidenceGrade;
  lastCalculatedAt: string;
}

export interface MedicationLeaderboardResponse {
  success: boolean;
  data: MedicationEfficacyStat[];
  error?: string;
}