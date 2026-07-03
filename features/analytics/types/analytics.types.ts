// features/analytics/types/analytics.types.ts
// File yang Tidak Diperlukan (Bersih-bersih)
// Karena Karena tipe datanya sudah kita masukkan langsung ke dalam analytics.actions.ts
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