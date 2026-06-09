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
  wantRedPlant: boolean; // PARAMETER BARU (V4)
}

export interface RecommendedPlant extends Plant {
  matchScore: number;
  matchReasons: string[];
  matchConfidence: "Excellent Match" | "Very Good Match" | "Good Match" | "Moderate Match";
}

// Fungsi bantu untuk persentase confidence
function getConfidenceLevel(score: number): RecommendedPlant["matchConfidence"] {
  if (score >= 90) return "Excellent Match";
  if (score >= 75) return "Very Good Match";
  if (score >= 60) return "Good Match";
  return "Moderate Match";
}

export function generateRecommendations(allPlants: Plant[], answers: UserAnswers): RecommendedPlant[] {
  let results: RecommendedPlant[] = [];

  for (const plant of allPlants) {
    let isEligible = true;
    let score = 0;
    let reasons: string[] = [];

    // ==========================================
    // TAHAP A: HARD FILTERS (Eliminasi Mutlak: Biologi Mati)
    // ==========================================
    
    // 1. Filter CO2 Mandatori
    if (!answers.hasCO2 && plant.co2_mandatory) isEligible = false;

    // 2. Filter Light Requirement (Cahaya Rendah vs Tanaman High)
    if (answers.light === "Low" && plant.light_requirement === "High") isEligible = false;
    
    // *Tank Size dipindah ke Soft Scoring sesuai arsitektur V4*

    if (!isEligible) continue;

    // ==========================================
    // TAHAP B: SOFT SCORING (Pembobotan Peringkat V4)
    // ==========================================
    
    // 1. TANK SIZE (Kesesuaian Proporsi)
    if (plant.tank_size_recommendation && plant.tank_size_recommendation.length > 0) {
      if (plant.tank_size_recommendation.includes(answers.tankSize)) {
        score += 20;
        reasons.push(`Ukurannya sangat proporsional untuk tank ${answers.tankSize}.`);
      } else {
        score -= 20; // Penalti proporsi (bisa disesuaikan dengan trimming)
        reasons.push("Kurang proporsional untuk tank Anda (butuh penyesuaian).");
      }
    }

    // 2. PENGALAMAN (Difficulty & Beginner Score)
    if (answers.experience === "Pemula") {
      if (plant.beginner_score) score += plant.beginner_score * 3; // Max +30
      
      if (plant.difficulty === "Easy") {
        score += 20;
        reasons.push("Sangat ramah dan mudah untuk pemula.");
      } else if (plant.difficulty === "Hard") {
        score -= 25; 
      }
    } else if (answers.experience === "Mahir") {
      if (plant.difficulty === "Hard" || (plant.beginner_score && plant.beginner_score <= 4)) {
        score += 20; 
        reasons.push("Tingkat kesulitan menantang untuk level ahli.");
      }
    }

    // 3. PERAWATAN (Maintenance Level & Growth Rate)
    if (answers.maintenance === "Low") {
      if (plant.maintenance_level === "Low") {
        score += 20;
        reasons.push("Perawatan sangat minim (jarang trimming).");
      } else if (plant.maintenance_level === "High") {
        score -= 25; 
      }
      
      // Growth Rate penalty untuk low maintenance
      if (plant.growth_rate === "Fast") {
        score -= 15;
      } else if (plant.growth_rate === "Slow") {
        score += 10;
        reasons.push("Tumbuh lambat, tidak cepat merusak layout.");
      } else if (plant.growth_rate === "Medium") {
        // Eksplisit netral
        score += 0; 
      }
    } else if (answers.maintenance === "High") {
      if (plant.maintenance_level === "High" || plant.growth_rate === "Fast") {
        score += 15;
        reasons.push("Sangat cocok bagi Anda yang rutin merawat akuarium.");
      }
    }

    // 4. SHRIMP SAFE (Udang Hias)
    if (answers.shrimpTank) {
      if (plant.shrimp_safe) {
        score += 15;
        if (plant.plant_type === "Moss" || plant.plant_type === "Epiphyte") {
           reasons.push("Tempat bersembunyi ideal bagi anak udang.");
        }
      } else {
        score -= 30; // V4: Penalti diturunkan dari -50 ke -30
      }
    }

    // 5. CARPET POTENTIAL
    if (answers.wantCarpet) {
      if (plant.carpet_potential) {
        score += 35; 
        reasons.push("Kandidat utama untuk membentuk karpet dasar.");
      } else {
        score -= 20; 
      }
    }

    // 6. WARNA MERAH (V4: Color Feature)
    if (answers.wantRedPlant) {
      // Deteksi heuristik warna dari nama atau style
      const nameL = plant.name.toLowerCase();
      const isRed = nameL.includes("red") || nameL.includes("macrandra") || 
                    nameL.includes("reineckii") || nameL.includes("ludwigia") || nameL.includes("colorata") ||
                    (plant.aquascape_style && plant.aquascape_style.includes("Dutch"));
      
      if (isRed) {
        score += 25;
        reasons.push("Membawa nuansa merah/warna-warni yang Anda cari.");
      } else {
        score -= 15; // Turunkan sedikit tanaman hijau biasa
      }
    }

    // 7. RECOMMENDED FOR TAGS
    if (plant.recommended_for) {
      if (answers.experience === "Pemula" && plant.recommended_for.includes("Beginner")) score += 15;
      if (!answers.hasCO2 && plant.recommended_for.includes("Low Tech")) {
        score += 15;
        if (!reasons.some(r => r.includes("Low-Tech"))) {
          reasons.push("Teruji juara di setup Low-Tech (Tanpa CO2).");
        }
      }
    }

    // 8. AQUASCAPE STYLE (V4: Bobot diturunkan jadi 15)
    if (answers.style !== "Bebas") {
      if (plant.aquascape_style && plant.aquascape_style.includes(answers.style)) {
        score += 15;
        reasons.push(`Sesuai dengan tema ${answers.style}.`);
      }
    }

    // ==========================================
    // TAHAP C: FINALISASI & NORMALISASI
    // ==========================================
    // Batasi skor maksimal 100
    const finalScore = Math.min(Math.max(score, 10), 100); 

    // Filter sisa: Jangan tampilkan tanaman yang skornya terlalu rendah (< 20)
    if (finalScore >= 20) {
      results.push({ 
        ...plant, 
        matchScore: finalScore, 
        matchReasons: reasons,
        matchConfidence: getConfidenceLevel(finalScore)
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}