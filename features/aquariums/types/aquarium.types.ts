// features/aquariums/types/aquarium.types.ts

export interface Aquarium {
  id: string;
  user_id: string;

  name: string;
  image_url?: string | null;
  tank_type: string;
  aquascape_style?: string | null; // KOLOM BARU (Untuk Deep Diagnosis & Fish Expert)
  setup_date: string;
  is_primary: boolean;

  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_liters: number;

  substrate_type?: string | null;

  filter_type?: string | null;
  filter_capacity_lph?: number | null;

  light_type?: string | null;
  light_wattage?: number | null;
  photoperiod_hours?: number | null;

  co2_type?: string | null;
  co2_bps?: number | null;
  heater_enabled: boolean;

  water_change_percent?: number | null;
  water_change_interval_days?: number | null;

  fertilizer_type?: string | null;
  fertilizer_schedule?: string | null;

  is_active: boolean;
  created_at?: string;
  updated_at?: string;

  // RELASI
  aquarium_plants?: { id: string }[];
  aquarium_fishes?: { id: string }[];

  owner?: {
    id: string;
    email: string;
    full_name: string | null;
    last_login_at: string | null;
  };
}

// ----------------------------------------------------
// STRICT INPUT TYPES UNTUK MENCEGAH INJEKSI PAYLOAD
// ----------------------------------------------------
export interface CreateAquariumInput {
  name: string;
  tank_type: string;
  aquascape_style?: string | null; // KOLOM BARU
  setup_date: string;
  
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_liters: number;

  image_url?: string | null;
  is_primary?: boolean;

  substrate_type?: string | null;
  filter_type?: string | null;
  filter_capacity_lph?: number | null;
  light_type?: string | null;
  light_wattage?: number | null;
  photoperiod_hours?: number | null;
  co2_type?: string | null;
  co2_bps?: number | null;
  heater_enabled?: boolean;
  water_change_percent?: number | null;
  water_change_interval_days?: number | null;
  fertilizer_type?: string | null;
  fertilizer_schedule?: string | null;
}

export type UpdateAquariumInput = Partial<CreateAquariumInput> & {
  is_active?: boolean;
};

// ... (Interface lainnya tetap) ...
export interface AquariumParameter {
  id: string;
  aquarium_id: string;
  temperature?: number | null;
  ph?: number | null;
  tds?: number | null;
  gh?: number | null;
  kh?: number | null;
  ammonia?: number | null;
  nitrite?: number | null; // Cek sinkronisasi: Saya tambahkan untuk keselamatan
  nitrate?: number | null;
  test_method?: string | null;
  parameter_source?: string | null;
  notes?: string | null;
  recorded_at?: string;
}

export interface AquariumPlant {
  id: string;
  aquarium_id: string;
  plant_id: string;
  quantity: number;
  status: "Healthy" | "Melting" | "Algae-Covered";
  added_at?: string;
}

export interface AquariumFish {
  id: string;
  aquarium_id: string;
  fish_id?: string | null;
  species_name: string;
  quantity: number;
  health_status?: string | null;
  size_category?: string | null;
  added_at?: string;
}