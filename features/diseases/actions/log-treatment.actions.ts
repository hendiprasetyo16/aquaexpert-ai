// features/diseases/actions/log-treatment.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import type { LogTreatmentResponse, TreatmentStatus, ActionTaken } from "../types/treatment.types";
import { revalidatePath } from "next/cache";

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

// 💡 UPDATE: Fungsi Hapus yang Tersinkronisasi dengan Papan Analisis AI
export async function deleteTreatmentSessionAction(sessionId: string, aquariumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi berakhir.");
    await verifyAquariumOwnership(supabase, aquariumId, user.id);
    
    // 1. Ambil data sesi sebelum dibakar (Kita butuh ID Penyakit & Obatnya)
    const { data: sessionData } = await supabase
      .from("treatment_sessions")
      .select("disease_id, medication_id, status")
      .eq("id", sessionId)
      .single();

    // 2. Bakar/Hapus sesi dari tabel utama
    const { error } = await supabase.from("treatment_sessions").delete().eq("id", sessionId);
    if (error) throw new Error(error.message);

    // 3. 🤖 SINKRONISASI ANALITIK: Jika yang dihapus adalah pasien selesai/gagal, kurangi angkanya!
    if (sessionData && ["Completed", "Failed", "Aborted"].includes(sessionData.status)) {
      const { data: statData } = await supabase
        .from("medication_efficacy_stats")
        .select("*")
        .eq("disease_id", sessionData.disease_id)
        .eq("medication_id", sessionData.medication_id)
        .single();

      if (statData) {
        // Logika Pengurangan (Tidak boleh minus)
        const newTotalCases = Math.max(0, statData.total_cases - 1);
        let newSuccessCases = statData.success_cases || 0;
        let newFailedCases = statData.failed_cases || 0;
        let newAbortedCases = statData.aborted_cases || 0;

        // Kurangi metrik spesifik
        if (sessionData.status === "Completed") newSuccessCases = Math.max(0, newSuccessCases - 1);
        if (sessionData.status === "Failed") newFailedCases = Math.max(0, newFailedCases - 1);
        if (sessionData.status === "Aborted") newAbortedCases = Math.max(0, newAbortedCases - 1);

        // Kalkulasi ulang persen kesembuhan (Update Real-time)
        const newSuccessRate = newTotalCases > 0 ? Number(((newSuccessCases / newTotalCases) * 100).toFixed(2)) : 0;
        const newMortalityRate = newTotalCases > 0 ? Number(((newFailedCases / newTotalCases) * 100).toFixed(2)) : 0;

        // Simpan angka perbaikan ke Papan Analisis
        await supabase
          .from("medication_efficacy_stats")
          .update({
            total_cases: newTotalCases,
            success_cases: newSuccessCases,
            failed_cases: newFailedCases,
            aborted_cases: newAbortedCases,
            success_rate_pct: newSuccessRate,
            mortality_rate_pct: newMortalityRate
          })
          .eq("disease_id", sessionData.disease_id)
          .eq("medication_id", sessionData.medication_id);
      }
    }

    // Segarkan UI Halaman
    revalidatePath(`/dashboard/my-aquarium/${aquariumId}`);
    revalidatePath(`/dashboard/treatments`);
    revalidatePath(`/dashboard/analytics`); // Wajib segarkan analitik

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus sesi." };
  }
}

// ==========================================================
// FUNGSI PENCATATAN HARIAN TETAP UTUH & AMAN
// ==========================================================
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

    // KALKULASI PERSENTASE KESEMBUHAN
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
    
    // 1. Cek apakah hari ini sudah absen
    const { data: existingLog } = await supabase.from("treatment_logs")
      .select("id").eq("session_id", sessionId).eq("day_number", dayNumber).maybeSingle();
    
    // 2. Lakukan Update Jika Ada, Insert Jika Baru
    if (existingLog) {
      const { error } = await supabase
        .from("treatment_logs")
        .update(logData)
        .eq("id", existingLog.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("treatment_logs")
        .insert(logData);
      if (error) throw error;
    }

    // 3. Update status tangki pasien
    const { error: updateError } = await supabase
    .from("treatment_sessions")
    .update({
        current_recovery_rate: recoveryRate,
        status: autoUpdateStatus,
        outcome_reason: finalOutcomeReason,
        fish_lost_count: Number(session.fish_lost_count || 0) + newFishLostCount,
        completed_at: autoUpdateStatus !== "Active" ? new Date().toISOString() : null
    })
    .eq("id",sessionId);

    if(updateError){
        console.error(updateError);
        return { success:false, analytics:null, error:updateError.message };
    }

    // 4. Masukkan ke papan Analitik jika selesai (Sembuh/Batal)
    const { error: outcomeError } = await supabase
    .from("treatment_outcomes")
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
    },{
        onConflict:"session_id"
    });

    if(outcomeError){
        console.error(outcomeError);
        return { success:false, analytics:null, error:outcomeError.message };
    }

    return {
      success: true,
      analytics: { isImproving: true, recoveryPercentage: recoveryRate, aiRecommendationId: recId, aiRecommendationEn: recEn }
    };

  } catch (error: unknown) {
    return { success: false, analytics: null, error: error instanceof Error ? error.message : "Sistem Gagal." };
  }
}