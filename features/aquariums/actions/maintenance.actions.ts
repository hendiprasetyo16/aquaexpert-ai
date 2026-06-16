// features/aquariums/actions/maintenance.actions.ts
"use server";

import { z, ZodIssue } from "zod";
import { revalidatePath } from "next/cache";
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
  getLatestLogByTaskId // <-- getMaintenanceLogById sudah resmi dihapus dari sini
} from "../repositories/maintenance.repository";
import { MaintenanceDashboardStatus } from "../types/maintenance.types";

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

// ==========================================
// 2. TASK ACTIONS (MANAJEMEN JADWAL)
// ==========================================

export async function addTaskAction(payload: z.infer<typeof createTaskSchema>) {
  try {
    const validatedData = createTaskSchema.parse(payload);
    const nextDue = calculateNextDueDate(new Date(), validatedData.interval_days);

    await createMaintenanceTask({
      ...validatedData,
      next_due_at: nextDue.toISOString()
    });
    
    revalidatePath(`/dashboard/my-aquarium/${validatedData.aquarium_id}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

export async function editTaskAction(payload: z.infer<typeof updateTaskSchema>) {
  try {
    const validatedData = updateTaskSchema.parse(payload);
    const { id, ...updateData } = validatedData;
    
    if (!id) throw new Error("ID Tugas diperlukan.");

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
    
    const aquariumIdToRevalidate = validatedData.aquarium_id || existingTask.aquarium_id;
    revalidatePath(`/dashboard/my-aquarium/${aquariumIdToRevalidate}`);
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

export async function removeTaskAction(taskId: string, aquariumId: string) {
  try {
    await deleteMaintenanceTask(taskId);
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
    const validatedData = createLogSchema.parse(payload);
    const safePerformedAt = validatedData.performed_at || new Date().toISOString();
    
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

    revalidatePath(`/dashboard/my-aquarium/${validatedData.aquarium_id}`);
    return { success: true, data: newLog };
  } catch (error: unknown) {
    return { success: false, error: formatError(error) };
  }
}

export async function removeLogAction(logId: string, aquariumId: string, taskId?: string) {
  try {
    // 1. Eksekusi Hapus Log Terlebih Dahulu (Mengubah State Database)
    await deleteMaintenanceLog(logId);

    // 2. Post-Delete Absolute Sync: Cek kondisi mutakhir database jika log ini terikat jadwal
    if (taskId) {
      const task = await getMaintenanceTaskById(taskId);
      if (task) {
        // Tarik log apa pun yang SEKARANG menduduki posisi teratas setelah penghapusan
        const currentLatestLog = await getLatestLogByTaskId(taskId);
        
        let newLastCompletedAt: string | null = null;
        let newNextDueAt: string;

        if (currentLatestLog) {
          // Ada sisa riwayat, sinkronkan dengan riwayat tersebut
          const latestDate = new Date(currentLatestLog.performed_at);
          newLastCompletedAt = latestDate.toISOString();
          newNextDueAt = calculateNextDueDate(latestDate, task.interval_days).toISOString();
        } else {
          // Tidak ada riwayat tersisa, reset kembali ke titik nol (created_at)
          const createdDate = new Date(task.created_at);
          newNextDueAt = calculateNextDueDate(createdDate, task.interval_days).toISOString();
        }

        // PENCEGAH RACE CONDITION: 
        // Jika hasil kalkulasi berbeda dengan data yang ada di tabel Task saat ini, update!
        // Jika sama (misal karena User B menimpa di saat bersamaan), hemat koneksi DB.
        if (
            task.last_completed_at !== newLastCompletedAt ||
            task.next_due_at !== newNextDueAt
        ) {
            await updateTaskSchedule(task.id, {
            last_completed_at: newLastCompletedAt,
            next_due_at: newNextDueAt
        });
        }
      }
    }

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