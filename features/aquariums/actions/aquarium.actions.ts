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
  // REFAKTOR: Mengganti any menjadi unknown
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function getAquariumByIdAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const data = await getAquariumById(supabase, id, user.id);
    return { success: true, data };
  // REFAKTOR: Mengganti any menjadi unknown
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
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
  // REFAKTOR: Mengganti any menjadi unknown dan casting khusus untuk error Database
  } catch (error: unknown) {
    // Tangkap error unique index database jika terjadi race condition
    const dbError = error as { code?: string; message?: string };
    if (dbError?.code === '23505') { 
      return { success: false, error: "A primary aquarium already exists. Please refresh." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
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
  // REFAKTOR: Mengganti any menjadi unknown dan casting khusus untuk error Database
  } catch (error: unknown) {
    const dbError = error as { code?: string; message?: string };
    if (dbError?.code === '23505') { 
      return { success: false, error: "A primary aquarium already exists. Please refresh." };
    }
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
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
  // REFAKTOR: Mengganti any menjadi unknown
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
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
  // REFAKTOR: Mengganti any menjadi unknown
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}