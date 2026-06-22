// features/aquariums/actions/inventory.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TankPlant, TankFish } from "../types/inventory.types";

const plantSchema = z.object({
  aquarium_id: z.string().uuid(),
  plant_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
  added_at: z.string().optional(),
});

const fishSchema = z.object({
  aquarium_id: z.string().uuid(),
  fish_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
  health_status: z.enum(["Healthy", "Sick", "Quarantined"]).default("Healthy"),
  size_category: z.enum(["Juvenile", "Adult"]).default("Adult"),
  added_at: z.string().optional(),
});

async function verifyAquariumOwnership(supabase: SupabaseClient, aquariumId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("my_aquariums")
    .select("id")
    .eq("id", aquariumId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw new Error("Unauthorized access to this aquarium ecosystem.");
  return true;
}

export async function getTankInventoryAction(aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data: fishes, error: errFish } = await supabase
      .from("aquarium_fishes")
      .select(`
        *, 
        fish:fishes(
          id, name_id, name_en, image_url, fish_type, 
          estimated_adult_size_cm, bioload_factor,
          activity_level, water_layer, temperament_score, shrimp_safe, plant_safe,
          temperature_min, temperature_max, ph_min, ph_max,
          min_school_size, fin_nipper, long_finned, minimum_tank_length_cm,
          mouth_size_factor, compatibility_tags, territorial, predatory, activity_period,
          compatibility_score, shrimp_predation_risk, native_biotope,
          preferred_temperature, preferred_ph, preferred_gh, uproots_plants, preferred_aquascape_styles,
          oxygen_requirement_score, current_preference, max_group_size, breeding_difficulty, lifespan_years,
          minimum_tank_volume_liters, waste_production_score, jump_risk, sensitive_to_nitrate,
          conservation_status
        )
      `)
      .eq("aquarium_id", aquariumId)
      .order("added_at", { ascending: false });

    const { data: plants, error: errPlant } = await supabase
      .from("aquarium_plants")
      .select(`
        *, 
        plant:plants(
          id, name_id, name_en, image_url, placement, growth_rate, nitrate_consumption, 
          oxygen_production, algae_resistance, difficulty, co2_mandatory, light_requirement, 
          growth_speed_score, nutrient_consumption_score,
          preferred_ph, preferred_temperature, preferred_gh, carpeting, epiphyte, floating, aquascape_style,
          growth_height_cm, growth_width_cm, trimming_frequency_score, invasive_growth,
          root_feeder
        )
      `)
      .eq("aquarium_id", aquariumId)
      .order("added_at", { ascending: false });

    if (errFish || errPlant) throw new Error("Database error while fetching inventory.");

    return { success: true, fishes: fishes as TankFish[], plants: plants as TankPlant[] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown structural error" };
  }
}

export async function addPlantToTankAction(payload: z.infer<typeof plantSchema>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const validated = plantSchema.parse(payload);
    await verifyAquariumOwnership(supabase, validated.aquarium_id, user.id);
    const safeAddedAt = validated.added_at || new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from("aquarium_plants")
      .select("id, quantity")
      .eq("aquarium_id", validated.aquarium_id)
      .eq("plant_id", validated.plant_id)
      .eq("added_at", safeAddedAt) 
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("aquarium_plants").update({ quantity: existing.quantity + validated.quantity }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("aquarium_plants").insert([{ ...validated, added_at: safeAddedAt }]);
      if (error) throw new Error(error.message);
    }

    revalidatePath(`/dashboard/my-aquarium/${validated.aquarium_id}`);
    return { success: true };
  } catch (error: unknown) { 
    return { success: false, error: error instanceof Error ? error.message : "Process failed" }; 
  }
}

export async function addFishToTankAction(payload: z.infer<typeof fishSchema>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const validated = fishSchema.parse(payload);
    await verifyAquariumOwnership(supabase, validated.aquarium_id, user.id);
    const safeAddedAt = validated.added_at || new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from("aquarium_fishes")
      .select("id, quantity")
      .eq("aquarium_id", validated.aquarium_id)
      .eq("fish_id", validated.fish_id)
      .eq("size_category", validated.size_category)
      .eq("health_status", validated.health_status)
      .eq("added_at", safeAddedAt) 
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("aquarium_fishes").update({ quantity: existing.quantity + validated.quantity }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("aquarium_fishes").insert([{ ...validated, added_at: safeAddedAt }]);
      if (error) throw new Error(error.message);
    }

    revalidatePath(`/dashboard/my-aquarium/${validated.aquarium_id}`);
    return { success: true };
  } catch (error: unknown) { 
    return { success: false, error: error instanceof Error ? error.message : "Process failed" }; 
  }
}

export async function updateFishInventoryAction(id: string, aquariumId: string, updates: { quantity: number; health_status: string; size_category: string; added_at?: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { error } = await supabase.from("aquarium_fishes").update({ 
        quantity: updates.quantity, health_status: updates.health_status, size_category: updates.size_category, ...(updates.added_at ? { added_at: updates.added_at } : {})
      }).eq("id", id).eq("aquarium_id", aquariumId);

    if (error) throw new Error(error.message);
    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) { 
    return { success: false, error: error instanceof Error ? error.message : "Update failed" }; 
  }
}

export async function removeInventoryItemAction(table: "aquarium_fishes" | "aquarium_plants", id: string, aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { error } = await supabase.from(table).delete().eq("id", id).eq("aquarium_id", aquariumId);
    if (error) throw new Error(error.message);
    
    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) { 
    return { success: false, error: error instanceof Error ? error.message : "Deletion failed" }; 
  }
}