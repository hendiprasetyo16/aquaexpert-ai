// features/diseases/repositories/disease.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Disease } from "../types/disease.types";
import imageCompression from 'browser-image-compression';

// FIX: Menambahkan scientific_name, description_id, description_en
const DISEASE_COLUMNS = `
  id, slug, name_id, name_en, scientific_name, description_id, description_en,
  disease_category, severity, difficulty, mortality_risk, urgency_level,
  symptom_tags, visual_tags, water_trigger_tags, affected_body_parts, affected_species,
  transmissible, quarantine_required, medication_tags,
  disease_stage, treatment_duration_days, recovery_probability, emergency_actions,
  symptoms_id, symptoms_en, treatments_id, treatments_en, 
  prevention_id, prevention_en, expert_notes_id, expert_notes_en, 
  image_url, gallery_urls, is_active, created_at, updated_at
`;

export async function getDiseases(): Promise<Disease[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("diseases")
    .select(DISEASE_COLUMNS)
    .eq("is_active", true)
    .order("name_id");
    
  if (error) { 
    console.error(error); 
    return []; 
  }
  return (data ?? []) as Disease[];
}

export async function getArchivedDiseases(): Promise<Disease[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("diseases")
    .select(DISEASE_COLUMNS)
    .eq("is_active", false)
    .order("name_id");
  
  if (error) {
    console.error("Gagal menarik arsip penyakit:", error);
    return [];
  }
  return (data ?? []) as Disease[];
}

// FUNGSI UPLOAD & KOMPRESI GAMBAR PENYAKIT
export async function uploadDiseaseImage(file: File, oldImageUrl?: string | null): Promise<string | null> {
  try {
    const supabase = createClient();
    
    // 1. Kompresi Gambar (Maks 500KB, Resolusi Maks 1200px)
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);

    // 2. Hapus gambar lama jika sedang mode edit (agar storage tidak penuh)
    if (oldImageUrl) {
      const oldPath = oldImageUrl.split('/').pop(); // Mengambil nama file dari URL
      if (oldPath) {
        await supabase.storage.from('disease-images').remove([oldPath]);
      }
    }

    // 3. Upload gambar baru
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('disease-images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 4. Dapatkan Public URL
    const { data: { publicUrl } } = supabase.storage.from('disease-images').getPublicUrl(fileName);
    return publicUrl;
    
  } catch (error) {
    console.error("Gagal mengunggah gambar penyakit:", error);
    return null;
  }
}