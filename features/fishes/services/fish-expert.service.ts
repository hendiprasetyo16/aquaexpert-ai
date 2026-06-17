// features/fishes/services/fish-expert.service.ts
import { Fish } from "../types/fish.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface UserFishAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankVolumeLiters: number;
  currentPH: number;
  currentTemp: number;
  wantSchoolingFish: boolean;
  fishTypePref: string; // "Community Tank", "Semi-Aggressive", "Species Only"
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
}

export function generateFishRecommendations(
  allFishes: Fish[], 
  answers: UserFishAnswers, 
  dictEE: FishExpertDictionary
): RecommendedFish[] {
  const rawEvaluations: RawEvaluation<Fish>[] = [];

  for (const fish of allFishes) {
    let isEligible = true;
    let score = 0;
    let reasons: string[] = [];

    // ==========================================
    // TAHAP A: HARD FILTERS (PENYISIHAN MUTLAK)
    // ==========================================
    
    // 1. Minimum Tank Size
    if (fish.min_tank_size && answers.tankVolumeLiters < fish.min_tank_size) {
      isEligible = false; 
    }

    // 2. Jika Ikan Predator (Aggressive) masuk ke tangki Damai (Community)
    if (answers.fishTypePref === "Community Tank" && fish.compatibility === "Aggressive") {
      isEligible = false;
    }

    // 3. Toleransi pH Ekstrem (Jika meleset lebih dari 1.5, gugur)
    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH < fish.ideal_ph_min - 1.5 || answers.currentPH > fish.ideal_ph_max + 1.5) {
        isEligible = false;
      }
    }

    // 4. Overstocking / Bioload Check
    // Asumsi: Ikan Schooling butuh volume ekstra karena bergerombol
    const requiredVolume = fish.schooling ? (fish.bioload_factor || 1) * (fish.min_group_size || 6) * 5 : (fish.bioload_factor || 1) * 10;
    if (answers.tankVolumeLiters < requiredVolume) {
       isEligible = false;
    }

    if (!isEligible) continue;

    // ==========================================
    // TAHAP B: SOFT SCORING (PENILAIAN)
    // ==========================================

    // 1. TANK SIZE MARGIN (Nilai lebih jika tangki sangat luas)
    if (fish.min_tank_size && answers.tankVolumeLiters >= fish.min_tank_size * 2) {
      score += 20;
      reasons.push(dictEE.reasonTankSizeOK);
    } else {
      score += 10;
    }

    // 2. pH WATER MATCH (Sempurna di dalam rentang)
    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH >= fish.ideal_ph_min && answers.currentPH <= fish.ideal_ph_max) {
        score += 15;
        reasons.push(dictEE.reasonPHMatch);
      } else {
        score -= 10; // Tidak gugur, tapi nilai turun karena kurang optimal
        reasons.push(dictEE.reasonPHMismatch);
      }
    }

    // 3. TEMPERATURE MATCH (Sempurna di dalam rentang)
    if (fish.ideal_temp_min && fish.ideal_temp_max) {
      if (answers.currentTemp >= fish.ideal_temp_min && answers.currentTemp <= fish.ideal_temp_max) {
        score += 15;
        reasons.push(dictEE.reasonTempMatch);
      } else {
        score -= 15;
        reasons.push(dictEE.reasonTempMismatch);
      }
    }

    // 4. DIFFICULTY vs EXPERIENCE
    if (answers.experience === "Pemula") {
      if (fish.difficulty === "Easy") {
        score += 25;
        reasons.push(dictEE.reasonBeginnerFriendly);
      } else if (fish.difficulty === "Hard") {
        score -= 30; // Pemula sangat dilarang pegang ikan Hard
      }
    } else if (answers.experience === "Mahir" && fish.difficulty === "Hard") {
      score += 15;
      reasons.push(dictEE.reasonExpertOnly);
    } else if (fish.difficulty === "Medium") {
      score += 10;
    }

    // 5. SCHOOLING PREFERENCE
    if (answers.wantSchoolingFish && fish.schooling) {
      score += 20;
      reasons.push(`${dictEE.reasonSchooling} (Min: ${fish.min_group_size || 6})`);
    } else if (!answers.wantSchoolingFish && fish.schooling) {
      score -= 15; // User tidak mau repot beli kawanan, jadi kurangi nilai ikan schooling
    }

    // 6. COMPATIBILITY / ECOSYSTEM PREFERENCE
    if (answers.fishTypePref === "Community Tank" && fish.compatibility === "Peaceful") {
      score += 20;
      reasons.push(dictEE.reasonCompatibility);
    } else if (answers.fishTypePref === "Semi-Aggressive" && fish.compatibility === "Semi-Aggressive") {
      score += 20;
      reasons.push(dictEE.reasonCompatibility);
    } else if (answers.fishTypePref === "Species Only" && fish.compatibility === "Species Only") {
      score += 20;
      reasons.push(dictEE.reasonCompatibility);
    }

    // Masukkan ke array evaluasi
    rawEvaluations.push({ item: fish, rawScore: score, reasons });
  }

  // Proses dan standarisasi skor dengan Expert Engine Core
  const processedResults = processExpertResults(rawEvaluations, 25);

  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}