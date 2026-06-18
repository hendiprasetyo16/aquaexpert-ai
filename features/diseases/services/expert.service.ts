// D:\aquaexpert-ai\features\diseases\services\expert.service.ts
import type { AquariumParameterLog } from "../types/parameter.types";

export interface Symptom {
  id: string;
  label_id: string;
  label_en: string;
  weight: number; // UPGRADE C: Bobot Keparahan Gejala
}

export interface DiseasePrediction {
  disease_name_id: string;
  disease_name_en: string;
  probability: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  treatment_id: string;
  treatment_en: string;
  isPrimary: boolean; // UPGRADE C: Flag Primary vs Secondary
}

// 1. KAMUS GEJALA KLINIS DENGAN BOBOT
export const COMMON_SYMPTOMS: Symptom[] = [
  { id: "gasping", label_id: "Megap-megap di permukaan", label_en: "Gasping at surface", weight: 4 },
  { id: "lethargy", label_id: "Lemas / Berdiam di dasar", label_en: "Lethargy / Sitting at bottom", weight: 2 },
  { id: "white_spots", label_id: "Bintik putih seperti garam", label_en: "White spots like salt", weight: 5 }, // Mutlak (Pathognomonic)
  { id: "flashing", label_id: "Menggesekkan badan ke benda", label_en: "Rubbing against objects (Flashing)", weight: 3 },
  { id: "fin_rot", label_id: "Sirip robek / membusuk", label_en: "Frayed or rotting fins", weight: 4 },
  { id: "loss_appetite", label_id: "Nafsu makan hilang", label_en: "Loss of appetite", weight: 2 },
  { id: "red_gills", label_id: "Insang memerah / meradang", label_en: "Red or inflamed gills", weight: 4 },
  { id: "bloated", label_id: "Perut bengkak / sisik berdiri", label_en: "Bloated / Pineconing scales", weight: 5 }, // Mutlak Dropsy
];

// 2. MATRIKS PENYAKIT & STRESOR LINGKUNGAN
const DISEASE_KNOWLEDGE_BASE = [
  {
    id: "ammonia_poisoning",
    name_id: "Keracunan Amonia (Ammonia Poisoning)",
    name_en: "Ammonia Poisoning",
    symptoms: ["gasping", "red_gills", "lethargy", "loss_appetite"],
    triggers: { ammonia: 0.25 }, 
    urgency: "CRITICAL",
    treatment_id: "Water change 50% segera. Stop pemberian pakan. Beri aerasi maksimal dan gunakan pengikat amonia (Ammonia Binder).",
    treatment_en: "Immediate 50% water change. Stop feeding. Maximize aeration and use Ammonia Binder."
  },
  {
    id: "nitrite_poisoning",
    name_id: "Penyakit Darah Coklat (Nitrite Poisoning)",
    name_en: "Brown Blood Disease (Nitrite Poisoning)",
    symptoms: ["gasping", "lethargy"],
    triggers: { nitrite: 0.25 }, 
    urgency: "CRITICAL",
    treatment_id: "Water change 30-50%. Tambahkan garam ikan (NaCl) 1 gram per liter untuk mencegah nitrit masuk ke insang.",
    treatment_en: "30-50% water change. Add aquarium salt (NaCl) at 1g/liter to block nitrite absorption."
  },
  {
    id: "ich",
    name_id: "Bintik Putih (Ich / White Spot)",
    name_en: "White Spot Disease (Ich)",
    symptoms: ["white_spots", "flashing", "lethargy"],
    triggers: { temp_max: 26 }, // Rentan menyerang jika suhu dingin
    urgency: "HIGH",
    treatment_id: "Naikkan suhu perlahan ke 28-30°C. Gunakan obat anti-parasit (Methylene Blue / Malachite Green).",
    treatment_en: "Slowly raise temperature to 28-30°C. Use anti-parasitic medication (Methylene Blue / Malachite Green)."
  },
  {
    id: "fin_rot",
    name_id: "Busuk Sirip (Fin Rot)",
    name_en: "Fin Rot",
    symptoms: ["fin_rot", "lethargy", "loss_appetite"],
    triggers: { nitrate: 40 }, // Dipicu kualitas air buruk
    urgency: "MEDIUM",
    treatment_id: "Perbaiki kualitas air (Water Change 30%). Gunakan antibiotik ringan atau ekstrak daun ketapang/Melafix.",
    treatment_en: "Improve water quality (30% WC). Use mild antibiotics, Catappa extract, or Melafix."
  },
  {
    id: "dropsy",
    name_id: "Sisik Nanas (Dropsy)",
    name_en: "Dropsy",
    symptoms: ["bloated", "loss_appetite", "lethargy"],
    triggers: { nitrate: 60, ammonia: 0.5 }, 
    urgency: "CRITICAL",
    treatment_id: "Karantina segera! Sangat menular. Mandi garam Epsom (Magnesium Sulfat) dan berikan antibiotik spektrum luas (Kanaplex).",
    treatment_en: "Quarantine immediately! Highly contagious. Epsom salt baths and broad-spectrum antibiotics (Kanaplex)."
  }
];

// ==========================================
// 3. ENGINE PROBABILITAS (DENGAN PEMBOBOTAN)
// ==========================================
export function predictDiseases(
  selectedSymptomIds: string[], 
  latestParam: AquariumParameterLog | null | undefined
): DiseasePrediction[] {
  
  if (selectedSymptomIds.length === 0) return [];

  const predictions: DiseasePrediction[] = [];

  DISEASE_KNOWLEDGE_BASE.forEach(disease => {
    let matchScore = 0;
    let maxPossibleScore = 4; // 4 adalah base environmental weight (Amonia 2 + Nitrit 2 / Suhu dll)

    // Hitung Max Score Spesifik untuk Penyakit ini
    disease.symptoms.forEach(symId => {
      const symData = COMMON_SYMPTOMS.find(s => s.id === symId);
      if (symData) maxPossibleScore += symData.weight;
    });

    let symptomMatches = 0;
    disease.symptoms.forEach(symId => {
      if (selectedSymptomIds.includes(symId)) {
        symptomMatches++;
        const symData = COMMON_SYMPTOMS.find(s => s.id === symId);
        if (symData) matchScore += symData.weight; // Menggunakan Bobot (Weight)
      }
    });

    if (symptomMatches === 0) return;

    // Evaluasi Stresor Lingkungan (Environmental Multiplier)
    let triggerHit = false;
    if (latestParam) {
      if (disease.triggers.ammonia !== undefined && latestParam.ammonia != null && latestParam.ammonia >= disease.triggers.ammonia) {
        matchScore += 2; triggerHit = true;
      }
      if (disease.triggers.nitrite !== undefined && latestParam.nitrite != null && latestParam.nitrite >= disease.triggers.nitrite) {
        matchScore += 2; triggerHit = true;
      }
      if (disease.triggers.nitrate !== undefined && latestParam.nitrate != null && latestParam.nitrate >= disease.triggers.nitrate) {
        matchScore += 1.5; triggerHit = true;
      }
      if (disease.triggers.temp_max !== undefined && latestParam.temperature != null && latestParam.temperature <= disease.triggers.temp_max) {
        matchScore += 1.5; triggerHit = true;
      }
    }

    let probability = Math.round((matchScore / maxPossibleScore) * 100);
    
    // Hard Override untuk kepastian 99%
    if (probability > 100) probability = 99;
    if (symptomMatches === disease.symptoms.length && triggerHit) probability = 98; 

    if (probability >= 20) {
      predictions.push({
        disease_name_id: disease.name_id,
        disease_name_en: disease.name_en,
        probability,
        urgency: disease.urgency as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        treatment_id: disease.treatment_id,
        treatment_en: disease.treatment_en,
        isPrimary: false
      });
    }
  });

  // Sort dari tinggi ke rendah
  const sorted = predictions.sort((a, b) => b.probability - a.probability);
  
  // UPGRADE C: Tandai Diagnosis Utama (Primary) dan Sekunder (Secondary)
  if (sorted.length > 0) {
    sorted[0].isPrimary = true;
  }

  return sorted;
}