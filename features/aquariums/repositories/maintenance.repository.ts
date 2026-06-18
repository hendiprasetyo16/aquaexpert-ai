// features/aquariums/repositories/maintenance.repository.ts
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { 
  MaintenanceTask, 
  AquariumMaintenanceLog, 
  CreateTaskPayload, 
  UpdateTaskPayload, 
  CreateLogPayload,
  TaskScheduleUpdate
} from "../types/maintenance.types";

// features/aquariums/repositories/maintenance.repository.ts

// ==========================================
// SECURITY LAYER: BULLETPROOF HARDENING (TWO-STEP LOOKUP)
// ==========================================
export async function verifyAquariumOwnership(supabase: SupabaseClient, aquariumId: string, userId: string) {
  const { data, error } = await supabase
    .from("my_aquariums")
    .select("id")
    .eq("id", aquariumId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw new Error("Unauthorized access to this aquarium ecosystem.");
  return true;
}

export async function verifyTaskOwnership(supabase: SupabaseClient, taskId: string, userId: string) {
  // Tahap 1: Ambil aquarium_id langsung dari tabel task secara terisolasi
  const { data: task, error: taskError } = await supabase
    .from("maintenance_tasks")
    .select("aquarium_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) {
    throw new Error("Unauthorized access to this task.");
  }

  // Tahap 2: Lakukan validasi silang apakah aquarium tersebut milik user yang sah
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

// ==========================================
// REPOSITORIES
// ==========================================
export async function getMaintenanceTasks(aquariumId: string): Promise<MaintenanceTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .select("*")
    .eq("aquarium_id", aquariumId)
    .order("next_due_at", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MaintenanceTask[]; 
}

export async function getUpcomingTasks(aquariumId: string): Promise<MaintenanceTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .select("*")
    .eq("aquarium_id", aquariumId)
    .eq("is_active", true)
    .order("next_due_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MaintenanceTask[];
}

export async function getMaintenanceTaskById(id: string): Promise<MaintenanceTask | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as MaintenanceTask) : null;
}

export async function createMaintenanceTask(payload: CreateTaskPayload): Promise<MaintenanceTask> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MaintenanceTask;
}

export async function updateMaintenanceTask(id: string, payload: UpdateTaskPayload): Promise<MaintenanceTask> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MaintenanceTask;
}

export async function updateTaskSchedule(id: string, payload: TaskScheduleUpdate): Promise<MaintenanceTask> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tasks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MaintenanceTask;
}

export async function deleteMaintenanceTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_tasks")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getMaintenanceLogs(aquariumId: string, limit: number = 50): Promise<AquariumMaintenanceLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aquarium_maintenance_logs")
    .select("*")
    .eq("aquarium_id", aquariumId)
    .order("performed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AquariumMaintenanceLog[];
}

export async function getMaintenanceLogById(id: string): Promise<AquariumMaintenanceLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aquarium_maintenance_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as AquariumMaintenanceLog) : null;
}

export async function getLatestLogByTaskId(taskId: string): Promise<AquariumMaintenanceLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("aquarium_maintenance_logs")
    .select("*")
    .eq("task_id", taskId)
    .order("performed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as AquariumMaintenanceLog) : null;
}

export async function createMaintenanceLog(payload: CreateLogPayload): Promise<AquariumMaintenanceLog> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const insertData = { ...payload, completed_by: user.id };
  const { data, error } = await supabase
    .from("aquarium_maintenance_logs")
    .insert([insertData])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AquariumMaintenanceLog;
}

export async function deleteMaintenanceLog(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("aquarium_maintenance_logs")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}