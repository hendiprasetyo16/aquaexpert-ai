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
  fishHealth: number; // KOLOM BARU UNTUK SCORING KESEHATAN IKAN
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

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.floor(score)));
}

function getStatusFromScore(score: number): HealthStatus {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Warning";
  return "Critical";
}

function getAverage(params: AquariumParameterLog[], extractor: (p: AquariumParameterLog) => number | null | undefined, maxLogs: number = 5, maxDays: number = 14): number | null {
  const now = new Date().getTime();
  const validValues: number[] = [];

  for (const p of params) {
    if (validValues.length >= maxLogs) break;
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

export function analyzeAquariumHealth({ aquarium, parameters, plants, fishes, maintenanceStatus = [] }: AnalyzeProps): HealthAnalysisResult {
  const alerts: string[] = [];
  const recommendations: string[] = [];
  
  // ==========================================
  // 1. WATER QUALITY SCORE (0-100)
  // ==========================================
  let waterScore = 100;
  const latestParam = parameters.length > 0 ? parameters[0] : null;

  if (latestParam) {
    const paramDate = latestParam.created_at ? new Date(latestParam.created_at) : new Date();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - paramDate.getTime());
    const daysSinceLastParameter = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysSinceLastParameter > 60) {
      waterScore -= 40; alerts.push(`Kritis: Data parameter air sangat usang (${daysSinceLastParameter} hari).`);
    } else if (daysSinceLastParameter > 30) {
      waterScore -= 25; alerts.push(`Peringatan: Log parameter air belum diperbarui > 1 bulan.`);
    }

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

    // EMERGENCY OVERRIDE
    if (latestParam.ammonia !== null && latestParam.ammonia > 0) {
      alerts.push(`Bahaya: Amonia terdeteksi (${latestParam.ammonia} ppm)`);
      if (latestParam.ammonia >= 1.0) waterScore = Math.min(waterScore, 40); 
    }
    if (latestParam.nitrite !== null && latestParam.nitrite > 0) {
      if (latestParam.nitrite > 0.25) {
        alerts.push(`Kritis: Kadar Nitrit tinggi (${latestParam.nitrite} ppm)`);
        waterScore = Math.min(waterScore, 40);
      }
    }
    if (latestParam.ph !== null) {
      if (latestParam.ph < 5.5) { alerts.push("pH terlalu asam (di bawah 5.5)."); waterScore = Math.min(waterScore, 50); } 
      else if (latestParam.ph > 8.0) { alerts.push("pH terlalu basa (di atas 8.0)."); waterScore = Math.min(waterScore, 50); }
    }
  } else {
    waterScore = 50;
    alerts.push("Tidak ada log parameter air.");
  }
  waterScore = clampScore(waterScore);

  // ==========================================
  // 2. MAINTENANCE SCORE (0-100)
  // ==========================================
  let maintenanceScore = 100;
  if (maintenanceStatus.length > 0) {
    let criticalCount = 0; let warningCount = 0;
    maintenanceStatus.forEach(status => {
      if (status.urgencyLevel === "critical") criticalCount++;
      else if (status.urgencyLevel === "warning" && status.isOverdue) warningCount++;
    });

    const totalMaintenancePenalty = (criticalCount * 30) + (warningCount * 10);
    maintenanceScore -= totalMaintenancePenalty;
    
    if (totalMaintenancePenalty > 0) {
      alerts.push(`Penundaan perawatan: ${criticalCount} Kritis, ${warningCount} Peringatan.`);
    }
  }
  maintenanceScore = clampScore(maintenanceScore);

  // ==========================================
  // 3. BIOLOAD SCORE (0-100) - UPGRADE: BACA SIZE CATEGORY
  // ==========================================
  let bioloadScore = 100;
  const totalFishQuantity = fishes.reduce((acc, curr) => acc + curr.quantity, 0);
  
  if (totalFishQuantity > 0 && aquarium.volume_liters > 0) {
    const totalBioloadUnits = fishes.reduce((acc, curr) => {
      const adultSize = curr.fish?.estimated_adult_size_cm ?? 4; 
      const wasteMultiplier = curr.fish?.bioload_factor ?? 1.0; 
      // PRIORITAS 4: Kalkulasi Presisi Size Category (Juvenile vs Adult)
      const sizeMultiplier = curr.size_category === "Juvenile" ? 0.5 : 1;
      
      return acc + (curr.quantity * (adultSize * sizeMultiplier) * wasteMultiplier);
    }, 0);
    
    const bioloadRatio = totalBioloadUnits / aquarium.volume_liters;

    if (bioloadRatio > 1.5) {
      bioloadScore -= 60;
      alerts.push(`Overstocking Ekstrem: Rasio Bioload tinggi.`);
    } else if (bioloadRatio > 1.0) {
      bioloadScore -= 30;
      alerts.push("Beban biologis (Bioload) hampir melampaui batas aman kapasitas tampung.");
    }
  }
  bioloadScore = clampScore(bioloadScore);

  // ==========================================
  // 4. FISH HEALTH SCORE (0-100) - UPGRADE: BACA HEALTH STATUS
  // ==========================================
  let fishHealthScore = 100;
  if (totalFishQuantity > 0) {
    let sickCount = 0;
    let quarantinedCount = 0;

    fishes.forEach(f => {
      if (f.health_status === "Sick") sickCount += f.quantity;
      if (f.health_status === "Quarantined") quarantinedCount += f.quantity;
    });

    if (sickCount > 0) {
      fishHealthScore -= Math.min(60, sickCount * 20); // 1 ikan sakit = -20 poin
      alerts.push(`Kritis: ${sickCount} ikan terpantau sakit di dalam tangki utama!`);
      recommendations.push("Segera isolasi ikan yang sakit dan lakukan diagnosis penyakit.");
    }

    if (quarantinedCount > 0) {
      fishHealthScore -= 10; // Karantina lebih baik dari sakit di tank utama, tapi tetap mengurangi skor ideal
      alerts.push(`Info: Terdapat ${quarantinedCount} ikan dalam masa karantina.`);
    }
  }
  fishHealthScore = clampScore(fishHealthScore);

  // ==========================================
  // 5. PLANT SCORE (0-100 atau null)
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
    }
  } else if (totalFishQuantity > 5 && aquarium.aquascape_style !== "Blackwater" && aquarium.aquascape_style !== "Iwagumi") {
    // PRIORITAS 6 (Sebagian): Blackwater & Iwagumi wajar jika kurang tanaman
    alerts.push("Tidak ada tanaman hidup untuk menyerap nitrat berlebih secara alami.");
  }

  // ==========================================
  // 6. OVERALL HEALTH SCORE & TREND
  // ==========================================
  let overallScore = 0;
  if (plantScore !== null) {
    overallScore = (waterScore * 0.30) + (fishHealthScore * 0.30) + (maintenanceScore * 0.20) + (bioloadScore * 0.15) + (plantScore * 0.05);
  } else {
    overallScore = (waterScore * 0.35) + (fishHealthScore * 0.30) + (maintenanceScore * 0.15) + (bioloadScore * 0.20);
  }
  overallScore = clampScore(overallScore);

  if (waterScore <= 40) overallScore = Math.min(overallScore, waterScore);
  if (bioloadScore <= 40) overallScore = Math.min(overallScore, bioloadScore);
  if (fishHealthScore <= 40) overallScore = Math.min(overallScore, fishHealthScore);
  overallScore = clampScore(overallScore);

  let healthTrend: HealthTrend = "stable";
  if (parameters.length > 1) {
    const currentParam = parameters[0];
    const previousParam = parameters[1];
    const currentToxinLoad = (currentParam.ammonia ?? 0) + (currentParam.nitrite ?? 0) + ((currentParam.nitrate ?? 0) * 0.1);
    const previousToxinLoad = (previousParam.ammonia ?? 0) + (previousParam.nitrite ?? 0) + ((previousParam.nitrate ?? 0) * 0.1);

    if (currentToxinLoad > previousToxinLoad) healthTrend = "declining";
    else if (currentToxinLoad < previousToxinLoad) healthTrend = "improving";
  }

  return {
    scores: { waterQuality: waterScore, maintenance: maintenanceScore, bioload: bioloadScore, fishHealth: fishHealthScore, plant: plantScore, overall: overallScore },
    status: getStatusFromScore(overallScore), trend: healthTrend, alerts, recommendations
  };
}