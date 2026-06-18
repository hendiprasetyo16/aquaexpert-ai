// features/diseases/repositories/disease.repository.ts
import { createClient } from "@/lib/supabase/client";
import { Disease } from "../types/disease.types";

const DISEASE_COLUMNS = `
  id, slug, name_id, name_en, 
  disease_category, severity, difficulty, mortality_risk, urgency_level,
  symptom_tags, visual_tags, water_trigger_tags, affected_body_parts, affected_species,
  transmissible, quarantine_required, medication_tags,
  disease_stage, treatment_duration_days, recovery_probability, emergency_actions,
  symptoms_id, symptoms_en, treatments_id, treatments_en, 
  prevention_id, prevention_en, expert_notes_id, expert_notes_en, 
  image_url, gallery_urls, is_active, created_at, updated_at
`;

// ... (fungsi CRUD lainnya tetap sama persis, hanya query string di atas yang berubah)
export async function getDiseases(): Promise<Disease[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("diseases").select(DISEASE_COLUMNS).eq("is_active", true).order("name_id");
  if (error) { console.error(error); return []; }
  return (data ?? []) as Disease[];
}