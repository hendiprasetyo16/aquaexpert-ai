// features/aquariums/utils/health-engine.ts

import type { Aquarium } from "../types/aquarium.types";
import type { MaintenanceDashboardStatus } from "../types/maintenance.types";
import type { AquariumParameterLog } from "../types/parameter.types"; 
import type { TankFish, TankPlant } from "../types/inventory.types"; 

export type HealthStatus = "Excellent" | "Good" | "Warning" | "Critical";
export type HealthTrend = "improving" | "stable" | "declining"; 

export interface HealthScores {
  waterQuality: number;
  maintenance: number;
  bioload: number;
  plant: number | null; 
  overall: number;
}

export interface HealthAnalysisResult {
  scores: HealthScores;
  status: HealthStatus;
  trend: HealthTrend; 
  alerts: string[];
  recommendations: string[];
}

interface AnalyzeProps {
  aquarium: Aquarium;
  parameters: AquariumParameterLog[];
  plants: TankPlant[];
  fishes: TankFish[];
  maintenanceStatus?: MaintenanceDashboardStatus[];
}

// Helper untuk konsistensi rentang nilai 0-100
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.floor(score)));
}

function getStatusFromScore(score: number): HealthStatus {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Warning";
  return "Critical";
}

// Helper Moving Average yang 100% Type-Safe menggunakan Extractor Pattern
function getAverage(
  params: AquariumParameterLog[], 
  extractor: (p: AquariumParameterLog) => number | null | undefined, 
  maxLogs: number = 5, 
  maxDays: number = 14
): number | null {
  const now = new Date().getTime();
  const validValues: number[] = [];

  for (const p of params) {
    if (validValues.length >= maxLogs) break;
    
    // TODO: Replace created_at with recorded_at/measured_at when parameter schema supports measurement timestamps.
    const pDate = p.created_at ? new Date(p.created_at).getTime() : now;
    const daysDiff = (now - pDate) / (1000 * 60 * 60 * 24);
    const val = extractor(p);
    
    if (daysDiff <= maxDays && val !== null && val !== undefined) {
      validValues.push(val);
    }
  }

  if (validValues.length === 0) return null;
  const sum = validValues.reduce((a, b) => a + b, 0);
  return sum / validValues.length;
}

export function analyzeAquariumHealth({
  aquarium,
  parameters,
  plants,
  fishes,
  maintenanceStatus = [],
}: AnalyzeProps): HealthAnalysisResult {
  
  const alerts: string[] = [];
  const recommendations: string[] = [];
  
  // ==========================================
  // 1. WATER QUALITY SCORE (0-100)
  // ==========================================
  let waterScore = 100;
  const latestParam = parameters.length > 0 ? parameters[0] : null;

  if (latestParam) {
    // 1A. FRESHNESS CHECK
    const paramDate = latestParam.created_at ? new Date(latestParam.created_at) : new Date();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - paramDate.getTime());
    const daysSinceLastParameter = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysSinceLastParameter > 60) {
      waterScore -= 40;
      alerts.push(`Kritis: Data parameter air sangat usang (${daysSinceLastParameter} hari).`);
      recommendations.push("Segera uji parameter air secara menyeluruh.");
    } else if (daysSinceLastParameter > 30) {
      waterScore -= 25;
      alerts.push(`Peringatan: Log parameter air belum diperbarui > 1 bulan.`);
      recommendations.push("Jadwalkan pengujian air minggu ini.");
    } else if (daysSinceLastParameter > 14) {
      waterScore -= 10;
      alerts.push(`Info: Data parameter air sudah melewati 14 hari.`);
      recommendations.push("Sebaiknya lakukan tes air ringan (Amonia/pH) dalam waktu dekat.");
    }

    // 1B. LAYER 1: HISTORICAL SCORE (Menggunakan Rata-Rata untuk Meredam Anomali)
    const avgAmmonia = getAverage(parameters, p => p.ammonia);
    const avgNitrite = getAverage(parameters, p => p.nitrite);
    const avgNitrate = getAverage(parameters, p => p.nitrate);
    const avgPh = getAverage(parameters, p => p.ph);
    const avgTemp = getAverage(parameters, p => p.temperature);

    if (avgAmmonia !== null && avgAmmonia > 0) waterScore -= Math.min(60, avgAmmonia * 30);
    if (avgNitrite !== null && avgNitrite > 0) waterScore -= Math.min(50, avgNitrite * 25);
    if (avgNitrate !== null && avgNitrate > 20) waterScore -= Math.min(30, (avgNitrate - 20) * 0.5);
    
    if (avgPh !== null && (avgPh < 5.5 || avgPh > 8.0)) waterScore -= 15;
    if (avgTemp !== null && (avgTemp > 32 || (avgTemp < 22 && aquarium.heater_enabled))) waterScore -= 15;

    // 1C. LAYER 2: EMERGENCY OVERRIDE (Keselamatan Mutlak Berdasarkan Data Terbaru)
    if (latestParam.ammonia !== null && latestParam.ammonia > 0) {
      alerts.push(`Bahaya: Amonia terdeteksi (${latestParam.ammonia} ppm)`);
      recommendations.push("Segera lakukan water change 50% dan tambahkan bakteri starter.");
      if (latestParam.ammonia >= 1.0) waterScore = Math.min(waterScore, 40); 
    }

    if (latestParam.nitrite !== null && latestParam.nitrite > 0) {
      if (latestParam.nitrite > 0.25) {
        alerts.push(`Kritis: Kadar Nitrit tinggi (${latestParam.nitrite} ppm)`);
        recommendations.push("Siklus nitrogen belum stabil. Ganti air 30% dan puasakan ikan.");
        waterScore = Math.min(waterScore, 40);
      } else {
        alerts.push("Peringatan: Nitrit mulai terdeteksi.");
      }
    }

    if (latestParam.nitrate !== null && latestParam.nitrate > 20) {
      if (latestParam.nitrate > 40) {
        alerts.push(`Kadar Nitrat tinggi (${latestParam.nitrate} ppm) memicu ledakan alga.`);
        recommendations.push("Tingkatkan frekuensi ganti air berkala dan bersihkan media mekanis.");
      }
    }

    if (latestParam.ph !== null) {
      if (latestParam.ph < 5.5) {
        alerts.push("pH terlalu asam (di bawah 5.5). Risiko asidosis fatal pada fauna.");
        waterScore = Math.min(waterScore, 50); 
      } else if (latestParam.ph > 8.0) {
        alerts.push("pH terlalu basa (di atas 8.0). Amonia akan menjadi lebih beracun.");
        waterScore = Math.min(waterScore, 50); 
      }
    }

    if (latestParam.temperature !== null) {
      if (latestParam.temperature > 32) {
        alerts.push("Suhu air terlalu panas. Oksigen terlarut drop tajam.");
        recommendations.push("Tambahkan kipas (cooling fan) atau nyalakan aerasi maksimal.");
        waterScore = Math.min(waterScore, 50); 
      } else if (latestParam.temperature < 22 && aquarium.heater_enabled) {
        alerts.push("Suhu terlalu dingin. Pastikan heater berfungsi.");
        waterScore = Math.min(waterScore, 50);
      }
    }
  } else {
    waterScore = 50;
    alerts.push("Tidak ada log parameter air.");
    recommendations.push("Lakukan pengujian parameter air dasar (pH, Ammonia) sebagai langkah awal diagnosis.");
  }
  waterScore = clampScore(waterScore);

  // ==========================================
  // 2. MAINTENANCE SCORE (0-100)
  // ==========================================
  let maintenanceScore = 100;
  if (maintenanceStatus.length > 0) {
    let criticalCount = 0;
    let warningCount = 0;

    maintenanceStatus.forEach(status => {
      if (status.urgencyLevel === "critical") criticalCount++;
      else if (status.urgencyLevel === "warning" && status.isOverdue) warningCount++;
    });

    const totalMaintenancePenalty = (criticalCount * 30) + (warningCount * 10);
    maintenanceScore -= totalMaintenancePenalty;
    
    if (totalMaintenancePenalty > 0) {
      alerts.push(`Penundaan perawatan: ${criticalCount} Kritis, ${warningCount} Peringatan.`);
      recommendations.push("Selesaikan sisa tunggakan pemeliharaan fisik untuk menghindari kelelahan ekosistem.");
    }
  }
  maintenanceScore = clampScore(maintenanceScore);

  // ==========================================
  // 3. BIOLOAD SCORE (0-100)
  // ==========================================
  let bioloadScore = 100;
  const totalFishQuantity = fishes.reduce((acc, curr) => acc + curr.quantity, 0);
  
  if (totalFishQuantity > 0 && aquarium.volume_liters > 0) {
    const estimatedTotalLengthCm = fishes.reduce((acc, curr) => {
      // FIX: Kombinasi ukuran fisik (cm) dikali faktor pengali limbah (bioload_factor)
      const adultSize = curr.fish?.estimated_adult_size_cm ?? 4; 
      const wasteMultiplier = curr.fish?.bioload_factor ?? 1.0; 
      
      // Ikan sapu-sapu 10cm dengan faktor 2.0 akan dihitung setara dengan 20cm ikan normal
      return acc + (curr.quantity * adultSize * wasteMultiplier);
    }, 0);
    
    const bioloadRatio = estimatedTotalLengthCm / aquarium.volume_liters;

    if (bioloadRatio > 1.5) {
      bioloadScore -= 60;
      alerts.push(`Overstocking Ekstrem: Rasio ${bioloadRatio.toFixed(2)} cm ikan / Liter (Batas 1.0).`);
      recommendations.push("Segera pindahkan ikan ke tank lain. Risiko amonia spike sangat tinggi.");
    } else if (bioloadRatio > 1.0) {
      bioloadScore -= 30;
      alerts.push("Beban biologis (Bioload) hampir melampaui batas aman kapasitas tampung.");
      recommendations.push("Tingkatkan filtrasi biologis dan pertahankan disiplin jadwal ganti air.");
    }
  }
  bioloadScore = clampScore(bioloadScore);

  // ==========================================
  // 4. PLANT SCORE (0-100 atau null)
  // ==========================================
  let plantScore: number | null = null;
  const totalPlantQuantity = plants.reduce((acc, curr) => acc + curr.quantity, 0);

  if (totalPlantQuantity > 0 && aquarium.volume_liters > 0) {
    const density = totalPlantQuantity / aquarium.volume_liters; 
    if (density < 0.03) plantScore = 40; 
    else if (density < 0.08) plantScore = 80; 
    else if (density <= 0.15) plantScore = 100; 
    else if (density <= 0.25) plantScore = 80; 
    else {
      plantScore = 60; 
      alerts.push(`Overcrowded Plants: Kepadatan tanaman terlalu tinggi.`);
      recommendations.push("Lakukan pemangkasan untuk mencegah dead-spots sirkulasi dan busuk daun.");
    }
  } else if (totalFishQuantity > 5) {
    alerts.push("Tidak ada tanaman hidup untuk menyerap nitrat berlebih secara alami.");
    recommendations.push("Pertimbangkan menanam tanaman low-light sebagai filter penunjang biologis.");
  }

  // ==========================================
  // 5. OVERALL HEALTH SCORE & TREND
  // ==========================================
  let overallScore = 0;
  if (plantScore !== null) {
    overallScore = (waterScore * 0.40) + (maintenanceScore * 0.25) + (bioloadScore * 0.25) + (plantScore * 0.10);
  } else {
    overallScore = (waterScore * 0.45) + (maintenanceScore * 0.25) + (bioloadScore * 0.30);
  }
  overallScore = clampScore(overallScore);

  // 6. EMERGENCY OVERALL OVERRIDE (The "Weakest Link" Rule)
  if (waterScore <= 40) {
    overallScore = Math.min(overallScore, waterScore);
    alerts.push("Kondisi Keseluruhan Kritis: Kualitas air yang buruk mengancam stabilitas seluruh ekosistem.");
  }
  if (bioloadScore <= 40) {
    overallScore = Math.min(overallScore, bioloadScore);
  }
  overallScore = clampScore(overallScore);

  // IMPORTANT:
  // parameters must be sorted DESC by created_at (or recorded_at) for this trend logic to be accurate.
  let healthTrend: HealthTrend = "stable";
  if (parameters.length > 1) {
    const currentParam = parameters[0];
    const previousParam = parameters[1];
    
    const currentToxinLoad = (currentParam.ammonia ?? 0) + (currentParam.nitrite ?? 0) + ((currentParam.nitrate ?? 0) * 0.1);
    const previousToxinLoad = (previousParam.ammonia ?? 0) + (previousParam.nitrite ?? 0) + ((previousParam.nitrate ?? 0) * 0.1);

    if (currentToxinLoad > previousToxinLoad) healthTrend = "declining";
    else if (currentToxinLoad < previousToxinLoad) healthTrend = "improving";
  }

  if (alerts.length === 0) alerts.push("Kondisi ekosistem sangat stabil dan harmonis.");
  if (recommendations.length === 0) recommendations.push("Lanjutkan rutinitas perawatan hebat Anda!");

  return {
    scores: {
      waterQuality: waterScore,
      maintenance: maintenanceScore,
      bioload: bioloadScore,
      plant: plantScore,
      overall: overallScore
    },
    status: getStatusFromScore(overallScore),
    trend: healthTrend,
    alerts,
    recommendations
  };
}