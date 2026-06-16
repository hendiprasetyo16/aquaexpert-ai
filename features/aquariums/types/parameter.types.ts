// features/aquariums/types/parameter.types.ts

export interface AquariumParameterLog {
  id: string;
  aquarium_id: string;
  
  // Parameter Fisik & Kimiawi Utama (Dibutuhkan oleh Health Engine)
  temperature: number | null;
  ph: number | null;
  ammonia: number | null;
  nitrite: number | null; // Memastikan parameter nitrit terikat kuat di level type safety
  nitrate: number | null;
  
  // Parameter Penunjang Tambahan (Opsional)
  tds?: number | null;
  gh?: number | null;
  kh?: number | null;
  
  // Metadata Audit Trail
  test_method?: string | null; // e.g., 'Liquid Kit', 'Digital Meter', 'Test Strip'
  parameter_source?: string | null;
  notes?: string | null;
  
  created_at: string; // Digunakan sebagai fallback freshness check & sorting order DESC
  updated_at: string;
}

// Input payload saat melakukan penambahan parameter baru (Zod parsing match)
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