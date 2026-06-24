// features/fishes/repositories/fish.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Fish } from "../types/fish.types";

const FISH_COLUMNS = `
  id, slug, name_id, name_en, scientific_name, description_id, description_en, 
  min_tank_size, ideal_ph_min, ideal_ph_max, ideal_temp_min, ideal_temp_max,
  hardness_min, hardness_max, lifespan_years, max_group_size,
  compatibility, temperament_score, adult_behavior, activity_level, schooling, min_group_size, 
  water_layer, origin_region, fish_type, difficulty, 
  shrimp_safe, plant_safe, recommended_tank_styles, 
  breeding_difficulty, is_egg_layer, is_livebearer,
  minimum_tank_length_cm, territorial, predatory, mouth_size_factor,
  compatibility_tags, activity_period, compatibility_score, shrimp_predation_risk,
  native_biotope, preferred_temperature, preferred_ph, preferred_gh,
  uproots_plants, preferred_aquascape_styles, oxygen_requirement_score,
  current_preference, minimum_tank_volume_liters, waste_production_score,
  jump_risk, sensitive_to_nitrate, conservation_status,
  image_url, gallery_urls, expert_notes_id, expert_notes_en, 
  is_active, created_at, updated_at, estimated_adult_size_cm, bioload_factor
`;

export async function getFishes(): Promise<Fish[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("fishes").select(FISH_COLUMNS).eq("is_active", true).order("name_id");
  if (error) { console.error(error); return []; }
  return (data ?? []) as Fish[];
}

export async function getFishById(id: string): Promise<Fish | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("fishes").select(FISH_COLUMNS).eq("id", id).single();
  if (error) { console.error(error); return null; }
  return data as Fish;
}

export async function uploadFishImage(file: File, slug: string, prefix: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `${slug}/${fileName}`;
  const { error } = await supabase.storage.from("fish-images").upload(filePath, file, { upsert: false, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("fish-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function removeFishImage(imageUrl: string) {
  if (!imageUrl) return;
  const supabase = createClient();
  const pathParts = imageUrl.split("fish-images/");
  if (pathParts.length === 2) {
    const { error } = await supabase.storage.from("fish-images").remove([pathParts[1]]);
    if (error) console.error("Gagal menghapus gambar ikan lama:", error);
  }
}

export async function getArchivedFishes(): Promise<Fish[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("fishes").select(FISH_COLUMNS).eq("is_active", false).order("name_id"); 
  if (error) { console.error(error); return []; }
  return (data ?? []) as Fish[];
}

export async function deleteFish(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fishes").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}