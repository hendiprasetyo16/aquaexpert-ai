export interface Plant {
  id: string;

  name: string;
  slug?: string;
  scientific_name?: string;

  light_requirement?: string;
  co2_requirement?: string;
  fertilizer_requirement?: string;
  
  ph_min?: number;
  ph_max?: number;
  temperature_min?: number;
  temperature_max?: number;

  placement?: string;
  difficulty?: string;
  growth_rate?: string;
  max_height_cm?: number; 
  origin_country?: string; 
  
  recommended_for?: string[]; // Array untuk Knowledge Base
  
  source_name?: string; 
  source_url?: string;

  description?: string;
  image_url?: string;

  created_at: string;
  updated_at?: string;
  
  // Status & Audit Trail
  is_active?: boolean;
  created_by?: string;
  updated_by?: string;
}