"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { MedicationLeaderboardResponse, MedicationEfficacyStat, EvidenceGrade } from "../types/analytics.types";

interface FetchLeaderboardParams {
  diseaseId?: string; // Opsional: Jika diisi, hanya menampilkan peringkat obat untuk penyakit tersebut
  limit?: number;
}

export async function getMedicationLeaderboardAction({
  diseaseId,
  limit = 20
}: FetchLeaderboardParams = {}): Promise<MedicationLeaderboardResponse> {
  try {
    const supabase = await createClient();

    // Query builder untuk join data efikasi, nama obat, dan nama penyakit
    let query = supabase
      .from("medication_efficacy_stats")
      .select(`
        disease_id,
        total_cases,
        success_rate_pct,
        median_recovery_days,
        mortality_rate_pct,
        relapse_rate_pct,
        evidence_grade,
        last_calculated_at,
        medication:medications!inner(id, name),
        disease:diseases!inner(id, name_id, name_en)
      `)
      // Hanya tampilkan yang minimal memiliki 1 kasus selesai agar tidak memunculkan data kosong
      .gt("total_cases", 0);

    // Filter penyakit jika diminta (Untuk halaman Disease Detail)
    if (diseaseId) {
      query = query.eq("disease_id", diseaseId);
    }

    // Urutkan berdasarkan Success Rate tertinggi, lalu Median Recovery tercepat
    const { data: statsRaw, error } = await query
      .order("success_rate_pct", { ascending: false })
      .order("median_recovery_days", { ascending: true })
      .limit(limit);

    if (error) {
      logger.error("[ANALYTICS] Gagal menarik data leaderboard", error);
      throw new Error("Gagal memuat statistik pengobatan.");
    }

    // Mapping DTO yang aman dari tipe 'any'
    const formattedData: MedicationEfficacyStat[] = (statsRaw || []).map((row: any) => ({
      diseaseId: row.disease_id,
      diseaseNameId: row.disease.name_id,
      diseaseNameEn: row.disease.name_en,
      medicationId: row.medication.id,
      medicationName: row.medication.name,
      totalCases: Number(row.total_cases) || 0,
      successRatePct: Number(row.success_rate_pct) || 0,
      medianRecoveryDays: Number(row.median_recovery_days) || 0,
      mortalityRatePct: Number(row.mortality_rate_pct) || 0,
      relapseRatePct: Number(row.relapse_rate_pct) || 0,
      evidenceGrade: (row.evidence_grade as EvidenceGrade) || "Experimental",
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