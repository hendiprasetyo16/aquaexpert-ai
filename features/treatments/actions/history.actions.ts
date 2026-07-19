// features/treatments/actions/history.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTreatmentHistoryLogsAction(sessionId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("treatment_logs")
      .select("*")
      .eq("session_id", sessionId)
      .order("day_number", { ascending: false }); // Urutkan dari hari terbaru

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Gagal menarik riwayat log:", error);
    return { success: false, data: [] };
  }
}