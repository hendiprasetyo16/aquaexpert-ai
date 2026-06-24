// features/fishes/types/fish.types.ts

export interface Fish {
  id: string;
  slug?: string;
  name_id: string;
  name_en: string;
  scientific_name?: string | null;
  description_id?: string | null;
  description_en?: string | null;
  
  // -- KEBUTUHAN LINGKUNGAN DASAR --
  min_tank_size?: number | null; 
  ideal_ph_min?: number | null;
  ideal_ph_max?: number | null;
  ideal_temp_min?: number | null;
  ideal_temp_max?: number | null;
  hardness_min?: number | null; 
  hardness_max?: number | null; 

  // -- SIFAT, KELOMPOK & BIOLOGI DASAR --
  compatibility?: string | null; 
  temperament_score?: number | null; 
  schooling?: boolean | null;
  min_group_size?: number | null;
  max_group_size?: number | null; 
  adult_behavior?: string | null; 
  activity_level?: string | null;
  fish_type?: string | null;
  difficulty?: string | null;
  lifespan_years?: number | null; 
  shrimp_safe?: boolean | null; 
  plant_safe?: boolean | null;  
  
  // -- ZONASI, ASAL & STYLE --
  water_layer?: string | null; 
  origin_region?: string | null; 
  recommended_tank_styles?: string[] | null; 
  
  // -- BREEDING --
  breeding_difficulty?: number | null; 
  is_egg_layer?: boolean | null;       
  is_livebearer?: boolean | null;      

  // -- BIOLOAD & FISIK DASAR --
  estimated_adult_size_cm?: number | null;
  bioload_factor?: number | null;

  // ==========================================
  // NEW EXPERT METRICS COLUMNS (UPDATE TERBARU)
  // ==========================================
  minimum_tank_length_cm?: number | null;
  territorial?: boolean | null;
  predatory?: boolean | null;
  mouth_size_factor?: number | null;
  compatibility_tags?: string[] | null;
  activity_period?: string | null;
  compatibility_score?: any | null; // Tipe JSONB dari Supabase
  shrimp_predation_risk?: number | null;
  native_biotope?: string | null;
  preferred_temperature?: number | null;
  preferred_ph?: number | null;
  preferred_gh?: number | null;
  uproots_plants?: boolean | null;
  preferred_aquascape_styles?: string[] | null;
  oxygen_requirement_score?: number | null;
  current_preference?: string | null;
  minimum_tank_volume_liters?: number | null;
  waste_production_score?: number | null;
  jump_risk?: boolean | null;
  sensitive_to_nitrate?: boolean | null;
  conservation_status?: string | null;

  // -- MEDIA & CATATAN --
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