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
  initialSymptoms: string[]; // Disimpan sebagai JSONB di database
}

export async function getTreatmentDropdownOptionsAction() {
  try {
    const supabase = await createClient();
    
    // Ambil daftar penyakit aktif
    const { data: diseases, error: errDis } = await supabase
      .from("diseases")
      .select("id, name_id, name_en, severity")
      .eq("is_active", true)
      .order("name_id", { ascending: true });

    // Ambil daftar obat-obatan
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

export async function startNewTreatmentSessionAction(payload: StartTreatmentPayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Sesi login berakhir.");
    
    // Keamanan: Pastikan user ini benar-benar pemilik akuarium
    await verifyAquariumOwnership(supabase, payload.aquariumId, user.id);

    // Insert ke tabel treatment_sessions
    const { error } = await supabase.from("treatment_sessions").insert({
      aquarium_id: payload.aquariumId,
      disease_id: payload.diseaseId,
      medication_id: payload.medicationId,
      status: "Active",
      initial_severity_score: payload.initialSeverityScore,
      initial_symptoms: payload.initialSymptoms, // JSONB
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