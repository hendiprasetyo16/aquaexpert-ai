// features/treatments/actions/log-treatment.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import type { LogTreatmentResponse, TreatmentStatus, ActionTaken } from "../types/treatment.types";
import { revalidatePath } from "next/cache";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; 

interface LogPayload {
  aquariumId: string;
  sessionId: string;
  remainingSymptomIds: string[];
  actionTaken: ActionTaken | string;
  medicationDose?: number;
  newFishLostCount?: number;
  notes?: string;
  lang?: "id" | "en";
}

async function getUserAndAquariumName(supabase: any, userId: string, aquariumId: string) {
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", aquariumId).single();
  return { 
    userName: profile?.full_name || "User", 
    aqName: aq?.name || "Akuarium" 
  };
}

export async function deleteTreatmentSessionAction(sessionId: string, aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi berakhir.");
    await verifyAquariumOwnership(supabase, aquariumId, user.id);
    
    const { data: sessionData } = await supabase.from("treatment_sessions").select("disease_id, medication_id, status").eq("id", sessionId).single();
    const { data: disease } = await supabase.from("diseases").select("name_id").eq("id", sessionData?.disease_id).single();

    const { error } = await supabase.from("treatment_sessions").delete().eq("id", sessionId);
    if (error) throw new Error(error.message);

    if (sessionData && ["Completed", "Failed", "Aborted"].includes(sessionData.status)) {
      const { data: statData } = await supabase.from("medication_efficacy_stats").select("*").eq("disease_id", sessionData.disease_id).eq("medication_id", sessionData.medication_id).single();

      if (statData) {
        const newTotalCases = Math.max(0, statData.total_cases - 1);
        let newSuccessCases = statData.success_cases || 0;
        let newFailedCases = statData.failed_cases || 0;
        let newAbortedCases = statData.aborted_cases || 0;

        if (sessionData.status === "Completed") newSuccessCases = Math.max(0, newSuccessCases - 1);
        if (sessionData.status === "Failed") newFailedCases = Math.max(0, newFailedCases - 1);
        if (sessionData.status === "Aborted") newAbortedCases = Math.max(0, newAbortedCases - 1);

        const newSuccessRate = newTotalCases > 0 ? Number(((newSuccessCases / newTotalCases) * 100).toFixed(2)) : 0;
        const newMortalityRate = newTotalCases > 0 ? Number(((newFailedCases / newTotalCases) * 100).toFixed(2)) : 0;

        await supabase.from("medication_efficacy_stats").update({
            total_cases: newTotalCases, success_cases: newSuccessCases, failed_cases: newFailedCases, aborted_cases: newAbortedCases, success_rate_pct: newSuccessRate, mortality_rate_pct: newMortalityRate
          }).eq("disease_id", sessionData.disease_id).eq("medication_id", sessionData.medication_id);
      }
    }

    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    await pushNotificationAction(
      "Sesi Pengobatan Dihapus",
      `${userName} menghapus riwayat sesi pengobatan "${disease?.name_id || 'Penyakit'}" di akuarium "${aqName}".`,
      "user_activity",
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    revalidatePath(`/dashboard/treatments`);
    revalidatePath(`/dashboard/analytics`); 
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus sesi." };
  }
}

export async function logDailyTreatmentAction({
  aquariumId, sessionId, remainingSymptomIds, actionTaken, medicationDose = 0, newFishLostCount = 0, notes = "", lang = "id"
}: LogPayload): Promise<LogTreatmentResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, analytics: null, error: lang === "id" ? "Sesi berakhir." : "Session expired." };
    
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data: session } = await supabase.from("treatment_sessions").select("*").eq("id", sessionId).eq("aquarium_id", aquariumId).single();
    if (!session) throw new Error(lang === "id" ? "Sesi tidak ditemukan." : "Session not found.");

    const { data: diseaseInfo } = await supabase.from("diseases").select("name_id").eq("id", session.disease_id).single();
    const dName = diseaseInfo?.name_id || 'Penyakit';

    const startDate = new Date(session.started_at);
    const today = new Date();
    
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = Math.abs(todayMidnight.getTime() - startMidnight.getTime());
    const dayNumber = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; 

    const initialCount = session.initial_symptoms?.length || 1;
    const currentCount = remainingSymptomIds.length;
    let recoveryRate = 0;
    if (initialCount > 0) recoveryRate = ((initialCount - currentCount) / initialCount) * 100;
    recoveryRate = Math.max(0, Math.min(100, Math.round(recoveryRate)));

    let autoUpdateStatus: TreatmentStatus = "Active";
    let finalOutcomeReason = null;
    let recId = "Pengobatan dicatat. Terus pantau fauna.";
    let recEn = "Treatment logged. Keep monitoring.";

    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, aquariumId);
    let notifTitle = `Catat Medis (Hari ${dayNumber})`;
    let notifMessage = `${userName} mencatat perkembangan "${dName}" di akuarium "${aqName}". Aksi: ${actionTaken}.`;
    let notifCategory: "user_activity" | "alert" | "system" = "user_activity";

    if (actionTaken === "Medication Changed") {
      autoUpdateStatus = "Aborted";
      finalOutcomeReason = "Berhenti untuk ganti obat baru.";
      recId = "Sesi ditutup otomatis karena ganti obat. Silakan mulai sesi baru.";
      notifTitle = "Pengobatan Dibatalkan/Ganti Obat";
      notifMessage = `${userName} membatalkan/mengganti obat untuk "${dName}" di akuarium "${aqName}".`;
      notifCategory = "alert";
    } else if (recoveryRate === 100 || currentCount === 0) {
      autoUpdateStatus = "Completed";
      finalOutcomeReason = "Sembuh Total";
      recId = "Kesembuhan 100%! Ikan ditandai Sembuh Total.";
      notifTitle = "Pengobatan Berhasil Selesai 🎉";
      notifMessage = `Luar Biasa! ${userName} berhasil menyembuhkan "${dName}" di akuarium "${aqName}".`;
      notifCategory = "system"; 
    } else if (newFishLostCount > 0) {
      recId = "Ada kematian. Tolong cek ulang kecocokan obat.";
      notifTitle = "Peringatan: Ada Korban Jiwa";
      notifMessage = `${userName} mencatat ada kematian selama pengobatan "${dName}" di akuarium "${aqName}".`;
      notifCategory = "alert";
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
    
    const { data: existingLog } = await supabase.from("treatment_logs").select("id, notes, action_taken").eq("session_id", sessionId).eq("day_number", dayNumber).maybeSingle();
    
    if (existingLog) {
      // 💡 FIX 2: Catatan Terbaru Ditampilkan Paling Atas
      let finalNotes = existingLog.notes || "";
      if (notes && notes.trim() !== "") {
        finalNotes = existingLog.notes ? `[Update]: ${notes} \n${existingLog.notes}` : notes;
      }
      
      const { error } = await supabase.from("treatment_logs").update({
        ...logData,
        notes: finalNotes 
      }).eq("id", existingLog.id);
      
      if (error) throw error;
      
      notifTitle = `Update Catatan Medis (Hari ${dayNumber})`;
      notifMessage = `${userName} merevisi catatan medis "${dName}" hari ini menjadi: ${actionTaken}.`;
      
    } else {
      const { error } = await supabase.from("treatment_logs").insert(logData);
      if (error) throw error;
    }

    const { error: updateError } = await supabase.from("treatment_sessions")
    .update({
        current_recovery_rate: recoveryRate,
        status: autoUpdateStatus,
        outcome_reason: finalOutcomeReason,
        fish_lost_count: Number(session.fish_lost_count || 0) + newFishLostCount,
        completed_at: autoUpdateStatus !== "Active" ? new Date().toISOString() : null
    }).eq("id",sessionId);

    if(updateError) return { success:false, analytics:null, error:updateError.message };

    if (autoUpdateStatus !== "Active") {
      const { error: outcomeError } = await supabase.from("treatment_outcomes")
      .upsert({
          session_id:sessionId,
          aquarium_id:aquariumId,
          disease_id:session.disease_id,
          medication_id:session.medication_id,
          recovery_days:dayNumber,
          recovery_rate:recoveryRate,
          fish_lost_count: Number(session.fish_lost_count||0) + newFishLostCount,
          outcome_status:autoUpdateStatus,
          created_at:new Date().toISOString()
      },{ onConflict:"session_id" });

      if(outcomeError) return { success:false, analytics:null, error:outcomeError.message };
    }

    await pushNotificationAction(notifTitle, notifMessage, notifCategory, userName);

    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    return {
      success: true,
      analytics: { isImproving: true, recoveryPercentage: recoveryRate, aiRecommendationId: recId, aiRecommendationEn: recEn }
    };

  } catch (error: unknown) {
    return { success: false, analytics: null, error: error instanceof Error ? error.message : "Sistem Gagal." };
  }
}