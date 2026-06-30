// features/diseases/actions/start-treatment.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";

interface StartTreatmentPayload {
  aquariumId: string;
  diseaseId: string;
  medicationId: string;
  initialSeverityScore: number;
  initialSymptoms: string[]; 
}

// ============================================================================
// INTERFACE UNTUK QUERY (Menghindari any)
// ============================================================================
export interface ActiveTreatmentDto {
  id: string;
  aquarium_id: string;
  disease_id: string;
  medication_id: string;
  status: string;
  started_at: string;
  current_recovery_rate: number;
  initial_symptoms: string[];
  aquarium: { name: string } | null;
  disease: { name_id: string; name_en: string } | null;
  medication: { name: string; dosage_unit: string } | null;
}

// ============================================================================
// 1. FUNGSI UNTUK DROPDOWN
// ============================================================================
export async function getTreatmentDropdownOptionsAction() {
  try {
    const supabase = await createClient();
    
    const { data: diseases, error: errDis } = await supabase
      .from("diseases")
      .select("id, name_id, name_en, severity")
      .eq("is_active", true)
      .order("name_id", { ascending: true });

    const { data: medications, error: errMed } = await supabase
      .from("medications")
      .select("id, name, dosage_unit")
      .order("name", { ascending: true });

    if (errDis || errMed) throw new Error("Gagal mengambil data referensi medis.");

    return { 
      success: true, 
      diseases: diseases || [], 
      medications: medications || [] 
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan internal" };
  }
}

// ============================================================================
// 2. FUNGSI UNTUK START TREATMENT BARU
// ============================================================================
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

    revalidatePath(`/dashboard/my-aquarium/${payload.aquariumId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal memulai sesi pengobatan." };
  }
}

// ============================================================================
// 3. FUNGSI UNTUK MENGAMBIL DATA KE UI TAB (Yang sebelumnya hilang)
// ============================================================================
export async function getActiveTreatmentsAction(aquariumIdFilter?: string): Promise<{ success: boolean; data: ActiveTreatmentDto[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, data: [], error: "Session expired." };

    let query = supabase
      .from("treatment_sessions")
      .select(`
        id, aquarium_id, disease_id, medication_id, status, started_at, current_recovery_rate, initial_symptoms,
        aquarium:my_aquariums(name),
        disease:diseases(name_id, name_en),
        medication:medications(name, dosage_unit)
      `)
      .eq("status", "Active")
      .order("started_at", { ascending: false });

    // Jika dipanggil dari Tab Aquarium Detail
    if (aquariumIdFilter) {
      query = query.eq("aquarium_id", aquariumIdFilter);
    } else {
      // Jika dipanggil dari Global Dashboard (nanti)
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

      return {
        id: String(s.id),
        aquarium_id: String(s.aquarium_id),
        disease_id: String(s.disease_id),
        medication_id: String(s.medication_id),
        status: String(s.status),
        started_at: String(s.started_at),
        current_recovery_rate: Number(s.current_recovery_rate) || 0,
        initial_symptoms: Array.isArray(s.initial_symptoms) ? s.initial_symptoms.map(String) : [],
        aquarium: aq ? { name: String(aq.name) } : null,
        disease: dis ? { name_id: String(dis.name_id), name_en: String(dis.name_en) } : null,
        medication: med ? { name: String(med.name), dosage_unit: String(med.dosage_unit) } : null
      };
    });

    return { success: true, data: formattedData };
  } catch (error: unknown) {
    return { success: false, data: [], error: error instanceof Error ? error.message : "Terjadi kesalahan internal" };
  }
}