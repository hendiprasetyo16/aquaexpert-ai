// features/algae/services/expert.service.ts
import { Algae } from "../types/algae.types";
import { getAlgaeTagDesc } from "../components/algae-helpers";

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
  // REFAKTOR: Mengganti any menjadi unknown. 
  // (Meskipun dict saat ini belum dipakai di dalam fungsi, tipe unknown akan melindunginya dari teguran linter)
  dict: unknown,
  lang: "id" | "en" = "id"
): RecommendedAlgae[] {
  
  // FINAL WEIGHTS: Visual observasi (Warna & Tekstur) adalah Raja (70%)
  const WEIGHTS = { color: 35, texture: 35, location: 20, trigger: 10 };
  
  // FINAL PENALTIES: Penalti trigger dibuat sangat kecil (-2) agar salah tebak user tidak merusak diagnosis visual.
  const PENALTIES = { color: -15, texture: -15, location: -5, trigger: -2 };

  const results = algaeList.map(algae => {
    let score = 0;
    const reasons: string[] = [];
    
    const algaeName = lang === "id" ? (algae.alias || algae.name_id) : (algae.alias || algae.name_en || algae.name_id);

    // 1. Evaluasi Warna
    if (answers.color) {
      if (algae.color_tags?.includes(answers.color)) {
        score += WEIGHTS.color;
        const colorName = getAlgaeTagDesc(answers.color, lang).toLowerCase();
        reasons.push(lang === "id" 
          ? `Karakteristik warna ${colorName} sangat khas pada ${algaeName}.`
          : `The ${colorName} color is a very characteristic identifier for ${algaeName}.`
        );
      } else {
        score += PENALTIES.color; 
      }
    }

    // 2. Evaluasi Tekstur
    if (answers.texture) {
      if (algae.texture_tags?.includes(answers.texture)) {
        score += WEIGHTS.texture;
        const textureName = getAlgaeTagDesc(answers.texture, lang).toLowerCase();
        reasons.push(lang === "id"
          ? `Tekstur visual ${textureName} sangat identik dengan struktur ${algaeName}.`
          : `The ${textureName} visual texture perfectly aligns with ${algaeName}'s structure.`
        );
      } else {
        score += PENALTIES.texture;
      }
    }

    // 3. Evaluasi Lokasi
    if (answers.location) {
      if (algae.location_tags?.includes(answers.location)) {
        score += WEIGHTS.location;
        const locationName = getAlgaeTagDesc(answers.location, lang).toLowerCase();
        reasons.push(lang === "id"
          ? `Umumnya memang sering menempel dan menyebar di area ${locationName}.`
          : `Commonly attaches and spreads around the ${locationName}.`
        );
      } else {
        score += PENALTIES.location;
      }
    }

    // 4. Evaluasi Pemicu (Trigger)
    if (answers.trigger) {
      if (algae.trigger_tags?.includes(answers.trigger)) {
        score += WEIGHTS.trigger;
        const triggerName = getAlgaeTagDesc(answers.trigger, lang); 
        reasons.push(lang === "id"
          ? `Kondisi "${triggerName}" terkonfirmasi sebagai pemicu kemunculannya.`
          : `The condition "${triggerName}" is a confirmed root cause.`
        );
      } else {
        score += PENALTIES.trigger;
      }
    }

    // Mencegah skor minus
    if (score < 0) score = 0;

    // CONFIDENCE THRESHOLD (STRICT & REALISTIC)
    let confidenceKey = "Poor";
    if (score >= 90) confidenceKey = "Excellent";
    else if (score >= 75) confidenceKey = "VeryGood";
    else if (score >= 60) confidenceKey = "Good";
    else if (score >= 40) confidenceKey = "Moderate";

    return {
      ...algae,
      matchScore: score,
      matchConfidenceKey: confidenceKey,
      matchReasons: reasons
    } as RecommendedAlgae;
  });

  return results
    .filter(r => r.matchScore >= 30) // Hanya tampilkan yang masuk akal
    .sort((a, b) => b.matchScore - a.matchScore);
}