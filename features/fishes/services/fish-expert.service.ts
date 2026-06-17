// features/fishes/services/fish-expert.service.ts
import { Fish } from "../types/fish.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface UserFishAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankVolumeLiters: number;
  currentPH: number;
  currentTemp: number;
  wantSchoolingFish: boolean;
  fishTypePref: string; // "Community", "Semi-Aggressive", "Aggressive", dll
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

    // TAHAP A: HARD FILTERS (Sangat ketat, jika tidak muat tank = gugur)
    if (fish.min_tank_size && answers.tankVolumeLiters < fish.min_tank_size) {
      isEligible = false; 
    }

    if (!isEligible) continue;

    // TAHAP B: SOFT SCORING

    // 1. TANK SIZE MARGIN (Beri nilai lebih jika akuariumnya jauh lebih luas)
    if (fish.min_tank_size && answers.tankVolumeLiters >= fish.min_tank_size * 2) {
      score += 20;
      reasons.push(dictEE.reasonTankSizeOK);
    } else {
      score += 10;
    }

    // 2. pH WATER MATCH
    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH >= fish.ideal_ph_min && answers.currentPH <= fish.ideal_ph_max) {
        score += 20;
        reasons.push(dictEE.reasonPHMatch);
      } else {
        score -= 20;
        reasons.push(dictEE.reasonPHMismatch);
      }
    }

    // 3. TEMPERATURE MATCH
    if (fish.ideal_temp_min && fish.ideal_temp_max) {
      if (answers.currentTemp >= fish.ideal_temp_min && answers.currentTemp <= fish.ideal_temp_max) {
        score += 15;
        reasons.push(dictEE.reasonTempMatch);
      } else {
        score -= 15;
      }
    }

    // 4. DIFFICULTY vs EXPERIENCE
    if (answers.experience === "Pemula") {
      if (fish.difficulty === "Easy") {
        score += 25;
        reasons.push(dictEE.reasonBeginnerFriendly);
      } else if (fish.difficulty === "Hard") {
        score -= 30;
      }
    } else if (answers.experience === "Mahir" && fish.difficulty === "Hard") {
      score += 15;
      reasons.push(dictEE.reasonExpertOnly);
    }

    // 5. SCHOOLING PREFERENCE
    if (answers.wantSchoolingFish && fish.schooling) {
      score += 20;
      reasons.push(`${dictEE.reasonSchooling} (Min: ${fish.min_group_size || 6})`);
    } else if (!answers.wantSchoolingFish && fish.schooling) {
      score -= 10; // Kurangi poin jika user tidak mau beli banyak tapi ikannya harus schooling
    }

    // 6. COMPATIBILITY TYPE
    if (answers.fishTypePref !== "Bebas" && fish.compatibility === answers.fishTypePref) {
      score += 15;
      reasons.push(dictEE.reasonCompatibility);
    }

    rawEvaluations.push({ item: fish, rawScore: score, reasons });
  }

  const processedResults = processExpertResults(rawEvaluations, 20);

  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}