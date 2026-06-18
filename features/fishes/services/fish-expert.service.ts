// features/fishes/services/fish-expert.service.ts
import { Fish } from "../types/fish.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface ExistingFishRecord {
  fish: Fish;
  quantity: number;
}

export interface UserFishAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankVolumeLiters: number;
  tankLengthCm: number; 
  currentPH: number;
  currentTemp: number;
  currentGH?: number; 
  wantSchoolingFish: boolean;
  fishTypePref: string;
  hasShrimp: boolean; 
  hasPlants: boolean; 
  aquascapeStyle: string; 
  existingFishes: ExistingFishRecord[]; // UPGRADE V4: Array ikan yang sudah ada di tangki
}

export interface RecommendedFish extends Fish {
  matchScore: number;
  matchReasons: string[];
  matchConfidenceKey: ConfidenceKey;
}

export interface FishExpertDictionary {
  reasonTankSizeOK: string;
  reasonTankSizeBad: string;
  reasonPHMatch: string;
  reasonPHMismatch: string;
  reasonTempMatch: string;
  reasonTempMismatch: string;
  reasonSchooling: string;
  reasonBeginnerFriendly: string;
  reasonExpertOnly: string;
  reasonCompatibility: string;
  reasonGHMatch?: string;     
  reasonGHMismatch?: string;  
  reasonBioloadBad?: string;  
  reasonNotPlantSafe?: string; 
  reasonStyleMatch?: string;    
  reasonActivityNeedsSpace?: string; 
  reasonLayerBalance?: string; 
  reasonLayerCrowded?: string; // V4
  reasonPredatorRisk?: string; // V4
  reasonPreyRisk?: string;     // V4
  reasonFinNipperRisk?: string;// V4
}

export function generateFishRecommendations(
  allFishes: Fish[], 
  answers: UserFishAnswers, 
  dictEE: FishExpertDictionary
): RecommendedFish[] {
  const rawEvaluations: RawEvaluation<Fish>[] = [];

  // V4 PRE-CALCULATION: Kalkulasi Kepadatan Layer (Layer Density) & Total Bioload Lama
  const layerBioload: Record<string, number> = { "Top": 0, "Middle": 0, "Bottom": 0, "All Levels": 0 };
  let currentTotalBioload = 0;

  answers.existingFishes.forEach(record => {
    const size = record.fish.estimated_adult_size_cm || 5;
    const factor = record.fish.bioload_factor || 1;
    const load = size * factor * record.quantity;
    const layer = record.fish.water_layer || "Middle";
    
    if (layerBioload[layer] !== undefined) layerBioload[layer] += load;
    currentTotalBioload += load;
  });

  for (const fish of allFishes) {
    let score = 0;
    let reasons: string[] = [];
    let isFatal = false; 

    // Cek apakah ikan ini sudah ada di dalam tank (jangan rekomendasikan ulang sebagai spesies "baru")
    if (answers.existingFishes.some(ef => ef.fish.id === fish.id)) {
      continue;
    }

    const candidateSize = fish.estimated_adult_size_cm || 5;
    const candidateTempScore = fish.temperament_score || 2;

    // ==========================================
    // TAHAP A: V4 EXISTING FISH COMPATIBILITY (HUKUM RIMBA)
    // ==========================================
    
    for (const record of answers.existingFishes) {
      const existingSize = record.fish.estimated_adult_size_cm || 5;
      const existingTempScore = record.fish.temperament_score || 2;

      // 1. PREDATOR CHECK: Apakah ikan KANDIDAT akan memakan ikan LAMA?
      // Jika kandidat agresif (>=4) dan ukurannya 2x lipat lebih besar dari ikan lama = FATAL
      if (candidateTempScore >= 4 && candidateSize > existingSize * 2) {
        isFatal = true;
        break;
      }

      // 2. PREY CHECK: Apakah ikan LAMA akan memakan ikan KANDIDAT?
      // Jika ikan lama agresif (>=4) dan ukurannya 2x lipat lebih besar dari kandidat = FATAL
      if (existingTempScore >= 4 && existingSize > candidateSize * 2) {
        isFatal = true;
        break;
      }

      // 3. FIN NIPPER CHECK: Barb/Tetra Jahil vs Ikan Sirip Panjang (Betta/Angelfish)
      if (fish.fish_type === "Betta" && record.fish.fish_type === "Barb") {
        score -= 40;
        reasons.push(dictEE.reasonFinNipperRisk || "BERBAHAYA: Sirip ikan ini akan digigit oleh kawanan Barb yang sudah ada.");
      } else if (record.fish.fish_type === "Betta" && fish.fish_type === "Barb") {
        score -= 40;
        reasons.push(dictEE.reasonFinNipperRisk || "BERBAHAYA: Ikan ini berisiko menggigit sirip Cupang/Angelfish Anda.");
      }
    }

    // ==========================================
    // TAHAP B: HARD FILTERS LAMA (Shrimp, Plant, Predator Rule)
    // ==========================================

    if (answers.hasShrimp && fish.shrimp_safe === false) isFatal = true;

    if (answers.hasPlants && fish.plant_safe === false) {
      if (answers.aquascapeStyle === "Dutch" || answers.aquascapeStyle === "Nature") isFatal = true;
      else {
        score -= 60;
        reasons.push(dictEE.reasonNotPlantSafe || "BERBAHAYA: Berisiko merusak tanaman aquascape Anda.");
      }
    }

    if (answers.fishTypePref === "Community Tank" && candidateTempScore >= 4) isFatal = true; 

    if (isFatal) continue; 

    // ==========================================
    // TAHAP C: V4 WATER LAYER CAPACITY & DYNAMIC BIOLOAD
    // ==========================================
    
    // TANK SIZE PENALTY
    if (fish.min_tank_size && answers.tankVolumeLiters < fish.min_tank_size) {
      const deficit = fish.min_tank_size - answers.tankVolumeLiters;
      score -= Math.min(50, deficit * 0.8);
      reasons.push(dictEE.reasonTankSizeBad || "Volume tangki kurang dari kebutuhan minimal spesies ini.");
    } else if (fish.min_tank_size && answers.tankVolumeLiters >= fish.min_tank_size * 2) {
      score += 15; 
      reasons.push(dictEE.reasonTankSizeOK);
    }

    // DYNAMIC BIOLOAD V4 (Kotoran Ikan Lama + Kotoran Ikan Baru)
    const candidateGroupSize = fish.schooling ? (fish.min_group_size || 6) : 1;
    const candidateLoad = candidateSize * (fish.bioload_factor || 1) * candidateGroupSize;
    const projectedTotalBioload = currentTotalBioload + candidateLoad;

    if (answers.tankVolumeLiters < projectedTotalBioload) {
       const bioloadDeficit = projectedTotalBioload - answers.tankVolumeLiters;
       score -= Math.min(60, bioloadDeficit * 0.5);
       reasons.push(dictEE.reasonBioloadBad || "Kapasitas filtrasi tangki Anda sudah maksimal/overstock.");
    }

    // V4 WATER LAYER BALANCING
    const layer = fish.water_layer || "Middle";
    if (layer !== "All Levels") {
      // Asumsi: Satu layer dianggap "padat" jika menyumbang >40% dari volume tangki
      const layerCapacityMax = answers.tankVolumeLiters * 0.4; 
      
      if (layerBioload[layer] >= layerCapacityMax) {
        score -= 20; // Hukuman karena layer ini sudah sesak
        reasons.push(dictEE.reasonLayerCrowded || `Area renang ${layer} sudah cukup padat oleh penghuni lama.`);
      } else if (layerBioload[layer] === 0) {
        score += 20; // Bonus besar karena mengisi slot yang benar-benar kosong
        reasons.push(dictEE.reasonLayerBalance || `Sempurna untuk mengisi area ${layer} yang masih kosong di akuarium Anda.`);
      } else {
        score += 5; // Layer ada isinya tapi belum penuh
      }
    }

    // ACTIVITY vs TANK LENGTH 
    if (fish.activity_level === "High" && answers.tankLengthCm < 80) {
      score -= 25; 
      reasons.push(dictEE.reasonActivityNeedsSpace || "Ikan hiperaktif ini butuh panjang akuarium (horizontal) minimal 80cm untuk sprint.");
    }

    // STYLE MATCHING
    if (answers.aquascapeStyle !== "Bebas" && fish.recommended_tank_styles?.includes(answers.aquascapeStyle)) {
      score += 15;
      reasons.push(dictEE.reasonStyleMatch || `Sangat direkomendasikan secara estetika untuk gaya ${answers.aquascapeStyle}.`);
    }

    // ==========================================
    // TAHAP D: PARAMETER AIR (pH, Temp, GH)
    // ==========================================

    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH >= fish.ideal_ph_min && answers.currentPH <= fish.ideal_ph_max) {
        score += 15;
        reasons.push(dictEE.reasonPHMatch);
      } else {
        const phDiff = Math.min(Math.abs(answers.currentPH - fish.ideal_ph_min), Math.abs(answers.currentPH - fish.ideal_ph_max));
        if (phDiff > 1.5) score -= 40; else score -= (phDiff * 10); 
        reasons.push(dictEE.reasonPHMismatch);
      }
    }

    if (fish.ideal_temp_min && fish.ideal_temp_max) {
      if (answers.currentTemp >= fish.ideal_temp_min && answers.currentTemp <= fish.ideal_temp_max) {
        score += 15;
        reasons.push(dictEE.reasonTempMatch);
      } else {
        const tempDiff = Math.min(Math.abs(answers.currentTemp - fish.ideal_temp_min), Math.abs(answers.currentTemp - fish.ideal_temp_max));
        score -= (tempDiff * 5);
        reasons.push(dictEE.reasonTempMismatch);
      }
    }

    if (fish.hardness_min && fish.hardness_max && answers.currentGH) {
      if (answers.currentGH >= fish.hardness_min && answers.currentGH <= fish.hardness_max) {
        score += 10;
        reasons.push(dictEE.reasonGHMatch || "Tingkat kekerasan air (GH) ideal.");
      } else {
        score -= 15;
        reasons.push(dictEE.reasonGHMismatch || "Tingkat kekerasan air (GH) kurang sesuai.");
      }
    }

    // ==========================================
    // TAHAP E: PENGALAMAN & KELOMPOK
    // ==========================================
    
    if (answers.experience === "Pemula") {
      if (fish.difficulty === "Easy") { score += 20; reasons.push(dictEE.reasonBeginnerFriendly); } 
      else if (fish.difficulty === "Hard") { score -= 40; }
    } else if (answers.experience === "Mahir" && fish.difficulty === "Hard") {
      score += 15; reasons.push(dictEE.reasonExpertOnly);
    } 

    if (answers.wantSchoolingFish && fish.schooling) {
      score += 15; reasons.push(`${dictEE.reasonSchooling} (Min: ${fish.min_group_size || 6})`);
    } else if (!answers.wantSchoolingFish && fish.schooling) {
      score -= 15; 
    }

    if (answers.fishTypePref === "Community Tank") {
      if (candidateTempScore <= 2) { score += 15; reasons.push(dictEE.reasonCompatibility); } 
    } else if (answers.fishTypePref === "Semi-Aggressive") {
      if (candidateTempScore === 3 || candidateTempScore === 4) { score += 15; reasons.push(dictEE.reasonCompatibility); } 
      else if (candidateTempScore === 5) { score -= 30; }
    } else if (answers.fishTypePref === "Species Only") {
      if (candidateTempScore >= 4) { score += 15; reasons.push(dictEE.reasonCompatibility); }
    }

    if (score < 0) score = 0;
    rawEvaluations.push({ item: fish, rawScore: score, reasons });
  }

  const processedResults = processExpertResults(rawEvaluations, 25);

  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}