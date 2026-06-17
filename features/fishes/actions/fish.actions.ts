// features/fishes/actions/fish.actions.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache"; 
import { Fish } from "../types/fish.types";

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
// 1. CREATE FISH (TAMBAH IKAN)
// ==========================================
export async function createFishAction(fishData: Partial<Fish>) {
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

    const { data: existingFish } = await supabase
      .from("fishes")
      .select("id")
      .ilike("name_id", fishData.name_id!)
      .eq("is_active", true)
      .maybeSingle();

    if (existingFish) throw new Error(`Ikan "${fishData.name_id}" sudah ada di database.`);
    
    const payload = {
      ...fishData,
      slug: generateSlug(fishData.name_id!),
      created_by: userId,
      updated_by: userId,
      is_active: true,
    };

    const { data, error } = await supabase.from("fishes").insert(payload).select().maybeSingle();
    if (error) throw new Error(error.message);
    
    await supabase.from("system_activities").insert({
      title: "Data Ikan Baru Ditambahkan",
      message: `Spesies ikan "${fishData.name_id}" berhasil ditambahkan ke database oleh admin.`,
      category: "data_crud",
      created_by: userName
    });

    revalidatePath("/dashboard/fishes"); 
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// ==========================================
// 2. UPDATE FISH (EDIT IKAN)
// ==========================================
export async function updateFishAction(id: string, fishData: Partial<Fish>) {
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

    const { data: duplicateFish } = await supabase
      .from("fishes")
      .select("id")
      .ilike("name_id", fishData.name_id!)
      .eq("is_active", true)
      .neq("id", id)
      .maybeSingle();

    if (duplicateFish) throw new Error(`Ikan "${fishData.name_id}" sudah ada di database.`);

    const payload = {
      ...fishData,
      slug: fishData.name_id ? generateSlug(fishData.name_id) : undefined,
      updated_by: userId,
    };

    const { data, error } = await supabase.from("fishes").update(payload).eq("id", id).select().maybeSingle();
    if (error) throw new Error(error.message);

    await supabase.from("system_activities").insert({
      title: "Data Ikan Diperbarui",
      message: `Spesies ikan "${fishData.name_id || data?.name_id || 'Ikan'}" berhasil diperbarui.`,
      category: "data_crud",
      created_by: userName
    });

    revalidatePath("/dashboard/fishes");
    revalidatePath(`/dashboard/fishes/${id}`); 

    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// ==========================================
// 3. HARD DELETE (HAPUS PERMANEN)
// ==========================================
export async function hardDeleteFishAction(id: string) {
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
    if (profile?.role !== "super_admin") throw new Error("Hanya Super Admin yang boleh menghapus permanen.");

    const { data: fish, error: fetchError } = await supabase
      .from("fishes")
      .select("name_id, image_url, gallery_urls") 
      .eq("id", id)
      .single();

    if (fetchError) throw new Error("Data ikan tidak ditemukan.");

    const filesToDelete: string[] = [];

    if (fish?.image_url) {
      const pathParts = fish.image_url.split("fish-images/");
      if (pathParts.length === 2) filesToDelete.push(pathParts[1]);
    }

    if (fish?.gallery_urls && Array.isArray(fish.gallery_urls)) {
      for (const url of fish.gallery_urls) {
        const pathParts = url.split("fish-images/");
        if (pathParts.length === 2) filesToDelete.push(pathParts[1]);
      }
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from("fish-images").remove(filesToDelete);
    }

    const { error } = await supabase.from("fishes").delete().eq("id", id);
    if (error) throw error;

    await supabase.from("system_activities").insert({
      title: "Data Ikan Dihapus Permanen",
      message: `Spesies ikan "${fish?.name_id || 'Ikan'}" berhasil dihapus permanen dari sistem beserta file gambarnya.`,
      category: "data_crud",
      created_by: userName
    });

    revalidatePath("/dashboard/fishes");
    revalidatePath("/dashboard/fishes/archive");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// ==========================================
// 4. RESTORE FISH (PULIHKAN IKAN)
// ==========================================
export async function restoreFishAction(id: string) {
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

    const { data: archivedFish, error: fetchError } = await supabase.from("fishes").select("name_id").eq("id", id).single();
    if (fetchError || !archivedFish) throw new Error("Data ikan tidak ditemukan.");

    const { data: duplicateFish } = await supabase
      .from("fishes")
      .select("id")
      .ilike("name_id", archivedFish.name_id)
      .eq("is_active", true)
      .maybeSingle();

    if (duplicateFish) throw new Error(`Ikan "${archivedFish.name_id}" sudah ada dalam database aktif.`);

    const { error } = await supabase.from("fishes").update({ is_active: true, updated_by: userId }).eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("system_activities").insert({
      title: "Data Ikan Dipulihkan",
      message: `Spesies ikan "${archivedFish.name_id}" berhasil dipulihkan dari arsip kembali ke database aktif.`,
      category: "data_crud",
      created_by: userName
    });

    revalidatePath("/dashboard/fishes");
    revalidatePath("/dashboard/fishes/archive");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}