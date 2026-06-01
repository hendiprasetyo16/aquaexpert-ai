import { createClient } from "@/lib/supabase/client";
import { Plant } from "../types/plant.types";

export async function getPlants(): Promise<Plant[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data tanaman:", error);
    return [];
  }

  return data ?? [];
}