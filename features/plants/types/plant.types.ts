// features/plants/types/plant.types.ts

export interface Plant {
  id: string;

  // -- BILINGUAL FIELDS --
  name_id: string;
  name_en?: string | null;
  description_id?: string | null;
  description_en?: string | null;
  expert_notes_id?: string | null;
  expert_notes_en?: string | null;
  // ----------------------

  slug?: string;
  scientific_name?: string | null;

  light_requirement?: string | null;
  co2_requirement?: string | null;
  fertilizer_requirement?: string | null;
  
  ph_min?: number | null;
  ph_max?: number | null;
  temperature_min?: number | null;
  temperature_max?: number | null;

  placement?: string | null;
  difficulty?: string | null;
  growth_rate?: string | null;
  max_height_cm?: number | null; 
  origin_country?: string | null; 
  
  recommended_for?: string[] | null; 
  
  source_name?: string | null; 
  source_url?: string | null;

  image_url?: string | null;
  gallery_urls?: string[] | null;

  // ==========================================
  // AQUAEXPERT V2: EXPERT ENGINE ATTRIBUTES
  // ==========================================
  plant_type?: string | null;
  aquascape_style?: string[] | null;
  beginner_score?: number | null;
  maintenance_level?: string | null;
  carpet_potential?: boolean | null;
  shrimp_safe?: boolean | null;
  co2_mandatory?: boolean | null; 
  emersed_capable?: boolean | null; 
  growth_control?: string | null;
  tank_size_recommendation?: string[] | null;

  // -- NEW COLUMNS DARI SQL TERBARU --
  nitrate_consumption?: string | null;
  oxygen_production?: string | null;
  algae_resistance?: string | null;
  growth_speed_score?: number | null;
  nutrient_consumption_score?: number | null;
  preferred_ph?: number | null;
  preferred_temperature?: number | null;
  preferred_gh?: number | null;
  carpeting?: boolean | null;
  epiphyte?: boolean | null;
  floating?: boolean | null;
  growth_height_cm?: number | null;
  growth_width_cm?: number | null;
  trimming_frequency_score?: number | null;
  invasive_growth?: boolean | null;
  root_feeder?: boolean | null;

  created_at: string;
  updated_at?: string | null;
  
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}