// features/aquariums/repositories/security.repository.ts
import { SupabaseClient } from "@supabase/supabase-js";

export async function verifyAquariumOwnership(supabase: SupabaseClient, aquariumId: string, userId: string): Promise<boolean> {
  // KUNCI MASTER: Cek apakah yang login adalah Super Admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const isSuperAdmin = profile?.role === 'super_admin';

  let query = supabase.from("my_aquariums").select("id").eq("id", aquariumId);
  
  // Jika BUKAN Super Admin, wajib cek kepemilikan
  if (!isSuperAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error("Unauthorized access to this aquarium ecosystem.");
  }
  return true;
}

export async function verifyTaskOwnership(supabase: SupabaseClient, taskId: string, userId: string): Promise<boolean> {
  // KUNCI MASTER: Cek apakah yang login adalah Super Admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const isSuperAdmin = profile?.role === 'super_admin';

  const { data: task, error: taskError } = await supabase.from("maintenance_tasks").select("aquarium_id").eq("id", taskId).maybeSingle();
  if (taskError || !task) throw new Error("Unauthorized access to this task.");

  let query = supabase.from("my_aquariums").select("id").eq("id", task.aquarium_id);
  
  // Jika BUKAN Super Admin, wajib cek kepemilikan
  if (!isSuperAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data: aquarium, error: aqError } = await query.maybeSingle();

  if (aqError || !aquarium) throw new Error("Unauthorized access to this task.");
  return true;
}