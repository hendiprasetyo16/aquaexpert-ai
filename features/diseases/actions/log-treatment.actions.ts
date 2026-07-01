// features/diseases/actions/log-treatment.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import type { LogTreatmentResponse, TreatmentStatus, ActionTaken } from "../types/treatment.types";

interface LogPayload {
  aquariumId: string;
  sessionId: string;
  remainingSymptomIds: string[];
  actionTaken: ActionTaken;
  medicationDose?: number;
  newFishLostCount?: number;
  notes?: string;
  lang?: "id" | "en";
}

export async function deleteTreatmentSessionAction(sessionId: string, aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi berakhir.");
    await verifyAquariumOwnership(supabase, aquariumId, user.id);
    
    const { error } = await supabase.from("treatment_sessions").delete().eq("id", sessionId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus sesi." };
  }
}

export async function logDailyTreatmentAction({
  aquariumId,
  sessionId,
  remainingSymptomIds,
  actionTaken,
  medicationDose = 0,
  newFishLostCount = 0,
  notes = "",
  lang = "id"
}: LogPayload): Promise<LogTreatmentResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, analytics: null, error: lang === "id" ? "Sesi berakhir." : "Session expired." };
    
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data: session } = await supabase.from("treatment_sessions").select("*").eq("id", sessionId).eq("aquarium_id", aquariumId).single();
    if (!session) throw new Error(lang === "id" ? "Sesi tidak ditemukan." : "Session not found.");

    const startDate = new Date(session.started_at);
    const today = new Date();
    const startMidnight = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const todayMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const dayNumber = Math.floor((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;

    const initialCount = session.initial_symptoms?.length || 1;
    const currentCount = remainingSymptomIds.length;
    let recoveryRate = 0;
    if (initialCount > 0) recoveryRate = ((initialCount - currentCount) / initialCount) * 100;
    recoveryRate = Math.max(0, Math.min(100, Math.round(recoveryRate)));

    let autoUpdateStatus: TreatmentStatus = "Active";
    let finalOutcomeReason = null;
    let recId = "Pengobatan dicatat. Terus pantau fauna.";
    let recEn = "Treatment logged. Keep monitoring.";

    if (actionTaken === "Medication Changed") {
      autoUpdateStatus = "Aborted";
      finalOutcomeReason = "Berhenti untuk ganti obat baru.";
      recId = "Sesi ditutup otomatis karena ganti obat. Silakan mulai sesi baru.";
    } else if (recoveryRate === 100 || currentCount === 0) {
      autoUpdateStatus = "Completed";
      finalOutcomeReason = "Sembuh Total";
      recId = "Kesembuhan 100%! Ikan ditandai Sembuh Total.";
    } else if (newFishLostCount > 0) {
      recId = "Ada kematian. Tolong cek ulang kecocokan obat.";
    }

    const logData = {
      session_id: sessionId,
      day_number: dayNumber,
      severity_score: currentCount,
      remaining_symptoms: remainingSymptomIds,
      action_taken: actionTaken,
      notes: notes,
      medication_dose: medicationDose,
      log_date: new Date().toISOString()
    };

    // PURE JAVASCRIPT LOGIC (Anti Error Database)
    // 1. Cek apakah hari ini sudah absen
    const { data: existingLog } = await supabase.from("treatment_logs").select("id").eq("session_id", sessionId).eq("day_number", dayNumber).maybeSingle();
    
    if (existingLog) {
      await supabase.from("treatment_logs").update(logData).eq("id", existingLog.id);
    } else {
      await supabase.from("treatment_logs").insert(logData);
    }

    // 2. Update status tangki
    await supabase.from("treatment_sessions").update({
      current_recovery_rate: recoveryRate,
      status: autoUpdateStatus,
      outcome_reason: finalOutcomeReason,
      fish_lost_count: Number(session.fish_lost_count || 0) + newFishLostCount,
      completed_at: autoUpdateStatus !== "Active" ? new Date().toISOString() : null
    }).eq("id", sessionId);

    // 3. Jika selesai, masukkan ke analitik
    if (autoUpdateStatus !== "Active") {
      await supabase.from("treatment_outcomes").upsert({
        session_id: sessionId,
        aquarium_id: aquariumId,
        disease_id: session.disease_id,
        medication_id: session.medication_id,
        recovery_days: dayNumber,
        recovery_rate: recoveryRate,
        fish_lost_count: Number(session.fish_lost_count || 0) + newFishLostCount,
        outcome_status: autoUpdateStatus,
        created_at: new Date().toISOString()
      }, { onConflict: 'session_id' });
    }

    return {
      success: true,
      analytics: { isImproving: true, recoveryPercentage: recoveryRate, aiRecommendationId: recId, aiRecommendationEn: recEn }
    };

  } catch (error: unknown) {
    return { success: false, analytics: null, error: error instanceof Error ? error.message : "Sistem Gagal." };
  }
}