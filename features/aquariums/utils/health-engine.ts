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
  fishHealth: number; 
  plant: number | null; 
  overall: number;
}

export interface HealthAnalysisResult {
  scores: HealthScores;
  status: HealthStatus;
  trend: HealthTrend; 
  alerts: string[];
  recommendations: string[];
  overdueTasks: string[]; 
  deductions: Record<string, number>; // PILAR UTAMA PRIORITY 3: Map jejak pemotongan skor
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
    
    if (daysDiff <= maxDays && val != null) {
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
  const overdueTasks: string[] = [];
  const deductions: Record<string, number> = {};
  
  // ==========================================
  // 1. WATER QUALITY SCORE
  // ==========================================
  let waterScore = 100;
  const sortedParams = [...parameters].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const latestParam = sortedParams.length > 0 ? sortedParams[0] : null;

  if (latestParam) {
    const paramDate = latestParam.record_date ? new Date(latestParam.record_date) : new Date();
    const now = new Date();
    const daysSinceLastParameter = Math.floor(Math.abs(now.getTime() - paramDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastParameter > 60) {
      waterScore -= 40; deductions["Outdated Water Parameter"] = 40;
      alerts.push(`Kritis: Data parameter air sangat usang (${daysSinceLastParameter} hari).`);
    } else if (daysSinceLastParameter > 30) {
      waterScore -= 25; deductions["Outdated Water Parameter"] = 25;
      alerts.push(`Peringatan: Log parameter air belum diperbarui > 1 bulan.`);
    }

    const avgAmmonia = getAverage(sortedParams, p => p.ammonia);
    const avgNitrite = getAverage(sortedParams, p => p.nitrite);
    const avgNitrate = getAverage(sortedParams, p => p.nitrate);
    const avgPh = getAverage(sortedParams, p => p.ph);
    const avgTemp = getAverage(sortedParams, p => p.temperature);

    if (avgAmmonia != null && avgAmmonia > 0) {
      const p = Math.min(60, avgAmmonia * 30); waterScore -= p; deductions["Ammonia Poisoning Factor"] = p;
    }
    if (avgNitrite != null && avgNitrite > 0) {
      const p = Math.min(50, avgNitrite * 25); waterScore -= p; deductions["Nitrite Poisoning Factor"] = p;
    }
    if (avgNitrate != null && avgNitrate > 20) {
      const p = Math.min(30, (avgNitrate - 20) * 0.5); waterScore -= p; deductions["Nitrate High Accumulation"] = p;
    }
    if (avgPh != null && (avgPh < 5.5 || avgPh > 8.0)) {
      waterScore -= 15; deductions["Unstable pH Level"] = 15;
    }
    if (avgTemp != null && (avgTemp > 32 || (avgTemp < 22 && aquarium.heater_enabled))) {
      waterScore -= 15; deductions["Thermal Deviation Stress"] = 15;
    }

    if (latestParam.ammonia != null && latestParam.ammonia > 0) {
      alerts.push(`Bahaya: Amonia terdeteksi (${latestParam.ammonia} ppm)`);
      if (latestParam.ammonia >= 1.0) waterScore = Math.min(waterScore, 40); 
    }
    if (latestParam.nitrite != null && latestParam.nitrite > 0) {
      if (latestParam.nitrite > 0.25) {
        alerts.push(`Kritis: Kadar Nitrit tinggi (${latestParam.nitrite} ppm)`);
        waterScore = Math.min(waterScore, 40);
      }
    }
  } else {
    waterScore = 50; deductions["Missing Water Logs"] = 50;
    alerts.push("Tidak ada log parameter air.");
  }
  waterScore = clampScore(waterScore);

  // ==========================================
  // 2. MAINTENANCE SCORE
  // ==========================================
  let maintenanceScore = 100;
  if (maintenanceStatus.length > 0) {
    let criticalCount = 0; let warningCount = 0;
    maintenanceStatus.forEach(status => {
      if (status.isOverdue) overdueTasks.push(status.task.title); 
      if (status.urgencyLevel === "critical") criticalCount++;
      else if (status.urgencyLevel === "warning" && status.isOverdue) warningCount++;
    });

    const totalMaintenancePenalty = (criticalCount * 30) + (warningCount * 10);
    maintenanceScore -= totalMaintenancePenalty;
    if (totalMaintenancePenalty > 0) {
      deductions["Overdue Tasks Penalty"] = totalMaintenancePenalty;
      alerts.push(`Penundaan perawatan: ${criticalCount} Kritis, ${warningCount} Peringatan.`);
    }
  }
  maintenanceScore = clampScore(maintenanceScore);

  // ==========================================
  // 3. BIOLOAD SCORE
  // ==========================================
  let bioloadScore = 100;
  const totalFishQuantity = fishes.reduce((acc, curr) => acc + curr.quantity, 0);
  
  if (totalFishQuantity > 0 && aquarium.volume_liters > 0) {
    const totalBioloadUnits = fishes.reduce((acc, curr) => {
      const adultSize = curr.fish?.estimated_adult_size_cm ?? 4; 
      const wasteMultiplier = curr.fish?.bioload_factor ?? 1.0; 
      const sizeMultiplier = curr.size_category === "Juvenile" ? 0.5 : 1;
      return acc + (curr.quantity * (adultSize * sizeMultiplier) * wasteMultiplier);
    }, 0);
    
    const layers = new Set(fishes.map(f => f.fish?.water_layer).filter(Boolean));
    const layerBonus = layers.size > 1 ? (layers.size - 1) * 0.1 : 0; 
    
    const effectiveVolume = aquarium.volume_liters * (1 + layerBonus);
    const bioloadRatio = totalBioloadUnits / effectiveVolume;

    if (bioloadRatio > 1.5) {
      bioloadScore -= 60; deductions["Severe Tank Overstocking"] = 60;
      alerts.push(`Overstocking Ekstrem: Rasio Bioload melampaui batas toleransi.`);
    } else if (bioloadRatio > 1.0) {
      bioloadScore -= 30; deductions["Mild Tank Overstocking"] = 30;
      alerts.push("Beban biologis (Bioload) hampir melampaui batas aman.");
    }
  }
  bioloadScore = clampScore(bioloadScore);

  // ==========================================
  // 4. FISH HEALTH SCORE
  // ==========================================
  let fishHealthScore = 100;
  if (totalFishQuantity > 0) {
    let sickCount = 0; let quarantinedCount = 0;
    fishes.forEach(f => {
      if (f.health_status === "Sick") sickCount += f.quantity;
      if (f.health_status === "Quarantined") quarantinedCount += f.quantity;
    });

    if (sickCount > 0) {
      const penalty = Math.min(60, sickCount * 20);
      fishHealthScore -= penalty; deductions["Active Disease Outbreak"] = penalty;
      alerts.push(`Kritis: ${sickCount} ikan terpantau sakit di dalam tangki utama!`);
      recommendations.push("Segera isolasi ikan yang sakit dan lakukan diagnosis penyakit.");
    }
    if (quarantinedCount > 0) {
      fishHealthScore -= 10; deductions["Quarantined Fish Presence"] = 10;
      alerts.push(`Info: Terdapat ${quarantinedCount} ikan dalam masa karantina.`);
    }
  }
  fishHealthScore = clampScore(fishHealthScore);

  // ==========================================
  // 5. PLANT SCORE
  // ==========================================
  let plantScore: number | null = null;
  const totalPlantQuantity = plants.reduce((acc, curr) => acc + curr.quantity, 0);

  if (totalPlantQuantity > 0 && aquarium.volume_liters > 0) {
    let totalPlantBiomassValue = 0;
    plants.forEach(p => {
      let multiplier = 1.0;
      const growthRate = p.plant?.growth_rate?.toLowerCase();
      const nitrate = p.plant?.nitrate_consumption?.toLowerCase();
      const oxygen = p.plant?.oxygen_production?.toLowerCase();

      if (growthRate === 'fast' || growthRate === 'very fast') multiplier += 0.5;
      if (nitrate === 'high') multiplier += 0.5;
      if (nitrate === 'low') multiplier -= 0.2;
      if (oxygen === 'high') multiplier += 0.3; 
      
      totalPlantBiomassValue += (p.quantity * multiplier);
    });

    const density = totalPlantBiomassValue / aquarium.volume_liters; 
    
    if (density < 0.05) { plantScore = 40; deductions["Critically Low Plant Density"] = 60; }
    else if (density < 0.1) { plantScore = 80; deductions["Low Plant Density"] = 20; }
    else if (density <= 0.3) plantScore = 100; 
    else if (density <= 0.5) { plantScore = 80; deductions["High Plant Density"] = 20; }
    else {
      plantScore = 60; deductions["Choking Plant Overcrowding"] = 40;
      alerts.push(`Overcrowded Plants: Kapasitas flora terlalu padat.`);
    }
  } else if (totalFishQuantity > 5 && aquarium.aquascape_style !== "Blackwater" && aquarium.aquascape_style !== "Iwagumi") {
    deductions["Zero Plant Ecosystem Risk"] = 30;
    alerts.push("Tidak ada tanaman hidup untuk menyerap nitrat berlebih secara alami.");
  }

  // ==========================================
  // 6. OVERALL HEALTH SCORE
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

  // ==========================================
  // 7. ADVANCED HEALTH TREND
  // ==========================================
  let healthTrend: HealthTrend = "stable";
  if (sortedParams.length > 1) {
    const current = sortedParams[0];
    const prev = sortedParams[1];
    let improvePoints = 0; let declinePoints = 0;

    if ((current.ammonia ?? 0) < (prev.ammonia ?? 0)) improvePoints++;
    else if ((current.ammonia ?? 0) > (prev.ammonia ?? 0)) declinePoints++;

    if ((current.nitrite ?? 0) < (prev.nitrite ?? 0)) improvePoints++;
    else if ((current.nitrite ?? 0) > (prev.nitrite ?? 0)) declinePoints++;

    if ((current.nitrate ?? 0) < (prev.nitrate ?? 0)) improvePoints++;
    else if ((current.nitrate ?? 0) > (prev.nitrate ?? 0)) declinePoints++;

    if (current.ph != null && prev.ph != null) {
      if (Math.abs(current.ph - prev.ph) >= 0.5) declinePoints += 2; 
    }
    if (current.temperature != null && prev.temperature != null) {
      if (Math.abs(current.temperature - prev.temperature) >= 2.0) declinePoints += 2; 
    }

    if (declinePoints > improvePoints) healthTrend = "declining";
    else if (improvePoints > declinePoints) healthTrend = "improving";
  }

  return {
    scores: { waterQuality: waterScore, maintenance: maintenanceScore, bioload: bioloadScore, fishHealth: fishHealthScore, plant: plantScore, overall: overallScore },
    status: getStatusFromScore(overallScore), trend: healthTrend, alerts, recommendations, overdueTasks, deductions
  };
}