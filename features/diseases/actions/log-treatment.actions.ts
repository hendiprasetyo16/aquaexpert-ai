// features/diseases/actions/log-treatment.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import { logger } from "@/lib/logger";
import type { 
  LogTreatmentResponse, 
  TreatmentStatus, 
  ActionTaken
} from "../types/treatment.types";

// ============================================================================
// STRICT INTERFACES
// ============================================================================
interface SymptomSnapshot {
  id: string;
  name_id: string;
  name_en: string;
  weight: number;
}

interface TreatmentRpcResult {
  success: boolean;
  log_id: string;
  recovery_rate: number;
  status: TreatmentStatus;
}

interface LogPayload {
  aquariumId: string;
  sessionId: string;
  remainingSymptomIds: string[];
  actionTaken: ActionTaken;
  medicationDose?: number;
  newFishLostCount?: number;
  explicitOutcomeReason?: string;
  notes?: string;
  photoUrl?: string;
  lang?: "id" | "en";
}

export async function logDailyTreatmentAction({
  aquariumId,
  sessionId,
  remainingSymptomIds,
  actionTaken,
  medicationDose = 0,
  newFishLostCount = 0,
  explicitOutcomeReason,
  notes = "",
  photoUrl,
  lang = "id"
}: LogPayload): Promise<LogTreatmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, analytics: null, error: lang === "id" ? "Sesi berakhir." : "Session expired." };
    }
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data: session, error: errSession } = await supabase
      .from("treatment_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("aquarium_id", aquariumId)
      .maybeSingle();

    if (errSession || !session) {
      throw new Error(lang === "id" ? "Sesi pengobatan tidak ditemukan." : "Treatment session not found.");
    }
    
    if (session.status !== "Active") {
      throw new Error(lang === "id" ? "Sesi pengobatan ini sudah ditutup." : "This treatment session is already closed.");
    }

    const startDate = new Date(session.started_at);
    const today = new Date();
    
    const startMidnight = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const todayMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    
    const dayNumber = Math.floor((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24)) + 1;

    // FIX: Strict Typed Snapshot Array
    let currentSeverityScore = 0;
    let symptomsSnapshot: SymptomSnapshot[] = [];
    
    if (remainingSymptomIds.length > 0) {
      const { data: symptoms } = await supabase
        .from("symptoms")
        .select("id, name_id, name_en, weight")
        .in("id", remainingSymptomIds);
        
      if (symptoms) {
        currentSeverityScore = symptoms.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
        // Mapping ketat untuk menghindari any leakage
        symptomsSnapshot = symptoms.map(s => ({
          id: String(s.id),
          name_id: String(s.name_id),
          name_en: String(s.name_en),
          weight: Number(s.weight) || 0
        }));
      }
    }

    const { data: previousLogRaw } = await supabase
      .from("treatment_logs")
      .select("severity_score")
      .eq("session_id", sessionId)
      .order("day_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousSeverity = previousLogRaw ? Number(previousLogRaw.severity_score) : Number(session.initial_severity_score);
    const isImproving = currentSeverityScore < previousSeverity;

    let recoveryRate = 0;
    const initialSeverity = Number(session.initial_severity_score);
    if (initialSeverity > 0) {
      recoveryRate = ((initialSeverity - currentSeverityScore) / initialSeverity) * 100;
    }
    recoveryRate = Math.max(0, Math.min(100, Math.round(recoveryRate)));

    const { data: latestParams } = await supabase
      .from("aquarium_parameters")
      .select("ph, temperature, ammonia, nitrite, nitrate")
      .eq("aquarium_id", aquariumId)
      .eq("is_deleted", false)
      .order("record_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let recId = "";
    let recEn = "";
    let autoUpdateStatus: TreatmentStatus = "Active";
    let finalOutcomeReason = explicitOutcomeReason || null;

    if (recoveryRate === 100 || remainingSymptomIds.length === 0) {
      autoUpdateStatus = "Completed";
      finalOutcomeReason = finalOutcomeReason || "Recovered fully";
      recId = "Kesembuhan 100% tercapai! Patogen berhasil dibasmi. Lakukan pergantian air (Water Change) 50% untuk membersihkan residu obat, dan pasang karbon aktif pada filter.";
      recEn = "100% recovery achieved! Pathogen eradicated. Perform a 50% Water Change to clear medication residue, and add active carbon to the filter.";
    } else if (newFishLostCount > 0 && recoveryRate < 20) {
      recId = `Tingkat mortalitas tercatat. Pemulihan berada di angka ${recoveryRate}%. Evaluasi sangat disarankan untuk kemungkinan salah diagnosis atau resistensi obat.`;
      recEn = `Mortality recorded. Recovery is at ${recoveryRate}%. Strong evaluation recommended for possible misdiagnosis or drug resistance.`;
    } else if (recoveryRate > 50) {
      recId = `Tingkat pemulihan mencapai ${recoveryRate}%. Terlihat kemajuan positif yang signifikan. Lanjutkan observasi sesuai dosis rekomendasi.`;
      recEn = `Recovery rate is at ${recoveryRate}%. Significant positive progress is visible. Continue observation at recommended dosage.`;
    } else if (!isImproving && dayNumber > 3) {
      recId = `PERINGATAN KRITIS: Kondisi memburuk atau tidak ada perbaikan dibandingkan catatan sebelumnya di Hari ke-${dayNumber}. Pertimbangkan mengganti obat ke opsi Alternatif.`;
      recEn = `CRITICAL WARNING: Worsening condition or no improvement compared to previous log at Day ${dayNumber}. Consider switching to an Alternative medication.`;
    } else if (recoveryRate > 0 && dayNumber > 5) {
      recId = `Pemulihan lambat (${recoveryRate}% di Hari ke-${dayNumber}). Evaluasi kembali dosis obat atau periksa kualitas air.`;
      recEn = `Slow recovery (${recoveryRate}% at Day ${dayNumber}). Re-evaluate medication dosage or check water quality.`;
    } else {
      recId = "Pengobatan sedang berlangsung. Terus pantau kondisi fauna secara berkala.";
      recEn = "Treatment is ongoing. Continue to monitor fauna condition regularly.";
    }

    const { data: rawRpcResult, error: rpcError } = await supabase.rpc('log_treatment_transaction', {
      p_session_id: sessionId,
      p_day_number: dayNumber,
      p_severity_score: currentSeverityScore,
      p_remaining_symptoms: remainingSymptomIds,
      p_symptoms_snapshot: symptomsSnapshot,
      p_action_taken: actionTaken,
      p_notes: notes,
      p_photo_url: photoUrl || null,
      p_water_parameters: latestParams || null,
      p_medication_dose: medicationDose,
      p_recovery_rate: recoveryRate,
      p_status: autoUpdateStatus,
      p_outcome_reason: finalOutcomeReason,
      p_fish_lost_count: newFishLostCount,
      p_completed_at: autoUpdateStatus === "Completed" ? new Date().toISOString() : null
    });

    if (rpcError) {
      const errStr = JSON.stringify(rpcError).toLowerCase();
      if (rpcError.code === '23505' || errStr.includes('unique') || errStr.includes('duplicate')) {
        throw new Error(lang === "id" 
          ? `Log rekam medis untuk Hari ke-${dayNumber} sudah tercatat sebelumnya. Silakan perbarui log yang sudah ada.` 
          : `Medical log for Day ${dayNumber} already exists. Please update the existing log.`
        );
      }
      logger.error("[TREATMENT ENGINE RPC ERROR]", rpcError);
      throw new Error("Gagal mengeksekusi transaksi rekam medis.");
    }

    // FIX: Type-Safe RPC Result Handling
    const rpcResult = rawRpcResult as unknown as TreatmentRpcResult;
    logger.info("[TREATMENT ENGINE SUCCESS]", { rpcResult });

    return {
      success: true,
      analytics: {
        isImproving,
        recoveryPercentage: rpcResult && typeof rpcResult === 'object' ? Number(rpcResult.recovery_rate) : recoveryRate,
        aiRecommendationId: recId,
        aiRecommendationEn: recEn
      }
    };

  } catch (error: unknown) {
    logger.error("[TREATMENT ENGINE FATAL]", error);
    return {
      success: false,
      analytics: null,
      error: error instanceof Error ? error.message : "Terjadi kegagalan sistem internal."
    };
  }
}