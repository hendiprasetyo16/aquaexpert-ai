export interface Plant {
  id: string;

  name: string;
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
  
  recommended_for?: string[] | null; // Array untuk Knowledge Base
  
  source_name?: string | null; 
  source_url?: string | null;

  description?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;

  created_at: string;
  updated_at?: string | null;
  
  // Status & Audit Trail
  is_active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}