// features/aquariums/actions/parameter.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// 1. STRICT TYPING (Tanpa Any)
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

// 2. ZOD SCHEMA (Mencakup ide milik Bapak)
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

export async function getParametersAction(aquariumId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("aquarium_parameters")
    .select("*")
    .eq("aquarium_id", aquariumId)
    .eq("is_deleted", false)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as AquariumParameterLog[] };
}

export async function addParameterAction(payload: z.infer<typeof parameterSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const validatedData = parameterSchema.parse(payload);
    const { error } = await supabase.from("aquarium_parameters").insert([validatedData]);
    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/my-aquarium/${payload.aquarium_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// SOFT DELETE
export async function softDeleteParameterAction(id: string, aquariumId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("aquarium_parameters")
    .update({ is_deleted: true }) 
    .eq("id", id);
  
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
  return { success: true };
}