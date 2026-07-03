// features/analytics/actions/analytics.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type EvidenceGrade = "High" | "Medium" | "Low" | "Experimental";

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
  medication: { id: string; name_id: string; name_en: string } | null;
  disease: { id: string; name_id: string; name_en: string } | null;
}

// Interface khusus untuk menangkap data mentah dari Supabase tanpa 'any'
interface RawStatRow {
  disease_id: string;
  medication_id: string;
  total_cases: number;
  success_rate_pct: number;
  median_recovery_days: number;
  mortality_rate_pct: number;
  relapse_rate_pct: number;
  evidence_grade: string;
  clinical_score: number;
}

export async function getMedicationLeaderboardAction(limit: number = 20): Promise<{ success: boolean; data?: LeaderboardRow[]; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Ambil data leaderboard mentah
    const { data, error } = await supabase
      .from("medication_efficacy_stats")
      .select("*") 
      .order("clinical_score", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) return { success: true, data: [] };

    const rawData = data as RawStatRow[];
    
    // 2. Kumpulkan ID yang unik agar lebih efisien saat mencari nama obat
    const medIds = [...new Set(rawData.map(d => d.medication_id))];
    const disIds = [...new Set(rawData.map(d => d.disease_id))];

    // 3. Tarik data nama obat & nama penyakit (Aman & kebal dari masalah Foreign Key)
    const { data: meds } = await supabase.from("medications").select("id, name_id, name_en").in("id", medIds);
    const { data: dises } = await supabase.from("diseases").select("id, name_id, name_en").in("id", disIds);

    // 4. Gabungkan datanya (Mapping Manual)
    const formattedData: LeaderboardRow[] = rawData.map((row) => ({
      ...row,
      evidence_grade: row.evidence_grade as EvidenceGrade,
      medication: meds?.find(m => m.id === row.medication_id) || null,
      disease: dises?.find(d => d.id === row.disease_id) || null,
    }));

    return { success: true, data: formattedData };
  } catch (error: unknown) { 
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("DEBUG ANALYTICS ERROR:", errorMessage);
    return { success: false, error: errorMessage };
  }
}