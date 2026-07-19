// features/analytics/actions/notification.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function pushNotificationAction(
  title: string, 
  message: string, 
  category: "data_crud" | "user_activity" | "system" | "alert" = "system",
  createdBy: string = "AquaExpert AI"
) {
  try {
    const supabase = await createClient();
    
    // 💡 FITUR BARU: Ambil data user yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("system_activities").insert({
      title,
      message,
      category,
      created_by: createdBy,
      user_id: user?.id || null // 💡 FITUR BARU: Simpan ID kepemilikan
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Gagal mengirim notifikasi:", error);
    return { success: false };
  }
}