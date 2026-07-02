// features/diseases/actions/medication.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  is_active?: boolean | null; // 💡 FIX 1: Ini yang menghilangkan Error 2339 di page.tsx
}

// Tambahkan Server Action untuk Membuat Obat Baru
export async function createMedicationAction(payload: Partial<MedicationDto>) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("medications")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    // Revalidate agar halaman mengambil data terbaru
    revalidatePath("/dashboard/medications");
    return { success: true, data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Gagal menambahkan data obat baru." 
    };
  }
}

// Tambahkan Server Action untuk Memperbarui/Edit Obat Lama
export async function updateMedicationAction(id: string, payload: Partial<MedicationDto>) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("medications")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Revalidate agar halaman mengambil data terbaru
    revalidatePath("/dashboard/medications");
    return { success: true, data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Gagal memperbarui data obat." 
    };
  }
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

// -------------------------------------------------------------
// FUNGSI ARSIP OBAT
// -------------------------------------------------------------

// 1. Ambil data obat yang diarsip (is_active = false)
export async function getArchivedMedications() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("is_active", false)
      .order("created_at", { ascending: false }); // 💡 FIX 2: Pakai created_at agar tidak error database

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching archived medications:", error);
    return [];
  }
}

// 2. Aksi Arsip atau Pulihkan (Toggle is_active)
export async function toggleMedicationArchiveAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    
    // 💡 FIX 3: Hanya ubah is_active, jangan mengirim updated_at agar tidak error database
    const { error } = await supabase
      .from("medications")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/dashboard/medications");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status arsip." };
  }
}

// 3. Aksi Hapus Permanen Khusus dari Halaman Arsip
export async function hardDeleteMedicationAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("medications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/dashboard/medications");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus permanen." };
  }
}