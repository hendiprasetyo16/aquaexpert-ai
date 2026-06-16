// features/aquariums/actions/inventory.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TankPlant, TankFish } from "../types/inventory.types";

// Zod Schema untuk Tanaman
const plantSchema = z.object({
  aquarium_id: z.string().uuid(),
  plant_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
});

// Zod Schema untuk Ikan
const fishSchema = z.object({
  aquarium_id: z.string().uuid(),
  fish_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
});

// MENGAMBIL DATA INVENTORI
export async function getTankInventoryAction(aquariumId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // FIX: Tarik 'estimated_adult_size_cm' dari tabel fishes agar Bioload Health Engine akurat
  const { data: fishes, error: errFish } = await supabase
    .from("aquarium_fishes")
    .select("*, fish:fishes(id, name_id, name_en, image_url, fish_type, estimated_adult_size_cm)")
    .eq("aquarium_id", aquariumId)
    .order("added_at", { ascending: false });

  // Fetch Tanaman
  const { data: plants, error: errPlant } = await supabase
    .from("aquarium_plants")
    .select("*, plant:plants(id, name_id, name_en, image_url, placement)")
    .eq("aquarium_id", aquariumId)
    .order("added_at", { ascending: false });

  if (errFish || errPlant) return { success: false, error: "Gagal mengambil data inventori." };
  
  return { 
    success: true, 
    fishes: fishes as TankFish[], 
    plants: plants as TankPlant[] 
  };
}

// MENAMBAH TANAMAN (Smart Update Quantity)
export async function addPlantToTankAction(payload: z.infer<typeof plantSchema>) {
  const supabase = await createClient();
  const validated = plantSchema.parse(payload);

  const { data: existing } = await supabase
    .from("aquarium_plants")
    .select("id, quantity")
    .eq("aquarium_id", validated.aquarium_id)
    .eq("plant_id", validated.plant_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("aquarium_plants")
      .update({ quantity: existing.quantity + validated.quantity })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("aquarium_plants").insert([validated]);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/my-aquarium/${validated.aquarium_id}`);
  return { success: true };
}

// MENAMBAH IKAN (Smart Update Quantity)
export async function addFishToTankAction(payload: z.infer<typeof fishSchema>) {
  const supabase = await createClient();
  const validated = fishSchema.parse(payload);

  const { data: existing } = await supabase
    .from("aquarium_fishes")
    .select("id, quantity")
    .eq("aquarium_id", validated.aquarium_id)
    .eq("fish_id", validated.fish_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("aquarium_fishes")
      .update({ quantity: existing.quantity + validated.quantity })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("aquarium_fishes").insert([validated]);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/my-aquarium/${validated.aquarium_id}`);
  return { success: true };
}

// MENGHAPUS ITEM
export async function removeInventoryItemAction(table: "aquarium_fishes" | "aquarium_plants", id: string, aquariumId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
  return { success: true };
}