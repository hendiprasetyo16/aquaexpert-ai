// features/aquariums/types/inventory.types.ts

export interface TankPlant {
  id: string;
  aquarium_id: string;
  plant_id: string;
  quantity: number;
  status: string;
  added_at: string;
  plant?: { 
    id: string; 
    name_id: string; 
    name_en: string; 
    image_url: string; 
    placement: string; 
    growth_rate?: string | null; 
    nitrate_consumption?: string | null;
    oxygen_production?: string | null;
    algae_resistance?: string | null;
    difficulty?: string | null;
    co2_mandatory?: boolean | null;
    light_requirement?: string | null;
    growth_speed_score?: number | null;
    nutrient_consumption_score?: number | null;
    
    // 💡 FIX: Sesuaikan properti suhu/pH tanaman dengan SQL Database
    preferred_ph?: number | null;
    preferred_temperature?: number | null;
    preferred_gh?: number | null;
    temperature_min?: number | null;
    temperature_max?: number | null;
    ph_min?: number | null;
    ph_max?: number | null;

    carpeting?: boolean | null;
    epiphyte?: boolean | null;
    floating?: boolean | null;
    aquascape_style?: string[] | null; 
    growth_height_cm?: number | null;
    growth_width_cm?: number | null;
    trimming_frequency_score?: number | null;
    invasive_growth?: boolean | null;
    root_feeder?: boolean | null;
  } | null;
}

export interface TankFish {
  id: string;
  aquarium_id: string;
  fish_id: string;
  quantity: number;
  health_status?: string | null;
  size_category?: string | null;
  added_at: string;
  fish?: { 
    id: string; 
    name_id: string; 
    name_en: string; 
    image_url: string; 
    fish_type: string; 
    estimated_adult_size_cm?: number | null; 
    bioload_factor?: number | null; 
    activity_level?: string | null;
    water_layer?: string | null;
    temperament_score?: number | null;
    shrimp_safe?: boolean | null;
    plant_safe?: boolean | null;
    
    // 💡 FIX FATAL: Nama variabel wajib SAMA PERSIS dengan SQL Database
    ideal_temp_min?: number | null;
    ideal_temp_max?: number | null;
    ideal_ph_min?: number | null;
    ideal_ph_max?: number | null;
    
    schooling?: boolean | null; // 💡 FIX: Menambahkan indikator kawanan
    min_school_size?: number | null;
    fin_nipper?: boolean | null;
    long_finned?: boolean | null;
    minimum_tank_length_cm?: number | null;
    mouth_size_factor?: number | null;
    compatibility_tags?: string[] | null;
    territorial?: boolean | null;
    predatory?: boolean | null;
    activity_period?: string | null;
    compatibility_score?: Record<string, number> | null;
    shrimp_predation_risk?: number | null;
    native_biotope?: string | null;
    preferred_temperature?: number | null;
    preferred_ph?: number | null;
    preferred_gh?: number | null;
    uproots_plants?: boolean | null;
    preferred_aquascape_styles?: string[] | null;
    oxygen_requirement_score?: number | null;
    current_preference?: string | null;
    max_group_size?: number | null;
    minimum_tank_volume_liters?: number | null;
    waste_production_score?: number | null;
    jump_risk?: boolean | null;
    sensitive_to_nitrate?: boolean | null;
    conservation_status?: string | null;
    breeding_difficulty?: number | null;
    lifespan_years?: number | null;
  } | null;
}