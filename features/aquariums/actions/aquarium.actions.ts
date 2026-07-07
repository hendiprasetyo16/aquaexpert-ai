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
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; 
import { SupabaseClient } from "@supabase/supabase-js";

function extractStoragePath(url: string | null | undefined) {
  if (!url) return null;
  try {
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/aquariums/');
    if (parts.length > 1) {
      return parts[1].split('?')[0].split('#')[0]; 
    }
    return null;
  } catch {
    return null;
  }
}

// 💡 FIX 1: Membunuh 'any' dan menggunakan SupabaseClient resmi
async function getProfileName(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  return data?.full_name || "Unknown User";
}

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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    let query = supabase.from("my_aquariums").select("*").eq("id", id);
    if (!isSuperAdmin) {
       query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.single();

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

    // 💡 FIX 1: Menggunakan tanggal Setup sebagai pijakan awal jadwal (bukan waktu real-time)
    const baseDate = payload.setup_date ? new Date(payload.setup_date) : new Date();

    if (payload.water_change_interval_days && payload.water_change_interval_days > 0) {
      const nextDue = new Date(baseDate);
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
      const nextDueFert = new Date(baseDate);
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

    const ownerName = await getProfileName(supabase, user.id);
    await pushNotificationAction(
      "Akuarium Baru Dibuat",
      `${ownerName} telah membuat akuarium baru bernama "${payload.name}".`,
      "user_activity",
      ownerName
    );

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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    const { data: oldAq } = await supabase.from("my_aquariums").select("name, image_url, user_id").eq("id", id).single();

    if (payload.is_primary) {
      await clearPrimaryAquarium(supabase, user.id);
    }

    let targetUserId = user.id;
    if (isSuperAdmin && oldAq) {
       targetUserId = oldAq.user_id;
    }

    if (oldAq?.image_url && payload.image_url && oldAq.image_url !== payload.image_url) {
      const oldPath = extractStoragePath(oldAq.image_url);
      if (oldPath) {
        await supabase.storage.from('aquariums').remove([oldPath]);
      }
    }

    const data = await updateAquarium(supabase, id, targetUserId, payload);

    if (!isSuperAdmin) {
      const ownerName = await getProfileName(supabase, user.id);
      await pushNotificationAction(
        "Akuarium Diperbarui",
        `${ownerName} memperbarui pengaturan akuarium "${payload.name || oldAq?.name || 'Tangki'}".`,
        "user_activity",
        ownerName
      );
    }

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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    const { data: oldAq } = await supabase.from("my_aquariums").select("name, image_url, user_id").eq("id", id).single();
    const aqName = oldAq?.name || "Tanpa Nama";

    let targetUserId = user.id;
    if (isSuperAdmin && oldAq) {
       targetUserId = oldAq.user_id;
    }

    if (oldAq?.image_url) {
      const oldPath = extractStoragePath(oldAq.image_url);
      if (oldPath) {
        await supabase.storage.from('aquariums').remove([oldPath]);
      }
    }

    await deleteAquarium(supabase, id, targetUserId);

    if (!isSuperAdmin) {
      const ownerName = await getProfileName(supabase, user.id);
      await pushNotificationAction(
        "Akuarium Dihapus",
        `${ownerName} telah menghapus akuarium "${aqName}" miliknya.`,
        "user_activity",
        ownerName
      );
    }

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

    const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", id).single();

    await clearPrimaryAquarium(supabase, user.id);
    const data = await updateAquarium(supabase, id, user.id, { is_primary: true });
    
    const ownerName = await getProfileName(supabase, user.id);
    await pushNotificationAction(
      "Status Utama Diubah",
      `${ownerName} menetapkan "${aq?.name || 'Akuarium'}" sebagai akuarium utama.`,
      "user_activity",
      ownerName
    );

    revalidatePath("/dashboard/my-aquarium");
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }
}

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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') throw new Error("Forbidden: Super Admin only");

    const { data: oldAq } = await supabase.from("my_aquariums").select("name, image_url, user_id").eq("id", id).single();
    const aqName = oldAq?.name || "Tanpa Nama";

    if (oldAq?.image_url) {
      const oldPath = extractStoragePath(oldAq.image_url);
      if (oldPath) {
        await supabase.storage.from('aquariums').remove([oldPath]);
      }
    }

    const { error } = await supabase.from("my_aquariums").delete().eq("id", id);
    if (error) throw new Error(error.message);

    const adminName = await getProfileName(supabase, user.id);
    await pushNotificationAction(
      "Penghapusan Paksa (Admin)",
      `${adminName} telah menghapus paksa akuarium "${aqName}" milik pengguna lain.`,
      "data_crud", 
      adminName
    );

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

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') throw new Error("Forbidden: Super Admin only");

    const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", id).single();

    const { error } = await supabase.from("my_aquariums").update({ is_active: !currentStatus }).eq("id", id);
    if (error) throw new Error(error.message);

    const adminName = await getProfileName(supabase, user.id);
    await pushNotificationAction(
      currentStatus ? "Akuarium Dinonaktifkan" : "Akuarium Diaktifkan",
      `${adminName} mengubah status akuarium "${aq?.name || 'Akuarium'}".`,
      "data_crud", 
      adminName
    );

    revalidatePath("/dashboard/admin-panel/aquariums");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal merubah status" };
  }
}