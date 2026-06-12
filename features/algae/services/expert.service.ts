// features/algae/services/expert.service.ts
import { Algae } from "../types/algae.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

// Input yang akan dikirim dari UI Form
export interface UserAnswersAlgae {
  color: string;
  texture: string;
  location: string;
  trigger: string;
}

// Flat interface untuk dikonsumsi UI
export interface RecommendedAlgae extends Algae {
  matchScore: number;
  matchReasons: string[];
  matchConfidenceKey: ConfidenceKey;
}

// Typing Dictionary yang tegas (Tidak ada 'any')
export interface AlgaeExpertDictionary {
  reasonColor: string;
  reasonTexture: string;
  reasonLocation: string;
  reasonTrigger: string;
  // Sisanya seperti title, dll ada di file json, tapi ini yang wajib untuk service
}

export function generateAlgaeDiagnosis(
  allAlgae: Algae[], 
  answers: UserAnswersAlgae, 
  dictAE: AlgaeExpertDictionary
): RecommendedAlgae[] {
  
  const rawEvaluations: RawEvaluation<Algae>[] = [];

  for (const algae of allAlgae) {
    let score = 0;
    let reasons: string[] = [];

    // 1. MATCH COLOR (Bobot Tertinggi: 35%)
    // Karena satu alga bisa punya beberapa warna dominan, kita pakai includes
    if (answers.color && algae.color_tags.includes(answers.color)) {
      score += 35;
      reasons.push(dictAE.reasonColor);
    }

    // 2. MATCH TEXTURE (Bobot Tertinggi: 35%)
    // Tekstur sangat vital untuk mengidentifikasi alga
    if (answers.texture && algae.texture_tags.includes(answers.texture)) {
      score += 35;
      reasons.push(dictAE.reasonTexture);
    }

    // 3. MATCH LOCATION (Bobot Sedang: 15%)
    if (answers.location && algae.location_tags.includes(answers.location)) {
      score += 15;
      reasons.push(dictAE.reasonLocation);
    }

    // 4. MATCH TRIGGER / TANK CONDITION (Bobot Sedang: 15%)
    if (answers.trigger && algae.trigger_tags.includes(answers.trigger)) {
      score += 15;
      reasons.push(dictAE.reasonTrigger);
    }

    // Memasukkan hasil raw ke penampung
    rawEvaluations.push({ item: algae, rawScore: score, reasons });
  }

  // ==========================================
  // PANGGIL CORE EXPERT ENGINE UNTUK STANDARISASI
  // Threshold 20: Jika kecocokan di bawah 20%, abaikan dari hasil akhir
  // ==========================================
  const processedResults = processExpertResults(rawEvaluations, 20);

  // Flatten hasil agar kompatibel dengan Card UI
  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}