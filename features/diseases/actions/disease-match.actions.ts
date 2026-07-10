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

    // ==========================================
    // 💡 THE GOLD STANDARD: MENGHITUNG GLOBAL IDF (Inverse Disease Frequency)
    // ==========================================
    // 1. Ambil total populasi penyakit (N)
    const { count: totalDiseases } = await supabase.from("diseases").select('*', { count: 'exact', head: true });
    const N = totalDiseases || 20; // Fallback aman

    // 2. Kumpulkan seluruh ID Gejala yang relevan (Kandidat + Pilihan User)
    const uniqueCandidateSymptomIds = Array.from(new Set(fullDiseaseSignatures.map(ds => ds.symptom_id)));
    const allRelevantSymptomIds = Array.from(new Set([...uniqueCandidateSymptomIds, ...selectedSymptomIds]));

    // 3. Hitung DF (Disease Frequency): Gejala ini muncul di berapa penyakit?
    const { data: symptomOccurrences } = await supabase
      .from("disease_symptoms")
      .select("symptom_id")
      .in("symptom_id", allRelevantSymptomIds);

    const dfMap = new Map<string, number>();
    symptomOccurrences?.forEach(row => {
      dfMap.set(row.symptom_id, (dfMap.get(row.symptom_id) || 0) + 1);
    });

    // 4. Kalkulasi IDF (Menggunakan Logaritma Basis 10 + Smoothing)
    const idfMap = new Map<string, number>();
    allRelevantSymptomIds.forEach(sId => {
      const df = dfMap.get(sId) || 1;
      const idf = Math.log10(N / df) + 1; // Gejala spesifik (DF kecil) akan mendapat IDF > 1.5, gejala pasaran ~1.0
      idfMap.set(sId, idf);
    });

    // ==========================================
    // 💡 SUSCEPTIBILITY MAPPING
    // ==========================================
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

    // ==========================================
    // 💡 PROFILE MAPPING (TF-IDF WEIGHTING)
    // ==========================================
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
          totalPossibleWeight: 0, // Akan diisi Bobot TF-IDF
          matchedWeight: 0,
          matchedSymptoms: [],
          totalHallmarksCount: 0,
          matchedHallmarksCount: 0,
          totalDiseaseSymptomIds: new Set()
        });
      }

      const p = profileMap.get(dId)!;
      const tf = ds.weight; // Term Frequency (Bobot Statis dari Database)
      const idf = idfMap.get(ds.symptom_id) || 1; // Keunikan Global
      const tfIdfWeight = tf * idf; // Kekuatan Mutlak Gejala

      p.totalPossibleWeight += tfIdfWeight;
      p.totalDiseaseSymptomIds.add(ds.symptom_id);
      
      if (ds.is_hallmark) p.totalHallmarksCount++;

      if (isSelected) {
        p.matchedWeight += tfIdfWeight;
        p.matchedSymptoms.push(sData);
        if (ds.is_hallmark) p.matchedHallmarksCount++;
      }
    });

    const results: DiseaseMatchResult[] = [];
    const selectedSet = new Set(selectedSymptomIds);
    
    // Total Kekuatan Gejala (IDF) yang dipilih pengguna
    const totalUserSelectedIDF = selectedSymptomIds.reduce((sum, sId) => sum + (idfMap.get(sId) || 1), 0);

    // ==========================================
    // 💡 DIAGNOSIS ENGINE CALCULATION (VERSI FINAL 10/10)
    // ==========================================
    profileMap.forEach((p, diseaseId) => {
      
      // 1. TF-IDF WEIGHTED RECALL
      // Bukti fisik utama (Proporsi bobot tercapai)
      const recall = p.totalPossibleWeight > 0 ? (p.matchedWeight / p.totalPossibleWeight) : 0;
      
      // 2. IDF WEIGHTED PRECISION
      // Menghukum klik brutal: Berapa porsi klik user yang BENAR berharga?
      const matchedUserIDF = p.matchedSymptoms.reduce((sum, sym) => sum + (idfMap.get(sym.id) || 1), 0);
      const precision = totalUserSelectedIDF > 0 ? (matchedUserIDF / totalUserSelectedIDF) : 0;

      // 3. COVERAGE
      // Menghalangi Recall memonopoli jika variasi gejalanya kurang
      const coverage = p.totalHallmarksCount > 0 
        ? (p.matchedHallmarksCount / p.totalHallmarksCount)
        : (p.matchedSymptoms.length / p.totalDiseaseSymptomIds.size);
      
      // 🚀 4. RUMUS HIBRIDA (65% Recall + 25% Precision + 10% Coverage)
      // Dominasi Recall disempurnakan seperti di ranah medis nyata.
      let baseConfidence = ((0.65 * recall) + (0.25 * precision) + (0.10 * coverage)) * 100;
      
      // 🚀 5. HALLMARK MULTIPLIER PROPORSIONAL (Maksimal x 1.08)
      // Multiplier kini diturunkan ke 0.08 agar kenaikannya jauh lebih natural dan tidak meledak tiba-tiba.
      const hallmarkRatio = p.totalHallmarksCount > 0 ? (p.matchedHallmarksCount / p.totalHallmarksCount) : 0;
      if (hallmarkRatio > 0) {
        baseConfidence *= (1 + (hallmarkRatio * 0.08)); 
      }

      // 💡 6. QUADRATIC ALIEN PENALTY (Alien^2 * 2)
      // 1 salah = -2 | 2 salah = -8 | 3 salah = -18 | 4 salah = -32
      const alienSymptomCount = selectedSet.size - p.matchedSymptoms.length;
      const negativePenalty = Math.pow(alienSymptomCount, 2) * 2; 

      // 💡 7. SUSCEPTIBILITY BONUS (Dibatasi Maksimal 5 Poin)
      // Faktor keturunan ras ikan tidak akan mendominasi fakta klinis!
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
      
      // Clamp nilai persentase secara mutlak (0 - 100)
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

    // Mengurutkan dari hasil paling pasti hingga yang terlemah
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