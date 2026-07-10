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

    if (invError) throw new Error(lang === 'id' ? "Gagal mengambil data inventaris ikan." : "Failed to fetch fish inventory data.");
    const tankFishIds = Array.from(new Set(inventoryFishes?.map(f => f.fish_id) || []));

    const { data: initialCandidates, error: candError } = await supabase
      .from("disease_symptoms")
      .select("disease_id")
      .in("symptom_id", selectedSymptomIds);

    if (candError || !initialCandidates) throw new Error(lang === 'id' ? "Gagal mengidentifikasi kandidat penyakit." : "Failed to identify disease candidates.");
    
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

    if (signatureError || !fullDiseaseSignatures) throw new Error(lang === 'id' ? "Gagal memetakan profil patologi." : "Failed to map pathology profiles.");

    const susceptibilityMap = new Map<string, { score: number; note_id: string | null; note_en: string | null }>(); 
    
    if (tankFishIds.length > 0) {
      const { data: fishRelations } = await supabase
        .from("fish_disease_relations")
        .select("disease_id, susceptibility_score, notes_id, notes_en")
        .in("fish_id", tankFishIds);

      if (fishRelations) {
        fishRelations.forEach(rel => {
          const currentData = susceptibilityMap.get(rel.disease_id);
          const currentMaxScore = currentData ? currentData.score : 0;
          
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
      totalHallmarksCount: number;
      matchedHallmarksCount: number;
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
          totalHallmarksCount: 0,
          matchedHallmarksCount: 0,
          totalDiseaseSymptomIds: new Set()
        });
      }

      const p = profileMap.get(dId)!;
      p.totalPossibleWeight += ds.weight;
      p.totalDiseaseSymptomIds.add(ds.symptom_id);
      
      if (ds.is_hallmark) p.totalHallmarksCount++;

      if (isSelected) {
        p.matchedWeight += ds.weight;
        p.matchedSymptoms.push(sData);
        if (ds.is_hallmark) p.matchedHallmarksCount++;
      }
    });

    const results: DiseaseMatchResult[] = [];
    const selectedSet = new Set(selectedSymptomIds);

    profileMap.forEach((p, diseaseId) => {
      
      // 💡 1. RECALL: Akurasi Bobot Gejala (0 - 1)
      const recall = p.totalPossibleWeight > 0 ? (p.matchedWeight / p.totalPossibleWeight) : 0;
      
      // 💡 2. PRECISION: Akurasi Tebakan Pengguna (0 - 1)
      const precision = selectedSet.size > 0 ? (p.matchedSymptoms.length / selectedSet.size) : 0;

      // 💡 3. COVERAGE: Persentase Gejala Khas/Umum yang Muncul
      const coverage = p.totalHallmarksCount > 0 
        ? (p.matchedHallmarksCount / p.totalHallmarksCount)
        : (p.matchedSymptoms.length / p.totalDiseaseSymptomIds.size);
      
      // 🚀 4. RUMUS HIBRIDA FINAL (60% Recall + 30% Precision + 10% Coverage)
      // Distribusi ini jauh lebih stabil dan mencegah double-dipping pada coverage.
      let baseConfidence = ((0.60 * recall) + (0.30 * precision) + (0.10 * coverage)) * 100;
      
      // 🚀 5. HALLMARK MULTIPLIER PROPORSIONAL (Maksimal x 1.12)
      // Pengganda kini linier dan proporsional sesuai jumlah hallmark yang berhasil ditemukan.
      const hallmarkRatio = p.totalHallmarksCount > 0 ? (p.matchedHallmarksCount / p.totalHallmarksCount) : 0;
      if (hallmarkRatio > 0) {
        baseConfidence *= (1 + (hallmarkRatio * 0.12)); 
      }

      // 💡 6. ALIEN PENALTY (Kuadratik)
      let alienSymptomCount = 0;
      selectedSet.forEach(sId => {
        if (!p.totalDiseaseSymptomIds.has(sId)) {
          alienSymptomCount++;
        }
      });
      const negativePenalty = Math.pow(alienSymptomCount, 2) * 2; 

      // 💡 7. SUSCEPTIBILITY BONUS (Dibatasi Maksimal 5 Poin)
      const susData = susceptibilityMap.get(diseaseId);
      const susceptibilityScore = susData ? susData.score : 0;
      
      let susceptibilityBonus = 0;
      let susceptibilityWarning = null;

      if (susceptibilityScore >= 4) {
        susceptibilityBonus = Math.min(5, susceptibilityScore * 0.5); 
        
        const baseWarning = lang === 'id' 
          ? "Peringatan Kritis: Spesies di tangki Anda memiliki kerentanan genetik terhadap patogen ini."
          : "Critical Warning: Species in your tank have a genetic susceptibility to this pathogen.";
          
        const dbNote = lang === 'id' ? susData?.note_id : susData?.note_en;
        const expertLabel = lang === 'id' ? "Catatan Pakar" : "Expert Note";
        
        if (dbNote) {
          susceptibilityWarning = `${baseWarning} [${expertLabel}: ${dbNote}]`;
        } else {
          susceptibilityWarning = baseWarning;
        }
      }

      // 💡 8. FINAL CALCULATION
      let finalConfidence = baseConfidence + susceptibilityBonus - negativePenalty;
      
      // Clamp nilai agar selalu berada di antara 0 - 100
      finalConfidence = Math.max(0, Math.min(100, Math.round(finalConfidence)));

      if (finalConfidence >= 10) {
        results.push({
          disease: p.disease,
          confidenceScore: finalConfidence,
          matchedSymptoms: p.matchedSymptoms,
          susceptibilityWarning
        });
      }
    });

    results.sort((a, b) => b.confidenceScore - a.confidenceScore);
    return { success: true, matches: results };

  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error 
        ? error.message 
        : (lang === 'id' ? "Terjadi kegagalan fungsi internal pada Sistem Pakar." : "Internal failure occurred in the Expert System.")
    };
  }
}