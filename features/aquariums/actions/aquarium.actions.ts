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

// FITUR KHUSUS SUPERADMIN: Mengambil semua akuarium beserta info pemiliknya secara manual
export async function getAdminAllAquariumsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Ambil data akuarium murni (Tanpa JOIN yang bikin error)
    const { data: aquariums, error: aqError } = await supabase
      .from("my_aquariums")
      .select("*")
      .order("created_at", { ascending: false });

    if (aqError) throw new Error(aqError.message);
    if (!aquariums || aquariums.length === 0) return { success: true, data: [] };

    // 2. Kumpulkan semua user_id yang unik dari akuarium-akuarium tersebut
    const userIds = [...new Set(aquariums.map(aq => aq.user_id))];

    // 3. Tarik data profil hanya untuk user_id yang ada di daftar akuarium
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, last_login_at")
      .in("id", userIds);

    if (profileError) {
      console.warn("Gagal menarik data profil owner:", profileError.message);
    }

    // 4. Jodohkan (Stitch) data akuarium dengan data profilnya secara manual di server
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

// FUNGSI BARU UNTUK ADMIN: Hapus akuarium tanpa mengecek user_id pemilik
export async function adminDeleteAquariumAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("my_aquariums").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/admin-panel/aquariums");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus akuarium" };
  }
}

// FUNGSI BARU UNTUK ADMIN: Toggle arsip tanpa mengecek user_id pemilik
export async function adminToggleArchiveAquariumAction(id: string, currentStatus: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("my_aquariums").update({ is_active: !currentStatus }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/admin-panel/aquariums");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal merubah status" };
  }
}