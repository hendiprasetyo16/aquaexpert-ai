// features/algae/services/expert.service.ts
import { Algae } from "../types/algae.types";
import { getAlgaeTagDesc } from "../components/algae-helpers"; // Kita gunakan helper untuk translate tag

export interface UserAnswersAlgae {
  color: string;
  texture: string;
  location: string;
  trigger: string;
}

export interface RecommendedAlgae extends Algae {
  matchScore: number;
  matchConfidenceKey: string;
  matchReasons: string[];
}

export function generateAlgaeDiagnosis(
  algaeList: Algae[],
  answers: UserAnswersAlgae,
  dict: any,
  lang: "id" | "en" = "id"
): RecommendedAlgae[] {
  // Bobot Diagnosis V1 (Akan disempurnakan di V2)
  const WEIGHTS = {
    color: 35,
    texture: 35,
    location: 15,
    trigger: 15
  };

  const results = algaeList.map(algae => {
    let score = 0;
    const reasons: string[] = [];
    
    // Ambil nama alias (contoh: BBA) atau nama asli untuk disisipkan di kalimat
    const algaeName = lang === "id" ? (algae.alias || algae.name_id) : (algae.alias || algae.name_en || algae.name_id);

    // 1. Evaluasi Warna (35 poin)
    if (answers.color && algae.color_tags?.includes(answers.color)) {
      score += WEIGHTS.color;
      const colorName = getAlgaeTagDesc(answers.color, lang).toLowerCase();
      reasons.push(lang === "id" 
        ? `Karakteristik warna ${colorName} sangat khas pada ${algaeName}.`
        : `The ${colorName} color is a very characteristic identifier for ${algaeName}.`
      );
    }

    // 2. Evaluasi Tekstur (35 poin)
    if (answers.texture && algae.texture_tags?.includes(answers.texture)) {
      score += WEIGHTS.texture;
      const textureName = getAlgaeTagDesc(answers.texture, lang).toLowerCase();
      reasons.push(lang === "id"
        ? `Tekstur visual ${textureName} sangat identik dengan struktur ${algaeName}.`
        : `The ${textureName} visual texture perfectly aligns with ${algaeName}'s structure.`
      );
    }

    // 3. Evaluasi Lokasi (15 poin)
    if (answers.location && algae.location_tags?.includes(answers.location)) {
      score += WEIGHTS.location;
      const locationName = getAlgaeTagDesc(answers.location, lang).toLowerCase();
      reasons.push(lang === "id"
        ? `Umumnya memang sering menempel dan menyebar di area ${locationName}.`
        : `Commonly attaches and spreads around the ${locationName}.`
      );
    }

    // 4. Evaluasi Pemicu (15 poin)
    if (answers.trigger && algae.trigger_tags?.includes(answers.trigger)) {
      score += WEIGHTS.trigger;
      const triggerName = getAlgaeTagDesc(answers.trigger, lang); // Tetap kapital
      reasons.push(lang === "id"
        ? `Kondisi "${triggerName}" terkonfirmasi sebagai pemicu utama kemunculannya.`
        : `The condition "${triggerName}" is a strongly confirmed root cause.`
      );
    }

    // Penentuan Keyakinan (Confidence)
    let confidenceKey = "Poor";
    if (score >= 90) confidenceKey = "Excellent";
    else if (score >= 70) confidenceKey = "VeryGood";
    else if (score >= 50) confidenceKey = "Good";
    else if (score >= 30) confidenceKey = "Moderate";

    return {
      ...algae,
      matchScore: score,
      matchConfidenceKey: confidenceKey,
      matchReasons: reasons
    } as RecommendedAlgae;
  });

  // Hanya kembalikan yang skornya relevan (> 0) dan urutkan dari yang tertinggi
  return results
    .filter(r => r.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore);
}