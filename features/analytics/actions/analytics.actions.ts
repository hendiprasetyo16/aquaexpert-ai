// features/analytics/actions/analytics.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type EvidenceGrade = "High" | "Medium" | "Low" | "Experimental";

// 💡 Interface disatukan di sini agar tidak perlu file .types terpisah
export interface LeaderboardRow {
  disease_id: string;
  medication_id: string;
  total_cases: number;
  success_rate_pct: number;
  median_recovery_days: number;
  mortality_rate_pct: number;
  relapse_rate_pct: number;
  evidence_grade: EvidenceGrade;
  clinical_score: number;
  medication: { id: string; name_id: string | null; name_en: string } | null;
  disease: { id: string; name_id: string | null; name_en: string } | null;
}

export async function getMedicationLeaderboardAction(limit: number = 20): Promise<{ success: boolean; data?: LeaderboardRow[]; error?: string }> {
  try {
    const supabase = await createClient();

    // 💡 PENINGKATAN: Menggunakan Relational Join bawaan Supabase
    // Ini jauh lebih cepat dan tidak membebani server daripada melakukan mapping manual
    const { data, error } = await supabase
      .from("medication_efficacy_stats")
      .select(`
        disease_id,
        medication_id,
        total_cases,
        success_rate_pct,
        median_recovery_days,
        mortality_rate_pct,
        relapse_rate_pct,
        evidence_grade,
        clinical_score,
        medication:medications(id, name_id, name_en),
        disease:diseases(id, name_id, name_en)
      `) 
      .order("clinical_score", { ascending: false })
      .order("total_cases", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return { success: true, data: [] };

    // Format aman dari Supabase langsung dimasukkan ke DTO kita
    return { success: true, data: data as unknown as LeaderboardRow[] };

  } catch (error: unknown) {
    console.error("[ANALYTICS ENGINE ERROR]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem internal." 
    };
  }
}