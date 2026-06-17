// features/diseases/types/disease.types.ts

export interface Disease {
  id: string;
  slug?: string;
  
  // -- BILINGUAL INFO --
  name_id: string;
  name_en: string;
  symptoms_id?: string | null;
  symptoms_en?: string | null;
  treatments_id?: string | null;
  treatments_en?: string | null;
  prevention_id?: string | null;
  prevention_en?: string | null;
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;

  // -- EXPERT ENGINE CONFIGURATION --
  severity?: number | null; // 1-5 (Seberapa parah secara umum)
  difficulty?: string | null; // Kesulitan mengobati
  mortality_risk?: number | null; // Kolom Baru: 1-5 (Risiko Kematian)
  contagious?: boolean | null; // Kolom Baru: Apakah menular?
  affected_species?: string[] | null; // Kolom Baru: Spesies yang rentan
  diagnostic_tags?: string[] | null; // Kolom Baru: Gejala visual untuk AI Diagnosis

  // -- MEDIA --
  image_url?: string | null;
  gallery_urls?: string[] | null;

  // -- SISTEM --
  is_active?: boolean;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}