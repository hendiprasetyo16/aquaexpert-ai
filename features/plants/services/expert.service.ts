import { Plant } from "../types/plant.types";

export interface UserAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankSize: string; // "Nano", "Medium", dll
  hasCO2: boolean;
  light: "Low" | "Medium" | "High";
  maintenance: "Low" | "Medium" | "High";
  style: string; // "Nature", "Dutch", "Bebas"
}

export interface RecommendedPlant extends Plant {
  matchScore: number;
  matchReasons: string[]; // Penjelasan kenapa AI merekomendasikan ini
}

export function generateRecommendations(allPlants: Plant[], answers: UserAnswers): RecommendedPlant[] {
  let results: RecommendedPlant[] = [];

  for (const plant of allPlants) {
    let isEligible = true;
    let score = 0;
    let reasons: string[] = [];

    // ==========================================
    // TAHAP A: HARD FILTERS (Eliminasi Mutlak)
    // ==========================================
    
    // 1. Filter CO2 Mandatori
    if (!answers.hasCO2 && plant.co2_mandatory) isEligible = false;

    // 2. Filter Tank Size Recommendation
    if (plant.tank_size_recommendation && !plant.tank_size_recommendation.includes(answers.tankSize)) {
      isEligible = false;
    }

    // 3. Filter Light Requirement/ Filter Cahaya (Jika user Low, gak bisa pakai tanaman High)
    if (answers.light === "Low" && plant.light_requirement === "High") isEligible = false;
    if (answers.light === "Low" && plant.light_requirement === "Medium") score -= 10; 

    // Jika gagal Hard Filter, lewati tanaman ini
    if (!isEligible) continue;

    // ==========================================
    // TAHAP B: SOFT SCORING (Pembobotan Peringkat)
    // ==========================================
    
    // 1. Pengalaman/ Skor Pemula (Beginner Score 1-10)
    if (answers.experience === "Pemula" && plant.beginner_score) {
      // Rumus: Skor beginner (1-10) dikali 3. (Maks +30 poin)
      score += plant.beginner_score * 3;
      if (plant.beginner_score >= 8) reasons.push("Sangat kuat dan ramah untuk pemula.");
    } else if (answers.experience === "Mahir" && plant.beginner_score && plant.beginner_score <= 4) {
      score += 20; 
      reasons.push("Tingkat kesulitan tinggi, cocok untuk menguji keahlian Anda.");
    }

    // 2. Perawatan/ Skor Perawatan (Maintenance)
    if (answers.maintenance === "Low") {
      if (plant.maintenance_level === "Low") {
        score += 20;
        reasons.push("Perawatan sangat minim (jarang trimming/replant).");
      } else if (plant.maintenance_level === "High") {
        score -= 20; // Penalti jika user minta rawat rendah tapi tanaman ribet
      }
    } else if (answers.maintenance === "High" && plant.maintenance_level === "High") {
       score += 10;
       reasons.push("Cocok bagi Anda yang suka rutin merapikan bentuk aquascape.");
    }

    // 3. Recommended For Tag
    if (plant.recommended_for) {
      if (answers.experience === "Pemula" && plant.recommended_for.includes("Beginner")) score += 15;
      if (!answers.hasCO2 && plant.recommended_for.includes("Low Tech")) {
        score += 15;
        reasons.push("Juara bertahan di setup Low-Tech (Tanpa CO2).");
      }
      if (answers.hasCO2 && plant.recommended_for.includes("High Tech")) {
        score += 10;
        reasons.push("Akan tampil sangat maksimal dengan injeksi CO2 Anda.");
      }
    }

    // 4. Aquascape Style
    if (answers.style !== "Bebas") {
      if (plant.aquascape_style && plant.aquascape_style.includes(answers.style)) {
        score += 25;
        reasons.push(`Pilihan ideal untuk aquascape bergaya ${answers.style}.`);
      }
    }

    // Hanya loloskan yang skornya > 0
    if (score > 0) {
      results.push({ ...plant, matchScore: score, matchReasons: reasons });
    }
  }

  // ==========================================
  // TAHAP C: PENGURUTAN (Sorting)
  // ==========================================
  // Urutkan dari skor tertinggi ke terendah
  return results.sort((a, b) => b.matchScore - a.matchScore);
}