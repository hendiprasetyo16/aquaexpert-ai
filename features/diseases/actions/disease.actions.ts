// features/diseases/actions/disease.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Disease } from "../types/disease.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

// ========================================================
// FUNGSI KEAMANAN: HAK AKSES BERTINGKAT (RBAC)
// ========================================================
async function verifyAdminAccess(supabase: SupabaseClient, requireSuperAdmin: boolean = false) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir. Silakan login kembali.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  // Jika aksi sangat fatal (Hard Delete), wajib super_admin
  if (requireSuperAdmin && profile?.role !== 'super_admin') {
    throw new Error("Akses Ditolak: Fitur ini khusus untuk Super Admin.");
  }
  
  // Jika aksi standar admin (Tambah/Edit/Arsip), izinkan admin & super_admin
  if (!requireSuperAdmin && profile?.role !== 'super_admin' && profile?.role !== 'admin') {
    throw new Error("Akses Ditolak: Minimal akses Admin diperlukan.");
  }

  // Mengembalikan user sekaligus namanya untuk keperluan Notifikasi
  return { ...user, fullName: profile?.full_name || "Admin" };
}

// 1. AMBIL SEMUA DATA
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
    const user = await verifyAdminAccess(supabase, false); 

    const { error } = await supabase.from("diseases").insert({
      ...payload,
      created_by: user.id
    });

    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI
    await pushNotificationAction(
      "Penyakit Baru Ditambahkan",
      `Menambahkan data penyakit: ${payload.name_id || payload.name_en}.`,
      "data_crud",
      user.fullName
    );

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
    const user = await verifyAdminAccess(supabase, false); 

    const { error } = await supabase.from("diseases").update({
      ...payload,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI
    await pushNotificationAction(
      "Data Penyakit Diperbarui",
      `Memperbarui data penyakit: ${payload.name_id || payload.name_en || 'ID '+id}.`,
      "data_crud",
      user.fullName
    );

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
    const user = await verifyAdminAccess(supabase, false); 

    const { data: disease, error } = await supabase.from("diseases").update({ 
      is_active: !currentStatus,
      updated_at: new Date().toISOString()
    }).eq("id", id).select("name_id").single();

    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI
    await pushNotificationAction(
      currentStatus ? "Penyakit Diarsipkan" : "Penyakit Diaktifkan",
      `Mengubah status penyakit: ${disease?.name_id || 'ID '+id}.`,
      "data_crud",
      user.fullName
    );

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
    const user = await verifyAdminAccess(supabase, true); 

    const { data: disease } = await supabase.from("diseases").select("name_id, image_url, gallery_urls").eq("id", id).single();
    const diseaseName = disease?.name_id || 'ID '+id;

    const { error } = await supabase.from("diseases").delete().eq("id", id);
    if (error) throw new Error(error.message);

    const deleteStorageImage = async (imageUrl: string) => {
      if (!imageUrl) return;
      try {
        const parts = imageUrl.split('/public/');
        if (parts.length > 1) {
          const subParts = parts[1].split('/');
          const bucket = subParts[0]; 
          const fileName = subParts.slice(1).join('/'); 
          await supabase.storage.from(bucket).remove([fileName]);
        }
      } catch (e) {
        console.error("Gagal menghapus gambar storage:", e);
      }
    };

    if (disease?.image_url) await deleteStorageImage(disease.image_url);
    if (disease?.gallery_urls && Array.isArray(disease.gallery_urls)) {
      for (const url of disease.gallery_urls) await deleteStorageImage(url);
    }

    // 💡 KIRIM NOTIFIKASI
    await pushNotificationAction(
      "Data Penyakit Dihapus",
      `Menghapus permanen penyakit: ${diseaseName} beserta gambarnya.`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/diseases");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus permanen." };
  }
}