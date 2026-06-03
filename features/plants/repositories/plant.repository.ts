import { createClient } from "@/lib/supabase/client";
import { Plant } from "../types/plant.types";

const PLANT_COLUMNS = `
  id, name, slug, scientific_name, light_requirement, co2_requirement, fertilizer_requirement,
  placement, difficulty, growth_rate, ph_min, ph_max, temperature_min, temperature_max,
  description, origin_country, max_height_cm, recommended_for, source_name, source_url, image_url, 
  created_at, updated_at, is_active, created_by, updated_by
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

  if (error) throw error;
  return data as Plant;
}

export async function deletePlant(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("plants").update({ is_active: false }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function uploadPlantImage(file: File, plantName: string): Promise<string> {
  const supabase = createClient();
  const folderSlug = plantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `${folderSlug}/${fileName}`;

  const { error } = await supabase.storage.from("plant-images").upload(filePath, file);
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