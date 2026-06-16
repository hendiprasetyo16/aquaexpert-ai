// features/aquariums/types/inventory.types.ts

export interface TankFish {
  id: string;
  aquarium_id: string;
  name: string;
  quantity: number;
  // Field baru untuk menunjang Health Engine V2
  estimated_adult_size_cm?: number | null; 
}

export interface TankPlant {
  id: string;
  aquarium_id: string;
  name: string;
  quantity: number;
}