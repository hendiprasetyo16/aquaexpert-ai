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
  deductions: Record<string, number>; 
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
  
  const sortedParams = [...parameters].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const latestParam = sortedParams.length > 0 ? sortedParams[0] : null;

  const totalFishQuantity = fishes.reduce((acc, curr) => acc + curr.quantity, 0);

  const groupedFishes = new Map<string, { totalQty: number, fishInfo: NonNullable<TankFish['fish']> }>();
  fishes.forEach(f => {
    if (f.fish && f.fish_id) {
      if (!groupedFishes.has(f.fish_id)) {
        groupedFishes.set(f.fish_id, { totalQty: 0, fishInfo: f.fish });
      }
      groupedFishes.get(f.fish_id)!.totalQty += f.quantity;
    }
  });

  // =======================================================
  // 1. WATER QUALITY SCORE (WEIGHTED SPECIES MATCHING)
  // =======================================================
  let waterScore = 100;

  if (latestParam) {
    const paramDate = latestParam.record_date ? new Date(latestParam.record_date) : new Date();
    const now = new Date();
    const daysSinceLastParameter = Math.floor(Math.abs(now.getTime() - paramDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastParameter > 30) {
      const p = daysSinceLastParameter > 60 ? 40 : 25;
      waterScore -= p; deductions["Outdated Water Parameter"] = p;
    }

    const avgAmmonia = getAverage(sortedParams, p => p.ammonia);
    const avgNitrite = getAverage(sortedParams, p => p.nitrite);
    const avgNitrate = getAverage(sortedParams, p => p.nitrate);

    if (avgAmmonia != null && avgAmmonia > 0) {
      const p = Math.min(60, avgAmmonia * 30); waterScore -= p; deductions["Ammonia Poisoning Factor"] = p;
    }
    if (avgNitrite != null && avgNitrite > 0) {
      const p = Math.min(50, avgNitrite * 25); waterScore -= p; deductions["Nitrite Poisoning Factor"] = p;
    }
    
    // PATCH: Kalkulasi Weighted Average Deviasi Parameter Spesifik Spesies
    if (groupedFishes.size > 0 && latestParam.ph != null && totalFishQuantity > 0) {
      let totalWeightedPhPenalty = 0;
      let totalWeightedTempPenalty = 0;

      groupedFishes.forEach((data) => {
        const f = data.fishInfo;
        const qty = data.totalQty;
        const populationRatio = qty / totalFishQuantity;

        const phSweetSpot = f.preferred_ph ?? ((f.ph_min ?? 6.5) + (f.ph_max ?? 7.5)) / 2;
        const tempSweetSpot = f.preferred_temperature ?? ((f.temperature_min ?? 24) + (f.temperature_max ?? 28)) / 2;

        let phPenalty = 0;
        if (latestParam.ph! < (f.ph_min ?? 5.5) || latestParam.ph! > (f.ph_max ?? 8.5)) {
          phPenalty = 20; 
          alerts.push(`Peringatan: pH (${latestParam.ph}) merusak osmoregulasi kawanan ${f.name_id}.`);
        } else if (Math.abs(latestParam.ph! - phSweetSpot) >= 0.8) {
          phPenalty = 8; 
        }
        totalWeightedPhPenalty += (phPenalty * populationRatio);

        let tempPenalty = 0;
        if (latestParam.temperature != null) {
          if (latestParam.temperature < (f.temperature_min ?? 20) || latestParam.temperature > (f.temperature_max ?? 32)) {
            tempPenalty = 25;
            alerts.push(`Kritis: Suhu (${latestParam.temperature}°C) memicu shock termal kawanan ${f.name_id}.`);
          } else if (Math.abs(latestParam.temperature - tempSweetSpot) >= 2.5) {
            tempPenalty = 10;
          }
        }
        totalWeightedTempPenalty += (tempPenalty * populationRatio);
      });

      if (totalWeightedPhPenalty > 0) {
        waterScore -= totalWeightedPhPenalty; deductions["Weighted Species pH Mismatch"] = totalWeightedPhPenalty;
      }
      if (totalWeightedTempPenalty > 0) {
        waterScore -= totalWeightedTempPenalty; deductions["Weighted Species Temperature Mismatch"] = totalWeightedTempPenalty;
      }
    }

    if (avgNitrate != null && avgNitrate > 20) {
      const p = Math.min(30, (avgNitrate - 20) * 0.5); waterScore -= p; deductions["Nitrate High Accumulation"] = p;
      
      const hasNitrateSensitiveFish = fishes.some(f => f.fish?.sensitive_to_nitrate === true);
      if (hasNitrateSensitiveFish && avgNitrate >= 25) {
        waterScore -= 15; deductions["Nitrate Sensitive Species Stress"] = 15;
        alerts.push("Bahaya: Akumulasi nitrat menekan imunitas spesies rentan (Risiko Penyakit Kronis).");
      }
    }

    if (latestParam.ammonia != null && latestParam.ammonia > 0) {
      alerts.push(`Bahaya: Amonia terdeteksi (${latestParam.ammonia} ppm)`);
      if (latestParam.ammonia >= 1.0) waterScore = Math.min(waterScore, 40); 
    }
  } else {
    waterScore = 50; deductions["Missing Water Logs"] = 50;
    alerts.push("Tidak ada log parameter air terdata.");
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

    let totalMaintenancePenalty = (criticalCount * 30) + (warningCount * 10);
    
    const hasHighTrimmingPlant = plants.some(p => (p.plant?.trimming_frequency_score || 5) >= 8 || p.plant?.invasive_growth === true);
    if (hasHighTrimmingPlant && criticalCount > 0) {
      totalMaintenancePenalty += 15; deductions["Neglected Invasive Plant Growth"] = 15;
    }

    maintenanceScore -= totalMaintenancePenalty;
    if (totalMaintenancePenalty > 0 && !deductions["Overdue Tasks Penalty"]) {
      deductions["Overdue Tasks Penalty"] = Math.min(100, totalMaintenancePenalty);
    }
  }
  maintenanceScore = clampScore(maintenanceScore);

  // =======================================================
  // 3. BIOLOAD & AGGRESSIVE TERRITORIAL SCORE
  // =======================================================
  let bioloadScore = 100;
  
  if (totalFishQuantity > 0 && aquarium.volume_liters > 0) {
    const totalBioloadUnits = fishes.reduce((acc, curr) => {
      const adultSize = curr.fish?.estimated_adult_size_cm ?? 4; 
      const bioloadFactor = curr.fish?.bioload_factor ?? 1.0; 
      const wasteScore = curr.fish?.waste_production_score ?? 5; 
      const sizeMultiplier = curr.size_category === "Juvenile" ? 0.5 : 1;
      return acc + (curr.quantity * (adultSize * sizeMultiplier) * bioloadFactor * (wasteScore / 5));
    }, 0);
    
    const layers = new Set(fishes.map(f => f.fish?.water_layer).filter(Boolean));
    const layerBonus = layers.size > 1 ? (layers.size - 1) * 0.1 : 0; 
    const effectiveVolume = aquarium.volume_liters * (1 + layerBonus);
    const bioloadRatio = totalBioloadUnits / effectiveVolume;

    if (bioloadRatio > 1.0) {
      const p = bioloadRatio > 1.5 ? 60 : 30;
      bioloadScore -= p; deductions[bioloadRatio > 1.5 ? "Severe Tank Overstocking" : "Mild Tank Overstocking"] = p;
    }

    // PATCH: Territorial Density Berbobot Keganasan (Temperament Score)
    let territorialAggressionScore = 0;
    groupedFishes.forEach((data) => {
      if (data.fishInfo.territorial === true) {
        const agresiMultiplier = (data.fishInfo.temperament_score ?? 2) / 2; // Makin agresif, beban area makin tinggi
        territorialAggressionScore += (data.totalQty * agresiMultiplier);
      }
    });

    if (territorialAggressionScore > 1) {
      const footprintFactor = aquarium.length_cm * (aquarium.width_cm || 30);
      if (footprintFactor < 2700 || aquarium.volume_liters < 90) { 
        const p = territorialAggressionScore >= 4 ? 40 : 20;
        bioloadScore -= p; 
        deductions["Weighted Territorial Density Conflict"] = p;
        alerts.push(`Kepadatan Agresi Teritorial: Area tangki memicu sengketa ruang gerak.`);
      }
    }

    const filterFlow = aquarium.filter_flow_lph || 0;
    const turnoverRate = filterFlow / aquarium.volume_liters;
    if (bioloadRatio >= 0.8 && turnoverRate < 4.0 && filterFlow > 0) {
      bioloadScore -= 20; deductions["Inadequate Filtration Turnover"] = 20;
    }
  }
  bioloadScore = clampScore(bioloadScore);

  // =======================================================
  // 4. FAUNA HEALTH & POPULATION ENGINE (SCHOOLING STRESS)
  // =======================================================
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
    }
    if (quarantinedCount > 0) {
      fishHealthScore -= 10; deductions["Quarantined Fish Presence"] = 10;
    }

    let schoolingStressPenalties = 0;
    groupedFishes.forEach((data) => {
      const f = data.fishInfo;
      if (f.schooling === true || (f.min_school_size != null && f.min_school_size > 1)) {
        const minRequired = f.min_school_size ?? 6;
        if (data.totalQty < minRequired) {
          schoolingStressPenalties += 15;
          alerts.push(`Populasi Invalid: Kawanan ${f.name_id} terlalu sedikit (${data.totalQty}/${minRequired} ekor). Memicu stres sosial.`);
        }
      }
    });

    if (schoolingStressPenalties > 0) {
      const p = Math.min(30, schoolingStressPenalties);
      fishHealthScore -= p;
      deductions["Schooling Isolation Stress"] = p;
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
    let rootFeederCount = 0;

    plants.forEach(p => {
      let multiplier = 1.0;
      const growthRate = p.plant?.growth_rate?.toLowerCase();
      const nitrate = p.plant?.nitrate_consumption?.toLowerCase();
      const oxygen = p.plant?.oxygen_production?.toLowerCase();

      if (growthRate === 'fast' || growthRate === 'very fast') multiplier += 0.5;
      if (nitrate === 'high') multiplier += 0.5;
      if (nitrate === 'low') multiplier -= 0.2;
      if (oxygen === 'high') multiplier += 0.3; 
      if (p.plant?.root_feeder) rootFeederCount += p.quantity;
      
      totalPlantBiomassValue += (p.quantity * multiplier);
    });

    const density = totalPlantBiomassValue / aquarium.volume_liters; 
    
    if (density < 0.05) { plantScore = 40; deductions["Critically Low Plant Density"] = 60; }
    else if (density < 0.1) { plantScore = 80; deductions["Low Plant Density"] = 20; }
    else if (density <= 0.35) plantScore = 100; 
    else if (density <= 0.55) { plantScore = 80; deductions["High Plant Density"] = 20; }
    else { plantScore = 60; deductions["Choking Plant Overcrowding"] = 40; }

    const substrate = aquarium.substrate_type?.toLowerCase() || "";
    const isInertSubstrate = substrate === "sand" || substrate === "gravel" || substrate === "bare bottom";
    if (rootFeederCount > 0 && isInertSubstrate && plantScore !== null) {
      plantScore -= 15; deductions["Inert Substrate for Root Feeders"] = 15;
    }
  } else if (totalFishQuantity > 5 && aquarium.aquascape_style !== "Blackwater" && aquarium.aquascape_style !== "Iwagumi") {
    deductions["Zero Plant Ecosystem Risk"] = 30;
  }

  if (plantScore !== null) plantScore = clampScore(plantScore);

  // ==========================================
  // 6. OVERALL SCORE & CRITICAL INHERITANCE
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
  // 7. HEALTH TREND
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

    if (current.ph != null && prev.ph != null && Math.abs(current.ph - prev.ph) >= 0.5) declinePoints += 2; 
    if (current.temperature != null && prev.temperature != null && Math.abs(current.temperature - prev.temperature) >= 1.5) declinePoints += 2; 

    if (declinePoints > improvePoints) healthTrend = "declining";
    else if (improvePoints > declinePoints) healthTrend = "improving";
  }

  return {
    scores: { waterQuality: waterScore, maintenance: maintenanceScore, bioload: bioloadScore, fishHealth: fishHealthScore, plant: plantScore, overall: overallScore },
    status: getStatusFromScore(overallScore), trend: healthTrend, alerts, recommendations, overdueTasks, deductions
  };
}