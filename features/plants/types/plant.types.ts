export interface Plant {
  id: string;
  name: string;
  scientific_name?: string;

  light_requirement?: string;
  co2_requirement?: string;
  fertilizer_requirement?: string;

  placement?: string;
  difficulty?: string;
  growth_rate?: string;

  ph_min?: number;
  ph_max?: number;

  temperature_min?: number;
  temperature_max?: number;

  description?: string;
  image_url?: string;

  created_at: string;
  updated_at?: string;
  is_active?: boolean; // Tambahan untuk Soft Delete
}