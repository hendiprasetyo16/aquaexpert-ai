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
    // TAMBAHAN WAJIB UNTUK DEEP DIAGNOSIS & EXPERT ENGINE
    activity_level?: string | null;
    water_layer?: string | null;
    temperament_score?: number | null;
    shrimp_safe?: boolean | null;
    plant_safe?: boolean | null;
  } | null;
}