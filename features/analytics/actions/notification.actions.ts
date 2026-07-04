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
    
    const { error } = await supabase.from("system_activities").insert({
      title,
      message,
      category,
      created_by: createdBy
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Gagal mengirim notifikasi:", error);
    return { success: false };
  }
}