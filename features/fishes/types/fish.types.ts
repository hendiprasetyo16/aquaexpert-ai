// features/fishes/types/fish.types.ts

export interface Fish {
  id: string;
  slug?: string;
  name_id: string;
  name_en: string;
  scientific_name?: string | null;
  description_id?: string | null;
  description_en?: string | null;
  
  // -- KEBUTUHAN LINGKUNGAN --
  min_tank_size?: number | null; 
  ideal_ph_min?: number | null;
  ideal_ph_max?: number | null;
  ideal_temp_min?: number | null;
  ideal_temp_max?: number | null;
  hardness_min?: number | null; 
  hardness_max?: number | null; 

  // -- SIFAT, KELOMPOK & BIOLOGI --
  compatibility?: string | null; 
  temperament_score?: number | null; 
  schooling?: boolean | null;
  min_group_size?: number | null;
  max_group_size?: number | null; 
  adult_behavior?: string | null; 
  activity_level?: string | null; // Kolom Baru: Low, Medium, High
  fish_type?: string | null;
  difficulty?: string | null;
  lifespan_years?: number | null; 
  shrimp_safe?: boolean | null; 
  plant_safe?: boolean | null;  
  
  // -- ZONASI, ASAL & STYLE --
  water_layer?: string | null; 
  origin_region?: string | null; 
  recommended_tank_styles?: string[] | null; 
  
  // -- BREEDING (Future Proofing) --
  breeding_difficulty?: string | null; 
  is_egg_layer?: boolean | null;       
  is_livebearer?: boolean | null;      

  // -- BIOLOAD & FISIK --
  estimated_adult_size_cm?: number | null;
  bioload_factor?: number | null;

  // -- MEDIA & CATATAN --
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;

  // -- SISTEM --
  is_active?: boolean;
  created_at: string;
  updated_at?: string | null;
}