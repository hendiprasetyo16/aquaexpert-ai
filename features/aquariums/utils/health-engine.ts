// features/aquariums/utils/health-engine.ts

import { Aquarium } from "../types/aquarium.types";
import { AquariumParameterLog } from "../actions/parameter.actions";
import { TankFish, TankPlant } from "../actions/inventory.actions";

export interface HealthAnalysisResult {
  score: number;
  status: "Excellent" | "Good" | "Warning" | "Critical";
  alerts: string[];
  recommendations: string[];
}

interface AnalyzeProps {
  aquarium: Aquarium;
  parameters: AquariumParameterLog[];
  plants: TankPlant[];
  fishes: TankFish[];
}

export function analyzeAquariumHealth({
  aquarium,
  parameters,
  plants,
  fishes,
}: AnalyzeProps): HealthAnalysisResult {
  
  let score = 100;
  const alerts: string[] = [];
  const recommendations: string[] = [];
  
  // 1. ANALISIS PARAMETER AIR (PRIORITAS TERTINGGI)
  const latestParam = parameters.length > 0 ? parameters[0] : null; // Parameter terbaru

  if (latestParam) {
    // Amonia (Sangat Mematikan)
    if (latestParam.ammonia !== null && latestParam.ammonia !== undefined) {
      if (latestParam.ammonia > 0) {
        score -= 30; // Penalti sangat besar
        alerts.push(`Bahaya: Amonia terdeteksi (${latestParam.ammonia} ppm)`);
        recommendations.push("Segera lakukan water change 50% dan tambahkan bakteri starter.");
      }
    }

    // Nitrit (Mematikan)
    if (latestParam.nitrite !== null && latestParam.nitrite !== undefined) {
      if (latestParam.nitrite > 0.25) {
        score -= 25;
        alerts.push(`Kritis: Kadar Nitrit tinggi (${latestParam.nitrite} ppm)`);
        recommendations.push("Siklus nitrogen belum stabil. Ganti air 30% dan puasakan ikan.");
      } else if (latestParam.nitrite > 0) {
        score -= 10;
        alerts.push("Peringatan: Nitrit mulai terdeteksi.");
      }
    }

    // Nitrat (Beracun dalam jumlah besar)
    if (latestParam.nitrate !== null && latestParam.nitrate !== undefined) {
      if (latestParam.nitrate > 40) {
        score -= 15;
        alerts.push(`Kadar Nitrat tinggi (${latestParam.nitrate} ppm) memicu ledakan alga.`);
        recommendations.push("Lakukan jadwal ganti air lebih sering. Bersihkan media filter mekanis.");
      } else if (latestParam.nitrate > 20) {
        score -= 5;
      }
    }

    // pH Ekstrem
    if (latestParam.ph !== null && latestParam.ph !== undefined) {
      if (latestParam.ph < 5.5) {
        score -= 10;
        alerts.push("pH terlalu asam (di bawah 5.5). Risiko asidosis.");
        recommendations.push("Cek sumber air atau periksa benda yang menurunkan pH (seperti kayu atau daun ketapang berlebih).");
      } else if (latestParam.ph > 8.0) {
        score -= 10;
        alerts.push("pH terlalu basa (di atas 8.0). Amonia akan menjadi lebih beracun.");
        recommendations.push("Kurangi penggunaan bebatuan kapur (limestone) jika bukan tank cichlid Afrika.");
      }
    }

    // Suhu Ekstrem
    if (latestParam.temperature !== null && latestParam.temperature !== undefined) {
      if (latestParam.temperature > 32) {
        score -= 10;
        alerts.push("Suhu air terlalu panas. Oksigen terlarut akan drop tajam.");
        recommendations.push("Tambahkan kipas (cooling fan) atau nyalakan aerasi maksimal.");
      } else if (latestParam.temperature < 22 && aquarium.heater_enabled) {
        score -= 5;
        alerts.push("Suhu terlalu dingin. Pastikan heater berfungsi.");
      }
    }
  } else {
    // Belum ada data parameter sama sekali
    score -= 15;
    alerts.push("Tidak ada log parameter air.");
    recommendations.push("Segera uji air Anda (khususnya pH dan Amonia) untuk mencegah kematian massal ikan.");
  }

  // 2. ANALISIS BEBAN BIOLOGIS (OVERSTOCKING CHECK)
  const totalFishQuantity = fishes.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPlantQuantity = plants.reduce((acc, curr) => acc + curr.quantity, 0);
  
  // Aturan kasar: 1 Liter air aman untuk ~1.5 ekor ikan kecil
  // (Nanti bisa lebih akurat jika kita memakai panjang ikan/cm dari tabel fishes)
  if (aquarium.volume_liters > 0) {
    const maxFishEstimation = aquarium.volume_liters * 1.5; 
    if (totalFishQuantity > maxFishEstimation) {
      score -= 15;
      alerts.push(`Overstocking: ${totalFishQuantity} ekor ikan di dalam ${aquarium.volume_liters} Liter air.`);
      recommendations.push("Kurangi jumlah ikan atau tingkatkan kapasitas filter dan frekuensi water change.");
    }
  }

  // 3. ANALISIS PENYARING ALAMI (FLORA)
  if (totalFishQuantity > 5 && totalPlantQuantity === 0) {
    score -= 5;
    alerts.push("Tidak ada tanaman hidup untuk menyerap nitrat.");
    recommendations.push("Pertimbangkan menambah tanaman hidup (seperti Anubias atau stem plants) untuk sistem filtrasi alami.");
  }

  // VALIDASI SKOR AKHIR DAN PENENTUAN STATUS
  score = Math.max(0, Math.min(100, score)); // Pastikan skor selalu di rentang 0-100

  let status: "Excellent" | "Good" | "Warning" | "Critical" = "Good";
  if (score >= 90) status = "Excellent";
  else if (score >= 70) status = "Good";
  else if (score >= 50) status = "Warning";
  else status = "Critical";

  // Pesan bawaan jika tidak ada alert
  if (alerts.length === 0) {
    alerts.push("Kondisi ekosistem stabil.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Lanjutkan rutinitas perawatan (water change & pupuk) seperti biasa.");
  }

  return {
    score,
    status,
    alerts,
    recommendations
  };
}