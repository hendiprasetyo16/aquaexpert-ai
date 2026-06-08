"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache"; 
import { Plant } from "../types/plant.types";

// Fungsi pembantu untuk mendapatkan data User yang sedang aktif
async function getAuditUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// ==========================================
// 1. CREATE PLANT (TAMBAH TANAMAN)
// ==========================================
export async function createPlantAction(plantData: Partial<Plant>) {
  try {
    const user = await getAuditUser();
    const userId = user.id;
    const userName = user.email || "System";

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: existingPlant } = await supabase
      .from("plants")
      .select("id")
      .ilike("name", plantData.name!)
      .eq("is_active", true)
      .maybeSingle();

    if (existingPlant) {
      throw new Error(`Tanaman "${plantData.name}" sudah ada di database.`);
    }
    
    const payload = {
      ...plantData,
      slug: generateSlug(plantData.name!),
      created_by: userId,
      updated_by: userId,
      is_active: true,
    };

    const { data, error } = await supabase.from("plants").insert(payload).select().maybeSingle();
    if (error) throw new Error(error.message);
    
    // === TAMBAHAN KODE: CATAT LOG AKTIVITAS ===
    await supabase.from("system_activities").insert({
      title: "Tanaman Baru Ditambahkan",
      message: `Tanaman "${plantData.name}" berhasil ditambahkan ke database oleh admin.`,
      category: "data_crud",
      created_by: userName
    });
    // ==========================================

    // BERSIHKAN CACHE HALAMAN AGAR LANGSUNG UPDATE
    revalidatePath("/dashboard/plants"); 
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. UPDATE PLANT (EDIT TANAMAN)
// ==========================================
export async function updatePlantAction(id: string, plantData: Partial<Plant>) {
  try {
    const user = await getAuditUser();
    const userId = user.id;
    const userName = user.email || "System";

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: duplicatePlant } = await supabase
      .from("plants")
      .select("id")
      .ilike("name", plantData.name!)
      .eq("is_active", true)
      .neq("id", id)
      .maybeSingle();

    if (duplicatePlant) {
      throw new Error(`Tanaman "${plantData.name}" sudah ada di database.`);
    }

    const payload = {
      ...plantData,
      slug: plantData.name ? generateSlug(plantData.name) : undefined,
      updated_by: userId,
    };

    const { data, error } = await supabase.from("plants").update(payload).eq("id", id).select().maybeSingle();
    if (error) throw new Error(error.message);

    // === TAMBAHAN KODE: CATAT LOG AKTIVITAS ===
    await supabase.from("system_activities").insert({
      title: "Tanaman Diperbarui",
      message: `Data tanaman "${plantData.name || data?.name || 'Tanaman'}" berhasil diperbarui.`,
      category: "data_crud",
      created_by: userName
    });
    // ==========================================

    // BERSIHKAN CACHE HALAMAN AGAR LANGSUNG UPDATE
    revalidatePath("/dashboard/plants");
    revalidatePath(`/dashboard/plants/${id}`); 

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 3. HARD DELETE (HAPUS PERMANEN)
// ==========================================
export async function hardDeletePlantAction(id: string) {
  try {
    const user = await getAuditUser();
    const userId = user.id;
    const userName = user.email || "System";

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "super_admin") {
      throw new Error("Hanya Super Admin yang boleh menghapus permanen.");
    }

    // 1. CARI TANAMAN UNTUK MENDAPATKAN NAMA, IMAGE_URL DAN GALLERY_URLS
    const { data: plant, error: fetchError } = await supabase
      .from("plants")
      .select("name, image_url, gallery_urls") // <-- Ditambahkan 'name' agar bisa dicatat di log
      .eq("id", id)
      .single();

    if (fetchError) throw new Error("Data tanaman tidak ditemukan.");

    const filesToDelete: string[] = [];

    // 2. AMBIL PATH DARI IMAGE_URL (COVER)
    if (plant?.image_url) {
      const pathParts = plant.image_url.split("plant-images/");
      if (pathParts.length === 2) {
        filesToDelete.push(pathParts[1]);
      }
    }

    // 3. AMBIL PATH DARI SEMUA GAMBAR DI GALLERY_URLS
    if (plant?.gallery_urls && Array.isArray(plant.gallery_urls)) {
      for (const url of plant.gallery_urls) {
        const pathParts = url.split("plant-images/");
        if (pathParts.length === 2) {
          filesToDelete.push(pathParts[1]);
        }
      }
    }

    // 4. HAPUS SEMUA FILE SEKALIGUS DI STORAGE JIKA ADA
    if (filesToDelete.length > 0) {
      await supabase.storage.from("plant-images").remove(filesToDelete);
    }

    // 5. EKSEKUSI HARD DELETE DARI DATABASE
    const { error } = await supabase.from("plants").delete().eq("id", id);
    if (error) throw error;

    // === TAMBAHAN KODE: CATAT LOG AKTIVITAS ===
    await supabase.from("system_activities").insert({
      title: "Tanaman Dihapus Permanen",
      message: `Tanaman "${plant?.name || 'Tanaman'}" berhasil dihapus permanen dari sistem beserta file gambarnya.`,
      category: "data_crud",
      created_by: userName
    });
    // ==========================================

    // BERSIHKAN CACHE HALAMAN AGAR LANGSUNG UPDATE
    revalidatePath("/dashboard/plants");
    revalidatePath("/dashboard/plants/archive");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 4. RESTORE PLANT (PULIHKAN TANAMAN)
// ==========================================
export async function restorePlantAction(id: string) {
  try {
    const user = await getAuditUser();
    const userId = user.id;
    const userName = user.email || "System";

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: archivedPlant, error: fetchError } = await supabase.from("plants").select("name").eq("id", id).single();
    if (fetchError || !archivedPlant) throw new Error("Data tanaman tidak ditemukan.");

    const { data: duplicatePlant } = await supabase
      .from("plants")
      .select("id")
      .ilike("name", archivedPlant.name)
      .eq("is_active", true)
      .maybeSingle();

    if (duplicatePlant) {
      throw new Error(`Tanaman "${archivedPlant.name}" sudah ada dalam database aktif. Harap hapus atau ubah nama tanaman yang aktif terlebih dahulu.`);
    }

    const { error } = await supabase.from("plants").update({ is_active: true, updated_by: userId }).eq("id", id);
    if (error) throw new Error(error.message);

    // === TAMBAHAN KODE: CATAT LOG AKTIVITAS ===
    await supabase.from("system_activities").insert({
      title: "Tanaman Dipulihkan",
      message: `Tanaman "${archivedPlant.name}" berhasil dipulihkan dari arsip kembali ke database aktif.`,
      category: "data_crud",
      created_by: userName
    });
    // ==========================================

    // BERSIHKAN CACHE HALAMAN AGAR LANGSUNG UPDATE
    revalidatePath("/dashboard/plants");
    revalidatePath("/dashboard/plants/archive");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}