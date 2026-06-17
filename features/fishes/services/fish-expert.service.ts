// features/fishes/services/fish-expert.service.ts
import { Fish } from "../types/fish.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface UserFishAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankVolumeLiters: number;
  tankLengthCm: number; // UPGRADE 1: Panjang tangki untuk ikan aktif
  currentPH: number;
  currentTemp: number;
  currentGH?: number; 
  wantSchoolingFish: boolean;
  fishTypePref: string;
  hasShrimp: boolean; 
  hasPlants: boolean; 
  aquascapeStyle: string; 
  existingFishLayers: string[]; // UPGRADE 4: Area ikan yang sudah ada (Top/Middle/Bottom)
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
  reasonLayerBalance?: string; // UPGRADE 4
}

export function generateFishRecommendations(
  allFishes: Fish[], 
  answers: UserFishAnswers, 
  dictEE: FishExpertDictionary
): RecommendedFish[] {
  const rawEvaluations: RawEvaluation<Fish>[] = [];

  for (const fish of allFishes) {
    let score = 0;
    let reasons: string[] = [];
    let isFatal = false; 

    // ==========================================
    // TAHAP A: HARD FILTERS (ATURAN FATAL / MUTLAK)
    // ==========================================

    // 1. FATAL SHRIMP SAFE (UPGRADE 2)
    // Jika user punya udang, ikan predator/iseng mutlak diskualifikasi.
    if (answers.hasShrimp && fish.shrimp_safe === false) {
      isFatal = true;
    }

    // 2. FATAL PLANT SAFE (UPGRADE 3)
    // Di tank Dutch/Nature yang full tanaman, ikan pemakan daun mutlak diskualifikasi.
    if (answers.hasPlants && fish.plant_safe === false) {
      if (answers.aquascapeStyle === "Dutch" || answers.aquascapeStyle === "Nature") {
        isFatal = true;
      } else {
        // Untuk style lain (misal Biotope), cukup beri penalti berat
        score -= 60;
        reasons.push(dictEE.reasonNotPlantSafe || "BERBAHAYA: Berisiko merusak tanaman aquascape Anda.");
      }
    }

    // 3. FATAL PREDATOR DI TANGKI DAMAI
    if (answers.fishTypePref === "Community Tank" && (fish.temperament_score && fish.temperament_score >= 4)) {
      isFatal = true; 
    }

    if (isFatal) continue; // Langsung buang ikan dari daftar rekomendasi

    // ==========================================
    // TAHAP B: PENILAIAN LINGKUNGAN & TANGKI
    // ==========================================
    
    // TANK SIZE PENALTY (Volume)
    if (fish.min_tank_size && answers.tankVolumeLiters < fish.min_tank_size) {
      const deficit = fish.min_tank_size - answers.tankVolumeLiters;
      score -= Math.min(50, deficit * 0.8);
      reasons.push(dictEE.reasonTankSizeBad || "Volume tangki kurang dari kebutuhan minimal spesies ini.");
    } else if (fish.min_tank_size && answers.tankVolumeLiters >= fish.min_tank_size * 2) {
      score += 20; 
      reasons.push(dictEE.reasonTankSizeOK);
    }

    // DYNAMIC BIOLOAD
    const adultSize = fish.estimated_adult_size_cm || 5; 
    const bioload = fish.bioload_factor || 1;
    const groupSize = fish.schooling ? (fish.min_group_size || 6) : 1;
    const requiredVolumeByBioload = adultSize * bioload * groupSize;

    if (answers.tankVolumeLiters < requiredVolumeByBioload) {
       const bioloadDeficit = requiredVolumeByBioload - answers.tankVolumeLiters;
       score -= Math.min(50, bioloadDeficit * 0.5);
       reasons.push(dictEE.reasonBioloadBad || "Berisiko overstock (kotoran ikan melebihi kapasitas filtrasi).");
    }

    // ACTIVITY vs TANK LENGTH (UPGRADE 1)
    if (fish.activity_level === "High" && answers.tankLengthCm < 80) {
      score -= 25; // Hukuman panjang tangki
      reasons.push(dictEE.reasonActivityNeedsSpace || "Ikan hiperaktif ini butuh panjang akuarium (horizontal) minimal 80cm untuk sprint.");
    }

    // ZONAL BALANCING / WATER LAYER (UPGRADE 4)
    if (answers.existingFishLayers.length > 0 && fish.water_layer && fish.water_layer !== "All Levels") {
      if (!answers.existingFishLayers.includes(fish.water_layer)) {
        score += 15;
        reasons.push(dictEE.reasonLayerBalance || `Mengisi area ${fish.water_layer} yang masih kosong di akuarium Anda.`);
      } else {
        score -= 5; // Area tersebut sudah sesak/dihuni
      }
    }

    // STYLE MATCHING
    if (answers.aquascapeStyle !== "Bebas" && fish.recommended_tank_styles?.includes(answers.aquascapeStyle)) {
      score += 15;
      reasons.push(dictEE.reasonStyleMatch || `Sangat direkomendasikan secara estetika untuk gaya ${answers.aquascapeStyle}.`);
    }

    // ==========================================
    // TAHAP C: PARAMETER AIR (pH, Temp, GH)
    // ==========================================

    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH >= fish.ideal_ph_min && answers.currentPH <= fish.ideal_ph_max) {
        score += 15;
        reasons.push(dictEE.reasonPHMatch);
      } else {
        const phDiff = Math.min(Math.abs(answers.currentPH - fish.ideal_ph_min), Math.abs(answers.currentPH - fish.ideal_ph_max));
        if (phDiff > 1.5) score -= 40; 
        else score -= (phDiff * 10); 
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
    // TAHAP D: PENGALAMAN, SIFAT & KELOMPOK
    // ==========================================
    
    if (answers.experience === "Pemula") {
      if (fish.difficulty === "Easy") { score += 25; reasons.push(dictEE.reasonBeginnerFriendly); } 
      else if (fish.difficulty === "Hard") { score -= 40; }
    } else if (answers.experience === "Mahir" && fish.difficulty === "Hard") {
      score += 15; reasons.push(dictEE.reasonExpertOnly);
    } else if (fish.difficulty === "Medium") {
      score += 10;
    }

    if (answers.wantSchoolingFish && fish.schooling) {
      score += 20; reasons.push(`${dictEE.reasonSchooling} (Min: ${fish.min_group_size || 6})`);
    } else if (!answers.wantSchoolingFish && fish.schooling) {
      score -= 15; 
    }

    const temperamentScore = fish.temperament_score || 2; 

    if (answers.fishTypePref === "Community Tank") {
      if (temperamentScore <= 2) { score += 20; reasons.push(dictEE.reasonCompatibility); } 
    } else if (answers.fishTypePref === "Semi-Aggressive") {
      if (temperamentScore === 3 || temperamentScore === 4) { score += 20; reasons.push(dictEE.reasonCompatibility); } 
      else if (temperamentScore === 5) { score -= 30; }
    } else if (answers.fishTypePref === "Species Only") {
      if (temperamentScore >= 4) { score += 20; reasons.push(dictEE.reasonCompatibility); }
    }

    // Cegah skor di bawah nol
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