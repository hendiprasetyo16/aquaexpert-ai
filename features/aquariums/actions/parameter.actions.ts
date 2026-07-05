// features/aquariums/actions/parameter.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

// 1. STRICT TYPING
export interface AquariumParameterLog {
  id: string;
  aquarium_id: string;
  record_date: string;
  temperature?: number | null;
  ph?: number | null;
  tds?: number | null;
  gh?: number | null;
  kh?: number | null;
  ammonia?: number | null;
  nitrite?: number | null;
  nitrate?: number | null;
  test_method?: string | null;
  parameter_source?: string | null;
  notes?: string | null;
  is_deleted: boolean;
  created_at: string;
}

// 2. ZOD SCHEMA
const parameterSchema = z.object({
  aquarium_id: z.string().uuid(),
  record_date: z.string(),
  temperature: z.number().nullable().optional(),
  ph: z.number().nullable().optional(),
  tds: z.number().nullable().optional(),
  gh: z.number().nullable().optional(),
  kh: z.number().nullable().optional(),
  ammonia: z.number().nullable().optional(),
  nitrite: z.number().nullable().optional(),
  nitrate: z.number().nullable().optional(),
  test_method: z.string().nullable().optional(),
  parameter_source: z.string().default("Manual"),
  notes: z.string().nullable().optional(),
});

// ==========================================
// SECURITY LAYER: VALIDASI KEPEMILIKAN
// ==========================================
async function verifyAquariumOwnership(supabase: SupabaseClient, aquariumId: string, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const isSuperAdmin = profile?.role === 'super_admin';

  let query = supabase.from("my_aquariums").select("id").eq("id", aquariumId);
  if (!isSuperAdmin) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) throw new Error("Unauthorized access to this aquarium ecosystem.");
  return true;
}

// 💡 HELPER BARU: Mengambil nama pengguna & nama akuarium untuk Notifikasi
async function getUserAndAquariumName(supabase: SupabaseClient, userId: string, aquariumId: string) {
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", aquariumId).single();
  return { 
    userName: profile?.full_name || "User", 
    aqName: aq?.name || "Akuarium" 
  };
}

export async function getParametersAction(aquariumId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data, error } = await supabase
      .from("aquarium_parameters")
      .select("*")
      .eq("aquarium_id", aquariumId)
      .eq("is_deleted", false)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, data: data as AquariumParameterLog[] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Process failed" };
  }
}

export async function addParameterAction(payload: z.infer<typeof parameterSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const validatedData = parameterSchema.parse(payload);
    await verifyAquariumOwnership(supabase, validatedData.aquarium_id, user.id);

    const { error } = await supabase.from("aquarium_parameters").insert([validatedData]);
    if (error) throw new Error(error.message);

    // 💡 KIRIM NOTIFIKASI
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, validatedData.aquarium_id);
    await pushNotificationAction(
      "Parameter Air Dicatat",
      `${userName} mencatat kualitas air baru di akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${payload.aquarium_id}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Process failed" };
  }
}

// 3. HARD DELETE (HAPUS PERMANEN)
export async function deleteParameterAction(id: string, aquariumId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    // Ambil tanggal catatan sebelum dihapus untuk detail notifikasi
    const { data: oldParam } = await supabase.from("aquarium_parameters").select("record_date").eq("id", id).single();

    const { data, error } = await supabase
      .from("aquarium_parameters")
      .delete() 
      .eq("id", id)
      .eq("aquarium_id", aquariumId) 
      .select();
    
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Akses ditolak atau data tidak ditemukan.");

    // 💡 KIRIM NOTIFIKASI
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    const dateStr = oldParam?.record_date ? new Date(oldParam.record_date).toLocaleDateString('id-ID') : 'lama';
    
    await pushNotificationAction(
      "Catatan Air Dihapus",
      `${userName} menghapus riwayat parameter air (tgl ${dateStr}) dari akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Process failed" };
  }
}