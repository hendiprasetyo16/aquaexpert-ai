// features/aquariums/utils/deep-diagnosis.ts
import type { HealthAnalysisResult } from "./health-engine";
import type { Aquarium } from "../types/aquarium.types";
import type { AquariumParameterLog } from "../types/parameter.types";
import type { TankFish, TankPlant } from "../types/inventory.types";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DiagnosisCause {
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface DeepDiagnosisResult {
  summary: string;
  riskLevel: RiskLevel;
  rootCauses: DiagnosisCause[];
  recommendations: string[];
  nextActions: string[];
  generatedAt: string;
}

interface Props {
  aquarium: Aquarium;
  health: HealthAnalysisResult;
  parameters: AquariumParameterLog[];
  fishes: TankFish[];
  plants: TankPlant[];
  lang: "id" | "en";
}

export function generateDeepDiagnosis({
  aquarium,
  health,
  parameters,
  fishes,
  plants,
  lang
}: Props): DeepDiagnosisResult {

  const rootCauses: DiagnosisCause[] = [];
  const recommendations: string[] = [];
  const nextActions: string[] = [];

  const latest = parameters[0];

  // =====================
  // WATER QUALITY
  // =====================
  if (latest?.ammonia && latest.ammonia > 0) {
    rootCauses.push({
      title: lang === 'id' ? "Deteksi Amonia" : "Ammonia Detected",
      severity: "high",
      description: lang === 'id' 
        ? `Kadar amonia ${latest.ammonia} ppm terdeteksi, sangat beracun bagi ikan.` 
        : `Ammonia level ${latest.ammonia} ppm detected, highly toxic.`
    });
    recommendations.push(lang === 'id' ? "Segera lakukan pergantian air (Water Change) 50%." : "Perform 50% water change immediately.");
    nextActions.push(lang === 'id' ? "Tambahkan bakteri starter (Beneficial bacteria)." : "Add beneficial bacteria.");
  }

  if (latest?.nitrate && latest.nitrate > 40) {
    rootCauses.push({
      title: lang === 'id' ? "Nitrat Tinggi" : "High Nitrate",
      severity: "medium",
      description: lang === 'id' 
        ? `Kadar nitrat ${latest.nitrate} ppm dapat memicu ledakan alga (Algae bloom).` 
        : `Nitrate level ${latest.nitrate} ppm may trigger algae growth.`
    });
    recommendations.push(lang === 'id' ? "Tingkatkan frekuensi pergantian air mingguan." : "Increase water change frequency.");
  }

  // =====================
  // MAINTENANCE
  // =====================
  if (health.scores.maintenance < 70) {
    rootCauses.push({
      title: lang === 'id' ? "Tunggakan Perawatan" : "Maintenance Debt",
      severity: "medium",
      description: lang === 'id' ? "Beberapa jadwal perawatan telah terlewat." : "Several maintenance tasks are overdue."
    });
    recommendations.push(lang === 'id' ? "Segera selesaikan tugas perawatan yang tertunda." : "Complete overdue maintenance tasks.");
  }

  // =====================
  // BIOLOAD & OVERSTOCKING
  // =====================
  if (health.scores.bioload <= 40) {
    rootCauses.push({
      title: "Overstocking",
      severity: "high",
      description: lang === 'id' ? "Populasi fauna melebihi kapasitas filtrasi ekosistem." : "Fish population exceeds ecosystem capacity."
    });
    recommendations.push(lang === 'id' ? "Kurangi populasi ikan atau upgrade kapasitas filter." : "Reduce fish population or upgrade filtration.");
  }

  // =====================
  // PLANTS
  // =====================
  if (plants.length === 0 && fishes.length > 5) {
    rootCauses.push({
      title: lang === 'id' ? "Kekurangan Flora" : "Insufficient Plants",
      severity: "medium",
      description: lang === 'id' ? "Tidak ada tanaman hidup untuk membantu menyerap nitrat alami." : "No live plants available to assist nitrate absorption."
    });
    recommendations.push(lang === 'id' ? "Tambahkan tanaman *low-maintenance* seperti Anubias/Fern." : "Add low-maintenance plants.");
  }

  // =====================
  // RISK LEVEL CALCULATION
  // =====================
  let riskLevel: RiskLevel = "LOW";
  if (health.scores.overall < 85) riskLevel = "MEDIUM";
  if (health.scores.overall < 70) riskLevel = "HIGH";
  if (health.scores.overall < 50) riskLevel = "CRITICAL";

  // =====================
  // SUMMARY NARRATIVE
  // =====================
  let summary = "";
  switch (riskLevel) {
    case "LOW":
      summary = lang === 'id' ? "Ekosistem akuarium sangat stabil dan sehat." : "Aquarium ecosystem is stable and healthy.";
      break;
    case "MEDIUM":
      summary = lang === 'id' ? "Ditemukan masalah minor yang memerlukan sedikit perhatian." : "Minor issues detected that require attention.";
      break;
    case "HIGH":
      summary = lang === 'id' ? "Terdapat beberapa faktor risiko yang dapat merusak kestabilan ekosistem." : "Multiple risk factors may destabilize the ecosystem.";
      break;
    case "CRITICAL":
      summary = lang === 'id' ? "Ekosistem dalam bahaya! Intervensi segera sangat disarankan." : "Immediate intervention is strongly recommended.";
      break;
  }

  if (nextActions.length === 0) {
    nextActions.push(lang === 'id' ? "Lanjutkan jadwal perawatan rutin seperti biasa." : "Continue regular maintenance schedule.");
  }

  return {
    summary,
    riskLevel,
    rootCauses,
    recommendations,
    nextActions,
    generatedAt: new Date().toISOString()
  };
}