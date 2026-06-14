// features/fishes/types/fish.types.ts
export interface Fish {
  id: string;
  slug: string | null;
  name_id: string;
  name_en: string;
  scientific_name: string | null;
  description_id: string | null;
  description_en: string | null;
  min_tank_size: number | null;
  ideal_ph_min: number | null;
  ideal_ph_max: number | null;
  ideal_temp_min: number | null;
  ideal_temp_max: number | null;
  compatibility: string | null;
  schooling: boolean;
  min_group_size: number | null;
  image_url: string | null;
  gallery_urls: string[];
  fish_type: string | null;
  difficulty: string | null;
  expert_notes_id: string | null;
  expert_notes_en: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}