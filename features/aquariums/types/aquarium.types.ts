// features/aquariums/types/aquarium.types.ts

export interface Aquarium {
  id: string;
  user_id: string;
  name: string;
  image_url?: string | null;
  tank_type: string;
  aquascape_style?: string | null; 
  setup_date: string;
  is_primary: boolean;

  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_liters: number;

  substrate_type?: string | null;
  filter_type?: string | null;
  filter_flow_lph?: number | null; 

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

  hardscape_type?: string[] | null;
  lid_present?: boolean | null;

  aquarium_plants?: { id: string }[];
  aquarium_fishes?: { id: string }[];

  owner?: {
    id: string;
    email: string;
    full_name: string | null;
    last_login_at: string | null;
  };
}

// STRICT INPUT TYPES UNTUK MENCEGAH INJEKSI PAYLOAD
export interface CreateAquariumInput {
  name: string;
  tank_type: string;
  aquascape_style?: string | null; 
  setup_date: string;
  
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_liters: number;

  image_url?: string | null;
  is_primary?: boolean;

  substrate_type?: string | null;
  hardscape_type?: string[] | null; // FIX: Ditambahkan
  lid_present?: boolean;            // FIX: Ditambahkan

  filter_type?: string | null;
  filter_flow_lph?: number | null;  // FIX: Disinkronkan (bukan capacity lagi)
  
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