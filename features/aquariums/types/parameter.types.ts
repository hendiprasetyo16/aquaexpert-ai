// features/aquariums/types/parameter.types.ts

export interface AquariumParameterLog {
  id: string;
  aquarium_id: string;
  record_date: string; // FIX: Wajib ada sesuai DB
  
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
  
  is_deleted: boolean; // FIX: Tipe boolean sesuai DB
  created_at: string;
}

export interface CreateParameterInput {
  aquarium_id: string;
  record_date?: string; // FIX: Bisa diinput manual
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