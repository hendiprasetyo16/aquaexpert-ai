// features/aquariums/types/maintenance.types.ts

export type MaintenanceType = 
  | "water_change" 
  | "filter_cleaning" 
  | "fertilizer" 
  | "glass_cleaning" 
  | "co2_refill" 
  | "equipment_check"
  | "other";

export interface MaintenanceTask {
  id: string;
  aquarium_id: string;
  task_type: MaintenanceType;
  title: string;
  interval_days: number;
  is_active: boolean;
  last_completed_at: string | null;
  next_due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AquariumMaintenanceLog {
  id: string;
  aquarium_id: string;
  task_id: string | null;
  maintenance_type: MaintenanceType;
  performed_at: string;
  value: number | null;
  unit: string | null;
  notes: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  aquarium_id: string;
  task_type: MaintenanceType;
  title: string;
  interval_days: number;
  is_active?: boolean;
  next_due_at?: string | null;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface CreateLogPayload {
  aquarium_id: string;
  task_id?: string | null;
  maintenance_type: MaintenanceType;
  performed_at?: string;
  value?: number | null;
  unit?: string | null;
  notes?: string | null;
}

// FIX: last_completed_at mendukung tipe null secara aman sesuai arsitektur Actions
export interface TaskScheduleUpdate {
  last_completed_at: string | null; 
  next_due_at: string;
}

export interface MaintenanceDashboardStatus {
  task: MaintenanceTask;
  isOverdue: boolean;
  daysRemaining: number;
  urgencyLevel: "safe" | "warning" | "critical"; 
  lastMaintenanceDaysAgo: number | null;
}