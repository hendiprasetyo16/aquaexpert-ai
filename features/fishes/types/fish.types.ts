// features/fishes/types/fish.types.ts

export interface Fish {
  id: string;
  slug?: string;
  name_id: string;
  name_en: string;
  scientific_name?: string | null;
  description_id?: string | null;
  description_en?: string | null;
  
  // -- KEBUTUHAN LINGKUNGAN (AIR & TANGKI) --
  min_tank_size?: number | null; 
  ideal_ph_min?: number | null;
  ideal_ph_max?: number | null;
  ideal_temp_min?: number | null;
  ideal_temp_max?: number | null;
  hardness_min?: number | null; // Kolom Baru (GH)
  hardness_max?: number | null; // Kolom Baru (GH)

  // -- SIFAT, KELOMPOK & BIOLOGI --
  compatibility?: string | null; 
  temperament_score?: number | null; // Kolom Baru: 1 (Very Peaceful) - 5 (Predator)
  schooling?: boolean | null;
  min_group_size?: number | null;
  max_group_size?: number | null; // Kolom Baru
  adult_behavior?: string | null; // Kolom Baru (Schooling, Pair, Solitary, dll)
  fish_type?: string | null;
  difficulty?: string | null;
  lifespan_years?: number | null; // Kolom Baru
  
  // -- ZONASI & ASAL --
  water_layer?: string | null; // Kolom Baru: Top, Middle, Bottom
  origin_region?: string | null; // Kolom Baru: South America, Asia, dll
  
  // -- BIOLOAD & FISIK --
  estimated_adult_size_cm?: number | null;
  bioload_factor?: number | null;

  // -- MEDIA & CATATAN PAKAR --
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;

  // -- SISTEM --
  is_active?: boolean;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}