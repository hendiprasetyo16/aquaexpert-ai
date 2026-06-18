// features/aquariums/actions/aquarium.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  getUserAquariums, 
  createAquarium, 
  updateAquarium, 
  deleteAquarium, 
  clearPrimaryAquarium 
} from "../repositories/aquarium.repository";
import { createMaintenanceTask } from "../repositories/maintenance.repository";
import { Aquarium, CreateAquariumInput, UpdateAquariumInput } from "../types/aquarium.types";

export async function getUserAquariumsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const data = await getUserAquariums(supabase, user.id);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

export async function getAquariumByIdAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("my_aquariums")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id) // SECURITY FIX 1: Mencegah akses ke tank orang lain
      .single();

    if (error) throw new Error(error.message);
    return { success: true, data };
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

    const data = await createAquarium(supabase, { ...payload, user_id: user.id });

    // AUTO-GENERATE MAINTENANCE TASKS
    const now = new Date();
    
    if (payload.water_change_interval_days && payload.water_change_interval_days > 0) {
      const nextDue = new Date(now);
      nextDue.setDate(nextDue.getDate() + payload.water_change_interval_days);
      const wcPercent = payload.water_change_percent ? ` ${payload.water_change_percent}%` : "";
      await createMaintenanceTask({
        aquarium_id: data.id,
        task_type: "water_change",
        title: `Ganti Air${wcPercent}`,
        interval_days: payload.water_change_interval_days,
        is_active: true,
        next_due_at: nextDue.toISOString()
      }).catch(err => console.error("Gagal auto-generate WC task:", err));
    }

    if (payload.fertilizer_type && payload.fertilizer_type !== "None") {
      let fertInterval = 7;
      if (payload.fertilizer_type.includes("Daily") || payload.fertilizer_type === "Estimative Index (EI)" || payload.fertilizer_type === "PPS-Pro") {
        fertInterval = 1;
      }
      const nextDueFert = new Date(now);
      nextDueFert.setDate(nextDueFert.getDate() + fertInterval);
      await createMaintenanceTask({
        aquarium_id: data.id,
        task_type: "fertilizer",
        title: `Pemupukan (${payload.fertilizer_type})`,
        interval_days: fertInterval,
        is_active: true,
        next_due_at: nextDueFert.toISOString()
      }).catch(err => console.error("Gagal auto-generate Fert task:", err));
    }

    revalidatePath("/dashboard/my-aquarium");
    return { success: true, data };
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

// =========================================================================
// FITUR KHUSUS SUPERADMIN
// =========================================================================

export async function getAdminAllAquariumsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') throw new Error("Forbidden: Super Admin only");

    const { data: aquariums, error: aqError } = await supabase
      .from("my_aquariums")
      .select("*, aquarium_fishes(id), aquarium_plants(id)")
      .order("created_at", { ascending: false });

    if (aqError) throw new Error(aqError.message);
    if (!aquariums || aquariums.length === 0) return { success: true, data: [] };

    const userIds = [...new Set(aquariums.map(aq => aq.user_id))];

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, last_login_at")
      .in("id", userIds);

    if (profileError) console.warn("Gagal menarik data profil owner:", profileError.message);

    const enrichedData = aquariums.map(aq => {
      const ownerProfile = profiles?.find(p => p.id === aq.user_id);
      return {
        ...aq,
        owner: ownerProfile ? {
          id: ownerProfile.id,
          email: ownerProfile.email,
          full_name: ownerProfile.full_name,
          last_login_at: ownerProfile.last_login_at
        } : undefined
      };
    });

    return { success: true, data: enrichedData };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal mengambil data seluruh akuarium." };
  }
}

export async function adminDeleteAquariumAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // SECURITY FIX 2: Validasi mutlak Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') throw new Error("Forbidden: Super Admin only");

    const { error } = await supabase.from("my_aquariums").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/admin-panel/aquariums");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus akuarium" };
  }
}

export async function adminToggleArchiveAquariumAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // SECURITY FIX 3: Validasi mutlak Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') throw new Error("Forbidden: Super Admin only");

    const { error } = await supabase.from("my_aquariums").update({ is_active: !currentStatus }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/admin-panel/aquariums");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal merubah status" };
  }
}