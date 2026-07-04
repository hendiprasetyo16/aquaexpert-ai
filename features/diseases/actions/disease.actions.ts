// features/diseases/actions/disease.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Disease } from "../types/disease.types";
import type { SupabaseClient } from "@supabase/supabase-js";

// ========================================================
// FUNGSI KEAMANAN: HAK AKSES BERTINGKAT (RBAC)
// ========================================================
async function verifyAdminAccess(supabase: SupabaseClient, requireSuperAdmin: boolean = false) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi berakhir. Silakan login kembali.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
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
    const user = await verifyAdminAccess(supabase, false); 

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
    const user = await verifyAdminAccess(supabase, false); 

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
    await verifyAdminAccess(supabase, false); 

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

// 5. HAPUS PERMANEN (HARD DELETE) & PEMBERSIHAN STORAGE OTOMATIS
export async function hardDeleteDiseaseAction(id: string) {
  try {
    const supabase = await createClient();
    await verifyAdminAccess(supabase, true); 

    // 1. Ambil URL gambar yang tersimpan sebelum data dihapus
    const { data: disease } = await supabase.from("diseases").select("image_url, gallery_urls").eq("id", id).single();

    // 2. Hapus data record dari database
    const { error } = await supabase.from("diseases").delete().eq("id", id);
    if (error) throw new Error(error.message);

    // 3. Fungsi Helper Cerdas: Ekstrak Bucket & Path lalu Hapus
    const deleteStorageImage = async (imageUrl: string) => {
      if (!imageUrl) return;
      try {
        const parts = imageUrl.split('/public/');
        if (parts.length > 1) {
          // Hasil pemotongan: "disease-images/folder/nama-file.jpg"
          const subParts = parts[1].split('/');
          const bucket = subParts[0]; // Otomatis mendapatkan nama bucket (misal: 'disease-images')
          const fileName = subParts.slice(1).join('/'); // Path file aslinya
          
          await supabase.storage.from(bucket).remove([fileName]);
        }
      } catch (e) {
        console.error("Gagal menghapus gambar storage:", e);
      }
    };

    // Eksekusi pembersihan foto patogen
    if (disease?.image_url) {
      await deleteStorageImage(disease.image_url);
    }
    if (disease?.gallery_urls && Array.isArray(disease.gallery_urls)) {
      for (const url of disease.gallery_urls) {
        await deleteStorageImage(url);
      }
    }

    revalidatePath("/dashboard/diseases");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus permanen." };
  }
}