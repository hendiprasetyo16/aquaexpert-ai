// features/diseases/actions/start-treatment.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import { pushNotificationAction } from "@/features/analytics/actions/notification.actions"; // 💡 IMPORT NOTIFIKASI

interface StartTreatmentPayload {
  aquariumId: string;
  diseaseId: string;
  medicationId: string;
  initialSeverityScore: number;
  initialSymptoms: string[]; 
}

export interface ActiveTreatmentDto {
  id: string;
  aquarium_id: string;
  disease_id: string;
  medication_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  current_recovery_rate: number;
  initial_symptoms: string[];
  aquarium: { name: string } | null;
  disease: { name_id: string; name_en: string } | null;
  medication: {
    id: string;
    name_id: string; 
    name_en: string; 
    dosage_unit: string;
  } | null;
  latest_log: { action_taken: string; notes: string; day_number: number } | null;
}

// 💡 HELPER: Mengambil nama pengguna & nama akuarium untuk Notifikasi
async function getUserAndAquariumName(supabase: any, userId: string, aquariumId: string) {
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
  const { data: aq } = await supabase.from("my_aquariums").select("name").eq("id", aquariumId).single();
  return { 
    userName: profile?.full_name || "User", 
    aqName: aq?.name || "Akuarium" 
  };
}

export async function getTreatmentDropdownOptionsAction() {
  try {
    const supabase = await createClient();
    
    const { data: diseases } = await supabase.from("diseases")
      .select("id, name_id, name_en, severity, quarantine_required") 
      .eq("is_active", true).order("name_id", { ascending: true });

    const { data: medications } = await supabase.from("medications")
      .select("id, name_id, name_en, dosage_unit, safe_for_plants, safe_for_inverts") 
      .order("name_id", { ascending: true });

    return { success: true, diseases: diseases || [], medications: medications || [] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan internal" };
  }
}

export async function startNewTreatmentSessionAction(payload: StartTreatmentPayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi login berakhir.");
    await verifyAquariumOwnership(supabase, payload.aquariumId, user.id);

    const { error } = await supabase.from("treatment_sessions").insert({
      aquarium_id: payload.aquariumId,
      disease_id: payload.diseaseId,
      medication_id: payload.medicationId,
      status: "Active",
      initial_severity_score: payload.initialSeverityScore,
      initial_symptoms: payload.initialSymptoms, 
      current_recovery_rate: 0,
      fish_lost_count: 0
    });

    if (error) throw new Error(error.message);

    // =====================================================================
    // 💡 FITUR BARU: NOTIFIKASI MEMULAI PENGOBATAN
    // =====================================================================
    const { userName, aqName } = await getUserAndAquariumName(supabase, user.id, payload.aquariumId);
    const { data: disease } = await supabase.from("diseases").select("name_id").eq("id", payload.diseaseId).single();
    
    await pushNotificationAction(
      "Sesi Pengobatan Dimulai",
      `${userName} memulai sesi pengobatan untuk indikasi "${disease?.name_id || 'Penyakit'}" di akuarium "${aqName}".`,
      "alert", // Muncul sebagai Peringatan Merah
      userName
    );

    revalidatePath(`/dashboard/my-aquarium/${payload.aquariumId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal memulai sesi." };
  }
}

export async function getActiveTreatmentsAction(aquariumIdFilter?: string): Promise<{ success: boolean; data: ActiveTreatmentDto[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [], error: "Session expired." };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    let query = supabase
      .from("treatment_sessions")
      .select(`
        id, aquarium_id, disease_id, medication_id, status, started_at, completed_at, current_recovery_rate, initial_symptoms,
        aquarium:my_aquariums(name),
        disease:diseases(name_id, name_en),
        medication:medications(id, name_id, name_en, dosage_unit), 
        treatment_logs(action_taken, notes, day_number)
      `)
      .order("started_at", { ascending: false });

    if (aquariumIdFilter) {
      query = query.eq("aquarium_id", aquariumIdFilter);
    } else if (!isSuperAdmin) {
      const { data: myAquariums } = await supabase.from("my_aquariums").select("id").eq("user_id", user.id);
      if (!myAquariums || myAquariums.length === 0) return { success: true, data: [] };
      const aquariumIds = myAquariums.map(aq => aq.id);
      query = query.in("aquarium_id", aquariumIds);
    }

    const { data: sessions, error: sessionErr } = await query;
    if (sessionErr) throw new Error(sessionErr.message);

    const formattedData: ActiveTreatmentDto[] = (sessions as Record<string, unknown>[] || []).map(s => {
      const aq = s.aquarium as Record<string, unknown> | null;
      const dis = s.disease as Record<string, unknown> | null;
      const med = s.medication as Record<string, unknown> | null;
      
      const logs = (s.treatment_logs as Array<{ action_taken: string, notes: string, day_number: number }>) || [];
      const latestLog = logs.length > 0 ? logs.sort((a, b) => b.day_number - a.day_number)[0] : null;

      return {
        id: String(s.id),
        aquarium_id: String(s.aquarium_id),
        disease_id: String(s.disease_id),
        medication_id: String(s.medication_id),
        status: String(s.status),
        started_at: String(s.started_at),
        completed_at: s.completed_at ? String(s.completed_at) : null,
        current_recovery_rate: Number(s.current_recovery_rate) || 0,
        initial_symptoms: Array.isArray(s.initial_symptoms) ? s.initial_symptoms.map(String) : [],
        aquarium: aq ? { name: String(aq.name) } : null,
        disease: dis ? { name_id: String(dis.name_id), name_en: String(dis.name_en) } : null,
        medication: med ? { 
          id: String(med.id), 
          name_id: String(med.name_id), 
          name_en: String(med.name_en), 
          dosage_unit: String(med.dosage_unit) 
        } : null,
        latest_log: latestLog
      };
    });

    return { success: true, data: formattedData };
  } catch (error: unknown) {
    return { success: false, data: [], error: error instanceof Error ? error.message : "Terjadi kesalahan internal" };
  }
}