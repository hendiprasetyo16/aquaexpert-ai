"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Plant } from "../types/plant.types";

async function getAuditUserId() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

const generateSlug = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// ==========================================
// 1. CREATE PLANT
// ==========================================
export async function createPlantAction(plantData: Partial<Plant>) {
  try {
    const userId = await getAuditUserId();
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
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. UPDATE PLANT
// ==========================================
export async function updatePlantAction(id: string, plantData: Partial<Plant>) {
  try {
    const userId = await getAuditUserId();
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

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 3. HARD DELETE (Hapus Storage lalu Database)
// ==========================================
export async function hardDeletePlantAction(id: string) {
  try {
    const userId = await getAuditUserId();
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

    // 1. CARI TANAMAN UNTUK MENDAPATKAN IMAGE_URL
    const { data: plant, error: fetchError } = await supabase
      .from("plants")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error("Data tanaman tidak ditemukan.");

    // 2. HAPUS FILE DI STORAGE JIKA ADA
    if (plant?.image_url) {
      const pathParts = plant.image_url.split("plant-images/");
      if (pathParts.length === 2) {
        const filePath = pathParts[1];
        await supabase.storage.from("plant-images").remove([filePath]);
      }
    }

    // 3. EKSEKUSI HARD DELETE DARI DATABASE
    const { error } = await supabase.from("plants").delete().eq("id", id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 4. RESTORE PLANT
// ==========================================
export async function restorePlantAction(id: string) {
  try {
    const userId = await getAuditUserId();
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

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}