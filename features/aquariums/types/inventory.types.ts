// features/aquariums/types/inventory.types.ts

export interface TankFish {
  id: string;
  aquarium_id: string;
  name?: string;          // Opsional agar tidak bentrok dengan actions
  species_name?: string;  // Penyesuaian dengan kolom database asli
  quantity: number;
  estimated_adult_size_cm?: number | null; 
}

export interface TankPlant {
  id: string;
  aquarium_id: string;
  name?: string;          // Opsional
  species_name?: string;
  quantity: number;
}