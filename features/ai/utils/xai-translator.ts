// features/ai/utils/xai-translator.ts
import type { DiagnosisExplanation } from "../types/diagnosis.types";

export function translateXAI(explanation: DiagnosisExplanation, lang: 'id' | 'en' = 'id'): string {
  const code = explanation.code;
  const vars = explanation.variables || {};

  // 💡 HELPER: Menyatukan array menjadi string dengan aman
  const parseVars = (val: any) => Array.isArray(val) ? val.join(', ') : val;

  const dictionary: Record<string, { id: string; en: string }> = {
    'diagnosis.reasoningChain': {
      id: `Kesimpulan AI: Diagnosis didukung bukti kuat dari gejala [${parseVars(vars.evidences)}].`,
      en: `AI Conclusion: Supported by strong evidence of [${parseVars(vars.evidences)}].`
    },
    'diagnosis.hardExcluded': {
      id: `DIELIMINASI MUTLAK: Penyakit ini digugurkan (0%) karena ikan menunjukkan gejala pantangan (bertolak belakang secara medis).`,
      en: `ABSOLUTE EXCLUSION: Dropped to 0% due to the presence of contradictory medical symptoms.`
    },
    'diagnosis.diseaseEliminated': {
      id: `Eksklusi Rival: [${parseVars(vars.rivalName)}] digeser karena hilangnya gejala [${parseVars(vars.missingSymptoms)}].`,
      en: `Rival Exclusion: [${parseVars(vars.rivalName)}] displaced due to absence of [${parseVars(vars.missingSymptoms)}].`
    },
    'diagnosis.mandatoryMatched': { id: `Gejala mutlak terkonfirmasi: ${parseVars(vars.symptoms)}.`, en: `Mandatory symptoms confirmed: ${parseVars(vars.symptoms)}.` },
    'diagnosis.hallmarkMatchedDetailed': { id: `Ditemukan gejala sangat khas: ${parseVars(vars.symptoms)}.`, en: `Highly specific hallmark symptoms found: ${parseVars(vars.symptoms)}.` },
    'diagnosis.mandatoryMissing': { id: `Sangat Diragukan: Kehilangan gejala mutlak [${parseVars(vars.symptoms)}].`, en: `Highly Doubtful: Missing mandatory [${parseVars(vars.symptoms)}].` },
    'diagnosis.missingHallmarks': { id: `Kurang meyakinkan: Kehilangan gejala khas (${parseVars(vars.symptoms)}).`, en: `Inconclusive: Missing hallmarks (${parseVars(vars.symptoms)}).` },
    'diagnosis.recallHigh': { id: "Sebagian besar ciri khas penyakit ini dialami oleh ikan.", en: "Most traits of this disease are currently experienced by the fish." },
    'diagnosis.precisionHigh': { id: "Tingkat presisi kecocokan patologi sangat relevan.", en: "High pathology precision match." },
    'diagnosis.precisionLow': { id: "Banyak gejala yang dipilih tidak relevan dengan penyakit ini.", en: "Many selected symptoms are irrelevant to this specific disease." },
    'diagnosis.modifierHigh': { id: "Kondisi lingkungan/genetik sangat mendukung penyebaran penyakit ini.", en: "Environmental/genetic conditions strongly favor this outbreak." },
    'diagnosis.noAlienSymptoms': { id: "Tidak ada gejala aneh yang melenceng dari profil penyakit ini.", en: "No unrelated symptoms detected outside this disease's profile." },
    'diagnosis.highConflictingSymptoms': { id: "Terlalu banyak gejala tumpang-tindih yang membingungkan diagnosis.", en: "Too many overlapping symptoms confusing the diagnosis." }
  };

  return dictionary[code]?.[lang] || code;
}