// features/diseases/actions/medication.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export interface MedicationDto {
  id: string;
  name_id: string;
  name_en: string;
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

// 1. MENGAMBIL SELURUH DATA OBAT
export async function getMedicationsDatabaseAction(): Promise<{ success: boolean; data: MedicationDto[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .order("name_id", { ascending: true }); // Diurutkan berdasar abjad

    if (error) throw new Error(error.message);
    return { success: true, data: data as MedicationDto[] };
  } catch (error: unknown) {
    return { success: false, data: [], error: error instanceof Error ? error.message : "Terjadi kesalahan sistem internal." };
  }
}

// 2. MENDETEKSI ROLE USER (User, Admin, Super Admin)
export async function getUserRoleAction(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "user";

    // Cek di tabel profiles (sesuaikan dengan struktur database Bapak)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    
    // Jika tidak ada di profiles, cek metadata bawaan Supabase Auth
    return profile?.role || user.user_metadata?.role || "user";
  } catch {
    return "user";
  }
}

// 3. MENGHAPUS OBAT (Hanya Super Admin)
export async function deleteMedicationAction(medicationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const role = await getUserRoleAction();
    
    // Keamanan Lapis Ganda: Hanya Super Admin yang boleh Delete
    if (role !== "super_admin") {
      throw new Error("Akses ditolak. Hanya Super Admin yang dapat menghapus database medis.");
    }

    const { error } = await supabase.from("medications").delete().eq("id", medicationId);
    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Sistem gagal menghapus obat." };
  }
}