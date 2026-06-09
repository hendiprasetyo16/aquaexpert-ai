import { Plant } from "../types/plant.types";

export interface UserAnswers {
  experience: "Pemula" | "Menengah" | "Mahir";
  tankSize: string; 
  hasCO2: boolean;
  light: "Low" | "Medium" | "High";
  maintenance: "Low" | "Medium" | "High";
  style: string;
  shrimpTank: boolean; // PARAMETER BARU
  wantCarpet: boolean; // PARAMETER BARU
}

export interface RecommendedPlant extends Plant {
  matchScore: number;
  matchReasons: string[];
  matchConfidence: "Excellent Match" | "Very Good Match" | "Good Match" | "Moderate Match";
}

// Fungsi bantu untuk persentase confidence
function getConfidenceLevel(score: number): RecommendedPlant["matchConfidence"] {
  if (score >= 90) return "Excellent Match";
  if (score >= 70) return "Very Good Match";
  if (score >= 50) return "Good Match";
  return "Moderate Match";
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

    // 3. Filter Light Requirement
    if (answers.light === "Low" && plant.light_requirement === "High") isEligible = false;
    if (answers.light === "Low" && plant.light_requirement === "Medium") score -= 15; // Penalti berat tapi tidak mati

    if (!isEligible) continue;

    // ==========================================
    // TAHAP B: SOFT SCORING (Pembobotan Peringkat V3)
    // ==========================================
    
    // 1. PENGALAMAN (Difficulty & Beginner Score)
    if (answers.experience === "Pemula") {
      if (plant.beginner_score) {
        score += plant.beginner_score * 3; // Max +30
      }
      if (plant.difficulty === "Easy") {
        score += 20;
        reasons.push("Sangat ramah dan mudah untuk pemula.");
      }
      if (plant.difficulty === "Hard") {
        score -= 25; // Penalti tajam
      }
    } else if (answers.experience === "Mahir") {
      if (plant.difficulty === "Hard" || (plant.beginner_score && plant.beginner_score <= 4)) {
        score += 20; 
        reasons.push("Menantang, cocok untuk menguji keahlian Anda.");
      }
    }

    // 2. PERAWATAN (Maintenance Level & Growth Rate)
    if (answers.maintenance === "Low") {
      if (plant.maintenance_level === "Low") {
        score += 20;
        reasons.push("Perawatan sangat minim (jarang trimming/replant).");
      } else if (plant.maintenance_level === "High") {
        score -= 25; // Penalti karena user males trimming tapi tanamannya ribet
      }
      
      // V3 Logic: Growth Rate penalty untuk low maintenance
      if (plant.growth_rate === "Fast") {
        score -= 15;
        reasons.push("Catatan: Tumbuh cepat, mungkin butuh pemangkasan sesekali.");
      } else if (plant.growth_rate === "Slow") {
        score += 10;
        reasons.push("Tumbuh lambat, tidak cepat merusak layout.");
      }
    } else if (answers.maintenance === "High") {
      if (plant.maintenance_level === "High" || plant.growth_rate === "Fast") {
        score += 15;
        reasons.push("Sangat cocok bagi Anda yang rutin merawat akuarium.");
      }
    }

    // 3. SHRIMP SAFE (Udang Hias)
    if (answers.shrimpTank) {
      if (plant.shrimp_safe) {
        score += 15;
        // Hanya beri alasan spesifik jika dia Moss/Epiphyte (habitat udang favorit)
        if (plant.plant_type === "Moss" || plant.plant_type === "Epiphyte") {
           reasons.push("Tempat bersembunyi & mencari makan ideal bagi udang.");
        }
      } else {
        score -= 50; // Penalti super berat jika tidak aman untuk udang
      }
    }

    // 4. CARPET POTENTIAL (Tanaman Karpet)
    if (answers.wantCarpet) {
      if (plant.carpet_potential) {
        score += 35; // Bobot sangat tinggi karena ini permintaan spesifik
        reasons.push("Kandidat utama untuk membentuk karpet.");
      } else {
        score -= 20; // Turunkan skor tanaman lain agar tidak mengganggu list karpet
      }
    }

    // 5. RECOMMENDED FOR TAGS
    if (plant.recommended_for) {
      if (answers.experience === "Pemula" && plant.recommended_for.includes("Beginner")) score += 15;
      if (!answers.hasCO2 && plant.recommended_for.includes("Low Tech")) {
        score += 15;
        if (!reasons.some(r => r.includes("Low-Tech"))) {
          reasons.push("Teruji juara di setup Low-Tech (Tanpa CO2).");
        }
      }
      if (answers.hasCO2 && plant.recommended_for.includes("High Tech")) {
        score += 10;
        reasons.push("Akan tampil sangat maksimal dengan injeksi CO2 Anda.");
      }
    }

    // 6. AQUASCAPE STYLE
    if (answers.style !== "Bebas") {
      if (plant.aquascape_style && plant.aquascape_style.includes(answers.style)) {
        score += 25;
        reasons.push(`Pilihan biologis ideal untuk gaya ${answers.style}.`);
      }
    }

    // ==========================================
    // TAHAP C: FINALISASI & NORMALISASI
    // ==========================================
    // Batasi skor maksimal 100 agar UI "Match Confidence" rapi
    const finalScore = Math.min(Math.max(score, 10), 100); 

    // Filter sisa: Jangan tampilkan tanaman yang skornya terlalu rendah (< 20)
    // kecuali jika hasilnya sangat sedikit.
    if (finalScore >= 20) {
      results.push({ 
        ...plant, 
        matchScore: finalScore, 
        matchReasons: reasons,
        matchConfidence: getConfidenceLevel(finalScore)
      });
    }
  }

  // Urutkan dari skor tertinggi ke terendah
  return results.sort((a, b) => b.matchScore - a.matchScore);
}