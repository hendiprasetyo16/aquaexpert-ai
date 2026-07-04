// features/plants/actions/plant.actions.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache"; 
import { Plant } from "../types/plant.types";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

// 💡 HELPER: Ambil user dan namanya
async function getAuditUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  
  return Object.assign(user, { fullName: profile?.full_name || user.email || "Admin" });
}

const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// 1. CREATE PLANT (TAMBAH TANAMAN)
export async function createPlantAction(plantData: Partial<Plant>) {
  try {
    const user = await getAuditUser();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: existingPlant } = await supabase
      .from("plants")
      .select("id")
      .ilike("name_id", plantData.name_id!)
      .eq("is_active", true)
      .maybeSingle();

    if (existingPlant) throw new Error(`Tanaman "${plantData.name_id}" sudah ada di database.`);
    
    const payload = {
      ...plantData,
      slug: generateSlug(plantData.name_id!),
      created_by: user.id,
      updated_by: user.id,
      is_active: true,
    };

    const { data, error } = await supabase.from("plants").insert(payload).select().maybeSingle();
    if (error) throw new Error(error.message);
    
    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Tanaman Baru Ditambahkan",
      `Menambahkan spesies tanaman: "${plantData.name_id}".`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/plants"); 
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// 2. UPDATE PLANT (EDIT TANAMAN)
export async function updatePlantAction(id: string, plantData: Partial<Plant>) {
  try {
    const user = await getAuditUser();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: duplicatePlant } = await supabase
      .from("plants")
      .select("id")
      .ilike("name_id", plantData.name_id!)
      .eq("is_active", true)
      .neq("id", id)
      .maybeSingle();

    if (duplicatePlant) throw new Error(`Tanaman "${plantData.name_id}" sudah ada di database.`);

    const payload = {
      ...plantData,
      slug: plantData.name_id ? generateSlug(plantData.name_id) : undefined,
      updated_by: user.id,
    };

    const { data, error } = await supabase.from("plants").update(payload).eq("id", id).select().maybeSingle();
    if (error) throw new Error(error.message);

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Tanaman Diperbarui",
      `Memperbarui data tanaman: "${plantData.name_id || data?.name_id || 'Tanaman'}".`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/plants");
    revalidatePath(`/dashboard/plants/${id}`); 
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// 3. HARD DELETE (HAPUS PERMANEN)
export async function hardDeletePlantAction(id: string) {
  try {
    const user = await getAuditUser();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "super_admin") throw new Error("Hanya Super Admin yang boleh menghapus permanen.");

    const { data: plant, error: fetchError } = await supabase.from("plants").select("name_id, image_url, gallery_urls").eq("id", id).single();
    if (fetchError) throw new Error("Data tanaman tidak ditemukan.");

    const filesToDelete: string[] = [];
    if (plant?.image_url) {
      const pathParts = plant.image_url.split("plant-images/");
      if (pathParts.length === 2) filesToDelete.push(pathParts[1]);
    }
    if (plant?.gallery_urls && Array.isArray(plant.gallery_urls)) {
      for (const url of plant.gallery_urls) {
        const pathParts = url.split("plant-images/");
        if (pathParts.length === 2) filesToDelete.push(pathParts[1]);
      }
    }
    if (filesToDelete.length > 0) {
      await supabase.storage.from("plant-images").remove(filesToDelete);
    }

    const { error } = await supabase.from("plants").delete().eq("id", id);
    if (error) throw error;

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Tanaman Dihapus Permanen",
      `Menghapus permanen tanaman: "${plant?.name_id || 'Tanaman'}" beserta file gambarnya.`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/plants");
    revalidatePath("/dashboard/plants/archive");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// 4. RESTORE PLANT (PULIHKAN TANAMAN)
export async function restorePlantAction(id: string) {
  try {
    const user = await getAuditUser();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: archivedPlant, error: fetchError } = await supabase.from("plants").select("name_id").eq("id", id).single();
    if (fetchError || !archivedPlant) throw new Error("Data tanaman tidak ditemukan.");

    const { data: duplicatePlant } = await supabase
      .from("plants")
      .select("id")
      .ilike("name_id", archivedPlant.name_id)
      .eq("is_active", true)
      .maybeSingle();

    if (duplicatePlant) throw new Error(`Tanaman "${archivedPlant.name_id}" sudah ada dalam database aktif.`);

    const { error } = await supabase.from("plants").update({ is_active: true, updated_by: user.id }).eq("id", id);
    if (error) throw new Error(error.message);

    // 💡 NOTIFIKASI
    await pushNotificationAction(
      "Data Tanaman Dipulihkan",
      `Memulihkan tanaman "${archivedPlant.name_id}" dari arsip kembali ke database aktif.`,
      "data_crud",
      user.fullName
    );

    revalidatePath("/dashboard/plants");
    revalidatePath("/dashboard/plants/archive");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}