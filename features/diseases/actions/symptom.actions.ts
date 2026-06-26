// features/diseases/actions/symptom.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { Symptom } from "../types/disease.types";

export async function getSymptomsAction() {
  try {
    const supabase = await createClient();
    
    // Tarik semua gejala dari database, urutkan berdasarkan area tubuh
    const { data, error } = await supabase
      .from("symptoms")
      .select("*")
      .order("body_region", { ascending: true })
      .order("name_id", { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, data: data as Symptom[] };
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Gagal mengambil data gejala" 
    };
  }
}