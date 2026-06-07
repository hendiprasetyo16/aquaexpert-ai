import { createClient } from "@/lib/supabase/client";
import { Plant } from "../types/plant.types";

const PLANT_COLUMNS = `
  id,
  name,
  slug,
  scientific_name,
  light_requirement,
  co2_requirement,
  fertilizer_requirement,
  placement,
  difficulty,
  growth_rate,
  ph_min,
  ph_max,
  temperature_min,
  temperature_max,
  description,
  origin_country,
  max_height_cm,
  recommended_for,
  source_name,
  source_url,
  image_url,
  gallery_urls,
  plant_type,
  aquascape_style,
  beginner_score,
  maintenance_level,
  carpet_potential,
  shrimp_safe,
  co2_mandatory,
  emersed_capable,
  growth_control,
  tank_size_recommendation,
  expert_notes,
  created_at,
  updated_at,
  is_active,
  created_by,
  updated_by
`;

export async function getPlants(): Promise<Plant[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plants")
    .select(PLANT_COLUMNS)
    .eq("is_active", true) 
    .order("name");

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as Plant[];
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plants")
    .select(PLANT_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  return data as Plant;
}

export async function uploadPlantImage(file: File, slug: string, prefix: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  
  // CACHE-BUSTING: Nama file dijamin unik 100%
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `${slug}/${fileName}`;

  // UPSERT FALSE: Karena nama unik, tidak perlu repot menimpa file
  const { error } = await supabase.storage.from("plant-images").upload(filePath, file, {
    upsert: false, 
    cacheControl: "3600"
  });
  
  if (error) throw error;

  const { data } = supabase.storage.from("plant-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function removePlantImage(imageUrl: string) {
  if (!imageUrl) return;
  const supabase = createClient();
  const pathParts = imageUrl.split("plant-images/");
  if (pathParts.length === 2) {
    const filePath = pathParts[1];
    const { error } = await supabase.storage.from("plant-images").remove([filePath]);
    if (error) console.error("Gagal menghapus gambar lama:", error);
  }
}

export async function getArchivedPlants(): Promise<Plant[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plants")
    .select(PLANT_COLUMNS)
    .eq("is_active", false)
    .order("name");

  if (error) {
    console.error("Gagal mengambil data tanaman yang diarsipkan:", error);
    return [];
  }
  return (data ?? []) as Plant[];
}

// PERBAIKAN KRITIS: Soft Delete (Arsip)
export async function deletePlant(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("plants")
    .update({
      is_active: false
    })
    .eq("id", id);
    
  if (error) throw error;
}