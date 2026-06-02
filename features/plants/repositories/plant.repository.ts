import { createClient } from "@/lib/supabase/client";
import { Plant } from "../types/plant.types";

export async function getPlants(): Promise<Plant[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .order("name");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function getPlantById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createPlant(
  plantData: Partial<Plant>
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("plants")
    .insert([plantData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePlant(
  id: string,
  plantData: Partial<Plant>
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("plants")
    .update(plantData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deletePlant(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("plants")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

export async function uploadPlantImage(
  file: File,
  plantName: string
): Promise<string> {
  const supabase = createClient();

  const folderSlug = plantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const ext = file.name.split(".").pop();

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${ext}`;

  const filePath =
    `${folderSlug}/${fileName}`;

  const { error } = await supabase.storage
    .from("plant-images")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("plant-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}