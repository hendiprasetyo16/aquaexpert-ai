"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Plant } from "../types/plant.types";

// Fungsi utilitas untuk mengambil ID user saat ini (Audit Trail)
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
        throw new Error(
            `Tanaman "${plantData.name}" sudah ada di database`
    );
    }
    
    const payload = {
      ...plantData,
      slug: generateSlug(plantData.name!),
      created_by: userId,
      updated_by: userId,
      is_active: true,
    };

    //const { data, error } = await supabase.from("plants").insert([payload]).select().single();
    const { data, error } = await supabase
        .from("plants")
        .insert(payload)
        .select()
        .maybeSingle();

    if (error) throw new Error(error.message);
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
        throw new Error(
            `Tanaman "${plantData.name}" sudah ada di database`
    );
    }

    const payload = {
      ...plantData,
      slug: plantData.name ? generateSlug(plantData.name) : undefined,
      updated_by: userId,
    };

    //const { data, error } = await supabase.from("plants").update(payload).eq("id", id).select().single();
    const { data, error } = await supabase
        .from("plants")
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();
    
    if (error) throw new Error(error.message);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}