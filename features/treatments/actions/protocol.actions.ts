// features/treatments/actions/protocol.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, unstable_noStore } from "next/cache"; // <-- IMPORT BARU UNTUK CACHE

export interface ProtocolDiseaseDto {
  id: string;
  name_id: string;
  name_en: string;
  is_active: boolean;
}

export interface ProtocolMedicationDto {
  id: string;
  name_id: string;
  name_en: string;
  active_ingredient: string;
  is_active: boolean;
}

export interface DiseaseMedicationDto {
  disease_id: string;
  medication_id: string;
  priority: "Primary" | "Alternative";
}

export interface ProtocolMasterDataResponse {
  success: boolean;
  error?: string;
  diseases: ProtocolDiseaseDto[];
  medications: ProtocolMedicationDto[];
  relations: DiseaseMedicationDto[];
}

export interface BaseResponse {
  success: boolean;
  error?: string;
}

export async function getProtocolMasterDataAction(): Promise<ProtocolMasterDataResponse> {
  unstable_noStore(); // <-- MEMATIKAN CACHE NEXT.JS SECARA PAKSA

  try {
    const supabase = await createClient();
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized access.", diseases: [], medications: [], relations: [] };
    }

    const [diseasesRes, medsRes, relationsRes] = await Promise.all([
      supabase.from("diseases").select("id, name_id, name_en, is_active").eq("is_active", true).order("name_id"),
      supabase.from("medications").select("id, name_id, name_en, active_ingredient, is_active").eq("is_active", true).order("name_id"),
      supabase.from("disease_medications").select("disease_id, medication_id, priority")
    ]);

    if (diseasesRes.error) throw new Error(diseasesRes.error.message);
    if (medsRes.error) throw new Error(medsRes.error.message);
    if (relationsRes.error) throw new Error(relationsRes.error.message);

    return {
      success: true,
      diseases: diseasesRes.data as ProtocolDiseaseDto[],
      medications: medsRes.data as ProtocolMedicationDto[],
      relations: relationsRes.data as DiseaseMedicationDto[]
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message, diseases: [], medications: [], relations: [] };
  }
}

export async function updateProtocolAction(
  diseaseId: string, 
  primaryMedIds: string[], 
  alternativeMedIds: string[]
): Promise<BaseResponse> {
  try {
    const supabase = await createClient();
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized access." };
    }

    // A: Hapus relasi lama
    const { error: deleteError } = await supabase
      .from("disease_medications")
      .delete()
      .eq("disease_id", diseaseId);
      
    if (deleteError) throw new Error(`Gagal menghapus data lama: ${deleteError.message}`);

    // B: Siapkan array relasi baru
    const newRelations: DiseaseMedicationDto[] = [];
    primaryMedIds.forEach(medId => {
      newRelations.push({ disease_id: diseaseId, medication_id: medId, priority: "Primary" });
    });
    alternativeMedIds.forEach(medId => {
      newRelations.push({ disease_id: diseaseId, medication_id: medId, priority: "Alternative" });
    });

    // C: Simpan relasi baru
    if (newRelations.length > 0) {
      const { error: insertError } = await supabase
        .from("disease_medications")
        .insert(newRelations);
        
      if (insertError) throw new Error(`Gagal menyimpan data baru: ${insertError.message}`);
    }

    // REVALIDASI HALAMAN AGAR UI LANGSUNG TER-UPDATE
    revalidatePath("/dashboard/protocols");
    revalidatePath("/dashboard/treatments");

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}