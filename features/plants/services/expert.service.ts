// features/plants/services/expert.service.ts
import { Plant } from "../types/plant.types";

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
  matchConfidenceKey: "Excellent" | "VeryGood" | "Good" | "Moderate"; // Menggunakan Kunci (Key), bukan teks mati
}

function getConfidenceKey(score: number): RecommendedPlant["matchConfidenceKey"] {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "VeryGood";
  if (score >= 60) return "Good";
  return "Moderate";
}

// PERBAIKAN: Menerima dictEE sebagai kamus penterjemah dinamis
export function generateRecommendations(allPlants: Plant[], answers: UserAnswers, dictEE: any): RecommendedPlant[] {
  let results: RecommendedPlant[] = [];

  for (const plant of allPlants) {
    let isEligible = true;
    let score = 0;
    let reasons: string[] = [];

    // TAHAP A: HARD FILTERS
    if (!answers.hasCO2 && plant.co2_mandatory) isEligible = false;
    if (answers.light === "Low" && plant.light_requirement === "High") isEligible = false;
    
    if (!isEligible) continue;

    // TAHAP B: SOFT SCORING (DENGAN KAMUS DINAMIS)
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

    // 2. PENGALAMAN
    if (answers.experience === "Pemula") {
      if (plant.beginner_score) score += plant.beginner_score * 3; 
      if (plant.difficulty === "Easy") {
        score += 20;
        reasons.push(dictEE.reasonBeginner);
      } else if (plant.difficulty === "Hard") {
        score -= 25; 
      }
    } else if (answers.experience === "Menengah") {
      if (plant.beginner_score) score += plant.beginner_score * 1.5; 
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
      if (plant.difficulty === "Hard" || (plant.beginner_score && plant.beginner_score <= 4)) {
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

    // TAHAP C: FINALISASI
    const finalScore = Math.min(Math.max(score, 10), 100); 

    if (finalScore >= 20) {
      results.push({ 
        ...plant, 
        matchScore: finalScore, 
        matchReasons: reasons,
        matchConfidenceKey: getConfidenceKey(finalScore)
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}