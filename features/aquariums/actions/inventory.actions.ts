// features/aquariums/actions/inventory.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TankPlant, TankFish } from "../types/inventory.types";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; 

const plantSchema = z.object({
  aquarium_id: z.string().uuid(),
  plant_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
  status: z.string().default("Healthy"), // 💡 FIX 1: Menambahkan properti status pada Zod
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
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const isSuperAdmin = profile?.role === 'super_admin';

  let query = supabase.from("my_aquariums").select("id").eq("id", aquariumId);
  if (!isSuperAdmin) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) throw new Error("Unauthorized access to this aquarium ecosystem.");
  return true;
}

async function getUserAndAquariumName(supabase: SupabaseClient, userId: string, aquariumId: string) {
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", aquariumId).single();
  return { 
    userName: profile?.full_name || "User", 
    aqName: aq?.name || "Akuarium" 
  };
}

export async function getTankInventoryAction(aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data: fishes, error: errFish } = await supabase.from("aquarium_fishes").select(`*, fish:fishes(*)`).eq("aquarium_id", aquariumId).order("added_at", { ascending: false });
    const { data: plants, error: errPlant } = await supabase.from("aquarium_plants").select(`*, plant:plants(*)`).eq("aquarium_id", aquariumId).order("added_at", { ascending: false });

    if (errFish) console.error("Supabase Fish Error:", errFish);
    if (errPlant) console.error("Supabase Plant Error:", errPlant);

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

    const { data: plantMaster } = await supabase.from("plants").select("name_id").eq("id", validated.plant_id).single();

    // 💡 FIX 2: Memasukkan validasi status agar query maybeSingle() tidak crash akibat hasil ganda
    const { data: existing } = await supabase.from("aquarium_plants")
      .select("id, quantity")
      .eq("aquarium_id", validated.aquarium_id)
      .eq("plant_id", validated.plant_id)
      .eq("status", validated.status) 
      .eq("added_at", safeAddedAt)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("aquarium_plants").update({ quantity: existing.quantity + validated.quantity }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("aquarium_plants").insert([{ ...validated, added_at: safeAddedAt }]);
      if (error) throw new Error(error.message);
    }

    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, validated.aquarium_id);
    await pushNotificationAction(
      "Tanaman Ditambahkan",
      `${userName} menambahkan ${validated.quantity} bibit "${plantMaster?.name_id || 'Tanaman'}" ke akuarium "${aqName}".`,
      "user_activity",
      userName
    );

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

    const { data: fishMaster } = await supabase.from("fishes").select("name_id").eq("id", validated.fish_id).single();

    const { data: existing } = await supabase.from("aquarium_fishes")
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

    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, validated.aquarium_id);
    await pushNotificationAction(
      "Fauna Ditambahkan",
      `${userName} menambahkan ${validated.quantity} ekor "${fishMaster?.name_id || 'Ikan'}" ke akuarium "${aqName}".`,
      "user_activity",
      userName
    );

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

    const { data: fishRef } = await supabase.from("aquarium_fishes").select("fishes(name_id)").eq("id", id).single();

    const { error } = await supabase.from("aquarium_fishes").update({ 
        quantity: updates.quantity, health_status: updates.health_status, size_category: updates.size_category, ...(updates.added_at ? { added_at: updates.added_at } : {})
      }).eq("id", id).eq("aquarium_id", aquariumId);

    if (error) {
      if (error.code === '23505') { 
         throw new Error("Kategori ukuran dan status kesehatan ini sudah ada di tanggal yang sama. Silakan hapus salah satu atau edit data yang sudah ada.");
      }
      throw new Error(error.message);
    }

    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    
    // 💡 FIX 2: Membunuh 'any' dengan Type Assertion yang ketat
    type JoinedFish = { name_id: string } | null;
    const fishName = (fishRef?.fishes as unknown as JoinedFish)?.name_id || 'Ikan';
    
    await pushNotificationAction(
      "Status Fauna Diubah",
      `${userName} memperbarui status "${fishName}" (Qty: ${updates.quantity}, Status: ${updates.health_status}) di "${aqName}".`,
      "user_activity",
      userName
    );

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

    let itemName = "Item";
    // 💡 FIX: Membunuh `any` dengan tipe objek terstruktur di kedua cabang if-else
    if (table === "aquarium_fishes") {
      const { data } = await supabase.from(table).select("fishes(name_id)").eq("id", id).single();
      type JoinedFish = { name_id: string } | null;
      itemName = (data?.fishes as unknown as JoinedFish)?.name_id || "Ikan";
    } else {
      const { data } = await supabase.from(table).select("plants(name_id)").eq("id", id).single();
      type JoinedPlant = { name_id: string } | null;
      itemName = (data?.plants as unknown as JoinedPlant)?.name_id || "Tanaman";
    }

    const { error } = await supabase.from(table).delete().eq("id", id).eq("aquarium_id", aquariumId);
    if (error) throw new Error(error.message);
    
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    await pushNotificationAction(
      table === "aquarium_fishes" ? "Fauna Dihapus" : "Flora Dihapus",
      `${userName} menghapus "${itemName}" dari akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) { 
    return { success: false, error: error instanceof Error ? error.message : "Deletion failed" }; 
  }
}