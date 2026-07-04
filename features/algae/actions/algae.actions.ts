// features/algae/actions/algae.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Algae } from "../types/algae.types";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

// Fungsi Helper untuk mendapatkan nama Admin yang sedang login
async function getAdminName(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "System";
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
    
  return profile?.full_name || "Unknown Admin";
}

export async function createAlgaeAction(payload: Partial<Algae>) {
  try {
    const supabase = await createClient();
    
    // Auto-generate slug dari nama Inggris jika ada, atau nama Indo
    const nameForSlug = payload.name_en || payload.name_id || "unknown";
    const slug = nameForSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
    
    const { data, error } = await supabase
      .from("algae")
      .insert([{ ...payload, slug, is_active: true }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI: Data Baru
    const adminName = await getAdminName(supabase);
    await pushNotificationAction(
      "Alga Baru Ditambahkan",
      `Menambahkan data alga baru: ${payload.name_id || payload.name_en}.`,
      "data_crud",
      adminName
    );

    revalidatePath("/dashboard/algae");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function updateAlgaeAction(id: string, payload: Partial<Algae>) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("algae")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI: Data Diubah
    const adminName = await getAdminName(supabase);
    await pushNotificationAction(
      "Data Alga Diperbarui",
      `Mengubah data alga: ${data.name_id}.`,
      "data_crud",
      adminName
    );

    revalidatePath("/dashboard/algae");
    revalidatePath(`/dashboard/algae/${id}`);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function restoreAlgaeAction(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("algae")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("name_id")
      .single();

    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI: Data Dipulihkan
    const adminName = await getAdminName(supabase);
    await pushNotificationAction(
      "Data Alga Dipulihkan",
      `Memulihkan alga ${data?.name_id || 'ID '+id} dari arsip.`,
      "data_crud",
      adminName
    );

    revalidatePath("/dashboard/algae");
    revalidatePath("/dashboard/algae/archive");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function hardDeleteAlgaeAction(id: string) {
  try {
    const supabase = await createClient();
    
    // 1. Ambil data untuk tahu URL gambarnya dan namanya untuk notifikasi
    const { data: algae } = await supabase.from("algae").select("name_id, image_url, gallery_urls").eq("id", id).single();
    const algaeName = algae?.name_id || 'ID '+id;
    
    // 2. Hapus data dari database (Ini akan sukses terhapus lebih dulu)
    const { error } = await supabase.from("algae").delete().eq("id", id);
    if (error) throw new Error(error.message);

    // 3. Helper baru: Hapus gambar fisik dari Storage menggunakan Server Client
    const deleteStorageImage = async (imageUrl: string) => {
      const parts = imageUrl.split("/algae-images/");
      if (parts.length === 2) {
        const fileName = parts[1];
        await supabase.storage.from("algae-images").remove([fileName]);
      }
    };

    // Eksekusi penghapusan semua gambarnya dari bucket
    if (algae?.image_url) {
      await deleteStorageImage(algae.image_url);
    }
    
    if (algae?.gallery_urls && algae.gallery_urls.length > 0) {
      for (const url of algae.gallery_urls) {
        await deleteStorageImage(url);
      }
    }

    // 💡 KIRIM NOTIFIKASI: Data Dihapus Permanen
    const adminName = await getAdminName(supabase);
    await pushNotificationAction(
      "Data Alga Dihapus",
      `Menghapus permanen alga: ${algaeName} beserta seluruh gambarnya.`,
      "data_crud",
      adminName
    );

    // Refresh halaman agar tabel ter-update
    revalidatePath("/dashboard/algae");
    revalidatePath("/dashboard/algae/archive");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}