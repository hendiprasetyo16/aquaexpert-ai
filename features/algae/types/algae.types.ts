// features/algae/types/algae.types.ts

export interface Algae {
  id: string;
  slug: string;
  
  name_id: string;
  name_en: string;
  alias: string | null;
  scientific_name: string | null;
  
  description_id: string | null;
  description_en: string | null;
  
  causes_id: string[];
  causes_en: string[];
  
  solutions_id: string[];
  solutions_en: string[];
  
  color_tags: string[];     
  texture_tags: string[];   
  location_tags: string[];  
  trigger_tags: string[];   
  
  difficulty: string | null;
  severity: number; 
  
  image_url: string | null;
  gallery_urls: string[] | null;

  // --- ATRIBUT BARU DARI SQL ---
  affected_conditions: string[] | null;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}