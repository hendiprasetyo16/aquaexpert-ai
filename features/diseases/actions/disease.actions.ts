// features/diseases/actions/disease.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Disease } from "../types/disease.types";

// ========================================================
// FUNGSI KEAMANAN: HANYA SUPER ADMIN YANG BISA LEWAT
// ========================================================
async function verifySuperAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer U> ? U : any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir. Silakan login kembali.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    throw new Error("Akses Ditolak: Fitur ini khusus untuk Super Admin.");
  }
  return user;
}

// 1. AMBIL SEMUA DATA (UNTUK TABEL DATABASE)
export async function getAdminDiseasesAction(): Promise<{ success: boolean; data?: Disease[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("diseases").select("*").order("name_id", { ascending: true });
    if (error) throw new Error(error.message);
    return { success: true, data: data as Disease[] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memuat data." };
  }
}

// 2. TAMBAH PENYAKIT (CREATE)
export async function createDiseaseAction(payload: Partial<Disease>) {
  try {
    const supabase = await createClient();
    const user = await verifySuperAdmin(supabase); // Cek Super Admin

    const { error } = await supabase.from("diseases").insert({
      ...payload,
      created_by: user.id
    });

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/diseases");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal membuat patogen baru." };
  }
}

// 3. EDIT PENYAKIT (UPDATE)
export async function updateDiseaseAction(id: string, payload: Partial<Disease>) {
  try {
    const supabase = await createClient();
    const user = await verifySuperAdmin(supabase); // Cek Super Admin

    const { error } = await supabase.from("diseases").update({
      ...payload,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/diseases");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui patogen." };
  }
}

// 4. ARSIPKAN / AKTIFKAN PENYAKIT (TOGGLE ARCHIVE)
export async function toggleDiseaseArchiveAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase); // Cek Super Admin

    const { error } = await supabase.from("diseases").update({ 
      is_active: !currentStatus,
      updated_at: new Date().toISOString()
    }).eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/diseases");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengubah status arsip." };
  }
}

// 5. HAPUS PERMANEN (HARD DELETE)
export async function hardDeleteDiseaseAction(id: string) {
  try {
    const supabase = await createClient();
    await verifySuperAdmin(supabase); // Cek Super Admin

    const { error } = await supabase.from("diseases").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/diseases");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus permanen." };
  }
}