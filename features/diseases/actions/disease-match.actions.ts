// features/diseases/actions/disease-match.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import type { Disease, Symptom, DiseaseMatchResult } from "../types/disease.types";

export async function getDiseaseMatchAction(
  aquariumId: string, 
  selectedSymptomIds: string[], 
  lang: 'id' | 'en' = 'en'
): Promise<{ success: boolean; matches?: DiseaseMatchResult[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') {
       await verifyAquariumOwnership(supabase, aquariumId, user.id);
    }

    if (!selectedSymptomIds || selectedSymptomIds.length === 0) {
      return { success: true, matches: [] };
    }

    const { data: inventoryFishes, error: invError } = await supabase
      .from("aquarium_fishes")
      .select("fish_id")
      .eq("aquarium_id", aquariumId);

    if (invError) throw new Error("Gagal mengambil data inventaris ikan.");
    const tankFishIds = Array.from(new Set(inventoryFishes?.map(f => f.fish_id) || []));

    const { data: initialCandidates, error: candError } = await supabase
      .from("disease_symptoms")
      .select("disease_id")
      .in("symptom_id", selectedSymptomIds);

    if (candError || !initialCandidates) throw new Error("Gagal mengidentifikasi kandidat penyakit.");
    
    const candidateDiseaseIds = Array.from(new Set(initialCandidates.map(c => c.disease_id)));
    if (candidateDiseaseIds.length === 0) {
      return { success: true, matches: [] };
    }

    const { data: fullDiseaseSignatures, error: signatureError } = await supabase
      .from("disease_symptoms")
      .select(`
        disease_id,
        symptom_id,
        weight,
        is_hallmark,
        symptoms (*),
        diseases (*)
      `)
      .in("disease_id", candidateDiseaseIds);

    if (signatureError || !fullDiseaseSignatures) throw new Error("Gagal memetakan profil patologi.");

    // 💡 PENINGKATAN: Menyimpan Score beserta Catatan Pakar (Bilingual)
    const susceptibilityMap = new Map<string, { score: number; note_id: string | null; note_en: string | null }>(); 
    
    if (tankFishIds.length > 0) {
      // 💡 Kueri Supabase sekarang menarik notes_id dan notes_en
      const { data: fishRelations } = await supabase
        .from("fish_disease_relations")
        .select("disease_id, susceptibility_score, notes_id, notes_en")
        .in("fish_id", tankFishIds);

      if (fishRelations) {
        fishRelations.forEach(rel => {
          const currentData = susceptibilityMap.get(rel.disease_id);
          const currentMaxScore = currentData ? currentData.score : 0;
          
          // Selalu simpan peringatan dengan skor kerentanan paling tinggi di akuarium tersebut
          if (rel.susceptibility_score > currentMaxScore) {
            susceptibilityMap.set(rel.disease_id, {
              score: rel.susceptibility_score,
              note_id: rel.notes_id,
              note_en: rel.notes_en
            });
          }
        });
      }
    }

    const profileMap = new Map<string, {
      disease: Disease;
      totalPossibleWeight: number;
      matchedWeight: number;
      matchedSymptoms: Symptom[];
      hasMatchedHallmark: boolean;
      totalDiseaseSymptomIds: Set<string>;
    }>();

    fullDiseaseSignatures.forEach(ds => {
      const dId = ds.disease_id;
      const dData = ds.diseases as unknown as Disease;
      const sData = ds.symptoms as unknown as Symptom;
      const isSelected = selectedSymptomIds.includes(ds.symptom_id);

      if (!profileMap.has(dId)) {
        profileMap.set(dId, {
          disease: dData,
          totalPossibleWeight: 0,
          matchedWeight: 0,
          matchedSymptoms: [],
          hasMatchedHallmark: false,
          totalDiseaseSymptomIds: new Set()
        });
      }

      const p = profileMap.get(dId)!;
      p.totalPossibleWeight += ds.weight;
      p.totalDiseaseSymptomIds.add(ds.symptom_id);

      if (isSelected) {
        p.matchedWeight += ds.weight;
        p.matchedSymptoms.push(sData);
        if (ds.is_hallmark) p.hasMatchedHallmark = true;
      }
    });

    const results: DiseaseMatchResult[] = [];
    const selectedSet = new Set(selectedSymptomIds);

    profileMap.forEach((p, diseaseId) => {
      const baseConfidence = (p.matchedWeight / p.totalPossibleWeight) * 100;
      let alienSymptomCount = 0;
      
      selectedSet.forEach(sId => {
        if (!p.totalDiseaseSymptomIds.has(sId)) {
          alienSymptomCount++;
        }
      });

      const negativePenalty = alienSymptomCount * 4;
      const hallmarkBonus = p.hasMatchedHallmark ? 20 : 0;
      
      // 💡 PENINGKATAN: Merakit Peringatan Dinamis berdasarkan Database
      const susData = susceptibilityMap.get(diseaseId);
      const susceptibilityScore = susData ? susData.score : 0;
      
      let susceptibilityBonus = 0;
      let susceptibilityWarning = null;

      if (susceptibilityScore >= 4) {
        susceptibilityBonus = susceptibilityScore * 2.5; 
        
        const baseWarning = lang === 'id' 
          ? "Peringatan Kritis: Terdapat spesies di tangki Anda yang memiliki kerentanan genetik tinggi terhadap patogen ini."
          : "Critical Warning: Your tank contains species highly susceptible to this specific pathogen.";
          
        const dbNote = lang === 'id' ? susData?.note_id : susData?.note_en;
        
        // Jika ada catatan tambahan di database, gabungkan!
        if (dbNote) {
          susceptibilityWarning = `${baseWarning} [Catatan Pakar: ${dbNote}]`;
        } else {
          susceptibilityWarning = baseWarning;
        }
      }

      let finalConfidence = baseConfidence + hallmarkBonus + susceptibilityBonus - negativePenalty;
      finalConfidence = Math.max(0, Math.min(100, Math.round(finalConfidence)));

      if (finalConfidence >= 10) {
        results.push({
          disease: p.disease,
          confidenceScore: finalConfidence,
          matchedSymptoms: p.matchedSymptoms,
          susceptibilityWarning // <-- Peringatan ini sekarang diambil langsung dari Supabase
        });
      }
    });

    results.sort((a, b) => b.confidenceScore - a.confidenceScore);
    return { success: true, matches: results };

  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kegagalan fungsi internal pada Disease Engine." };
  }
}