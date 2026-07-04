// features/plants/types/plant.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Plant } from "../types/plant.types";

const PLANT_COLUMNS = `
  id, name_id, name_en, slug, scientific_name, light_requirement,
  co2_requirement, fertilizer_requirement, placement, difficulty,
  growth_rate, ph_min, ph_max, temperature_min, temperature_max,
  description_id, description_en, origin_country, max_height_cm,
  recommended_for, source_name, source_url, image_url, gallery_urls,
  plant_type, aquascape_style, beginner_score, maintenance_level,
  carpet_potential, shrimp_safe, co2_mandatory, emersed_capable,
  growth_control, tank_size_recommendation, expert_notes_id,
  expert_notes_en, nitrate_consumption, oxygen_production, algae_resistance,
  growth_speed_score, nutrient_consumption_score, preferred_ph,
  preferred_temperature, preferred_gh, carpeting, epiphyte, floating,
  growth_height_cm, growth_width_cm, trimming_frequency_score,
  invasive_growth, root_feeder, created_at, updated_at, is_active,
  created_by, updated_by
`;

export async function getPlants(): Promise<Plant[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("plants")
    .select(PLANT_COLUMNS)
    .eq("is_active", true) 
    .order("name_id"); // <-- DIUBAH KE name_id

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
  
  // ✅ GUNAKAN NAMA FILE ASLI (file.name) yang dikirim dari PlantForm
  // Jangan biarkan ada Date.now() atau Math.random() lagi di sini agar tidak merusak format YYYYMMDD
  const fileName = file.name; 
  const filePath = `${slug}/${fileName}`;

  // UPSERT FALSE: Karena nama unik, tidak perlu khawatir menimpa file lain
  const { error } = await supabase.storage
    .from("plant-images")
    .upload(filePath, file, {
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
    .order("name_id"); // <-- DIUBAH KE name_id

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