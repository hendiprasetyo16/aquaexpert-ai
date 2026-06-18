// features/diseases/types/disease.types.ts

export interface Disease {
  id: string;
  slug?: string;

  // -- GENERAL --
  name_id: string;
  name_en: string;
  disease_category?: string | null;
  severity?: number | null;
  difficulty?: string | null;
  mortality_risk?: number | null;
  urgency_level?: string | null; // Low, Medium, High, Critical

  // -- EXPERT ENGINE & AI VISION TAGS --
  symptom_tags?: string[] | null;
  visual_tags?: string[] | null;       
  water_trigger_tags?: string[] | null;
  affected_body_parts?: string[] | null;
  affected_species?: string[] | null;

  // -- TREATMENT ENGINE & TRIAGE (FINAL) --
  transmissible?: boolean | null;
  quarantine_required?: boolean | null;
  medication_tags?: string[] | null;
  disease_stage?: string | null;               // Early, Moderate, Advanced
  treatment_duration_days?: number | null;     // Durasi standar pengobatan
  recovery_probability?: number | null;        // 1-100% peluang hidup
  emergency_actions?: string[] | null;         // Triage / Tindakan darurat seketika

  // -- CONTENT (BILINGUAL) --
  symptoms_id?: string | null;
  symptoms_en?: string | null;
  treatments_id?: string | null;
  treatments_en?: string | null;
  prevention_id?: string | null;
  prevention_en?: string | null;
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;

  // -- MEDIA --
  image_url?: string | null;
  gallery_urls?: string[] | null;

  // -- SISTEM --
  is_active?: boolean;
  created_at: string;
  updated_at?: string | null;
}