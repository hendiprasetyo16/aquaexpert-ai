// features/treatments/actions/medication.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

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
  reuse_interval_days?: number | null;
  clinical_score_baseline: number;
  success_rate_baseline_pct: number;
  avg_recovery_days_baseline: number;
  safe_for_plants: boolean;
  safe_for_inverts: boolean;
  is_active?: boolean | null;
}

// 💡 HELPER: Ambil user dan nama aslinya
async function getAuditUser(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi login berakhir.");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  return { ...user, fullName: profile?.full_name || user.email || "Admin" };
}

export async function createMedicationAction(payload: Partial<MedicationDto>) {
  try {
    const supabase = await createClient();
    const user = await getAuditUser(supabase);
    
    const { data, error } = await supabase.from("medications").insert([payload]).select().single();
    if (error) throw error;

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Obat Baru",
      `Menambahkan referensi obat: ${payload.name_id}.`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/medications");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal menambahkan data." };
  }
}

export async function updateMedicationAction(id: string, payload: Partial<MedicationDto>) {
  try {
    const supabase = await createClient();
    const user = await getAuditUser(supabase);
    
    const { data, error } = await supabase.from("medications").update(payload).eq("id", id).select().single();
    if (error) throw error;

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Obat Diperbarui",
      `Memperbarui detail obat: ${payload.name_id || data.name_id}.`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/medications");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui data." };
  }
}

export async function getMedicationsDatabaseAction(): Promise<{ success: boolean; data: MedicationDto[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("medications").select("*").order("name_id", { ascending: true });
    if (error) throw new Error(error.message);
    return { success: true, data: data as MedicationDto[] };
  } catch (error: unknown) {
    return { success: false, data: [], error: error instanceof Error ? error.message : "Terjadi kesalahan." };
  }
}

export async function getUserRoleAction(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "user";

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role || user.user_metadata?.role || "user";
  } catch {
    return "user";
  }
}

export async function deleteMedicationAction(medicationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const user = await getAuditUser(supabase);
    const role = await getUserRoleAction();
    
    if (role !== "super_admin") throw new Error("Akses ditolak. Hanya Super Admin.");

    const { data: med } = await supabase.from("medications").select("name_id").eq("id", medicationId).single();
    const { error } = await supabase.from("medications").delete().eq("id", medicationId);
    if (error) throw new Error(error.message);

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Obat Dihapus (Fatal)",
      `Menghapus permanen obat: ${med?.name_id || 'ID '+medicationId}.`,
      "data_crud",
      user.fullName
    );

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Sistem gagal menghapus." };
  }
}

// -------------------------------------------------------------
// FUNGSI ARSIP OBAT
// -------------------------------------------------------------
export async function getArchivedMedications() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("medications").select("*").eq("is_active", false).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
    return [];
  }
}

export async function toggleMedicationArchiveAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const user = await getAuditUser(supabase);
    
    const { data: med, error } = await supabase.from("medications").update({ is_active: !currentStatus }).eq("id", id).select("name_id").single();
    if (error) throw error;

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      currentStatus ? "Obat Diarsipkan" : "Obat Diaktifkan",
      `Mengubah status obat: ${med?.name_id}.`,
      "data_crud",
      user.fullName
    );
    
    revalidatePath("/dashboard/medications");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal mengubah status." };
  }
}

export async function hardDeleteMedicationAction(id: string) {
  try {
    const supabase = await createClient();
    const user = await getAuditUser(supabase);

    const { data: med } = await supabase.from("medications").select("name_id").eq("id", id).single();
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) throw error;

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Arsip Obat Dihapus",
      `Menghapus permanen dari arsip: ${med?.name_id}.`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/medications");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus permanen." };
  }
}