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
  matchConfidence: "Excellent Match" | "Very Good Match" | "Good Match" | "Moderate Match";
}

// Fungsi bantu untuk persentase confidence (Standard V1.0)
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
    
    if (!isEligible) continue;

    // ==========================================
    // TAHAP B: SOFT SCORING (Pembobotan Peringkat V1.0 STABLE)
    // ==========================================
    
    // 1. TANK SIZE (Kesesuaian Proporsi - Soft Filter)
    if (plant.tank_size_recommendation && plant.tank_size_recommendation.length > 0) {
      if (plant.tank_size_recommendation.includes(answers.tankSize)) {
        score += 20;
        reasons.push(`Proporsi sangat ideal untuk tank ${answers.tankSize}.`);
      } else {
        score -= 20; // Penalti proporsi (bisa disesuaikan dengan trimming intensif)
        reasons.push("Kurang proporsional untuk tank Anda (butuh pemangkasan ekstra).");
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
    } else if (answers.experience === "Menengah") {
      // V1.0 FIX: Bobot untuk user menengah (Ingin naik level)
      if (plant.beginner_score) score += plant.beginner_score * 1.5; // Moderasi poin
      
      if (plant.difficulty === "Easy") {
        score += 10;
        reasons.push("Sangat aman untuk setup Anda.");
      } else if (plant.difficulty === "Medium") {
        score += 20;
        reasons.push("Tingkat kesulitan yang sangat pas untuk mengasah skill Anda.");
      } else if (plant.difficulty === "Hard") {
        score -= 10; // Penalti ringan, tidak mematikan kesempatan
        reasons.push("Sedikit menantang, butuh konsistensi ekstra.");
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
      
      if (plant.growth_rate === "Fast") {
        score -= 15;
      } else if (plant.growth_rate === "Slow") {
        score += 10;
        reasons.push("Tumbuh lambat, tidak cepat merusak layout.");
      }
    } else if (answers.maintenance === "Medium") {
      // V1.0 FIX: Bobot untuk user dengan waktu perawatan Sedang
      if (plant.maintenance_level === "Medium") {
        score += 15;
        reasons.push("Waktu perawatan yang dibutuhkan sesuai dengan rutinitas Anda.");
      } else if (plant.maintenance_level === "Low") {
        score += 10;
      } else if (plant.maintenance_level === "High") {
        score -= 10;
        reasons.push("Catatan: Mungkin butuh waktu ekstra untuk trimming.");
      }
      // Penyesuaian halus untuk growth rate
      if (plant.growth_rate === "Fast") score -= 5;
      if (plant.growth_rate === "Slow") score += 5;
    } else if (answers.maintenance === "High") {
      if (plant.maintenance_level === "High" || plant.growth_rate === "Fast") {
        score += 15;
        reasons.push("Sangat cocok bagi Anda yang rutin merawat dan membentuk akuarium.");
      }
    }

    // 4. SHRIMP SAFE (Udang Hias)
    if (answers.shrimpTank) {
      if (plant.shrimp_safe) {
        score += 15;
        if (plant.plant_type === "Moss" || plant.plant_type === "Epiphyte") {
           reasons.push("Habitat bermain dan sembunyi yang ideal bagi burayak udang.");
        }
      } else {
        score -= 30; // Penalti seimbang (-30)
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

    // 6. WARNA MERAH (Heuristik Terbatas - Menunggu Field color_category)
    if (answers.wantRedPlant) {
      // PERBAIKAN: Menggabungkan name_en dan name_id dengan aman agar tidak undefined
      const nameL = ((plant.name_en || "") + " " + (plant.name_id || "")).toLowerCase();
      
      // Heuristik dipertajam
      const isRed = nameL.includes("red") || nameL.includes("macrandra") || 
                    nameL.includes("reineckii") || nameL.includes("colorata") || nameL.includes("aromatica") ||
                    (plant.aquascape_style && plant.aquascape_style.includes("Dutch") && plant.difficulty !== "Easy");
      
      if (isRed) {
        score += 25;
        reasons.push("Membawa nuansa merah/warna-warni yang Anda cari.");
      } else {
        score -= 15; 
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

    // 8. AQUASCAPE STYLE
    if (answers.style !== "Bebas") {
      if (plant.aquascape_style && plant.aquascape_style.includes(answers.style)) {
        score += 15; // Bobot wajar (+15) agar tidak mengalahkan biologis
        reasons.push(`Secara visual sesuai dengan tema ${answers.style}.`);
      }
    }

    // ==========================================
    // TAHAP C: FINALISASI & NORMALISASI
    // ==========================================
    const finalScore = Math.min(Math.max(score, 10), 100); 

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