// features/plants/services/expert.service.ts
import { Plant } from "../types/plant.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface UserAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankSize: string; 
  hasCO2: boolean;
  light: "Low" | "Medium" | "High";
  maintenance: "Low" | "Medium" | "High";
  style: string;
  shrimpTank: boolean; 
  wantCarpet: boolean; 
  wantRedPlant: boolean; 
}

export interface RecommendedPlant extends Plant {
  matchScore: number;
  matchReasons: string[];
  matchConfidenceKey: ConfidenceKey;
}

// Kamus pelokalan bahasa diisolasi penuh di dalam domain fitur tanaman
export interface PlantExpertDictionary {
  reasonPropIdeal: string;
  reasonPropBad: string;
  reasonBeginner: string;
  reasonSafe: string;
  reasonSkill: string;
  reasonChallenging: string;
  reasonExpert: string;
  reasonMinMaint: string;
  reasonSlowGrow: string;
  reasonMaintMatch: string;
  reasonHighMaintWarn: string;
  reasonHighMaintIdeal: string;
  reasonShrimp: string;
  reasonCarpet: string;
  reasonRed: string;
  reasonLowTech: string;
  reasonStyle: string;
}

export function generateRecommendations(
  allPlants: Plant[], 
  answers: UserAnswers, 
  dictEE: PlantExpertDictionary
): RecommendedPlant[] {
  const rawEvaluations: RawEvaluation<Plant>[] = [];

  for (const plant of allPlants) {
    let isEligible = true;
    let score = 0;
    let reasons: string[] = [];

    // TAHAP A: HARD FILTERS
    if (!answers.hasCO2 && plant.co2_mandatory) isEligible = false;
    if (answers.light === "Low" && plant.light_requirement === "High") isEligible = false;
    
    if (!isEligible) continue;

    // TAHAP B: SOFT SCORING
    // 1. TANK SIZE
    if (plant.tank_size_recommendation && plant.tank_size_recommendation.length > 0) {
      if (plant.tank_size_recommendation.includes(answers.tankSize)) {
        score += 20;
        reasons.push(`${dictEE.reasonPropIdeal} ${answers.tankSize}.`);
      } else {
        score -= 20; 
        reasons.push(dictEE.reasonPropBad);
      }
    }

    // 2. PENGALAMAN (BUG FIX SAFE: Mengecek tipe number agar angka 0 tidak lolos sebagai false)
    if (answers.experience === "Pemula") {
      if (typeof plant.beginner_score === "number") score += plant.beginner_score * 3; 
      if (plant.difficulty === "Easy") {
        score += 20;
        reasons.push(dictEE.reasonBeginner);
      } else if (plant.difficulty === "Hard") {
        score -= 25; 
      }
    } else if (answers.experience === "Menengah") {
      if (typeof plant.beginner_score === "number") score += plant.beginner_score * 1.5; 
      if (plant.difficulty === "Easy") {
        score += 10;
        reasons.push(dictEE.reasonSafe);
      } else if (plant.difficulty === "Medium") {
        score += 20;
        reasons.push(dictEE.reasonSkill);
      } else if (plant.difficulty === "Hard") {
        score -= 10; 
        reasons.push(dictEE.reasonChallenging);
      }
    } else if (answers.experience === "Mahir") {
      if (plant.difficulty === "Hard" || (typeof plant.beginner_score === "number" && plant.beginner_score <= 4)) {
        score += 20; 
        reasons.push(dictEE.reasonExpert);
      }
    }

    // 3. PERAWATAN
    if (answers.maintenance === "Low") {
      if (plant.maintenance_level === "Low") {
        score += 20;
        reasons.push(dictEE.reasonMinMaint);
      } else if (plant.maintenance_level === "High") {
        score -= 25; 
      }
      if (plant.growth_rate === "Fast") {
        score -= 15;
      } else if (plant.growth_rate === "Slow") {
        score += 10;
        reasons.push(dictEE.reasonSlowGrow);
      }
    } else if (answers.maintenance === "Medium") {
      if (plant.maintenance_level === "Medium") {
        score += 15;
        reasons.push(dictEE.reasonMaintMatch);
      } else if (plant.maintenance_level === "Low") {
        score += 10;
      } else if (plant.maintenance_level === "High") {
        score -= 10;
        reasons.push(dictEE.reasonHighMaintWarn);
      }
      if (plant.growth_rate === "Fast") score -= 5;
      if (plant.growth_rate === "Slow") score += 5;
    } else if (answers.maintenance === "High") {
      if (plant.maintenance_level === "High" || plant.growth_rate === "Fast") {
        score += 15;
        reasons.push(dictEE.reasonHighMaintIdeal);
      }
    }

    // 4. SHRIMP SAFE
    if (answers.shrimpTank) {
      if (plant.shrimp_safe) {
        score += 15;
        if (plant.plant_type === "Moss" || plant.plant_type === "Epiphyte") {
           reasons.push(dictEE.reasonShrimp);
        }
      } else {
        score -= 30; 
      }
    }

    // 5. CARPET POTENTIAL
    if (answers.wantCarpet) {
      if (plant.carpet_potential) {
        score += 35; 
        reasons.push(dictEE.reasonCarpet);
      } else {
        score -= 20; 
      }
    }

    // 6. WARNA MERAH
    if (answers.wantRedPlant) {
      const nameL = ((plant.name_en || "") + " " + (plant.name_id || "")).toLowerCase();
      const isRed = nameL.includes("red") || nameL.includes("macrandra") || 
                    nameL.includes("reineckii") || nameL.includes("colorata") || nameL.includes("aromatica") ||
                    (plant.aquascape_style && plant.aquascape_style.includes("Dutch") && plant.difficulty !== "Easy");
      
      if (isRed) {
        score += 25;
        reasons.push(dictEE.reasonRed);
      } else {
        score -= 15; 
      }
    }

    // 7. RECOMMENDED FOR TAGS
    if (plant.recommended_for) {
      if (answers.experience === "Pemula" && plant.recommended_for.includes("Beginner")) score += 15;
      if (!answers.hasCO2 && plant.recommended_for.includes("Low Tech")) {
        score += 15;
        if (!reasons.some(r => r.includes(dictEE.reasonLowTech))) {
          reasons.push(dictEE.reasonLowTech);
        }
      }
    }

    // 8. AQUASCAPE STYLE
    if (answers.style !== "Bebas") {
      if (plant.aquascape_style && plant.aquascape_style.includes(answers.style)) {
        score += 15; 
        reasons.push(`${dictEE.reasonStyle} ${answers.style}.`);
      }
    }

    // Memasukkan item evaluasi mentah ke penampung
    rawEvaluations.push({ item: plant, rawScore: score, reasons });
  }

  // PANGGIL OTAL PIPELINE MATEMATIKA DARI EXPERT ENGINE LIB
  const processedResults = processExpertResults(rawEvaluations, 20);

  // Kembalikan ke struktur data rata (flattened) demi menjaga kecocokan kode UI lama kita
  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}