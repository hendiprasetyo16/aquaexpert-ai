// features/analytics/actions/get-medication-leaderboard.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { MedicationLeaderboardResponse, MedicationEfficacyStat, EvidenceGrade } from "../types/analytics.types";

interface FetchLeaderboardParams {
  diseaseId?: string;
  limit?: number;
}

interface LeaderboardRow {
  disease_id: string;
  total_cases: number;
  success_rate_pct: number;
  median_recovery_days: number;
  mortality_rate_pct: number;
  relapse_rate_pct: number;
  clinical_score: number;
  evidence_grade: EvidenceGrade;
  last_calculated_at: string;
  medication: {
    id: string;
    name_id: string; // 💡 FIX
    name_en: string; // 💡 FIX
  };
  disease: {
    id: string;
    name_id: string;
    name_en: string;
  };
}

export async function getMedicationLeaderboardAction({
  diseaseId,
  limit = 20
}: FetchLeaderboardParams = {}): Promise<MedicationLeaderboardResponse> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("medication_efficacy_stats")
      .select(`
        disease_id,
        total_cases,
        success_rate_pct,
        median_recovery_days,
        mortality_rate_pct,
        relapse_rate_pct,
        clinical_score,
        evidence_grade,
        last_calculated_at,
        medication:medications!inner(id, name_id, name_en), 
        disease:diseases!inner(id, name_id, name_en)
      `) // 💡 FIX pada bagian select medication
      .gt("total_cases", 0);

    if (diseaseId) {
      query = query.eq("disease_id", diseaseId);
    }

    const { data: statsRaw, error } = await query
      .order("clinical_score", { ascending: false })
      .order("total_cases", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("[ANALYTICS] Gagal menarik data leaderboard", error);
      throw new Error("Gagal memuat statistik pengobatan.");
    }

    const rows = statsRaw as unknown as LeaderboardRow[];
    const formattedData: MedicationEfficacyStat[] = rows.map((row) => ({
      diseaseId: row.disease_id,
      diseaseNameId: row.disease.name_id,
      diseaseNameEn: row.disease.name_en,
      medicationId: row.medication.id,
      medicationNameId: row.medication.name_id, // 💡 FIX
      medicationNameEn: row.medication.name_en, // 💡 FIX
      totalCases: Number(row.total_cases) || 0,
      successRatePct: Number(row.success_rate_pct) || 0,
      medianRecoveryDays: Number(row.median_recovery_days) || 0,
      mortalityRatePct: Number(row.mortality_rate_pct) || 0,
      relapseRatePct: Number(row.relapse_rate_pct) || 0,
      clinicalScore: Number(row.clinical_score) || 0,
      evidenceGrade: row.evidence_grade,
      lastCalculatedAt: row.last_calculated_at
    }));

    return {
      success: true,
      data: formattedData
    };

  } catch (error: unknown) {
    logger.error("[ANALYTICS FATAL]", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal server."
    };
  }
}