// features/aquariums/actions/aquarium.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  getUserAquariums, 
  getAquariumById, 
  createAquarium, 
  updateAquarium, 
  deleteAquarium, 
  clearPrimaryAquarium 
} from "../repositories/aquarium.repository";
import { Aquarium, CreateAquariumInput, UpdateAquariumInput } from "../types/aquarium.types";

export async function getUserAquariumsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const data = await getUserAquariums(supabase, user.id);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAquariumByIdAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const data = await getAquariumById(supabase, id, user.id);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAquariumAction(payload: CreateAquariumInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (payload.is_primary) {
      await clearPrimaryAquarium(supabase, user.id);
    }

    // Hanya properti dari CreateAquariumInput yang akan masuk ke DB, mem-block user_id spoofing
    const data = await createAquarium(supabase, { ...payload, user_id: user.id });
    revalidatePath("/dashboard/my-aquarium");
    return { success: true, data };
  } catch (error: any) {
    // Tangkap error unique index database jika terjadi race condition
    if (error.code === '23505') { 
      return { success: false, error: "A primary aquarium already exists. Please refresh." };
    }
    return { success: false, error: error.message };
  }
}

export async function updateAquariumAction(id: string, payload: UpdateAquariumInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (payload.is_primary) {
      await clearPrimaryAquarium(supabase, user.id);
    }

    const data = await updateAquarium(supabase, id, user.id, payload);
    revalidatePath("/dashboard/my-aquarium");
    revalidatePath(`/dashboard/my-aquarium/${id}`);
    return { success: true, data };
  } catch (error: any) {
    if (error.code === '23505') { 
      return { success: false, error: "A primary aquarium already exists. Please refresh." };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteAquariumAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await deleteAquarium(supabase, id, user.id);
    revalidatePath("/dashboard/my-aquarium");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setPrimaryAquariumAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await clearPrimaryAquarium(supabase, user.id);
    const data = await updateAquarium(supabase, id, user.id, { is_primary: true });
    
    revalidatePath("/dashboard/my-aquarium");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}