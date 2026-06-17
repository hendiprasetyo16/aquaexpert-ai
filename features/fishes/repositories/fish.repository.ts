// features/fishes/repositories/fish.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Fish } from "../types/fish.types";

// Sesuaikan persis dengan Schema DB Bapak
const FISH_COLUMNS = `
  id,
  slug,
  name_id,
  name_en,
  scientific_name,
  description_id,
  description_en,
  min_tank_size,
  ideal_ph_min,
  ideal_ph_max,
  ideal_temp_min,
  ideal_temp_max,
  compatibility,
  schooling,
  min_group_size,
  image_url,
  gallery_urls,
  fish_type,
  difficulty,
  expert_notes_id,
  expert_notes_en,
  is_active,
  created_at,
  updated_at,
  created_by,
  updated_by,
  estimated_adult_size_cm,
  bioload_factor
`;

export async function getFishes(): Promise<Fish[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fishes")
    .select(FISH_COLUMNS)
    .eq("is_active", true) 
    .order("name_id");

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as Fish[];
}

export async function getFishById(id: string): Promise<Fish | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fishes")
    .select(FISH_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  return data as Fish;
}

export async function uploadFishImage(file: File, slug: string, prefix: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  
  // CACHE-BUSTING
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `${slug}/${fileName}`;

  // Upload ke bucket "fish-images"
  const { error } = await supabase.storage.from("fish-images").upload(filePath, file, {
    upsert: false, 
    cacheControl: "3600"
  });
  
  if (error) throw error;

  const { data } = supabase.storage.from("fish-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function removeFishImage(imageUrl: string) {
  if (!imageUrl) return;
  const supabase = createClient();
  const pathParts = imageUrl.split("fish-images/");
  if (pathParts.length === 2) {
    const filePath = pathParts[1];
    const { error } = await supabase.storage.from("fish-images").remove([filePath]);
    if (error) console.error("Gagal menghapus gambar ikan lama:", error);
  }
}

export async function getArchivedFishes(): Promise<Fish[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fishes")
    .select(FISH_COLUMNS)
    .eq("is_active", false)
    .order("name_id"); 

  if (error) {
    console.error("Gagal mengambil data ikan yang diarsipkan:", error);
    return [];
  }
  return (data ?? []) as Fish[];
}

export async function deleteFish(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("fishes")
    .update({ is_active: false })
    .eq("id", id);
    
  if (error) throw error;
}