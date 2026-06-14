// features/diseases/types/disease.types.ts
export interface Disease {
  id: string;
  slug: string | null;
  name_id: string;
  name_en: string;
  symptoms_id: string | null;
  symptoms_en: string | null;
  treatments_id: string | null;
  treatments_en: string | null;
  prevention_id: string | null;
  prevention_en: string | null;
  severity: number | null;
  difficulty: string | null;
  image_url: string | null;
  gallery_urls: string[];
  expert_notes_id: string | null;
  expert_notes_en: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}