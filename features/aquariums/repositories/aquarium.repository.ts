// features/aquariums/repositories/aquarium.repository.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Aquarium } from "../types/aquarium.types";

export async function getUserAquariums(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("my_aquariums")
    .select(`
      *,
      aquarium_plants(id),
      aquarium_fishes(id)
    `)
    .eq("user_id", userId)
    .order("is_primary", { ascending: false }) 
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Aquarium[];
}

export async function getAquariumById(supabase: SupabaseClient, id: string, userId: string) {
  const { data, error } = await supabase
    .from("my_aquariums")
    .select(`
      *,
      aquarium_plants(id),
      aquarium_fishes(id)
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Aquarium;
}

export async function createAquarium(supabase: SupabaseClient, payload: Partial<Aquarium>) {
  const { data, error } = await supabase
    .from("my_aquariums")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data as Aquarium;
}

export async function updateAquarium(supabase: SupabaseClient, id: string, userId: string, payload: Partial<Aquarium>) {
  const { data, error } = await supabase
    .from("my_aquariums")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId) 
    .select()
    .single();

  if (error) throw error;
  return data as Aquarium;
}

export async function deleteAquarium(supabase: SupabaseClient, id: string, userId: string) {
  const { error } = await supabase
    .from("my_aquariums")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}

export async function clearPrimaryAquarium(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("my_aquariums")
    .update({ is_primary: false })
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}