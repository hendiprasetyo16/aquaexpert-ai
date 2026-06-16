// features/aquariums/types/parameter.types.ts

export interface AquariumParameterLog {
  id: string;
  aquarium_id: string;
  
  temperature: number | null;
  ph: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  
  tds?: number | null;
  gh?: number | null;
  kh?: number | null;
  
  test_method?: string | null;
  parameter_source?: string | null;
  notes?: string | null;
  
  created_at: string;
  updated_at?: string; // Dibuat opsional agar tidak memicu error dari Actions
}

export interface CreateParameterInput {
  aquarium_id: string;
  temperature?: number | null;
  ph?: number | null;
  tds?: number | null;
  gh?: number | null;
  kh?: number | null;
  ammonia?: number | null;
  nitrite?: number | null;
  nitrate?: number | null;
  notes?: string | null;
  test_method?: string | null;
}