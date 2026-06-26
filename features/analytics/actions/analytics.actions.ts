// features/analytics/actions/analytics.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

// 1. STRICT TYPING: Menghilangkan 'any' sepenuhnya
export type EvidenceGrade = "High" | "Medium" | "Low";

export interface LeaderboardRow {
  disease_id: string;
  total_cases: number;
  success_rate_pct: number;
  median_recovery_days: number;
  mortality_rate_pct: number;
  relapse_rate_pct: number;
  evidence_grade: EvidenceGrade;
  last_calculated_at: string;
  medication: {
    id: string;
    name: string;
  } | null;
  disease: {
    id: string;
    name_id: string;
    name_en: string;
  } | null;
  // Dynamic field hasil kalkulasi kita di server
  clinical_score?: number; 
}

export async function getMedicationLeaderboardAction(limit: number = 10, diseaseId?: string) {
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
        evidence_grade, 
        last_calculated_at,
        medication:medications (id, name),
        disease:diseases (id, name_id, name_en)
      `);

    if (diseaseId) {
      query = query.eq("disease_id", diseaseId);
    }

    // 2. CLINICAL RANKING: Diurutkan berdasarkan bukti (Evidence) lalu tingkat keberhasilan
    query = query
      .order("evidence_grade", { ascending: true }) // Asumsi di DB enum diset agar High muncul duluan
      .order("success_rate_pct", { ascending: false })
      .order("total_cases", { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Casting yang aman dan kalkulasi Clinical Score
    const formattedData: LeaderboardRow[] = (data as unknown as LeaderboardRow[]).map(row => {
      // Formula Clinical Score (Contoh: Max 100)
      // +65% dari Success Rate
      // -15% penalti untuk Relapse (kambuh)
      // -20% penalti untuk Mortalitas (kematian)
      let score = (row.success_rate_pct * 0.65) - (row.relapse_rate_pct * 0.15) - (row.mortality_rate_pct * 0.20);
      score = Math.max(0, Math.min(100, score)); // Pastikan score ada di rentang 0-100

      return {
        ...row,
        clinical_score: parseFloat(score.toFixed(2))
      };
    });

    // Re-sort berdasarkan clinical_score tertinggi (setelah dikalkulasi)
    formattedData.sort((a, b) => (b.clinical_score || 0) - (a.clinical_score || 0));

    return { success: true, data: formattedData };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal mengambil data leaderboard" };
  }
}