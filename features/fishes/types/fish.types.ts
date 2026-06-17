// features/fishes/types/fish.types.ts

export interface Fish {
  id: string;

  // -- BILINGUAL FIELDS --
  name_id: string;
  name_en: string;
  description_id?: string | null;
  description_en?: string | null;
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;
  // ----------------------

  slug?: string;
  scientific_name?: string | null;

  // -- KEBUTUHAN LINGKUNGAN --
  min_tank_size?: number | null; // dalam liter atau cm, sesuaikan dengan standar Bapak
  ideal_ph_min?: number | null;
  ideal_ph_max?: number | null;
  ideal_temp_min?: number | null;
  ideal_temp_max?: number | null;

  // -- SIFAT & KELOMPOK --
  compatibility?: string | null;
  schooling?: boolean | null;
  min_group_size?: number | null;
  fish_type?: string | null;
  difficulty?: string | null;
  
  // -- BIOLOAD & FISIK --
  estimated_adult_size_cm?: number | null;
  bioload_factor?: number | null;

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