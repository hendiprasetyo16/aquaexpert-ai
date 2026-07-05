// features/aquariums/actions/maintenance.actions.ts
"use server";

import { z, ZodIssue } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { 
  createMaintenanceTask, 
  updateMaintenanceTask, 
  deleteMaintenanceTask, 
  createMaintenanceLog, 
  deleteMaintenanceLog,
  getMaintenanceTaskById,
  updateTaskSchedule,
  getUpcomingTasks,
  getMaintenanceLogs,
  getLatestLogByTaskId,
  verifyAquariumOwnership, 
  verifyTaskOwnership      
} from "../repositories/maintenance.repository";
import { MaintenanceDashboardStatus } from "../types/maintenance.types";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

// ==========================================
// 1. ZOD SCHEMAS & HELPERS
// ==========================================

const maintenanceTypeEnum = z.enum([
  'water_change', 'filter_cleaning', 'fertilizer', 
  'glass_cleaning', 'co2_refill', 'equipment_check', 'other'
]);

const createTaskSchema = z.object({
  aquarium_id: z.string().uuid(),
  task_type: maintenanceTypeEnum,
  title: z.string().min(1, "Judul tugas wajib diisi"), 
  interval_days: z.number().min(1, "Interval minimal 1 hari"),
  is_active: z.boolean().default(true),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid()
});

const createLogSchema = z.object({
  aquarium_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  maintenance_type: maintenanceTypeEnum,
  performed_at: z.string().nullable().optional(), 
  value: z.number().min(0, "Nilai tidak boleh negatif").nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function calculateNextDueDate(baseDate: Date, intervalDays: number): Date {
  const nextDue = new Date(baseDate);
  nextDue.setDate(nextDue.getDate() + intervalDays);
  return nextDue;
}

function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue: ZodIssue) => issue.message).join(", ");
  }
  return error instanceof Error ? error.message : "Unknown error";
}

function isSameDate(dateStr1: string | null | undefined, dateStr2: string | null | undefined): boolean {
  if (!dateStr1 && !dateStr2) return true;
  if (!dateStr1 || !dateStr2) return false;
  return new Date(dateStr1).getTime() === new Date(dateStr2).getTime();
}

// 💡 HELPER BARU: Mengambil nama pengguna & nama akuarium untuk Notifikasi
async function getUserAndAquariumName(supabase: any, userId: string, aquariumId: string) {
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", aquariumId).single();
  return { 
    userName: profile?.full_name || "User", 
    aqName: aq?.name || "Akuarium" 
  };
}

// ==========================================
// 2. TASK ACTIONS (MANAJEMEN JADWAL)
// ==========================================

export async function addTaskAction(payload: z.infer<typeof createTaskSchema>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const validatedData = createTaskSchema.parse(payload);
    await verifyAquariumOwnership(supabase, validatedData.aquarium_id, user.id);

    const nextDue = calculateNextDueDate(new Date(), validatedData.interval_days);

    await createMaintenanceTask({
      ...validatedData,
      next_due_at: nextDue.toISOString()
    });
    
    // 💡 KIRIM NOTIFIKASI
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, validatedData.aquarium_id);
    await pushNotificationAction(
      "Jadwal Perawatan Dibuat",
      `${userName} menjadwalkan tugas "${validatedData.title}" di akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${validatedData.aquarium_id}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

export async function editTaskAction(payload: z.infer<typeof updateTaskSchema>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const validatedData = updateTaskSchema.parse(payload);
    const { id, ...updateData } = validatedData;
    
    if (!id) throw new Error("ID Tugas diperlukan.");

    await verifyTaskOwnership(supabase, id, user.id);

    const existingTask = await getMaintenanceTaskById(id);
    if (!existingTask) throw new Error("Tugas tidak ditemukan.");

    let newNextDueAt: string | undefined = undefined;

    if (updateData.interval_days !== undefined && existingTask.interval_days !== updateData.interval_days) {
      const baseDate = existingTask.last_completed_at 
        ? new Date(existingTask.last_completed_at) 
        : new Date(existingTask.created_at);
      
      newNextDueAt = calculateNextDueDate(baseDate, updateData.interval_days).toISOString();
    }

    const payloadToUpdate = newNextDueAt 
      ? { ...updateData, next_due_at: newNextDueAt }
      : updateData;

    await updateMaintenanceTask(id, payloadToUpdate);
    
    // 💡 KIRIM NOTIFIKASI
    const aquariumIdToRevalidate = validatedData.aquarium_id || existingTask.aquarium_id;
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumIdToRevalidate);
    await pushNotificationAction(
      "Jadwal Perawatan Diperbarui",
      `${userName} mengubah jadwal tugas "${updateData.title || existingTask.title}" di akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${aquariumIdToRevalidate}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

export async function removeTaskAction(taskId: string, aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await verifyAquariumOwnership(supabase, aquariumId, user.id);
    await verifyTaskOwnership(supabase, taskId, user.id);

    // Ambil nama task sebelum dihapus
    const existingTask = await getMaintenanceTaskById(taskId);
    const taskName = existingTask?.title || "Tugas";

    await deleteMaintenanceTask(taskId);

    // 💡 KIRIM NOTIFIKASI
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    await pushNotificationAction(
      "Jadwal Perawatan Dihapus",
      `${userName} menghapus jadwal tugas "${taskName}" dari akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

// ==========================================
// 3. LOG ACTIONS (JANTUNG OPERASIONAL)
// ==========================================

export async function logMaintenanceAction(payload: z.infer<typeof createLogSchema>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const validatedData = createLogSchema.parse(payload);
    
    await verifyAquariumOwnership(supabase, validatedData.aquarium_id, user.id);
    
    if (validatedData.task_id) {
      await verifyTaskOwnership(supabase, validatedData.task_id, user.id);
    }

    const safePerformedAt = validatedData.performed_at ?? new Date().toISOString();
    
    const newLog = await createMaintenanceLog({
      aquarium_id: validatedData.aquarium_id,
      task_id: validatedData.task_id ?? null,
      maintenance_type: validatedData.maintenance_type,
      performed_at: safePerformedAt, 
      value: validatedData.value ?? null,
      unit: validatedData.unit ?? null,
      notes: validatedData.notes ?? null,
    });

    if (validatedData.task_id) {
      const task = await getMaintenanceTaskById(validatedData.task_id);
      
      if (task) {
        const performedDate = new Date(newLog.performed_at);
        const nextDue = calculateNextDueDate(performedDate, task.interval_days);

        await updateTaskSchedule(task.id, {
          last_completed_at: performedDate.toISOString(),
          next_due_at: nextDue.toISOString()
        });
      }
    }

    // 💡 KIRIM NOTIFIKASI
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, validatedData.aquarium_id);
    const activityName = validatedData.maintenance_type.replace('_', ' ');
    await pushNotificationAction(
      "Pekerjaan Diselesaikan",
      `${userName} mencatat aktivitas "${activityName}" di akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${validatedData.aquarium_id}`);
    return { success: true, data: newLog };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

export async function removeLogAction(logId: string, aquariumId: string, taskId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    if (taskId) {
      await verifyTaskOwnership(supabase, taskId, user.id);
    }

    await deleteMaintenanceLog(logId);

    if (taskId) {
      const task = await getMaintenanceTaskById(taskId);
      if (task) {
        const currentLatestLog = await getLatestLogByTaskId(taskId);
        
        let newLastCompletedAt: string | null = null;
        let newNextDueAt: string;

        if (currentLatestLog) {
          const latestDate = new Date(currentLatestLog.performed_at);
          newLastCompletedAt = latestDate.toISOString();
          newNextDueAt = calculateNextDueDate(latestDate, task.interval_days).toISOString();
        } else {
          const createdDate = new Date(task.created_at);
          newNextDueAt = calculateNextDueDate(createdDate, task.interval_days).toISOString();
        }

        if (!isSameDate(task.last_completed_at, newLastCompletedAt) || !isSameDate(task.next_due_at, newNextDueAt)) {
          await updateTaskSchedule(task.id, {
            last_completed_at: newLastCompletedAt,
            next_due_at: newNextDueAt
          });
        }
      }
    }

    // 💡 KIRIM NOTIFIKASI
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    await pushNotificationAction(
      "Riwayat Perawatan Dihapus",
      `${userName} menghapus salah satu riwayat pekerjaan dari akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

// ==========================================
// 4. FETCHING ACTIONS (UNTUK UI)
// ==========================================

export async function getMaintenanceDashboardAction(aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const [tasks, logs] = await Promise.all([
      getUpcomingTasks(aquariumId),
      getMaintenanceLogs(aquariumId, 20)
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dashboardStatus: MaintenanceDashboardStatus[] = tasks.map(task => {
      let isOverdue = false;
      let daysRemaining = 0;
      let urgencyLevel: "safe" | "warning" | "critical" = "safe";
      let lastMaintenanceDaysAgo: number | null = null;

      if (task.last_completed_at) {
        const lastDate = new Date(task.last_completed_at);
        const normalizedLast = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const diffLast = today.getTime() - normalizedLast.getTime();
        lastMaintenanceDaysAgo = Math.floor(diffLast / (1000 * 60 * 60 * 24));
      }

      if (task.next_due_at) {
        const dueDate = new Date(task.next_due_at);
        const normalizedDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        const diffTime = normalizedDue.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          isOverdue = true;
          urgencyLevel = daysRemaining <= -3 ? "critical" : "warning"; 
        } else if (daysRemaining <= 2) {
          urgencyLevel = "warning";
        }
      }

      return {
        task,
        isOverdue,
        daysRemaining,
        urgencyLevel,
        lastMaintenanceDaysAgo
      };
    });

    return { 
      success: true, 
      tasksStatus: dashboardStatus,
      recentLogs: logs 
    };
  } catch (error: unknown) {
    return { 
      success: false, 
      error: formatError(error),
      tasksStatus: [],
      recentLogs: []
    };
  }
}