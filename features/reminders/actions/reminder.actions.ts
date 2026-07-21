// features/reminders/actions/reminder.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export interface ReminderDto {
  id: string;
  user_id: string;
  aquarium_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  priority: "low" | "medium" | "high";
  created_at: string;
  aquarium?: {
    name: string;
  } | null;
}

// 1. Mengambil semua tugas pengguna, diurutkan dari yang belum selesai & paling mendesak
export async function getUserRemindersAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("user_reminders")
      .select(`
        *,
        aquarium:my_aquariums(name)
      `)
      .eq("user_id", user.id)
      .order("is_completed", { ascending: true }) // Yang belum selesai di atas
      .order("due_date", { ascending: true }); // Yang paling mendekati deadline di atas

    if (error) throw error;
    
    return { success: true, data: data as unknown as ReminderDto[] };
  } catch (error: unknown) {
    console.error("Error fetching reminders:", error);
    return { success: false, error: "Gagal memuat daftar tugas." };
  }
}

// 2. Menambahkan tugas baru
export async function addReminderAction(payload: {
  title: string;
  description?: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  aquariumId?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("user_reminders")
      .insert({
        user_id: user.id,
        title: payload.title,
        description: payload.description || null,
        due_date: payload.dueDate,
        priority: payload.priority,
        aquarium_id: payload.aquariumId || null
      });

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error("Error adding reminder:", error);
    return { success: false, error: "Gagal menambah tugas." };
  }
}

// 3. Mengubah status selesai/belum (Toggle Checkbox)
export async function toggleReminderStatusAction(id: string, isCompleted: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("user_reminders")
      .update({ 
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error("Error toggling reminder:", error);
    return { success: false, error: "Gagal memperbarui status tugas." };
  }
}

// 4. Menghapus tugas
export async function deleteReminderAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("user_reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting reminder:", error);
    return { success: false, error: "Gagal menghapus tugas." };
  }
}