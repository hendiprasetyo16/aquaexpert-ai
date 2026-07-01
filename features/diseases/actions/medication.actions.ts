// features/diseases/actions/medication.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export interface MedicationDto {
  id: string;
  name: string;
  active_ingredient: string;
  description_id: string;
  description_en: string;
  base_dosage_per_100l: number;
  dosage_unit: string;
  treatment_duration_days: number;
  clinical_score_baseline: number;
  success_rate_baseline_pct: number;
  avg_recovery_days_baseline: number;
  safe_for_plants: boolean;
  safe_for_inverts: boolean;
}

export async function getMedicationsDatabaseAction(): Promise<{ success: boolean; data: MedicationDto[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, data: data as MedicationDto[] };
  } catch (error: unknown) {
    return { 
      success: false, 
      data: [], 
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem internal." 
    };
  }
}