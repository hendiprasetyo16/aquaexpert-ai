// features/diseases/services/disease-match.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import type { Disease, Symptom, DiseaseMatchResult } from "../types/disease.types";
import { runDiagnosisEngine } from "@/features/ai/services/diagnosis-engine";
import { WaterInferenceService } from "@/features/ai/services/WaterInferenceService";
import type { DiseaseInput, DiagnosisModifier, RuleType } from "@/features/ai/types/diagnosis.types";

let cachedTotalDiseases: number | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; 

export async function getDiseaseMatchAction(
  aquariumId: string, 
  selectedSymptomIds: string[], 
  lang: 'id' | 'en' = 'en'
): Promise<{ success: boolean; matches?: DiseaseMatchResult[]; inferredRootCauses?: string[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') {
       await verifyAquariumOwnership(supabase, aquariumId, user.id);
    }

    if (!selectedSymptomIds || selectedSymptomIds.length === 0) return { success: true, matches: [] };

    const { data: inventoryFishes } = await supabase.from("aquarium_fishes").select("fish_id").eq("aquarium_id", aquariumId);
    const tankFishIds = Array.from(new Set(inventoryFishes?.map(f => f.fish_id) || []));

    const { data: initialCandidates, error: candError } = await supabase
      .from("disease_symptom_rules")
      .select("disease_id")
      .in("symptom_id", selectedSymptomIds)
      .neq("rule_type", "EXCLUDED");

    if (candError || !initialCandidates) throw new Error(lang === 'id' ? "Gagal mengidentifikasi kandidat." : "Failed to identify candidates.");
    
    const candidateDiseaseIds = Array.from(new Set(initialCandidates.map(c => c.disease_id)));
    if (candidateDiseaseIds.length === 0) return { success: true, matches: [] };

    const { data: fullDiseaseRules, error: rulesError } = await supabase
      .from("disease_symptom_rules")
      .select(`
        disease_id,
        symptom_id,
        weight,
        rule_type,
        symptoms (*),
        diseases (*)
      `)
      .in("disease_id", candidateDiseaseIds);

    if (rulesError || !fullDiseaseRules) throw new Error(lang === 'id' ? "Gagal memetakan aturan patologi." : "Failed to map pathology rules.");

    const uniqueRuleSymptomIds = Array.from(new Set(fullDiseaseRules.map(ds => ds.symptom_id)));
    const allRelevantSymptomIds = Array.from(new Set([...uniqueRuleSymptomIds, ...selectedSymptomIds]));

    const { data: symptomOccurrences } = await supabase
      .from("disease_symptom_rules")
      .select("symptom_id")
      .in("symptom_id", allRelevantSymptomIds);

    const dfRecord: Record<string, number> = {};
    symptomOccurrences?.forEach(row => { dfRecord[row.symptom_id] = (dfRecord[row.symptom_id] || 0) + 1; });

    const modifiers: DiagnosisModifier[] = [];
    if (tankFishIds.length > 0) {
      const { data: fishRelations } = await supabase.from("fish_disease_relations").select("disease_id, susceptibility_score, notes_id, notes_en").in("fish_id", tankFishIds);
      if (fishRelations) {
        fishRelations.forEach(rel => {
          modifiers.push({ diseaseId: rel.disease_id, type: 'SPECIES_GENETICS', score: rel.susceptibility_score, warningCode: lang === 'id' ? rel.notes_id : rel.notes_en });
        });
      }
    }

    const { data: latestParams } = await supabase.from("aquarium_parameters").select("temperature, ammonia, nitrite, ph").eq("aquarium_id", aquariumId).order("record_date", { ascending: false }).limit(1).single();
    if (latestParams) {
      let waterScore = 0; let tempScore = 0; const waterWarnings: string[] = []; const tempWarnings: string[] = [];
      const ammonia = Number(latestParams.ammonia ?? 0); const nitrite = Number(latestParams.nitrite ?? 0);
      if (ammonia >= 0.5 || nitrite >= 0.5) { waterScore = 5; waterWarnings.push(lang === 'id' ? `Ammonia/Nitrit beracun (${ammonia}/${nitrite} ppm)` : `Toxic Ammonia/Nitrite (${ammonia}/${nitrite} ppm)`); } 
      else if (ammonia > 0 || nitrite > 0) { waterScore = 3; waterWarnings.push(lang === 'id' ? "Ada jejak Ammonia/Nitrit" : "Traces of Ammonia/Nitrite"); }
      const temp = Number(latestParams.temperature ?? 26);
      if (latestParams.temperature !== null) {
        if (temp < 24) { tempScore = 4; tempWarnings.push(lang === 'id' ? `Suhu terlalu dingin (${temp}°C)` : `Water too cold (${temp}°C)`); } 
        else if (temp > 30) { tempScore = 4; tempWarnings.push(lang === 'id' ? `Suhu terlalu panas (${temp}°C)` : `Water too hot (${temp}°C)`); }
      }
      if (waterScore > 0 || tempScore > 0) {
        candidateDiseaseIds.forEach(dId => {
          if (waterScore > 0) modifiers.push({ diseaseId: dId, type: 'WATER_QUALITY', score: waterScore, warningCode: waterWarnings.join(', ') });
          if (tempScore > 0) modifiers.push({ diseaseId: dId, type: 'TEMPERATURE', score: tempScore, warningCode: tempWarnings.join(', ') });
        });
      }
    }

    const diseaseInputMap = new Map<string, DiseaseInput>();
    const originalDiseaseObjects = new Map<string, Disease>(); 
    const originalSymptomObjects = new Map<string, Symptom>(); 

    fullDiseaseRules.forEach(row => {
      const dId = row.disease_id;
      const sId = row.symptom_id;
      
      if (!diseaseInputMap.has(dId)) {
        const rawDisease = row.diseases as unknown as Disease; 
        diseaseInputMap.set(dId, {
          id: dId, name: lang === 'id' ? rawDisease.name_id : rawDisease.name_en, prevalence_prior: rawDisease.prevalence_prior || 0,
          rules: [] 
        });
        originalDiseaseObjects.set(dId, rawDisease);
      }

      if (!originalSymptomObjects.has(sId)) {
        const rawSymptom = row.symptoms as unknown as Symptom;
        originalSymptomObjects.set(sId, rawSymptom);
      }

      const symData = originalSymptomObjects.get(sId)!;
      diseaseInputMap.get(dId)!.rules.push({
        id: sId,
        weight: row.weight,
        rule_type: row.rule_type as RuleType,
        name_id: symData.name_id, 
        name_en: symData.name_en
      });
    });

    if (!cachedTotalDiseases || Date.now() - lastCacheTime > CACHE_TTL) {
      const { count } = await supabase.from("diseases").select("*", { count: 'exact', head: true });
      cachedTotalDiseases = count ?? 85;
      lastCacheTime = Date.now();
    }

    const rawSelectedSymptoms = selectedSymptomIds.map(id => originalSymptomObjects.get(id)).filter(Boolean) as Symptom[];
    const inferredWaterIssues = WaterInferenceService.infer(rawSelectedSymptoms);

    const diagnosisEngineResults = runDiagnosisEngine(
      selectedSymptomIds, Array.from(diseaseInputMap.values()), modifiers,
      { totalDiseasesCount: cachedTotalDiseases, allSymptomOccurrences: dfRecord }
    );

    const finalMatches: DiseaseMatchResult[] = diagnosisEngineResults.map(res => {
      const rawDisease = originalDiseaseObjects.get(res.diseaseId)!;
      const rawMatchedSymptoms = res.matchedSymptoms.map(rule => originalSymptomObjects.get(rule.id)!);

      return {
        disease: rawDisease,
        confidenceScore: res.confidenceScore,
        matchedSymptoms: rawMatchedSymptoms,
        susceptibilityWarning: res.modifierWarnings.length > 0 ? res.modifierWarnings.join(" | ") : null,
        differentialDiagnosis: res.differentialDiagnosis, 
        aiMetrics: res.metrics,
        explanations: res.explanations,
        status: res.status // 💡 Mapping status V7 terjamin ke UI
      } as DiseaseMatchResult; 
    });

    return { success: true, matches: finalMatches, inferredRootCauses: inferredWaterIssues };

  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Internal failure occurred." };
  }
}