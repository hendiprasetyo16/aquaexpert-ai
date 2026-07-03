// features/aquariums/actions/parameter.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

export async function getParametersAction(aquariumId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // SECURITY FIX: Cegah IDOR dengan validasi kepemilikan mutlak
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
    // ZERO ANY POLICY APPLIED
    return { success: false, error: error instanceof Error ? error.message : "Process failed" };
  }
}

export async function addParameterAction(payload: z.infer<typeof parameterSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const validatedData = parameterSchema.parse(payload);
    
    // SECURITY FIX: Cegah Inject Parameter ke Tank Orang Lain
    await verifyAquariumOwnership(supabase, validatedData.aquarium_id, user.id);

    const { error } = await supabase.from("aquarium_parameters").insert([validatedData]);
    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/my-aquarium/${payload.aquarium_id}`);
    return { success: true };
  } catch (error: unknown) {
    // ZERO ANY POLICY APPLIED
    return { success: false, error: error instanceof Error ? error.message : "Process failed" };
  }
}

// 3. HARD DELETE (HAPUS PERMANEN)
export async function deleteParameterAction(id: string, aquariumId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // SECURITY FIX: Cegah Hapus Parameter Orang Lain
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data, error } = await supabase
      .from("aquarium_parameters")
      .delete() 
      .eq("id", id)
      .eq("aquarium_id", aquariumId) // Double Check
      .select();
    
    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      throw new Error("Akses ditolak atau data tidak ditemukan.");
    }

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) {
    // ZERO ANY POLICY APPLIED
    return { success: false, error: error instanceof Error ? error.message : "Process failed" };
  }
}