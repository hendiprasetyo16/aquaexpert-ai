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

export function generateDeepDiagnosis({ aquarium, health, parameters, fishes, plants, lang }: Props): DeepDiagnosisResult {

  const rootCauses: DiagnosisCause[] = [];
  const recommendations: string[] = [];
  const nextActions: string[] = [];
  const latest = parameters[0];

  // Identifikasi Ekosistem
  const hasShrimp = fishes.some(f => f.fish?.fish_type === "Invertebrate" || f.fish?.fish_type?.toLowerCase().includes("shrimp"));
  
  // PRIORITAS 2: Hitung jumlah ikan sakit yang presisi (bukan sekadar boolean)
  const sickFishCount = fishes
    .filter(f => f.health_status === "Sick")
    .reduce((sum, f) => sum + f.quantity, 0);
    
  const hyperactiveFishes = fishes.filter(f => f.fish?.activity_level === "High");

  // =====================
  // 1. WATER CHEMISTRY (Amonia, Nitrit, Nitrat, GH, KH)
  // =====================
  if (latest?.ammonia && latest.ammonia > 0) {
    rootCauses.push({
      title: lang === 'id' ? "Lonjakan Amonia" : "Ammonia Spike", severity: "high",
      description: lang === 'id' ? `Kadar amonia ${latest.ammonia} ppm mematikan bagi insang ikan.` : `Ammonia level ${latest.ammonia} ppm is burning gills.`
    });
    nextActions.push(lang === 'id' ? "Lakukan Water Change 50% & Stop Pakan." : "50% Water Change & Stop Feeding.");
  }

  // PRIORITAS 1: Deteksi Nitrit Berbahaya
  if (latest?.nitrite && latest.nitrite > 0.25) {
    rootCauses.push({
      title: lang === "id" ? "Nitrit Berbahaya" : "Dangerous Nitrite",
      severity: "high",
      description: lang === "id"
          ? `Nitrit ${latest.nitrite} ppm menghambat penyerapan oksigen oleh darah ikan (Brown Blood Disease).`
          : `Nitrite ${latest.nitrite} ppm reduces oxygen transport in fish blood.`
    });
    recommendations.push(
      lang === "id" ? "Lakukan water change 30% dan periksa siklus nitrogen filter Anda." : "Perform 30% water change and check nitrogen cycle."
    );
  }

  if (latest?.nitrate && latest.nitrate > 40) {
    rootCauses.push({
      title: lang === 'id' ? "Nitrat Tinggi" : "High Nitrate", severity: "medium",
      description: lang === 'id' ? `Nitrat ${latest.nitrate} ppm dapat memicu stres panjang dan alga.` : `Nitrate ${latest.nitrate} ppm triggers long-term stress.`
    });
  }

  // GH & KH CHECK (Berdampak ke Udang dan Stabilitas pH)
  if (latest?.gh !== undefined && latest.gh !== null) {
    if (latest.gh < 4 && hasShrimp) {
      rootCauses.push({
        title: lang === 'id' ? "GH Sangat Rendah (Moulting Udang Gagal)" : "Low GH (Failed Moulting)", severity: "high",
        description: lang === 'id' ? "Tingkat kekerasan air (GH) terlalu rendah untuk pembentukan cangkang udang (risiko mati saat ganti kulit)." : "Water is too soft for shrimp to build shells."
      });
      recommendations.push(lang === 'id' ? "Tambahkan mineral GH+ (Kalsium/Magnesium) ke dalam tangki." : "Dose GH+ minerals.");
    }
  }

  if (latest?.kh !== undefined && latest.kh !== null) {
    if (latest.kh < 2) {
      rootCauses.push({
        title: lang === 'id' ? "Risiko pH Crash (KH Rendah)" : "pH Crash Risk (Low KH)", severity: "medium",
        description: lang === 'id' ? "Kapasitas penyangga air sangat rendah. pH dapat anjlok tiba-tiba di malam hari." : "Buffer capacity is low. pH might crash unexpectedly."
      });
    }
  }

  // =====================
  // 2. FISH HEALTH & INVENTORY
  // =====================
  
  // Impelementasi PRIORITAS 2 (Notifikasi informatif jumlah ikan sakit)
  if (sickFishCount > 0) {
    rootCauses.push({
      title: lang === 'id' ? "Wabah Penyakit Aktif" : "Active Disease Outbreak", severity: "high",
      description: lang === 'id' ? `Terdapat ${sickFishCount} ekor ikan dengan status 'Sakit'. Risiko penularan masif di tangki utama.` : `${sickFishCount} fish marked as 'Sick'. High risk of cross-infection.`
    });
    nextActions.push(lang === 'id' ? "Segera pindahkan ikan sakit ke Tank Karantina." : "Move sick fish to Quarantine Tank immediately.");
  }

  if (health.scores.bioload <= 40) {
    rootCauses.push({
      title: "Overstocking (Overcapacity)", severity: "high",
      description: lang === 'id' ? "Beban kotoran ikan melebihi batas filtrasi volume air." : "Fish waste load exceeds filtration limits."
    });
  }

  // Pengecekan Ruang untuk Ikan Aktif (Activity Level)
  if (hyperactiveFishes.length > 0 && aquarium.length_cm < 80) {
    rootCauses.push({
      title: lang === 'id' ? "Ruang Renang Terbatas" : "Limited Swimming Space", severity: "medium",
      description: lang === 'id' ? "Ikan perenang cepat (Hiperaktif) membutuhkan tangki yang lebih panjang untuk mencegah stres." : "High-activity fish need longer tanks to avoid stress."
    });
  }

  // =====================
  // 3. AQUASCAPE STYLE & PLANTS
  // =====================
  if (plants.length === 0) {
    if (aquarium.aquascape_style === "Dutch") {
      rootCauses.push({
        title: lang === 'id' ? "Tema Aquascape Tidak Sesuai" : "Theme Mismatch", severity: "high",
        description: lang === 'id' ? "Gaya 'Dutch' mewajibkan populasi tanaman yang sangat lebat (70% area), namun tangki Anda kosong." : "Dutch style requires heavy planting (70% cover), but tank has no plants."
      });
    } else if (aquarium.aquascape_style === "Nature") {
      rootCauses.push({
        title: lang === 'id' ? "Kekurangan Elemen Flora" : "Lack of Flora", severity: "medium",
        description: lang === 'id' ? "Gaya 'Nature' umumnya membutuhkan tanaman epifit atau rimbunan belakang." : "Nature style requires plants."
      });
    } 
    // PRIORITAS 3: Pengecualian dan Afirmasi Positif untuk Blackwater
    else if (aquarium.aquascape_style === "Blackwater") {
      recommendations.push(
        lang === "id"
          ? "Tangki bergaya Blackwater memang tidak memerlukan kepadatan tanaman tinggi. Fokuskan pada tannin dari daun ketapang."
          : "Blackwater aquariums typically do not require dense planting. Focus on leaf litter for tannins."
      );
    }
  }

  // =====================
  // 4. MAINTENANCE DEBT
  // =====================
  if (health.scores.maintenance < 70) {
    rootCauses.push({
      title: lang === 'id' ? "Tunggakan Perawatan" : "Maintenance Debt", severity: "medium",
      description: lang === 'id' ? "Beberapa jadwal perawatan telah terlewat." : "Several maintenance tasks are overdue."
    });
    recommendations.push(lang === 'id' ? "Segera selesaikan tugas perawatan yang tertunda." : "Complete overdue maintenance tasks.");
  }

  // =====================
  // 5. RISK LEVEL CALCULATION
  // =====================
  let riskLevel: RiskLevel = "LOW";
  if (health.scores.overall < 85) riskLevel = "MEDIUM";
  if (health.scores.overall < 70) riskLevel = "HIGH";
  if (health.scores.overall < 50) riskLevel = "CRITICAL";

  // =====================
  // SUMMARY NARRATIVE
  // =====================
  let summary = "";
  if (riskLevel === "LOW") summary = lang === 'id' ? "Ekosistem akuarium beroperasi pada kondisi puncak dan sangat harmonis." : "Ecosystem is operating at peak condition.";
  else if (riskLevel === "MEDIUM") summary = lang === 'id' ? "Sistem stabil, namun terdeteksi beberapa inefisiensi yang perlu penyesuaian." : "Stable system, but detected inefficiencies require tuning.";
  else if (riskLevel === "HIGH") summary = lang === 'id' ? "Peringatan Sistem: Ditemukan faktor risiko yang dapat merusak keseimbangan biologis." : "System Warning: Risk factors detected that may break biological balance.";
  else summary = lang === 'id' ? "KRITIS: Terdeteksi kegagalan ekosistem! Tindakan evakuasi dan Triage diperlukan." : "CRITICAL: Ecosystem failure detected! Triage required.";

  if (nextActions.length === 0) nextActions.push(lang === 'id' ? "Pertahankan jadwal maintenance dan observasi." : "Maintain schedule and observe.");
  if (recommendations.length === 0) recommendations.push(lang === 'id' ? "Kualitas air dan harmoni penghuni sangat baik." : "Water quality and harmony are excellent.");

  return { summary, riskLevel, rootCauses, recommendations, nextActions, generatedAt: new Date().toISOString() };
}