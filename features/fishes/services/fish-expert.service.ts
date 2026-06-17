// features/fishes/services/fish-expert.service.ts
import { Fish } from "../types/fish.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface UserFishAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankVolumeLiters: number;
  currentPH: number;
  currentTemp: number;
  wantSchoolingFish: boolean;
  fishTypePref: string; // "Community", "Semi-Aggressive", "Species Only"
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
    let score = 0;
    let reasons: string[] = [];

    // ==========================================
    // EVALUASI KAPASITAS & TANGKI
    // ==========================================
    
    // Perhitungan Volume Tangki
    const requiredVolume = fish.schooling 
      ? (fish.bioload_factor || 1) * (fish.min_group_size || 6) * 5 
      : (fish.bioload_factor || 1) * 10;

    // TANK SIZE PENALTY (Pengganti Hard Filter)
    if (fish.min_tank_size && answers.tankVolumeLiters < fish.min_tank_size) {
      score -= 30; // Hukuman berat tapi tidak diskualifikasi
      reasons.push(dictEE.reasonTankSizeBad);
    } else if (answers.tankVolumeLiters < requiredVolume) {
      score -= 20; // Hukuman bioload
      reasons.push(dictEE.reasonTankSizeBad);
    } else if (fish.min_tank_size && answers.tankVolumeLiters >= fish.min_tank_size * 2) {
      score += 20; // Ruang sangat lega
      reasons.push(dictEE.reasonTankSizeOK);
    } else {
      score += 10; // Cukup/Sesuai standar
    }

    // ==========================================
    // EVALUASI PARAMETER AIR
    // ==========================================

    // pH WATER MATCH
    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH >= fish.ideal_ph_min && answers.currentPH <= fish.ideal_ph_max) {
        score += 15;
        reasons.push(dictEE.reasonPHMatch);
      } else if (answers.currentPH < fish.ideal_ph_min - 1.5 || answers.currentPH > fish.ideal_ph_max + 1.5) {
        score -= 40; // Terlalu ekstrem melenceng, poin hancur drastis
        reasons.push(dictEE.reasonPHMismatch);
      } else {
        score -= 10; // Meleset sedikit
        reasons.push(dictEE.reasonPHMismatch);
      }
    }

    // TEMPERATURE MATCH
    if (fish.ideal_temp_min && fish.ideal_temp_max) {
      if (answers.currentTemp >= fish.ideal_temp_min && answers.currentTemp <= fish.ideal_temp_max) {
        score += 15;
        reasons.push(dictEE.reasonTempMatch);
      } else if (answers.currentTemp < fish.ideal_temp_min - 4 || answers.currentTemp > fish.ideal_temp_max + 4) {
        score -= 30; // Suhu fatal
        reasons.push(dictEE.reasonTempMismatch);
      } else {
        score -= 10; // Suhu kurang optimal
        reasons.push(dictEE.reasonTempMismatch);
      }
    }

    // ==========================================
    // EVALUASI PENGALAMAN & SIFAT (TEMPERAMENT)
    // ==========================================

    // DIFFICULTY vs EXPERIENCE
    if (answers.experience === "Pemula") {
      if (fish.difficulty === "Easy") {
        score += 25;
        reasons.push(dictEE.reasonBeginnerFriendly);
      } else if (fish.difficulty === "Hard") {
        score -= 40; // Sangat tidak disarankan untuk pemula
      }
    } else if (answers.experience === "Mahir" && fish.difficulty === "Hard") {
      score += 15;
      reasons.push(dictEE.reasonExpertOnly);
    } else if (fish.difficulty === "Medium") {
      score += 10;
    }

    // SCHOOLING PREFERENCE
    if (answers.wantSchoolingFish && fish.schooling) {
      score += 20;
      reasons.push(`${dictEE.reasonSchooling} (Min: ${fish.min_group_size || 6})`);
    } else if (!answers.wantSchoolingFish && fish.schooling) {
      score -= 15; // User tidak mau beli gerombolan
    }

    // TEMPERAMENT / COMPATIBILITY CHECK
    const temperamentScore = fish.temperament_score || 2; // Default ke Peaceful (2)

    if (answers.fishTypePref === "Community Tank") {
      if (temperamentScore <= 2) { // Sangat Damai & Damai
        score += 20;
        reasons.push(dictEE.reasonCompatibility);
      } else if (temperamentScore >= 4) { // Agresif / Predator
        score -= 50; // Hampir pasti tereliminasi dari ranking atas
      }
    } else if (answers.fishTypePref === "Semi-Aggressive") {
      if (temperamentScore === 3 || temperamentScore === 4) { // Semi-Agresif
        score += 20;
        reasons.push(dictEE.reasonCompatibility);
      } else if (temperamentScore === 5) {
        score -= 30; // Masih terlalu buas
      }
    } else if (answers.fishTypePref === "Species Only") {
      if (temperamentScore >= 4) { // Predator cocok di tank spesies khusus
        score += 20;
        reasons.push(dictEE.reasonCompatibility);
      }
    }

    // Hindari skor minus total (bisa ditangani oleh fungsi processExpertResults nantinya)
    if (score < 0) score = 0;

    rawEvaluations.push({ item: fish, rawScore: score, reasons });
  }

  // Proses dan standarisasi skor (1-100)
  const processedResults = processExpertResults(rawEvaluations, 25);

  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}