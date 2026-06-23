export type EvidenceGrade = "High" | "Medium" | "Low" | "Experimental";

export interface MedicationEfficacyStat {
  diseaseId: string;
  diseaseNameId: string;
  diseaseNameEn: string;
  medicationId: string;
  medicationName: string;
  
  totalCases: number;
  successRatePct: number;
  medianRecoveryDays: number;
  mortalityRatePct: number;
  relapseRatePct: number;
  
  evidenceGrade: EvidenceGrade;
  lastCalculatedAt: string;
}

export interface MedicationLeaderboardResponse {
  success: boolean;
  data: MedicationEfficacyStat[];
  error?: string;
}