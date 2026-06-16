// features/aquariums/repositories/maintenance.repository.ts
import { createClient } from "@/lib/supabase/server";
import { 
  MaintenanceTask, 
  AquariumMaintenanceLog, 
  CreateTaskPayload, 
  UpdateTaskPayload, 
  CreateLogPayload,
  TaskScheduleUpdate
} from "../types/maintenance.types";

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