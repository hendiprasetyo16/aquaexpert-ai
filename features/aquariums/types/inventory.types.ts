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
  added_at: string;
  fish?: { 
    id: string; 
    name_id: string; 
    name_en: string; 
    image_url: string; 
    fish_type: string; 
    // Field penentu nasib Bioload
    estimated_adult_size_cm?: number | null; 
  } | null;
}