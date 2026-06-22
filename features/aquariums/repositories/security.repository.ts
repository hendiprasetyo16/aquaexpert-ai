// features/aquariums/repositories/security.repository.ts
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Validasi Mutlak: Memastikan akuarium yang diakses adalah milik user yang sah (Anti-IDOR)
 */
export async function verifyAquariumOwnership(supabase: SupabaseClient, aquariumId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("my_aquariums")
    .select("id")
    .eq("id", aquariumId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Unauthorized access to this aquarium ecosystem.");
  }
  return true;
}

/**
 * Validasi Silang: Memastikan tugas perawatan terikat pada akuarium milik user yang sah
 */
export async function verifyTaskOwnership(supabase: SupabaseClient, taskId: string, userId: string): Promise<boolean> {
  // Tahap 1: Ambil aquarium_id langsung dari tabel task secara terisolasi
  const { data: task, error: taskError } = await supabase
    .from("maintenance_tasks")
    .select("aquarium_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) {
    throw new Error("Unauthorized access to this task.");
  }

  // Tahap 2: Validasi silang apakah aquarium tersebut milik user yang sah
  const { data: aquarium, error: aqError } = await supabase
    .from("my_aquariums")
    .select("id")
    .eq("id", task.aquarium_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (aqError || !aquarium) {
    throw new Error("Unauthorized access to this task.");
  }

  return true;
}