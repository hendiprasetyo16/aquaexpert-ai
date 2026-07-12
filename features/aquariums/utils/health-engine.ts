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
  bonuses: string[]; 
}

export interface ActiveTreatmentEngine {
  id: string;
  disease_id: string;
  medication_id: string;
  status: string;
  disease?: {
    name_id: string;
    name_en: string;
  } | null;
}

interface AnalyzeProps {
  aquarium: Aquarium;
  parameters: AquariumParameterLog[];
  plants: TankPlant[];
  fishes: TankFish[];
  maintenanceStatus?: MaintenanceDashboardStatus[];
  activeTreatments?: ActiveTreatmentEngine[]; 
  lang?: "id" | "en"; 
}

// 💡 HELPER BARU: STANDARISASI KONFLIK IKAN (Agar tidak diulang di deep-diagnosis)
export interface CompatibilityReport {
  fishA: NonNullable<TankFish['fish']>;
  fishB: NonNullable<TankFish['fish']>;
  dynamicScore: number;
  conflictSeverity: number;
  reasonId: string;
  reasonEn: string;
}

export function evaluateCompatibility(uniqueFishes: NonNullable<TankFish['fish']>[]): CompatibilityReport[] {
  const reports: CompatibilityReport[] = [];
  
  for (let i = 0; i < uniqueFishes.length; i++) {
    for (let j = i + 1; j < uniqueFishes.length; j++) {
      const fishA = uniqueFishes[i];
      const fishB = uniqueFishes[j];
      let dynamicScore = 10;
      let reasonId = "";
      let reasonEn = "";

      if (fishA.compatibility_score && fishB.name_en && fishA.compatibility_score[fishB.name_en] !== undefined) {
         dynamicScore = fishA.compatibility_score[fishB.name_en] as number;
         reasonId = "Tercatat dalam matriks hubungan spesies.";
         reasonEn = "Direct species matrix confirmed.";
      } else if (fishB.compatibility_score && fishA.name_en && fishB.compatibility_score[fishA.name_en] !== undefined) {
         dynamicScore = fishB.compatibility_score[fishA.name_en] as number;
         reasonId = "Tercatat dalam matriks hubungan spesies.";
         reasonEn = "Direct species matrix confirmed.";
      } else {
         const tagsA = fishA.compatibility_tags?.map(t => t.toLowerCase()) || [];
         const tagsB = fishB.compatibility_tags?.map(t => t.toLowerCase()) || [];
         const aPredator = tagsA.includes("predator") || fishA.predatory;
         const bPredator = tagsB.includes("predator") || fishB.predatory;
         const aCommunity = tagsA.includes("community");
         const bCommunity = tagsB.includes("community");
         const aAggressive = tagsA.includes("aggressive") || (fishA.temperament_score != null && fishA.temperament_score >= 4);
         const bAggressive = tagsB.includes("aggressive") || (fishB.temperament_score != null && fishB.temperament_score >= 4);
         const aPeaceful = tagsA.includes("peaceful") || (fishA.temperament_score != null && fishA.temperament_score <= 2);
         const bPeaceful = tagsB.includes("peaceful") || (fishB.temperament_score != null && fishB.temperament_score <= 2);

         if ((aPredator && (bCommunity || bPeaceful)) || (bPredator && (aCommunity || aPeaceful))) {
           let canEat = false;
           if (aPredator && fishA.estimated_adult_size_cm && fishB.estimated_adult_size_cm) {
             const maxGape = fishA.estimated_adult_size_cm * 0.45 * (fishA.mouth_size_factor || 1.0);
             if ((fishB.estimated_adult_size_cm * 0.7) <= maxGape) canEat = true;
           } else if (bPredator && fishB.estimated_adult_size_cm && fishA.estimated_adult_size_cm) {
             const maxGape = fishB.estimated_adult_size_cm * 0.45 * (fishB.mouth_size_factor || 1.0);
             if ((fishA.estimated_adult_size_cm * 0.7) <= maxGape) canEat = true;
           }
           dynamicScore = canEat ? 1 : 4;
           reasonId = canEat ? "Rantai makanan (Predator menelan spesies kecil)." : "Predator dicampur dengan spesies komunitas/damai.";
           reasonEn = canEat ? "Food chain (Predator can swallow the smaller species)." : "Predator mixed with small community fish.";
         } 
         else if ((aAggressive && bPeaceful) || (bAggressive && aPeaceful)) {
            dynamicScore = 3;
            reasonId = "Spesies agresif menekan mental spesies ringkih.";
            reasonEn = "Aggressive species suppressing vulnerable profiles.";
         }
      }

      let conflictSeverity = 0;
      if (dynamicScore <= 1) conflictSeverity = 20;
      else if (dynamicScore <= 3) conflictSeverity = 10;
      else if (dynamicScore <= 5) conflictSeverity = 5;

      if (conflictSeverity > 0) {
        reports.push({ fishA, fishB, dynamicScore, conflictSeverity, reasonId, reasonEn });
      }
    }
  }
  return reports;
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

// 🚀 UPGRADE 1: EXPONENTIAL MOVING AVERAGE (EMA) WAKTU (Time-Decay Parameter)
// Data yang diuji hari ini lebih berharga dibanding data 10 hari lalu.
function getTimeDecayAverage(params: AquariumParameterLog[], extractor: (p: AquariumParameterLog) => number | null | undefined, anchorDate: Date, maxLogs: number = 5, maxDays: number = 14): number | null {
  const anchorTime = anchorDate.getTime();
  let totalWeight = 0;
  let weightedSum = 0;
  let validCount = 0;

  for (const p of params) {
    if (validCount >= maxLogs) break;
    const pDate = p.record_date ? new Date(p.record_date).getTime() : anchorTime;
    const daysDiff = Math.abs(anchorTime - pDate) / (1000 * 60 * 60 * 24);
    const val = extractor(p);
    
    if (daysDiff <= maxDays && val != null) {
      // Half-life 3 hari (Kekuatan data berkurang setengah setiap 3 hari)
      const weight = Math.exp(-(Math.LN2 / 3) * daysDiff);
      weightedSum += (val * weight);
      totalWeight += weight;
      validCount++;
    }
  }
  return totalWeight > 0 ? (weightedSum / totalWeight) : null;
}

// =======================================================
// CORE EVALUATION ENGINE
// =======================================================
function getEcosystemSnapshot(
  aquarium: Aquarium, 
  parameters: AquariumParameterLog[], 
  plants: TankPlant[], 
  fishes: TankFish[], 
  maintenanceStatus: MaintenanceDashboardStatus[],
  activeTreatments: ActiveTreatmentEngine[], 
  anchorDate: Date,
  lang: "id" | "en" 
) {
  const t = (idText: string, enText: string) => lang === 'en' ? enText : idText;

  const alerts: string[] = [];
  const recommendations: string[] = []; 
  const bonuses: string[] = []; 
  const overdueTasks: string[] = [];
  const deductions: Record<string, number> = {};
  
  let ecosystemBonus = 0; 
  const isHistorical = anchorDate.getTime() < new Date().getTime() - (24 * 60 * 60 * 1000);
  
  const latestParam = parameters.length > 0 ? parameters[0] : null;
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

  // --- 1. KUALITAS AIR (WATER QUALITY SCORE) ---
  let waterScore = 100;
  if (latestParam) {
    const paramDate = latestParam.record_date ? new Date(latestParam.record_date) : anchorDate;
    const daysSinceLastParameter = Math.floor(Math.abs(anchorDate.getTime() - paramDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastParameter > 30) {
      const p = daysSinceLastParameter > 60 ? 40 : 25;
      waterScore -= p; deductions["Outdated Water Parameter"] = p;
      recommendations.push(t("Uji ulang air dan perbarui log parameter dasar minggu ini demi validitas diagnosis otomatis.", "Retest water and update baseline parameter logs this week for automated diagnosis validity."));
    }

    const avgAmmonia = getTimeDecayAverage(parameters, p => p.ammonia, anchorDate);
    const avgNitrite = getTimeDecayAverage(parameters, p => p.nitrite, anchorDate);
    const avgNitrate = getTimeDecayAverage(parameters, p => p.nitrate, anchorDate);
    const avgPh = getTimeDecayAverage(parameters, p => p.ph, anchorDate);
    const avgTemp = getTimeDecayAverage(parameters, p => p.temperature, anchorDate);

    // 🚀 UPGRADE 2: SYNERGISTIC TOXICITY (AMONIA x pH x SUHU)
    if (avgAmmonia != null && avgAmmonia > 0) {
      const phMultiplier = (avgPh && avgPh > 7.0) ? 1 + ((avgPh - 7.0) * 1.5) : 1;
      const tempMultiplier = (avgTemp && avgTemp > 26) ? 1 + ((avgTemp - 26) * 0.05) : 1;
      const toxicFactor = avgAmmonia * phMultiplier * tempMultiplier;

      const p = Math.min(80, toxicFactor * 30);
      waterScore -= p; 
      deductions["Ammonia Poisoning Factor"] = p;
      
      if (phMultiplier > 1.5) {
        recommendations.push(t("Turunkan pH segera! Air yang Basa merubah Ion Amonium (aman) menjadi Gas Amonia (mematikan).", "Lower pH immediately! Alkaline water converts safe Ammonium ions into lethal Ammonia gas."));
      } else {
        recommendations.push(t("Lakukan penggantian air darurat 40% dan periksa keandalan sirkulasi filter biologis.", "Perform a 40% emergency water change and check biological filter flow."));
      }
    }

    if (avgNitrite != null && avgNitrite > 0) {
      const p = Math.min(50, avgNitrite * 25); waterScore -= p; deductions["Nitrite Poisoning Factor"] = p;
      recommendations.push(t("Puasakan ikan 24 jam dan tambahkan bakteri starter guna mempercepat reduksi senyawa toksik.", "Fast fish for 24 hours and dose starter bacteria to accelerate toxin reduction."));
    }
    
    if (avgAmmonia === 0 && avgNitrite === 0 && parameters.length >= 3) {
      ecosystemBonus += 5;
      bonuses.push(t("🌟 Bonus Siklus Nitrogen: Histori kualitas air terbebas dari racun.", "🌟 Nitrogen Cycle Bonus: Water quality history is toxin-free."));
    }

    if (groupedFishes.size > 0 && avgPh != null && totalFishQuantity > 0) {
      let totalWeightedPhPenalty = 0;
      let totalWeightedTempPenalty = 0;
      
      const phMismatchSpecies: string[] = [];
      const tempMismatchSpecies: string[] = [];

      groupedFishes.forEach((data) => {
        const f = data.fishInfo;
        const qty = data.totalQty;
        const populationRatio = qty / totalFishQuantity;

        const phSweetSpot = f.preferred_ph ?? ((f.ideal_ph_min ?? 6.5) + (f.ideal_ph_max ?? 7.5)) / 2;
        const tempSweetSpot = f.preferred_temperature ?? ((f.ideal_temp_min ?? 24) + (f.ideal_temp_max ?? 28)) / 2;

        let phPenalty = 0;
        if (avgPh < (f.ideal_ph_min ?? 5.5) || avgPh > (f.ideal_ph_max ?? 8.5)) {
          phPenalty = 20; 
          phMismatchSpecies.push(f.name_id || f.name_en || "Unknown Species");
        } else if (Math.abs(avgPh - phSweetSpot) >= 0.8) {
          phPenalty = 8; 
        }
        totalWeightedPhPenalty += (phPenalty * populationRatio);

        let tempPenalty = 0;
        if (avgTemp != null) {
          if (avgTemp < (f.ideal_temp_min ?? 20) || avgTemp > (f.ideal_temp_max ?? 32)) {
            tempPenalty = 25;
            tempMismatchSpecies.push(f.name_id || f.name_en || "Unknown Species");
          } else if (Math.abs(avgTemp - tempSweetSpot) >= 2.5) {
            tempPenalty = 10;
          }
        }
        totalWeightedTempPenalty += (tempPenalty * populationRatio);
      });

      if (phMismatchSpecies.length > 0) {
        alerts.push(t(
          `Peringatan: Tingkat pH (${avgPh.toFixed(1)}) merusak osmoregulasi kawanan (${phMismatchSpecies.join(", ")}).`, 
          `Warning: pH level (${avgPh.toFixed(1)}) damages osmoregulation of group(s) (${phMismatchSpecies.join(", ")}).`
        ));
      }
      if (tempMismatchSpecies.length > 0 && avgTemp) {
        alerts.push(t(
          `Kritis: Suhu (${avgTemp.toFixed(1)}°C) memicu shock termal pada (${tempMismatchSpecies.join(", ")}).`,
          `Critical: Temperature (${avgTemp.toFixed(1)}°C) triggers thermal shock in (${tempMismatchSpecies.join(", ")}).`
        ));
      }

      if (totalWeightedPhPenalty > 0) {
        waterScore -= totalWeightedPhPenalty; deductions["Weighted Species pH Mismatch"] = totalWeightedPhPenalty;
      }
      if (totalWeightedTempPenalty > 0) {
        waterScore -= totalWeightedTempPenalty; deductions["Weighted Species Temperature Mismatch"] = totalWeightedTempPenalty;
      }
    }

    if (avgNitrate != null && avgNitrate > 20) {
      const p = Math.min(30, (avgNitrate - 20) * 0.5); waterScore -= p; deductions["Nitrate High Accumulation"] = p;
      recommendations.push(t("Tingkatkan frekuensi penggantian air untuk membuang akumulasi Nitrat.", "Increase water change frequency to remove Nitrate accumulation."));
      
      const hasNitrateSensitiveFish = Array.from(groupedFishes.values()).some(d => d.fishInfo.sensitive_to_nitrate === true);
      if (hasNitrateSensitiveFish && avgNitrate >= 25) {
        waterScore -= 15; deductions["Nitrate Sensitive Species Stress"] = 15;
        alerts.push(t("Bahaya: Akumulasi nitrat merusak imunitas spesies rentan.", "Danger: Nitrate buildup destroys immunity of vulnerable species."));
      }
    }

  } else {
    waterScore = 50; deductions["Missing Water Logs"] = 50;
    alerts.push(t("Tidak ada log parameter air terdata.", "No water parameter logs recorded."));
    recommendations.push(t("Masukkan data parameter air dasar (pH, Amonia, Nitrat) untuk akurasi AI.", "Input baseline water parameters (pH, Ammonia, Nitrate) for AI accuracy."));
  }
  waterScore = clampScore(waterScore);

  // --- 2. PEMELIHARAAN (MAINTENANCE SCORE) ---
  let maintenanceScore = 100;
  if (!isHistorical && maintenanceStatus.length > 0) {
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
    if (totalMaintenancePenalty > 0) {
      if (!deductions["Overdue Tasks Penalty"]) deductions["Overdue Tasks Penalty"] = Math.min(100, totalMaintenancePenalty);
      recommendations.push(t("Selesaikan sisa perawatan tangki guna mencegah kelelahan ekosistem.", "Complete remaining tank maintenance to prevent ecosystem exhaustion."));
    }
    
    if (criticalCount === 0 && warningCount === 0 && maintenanceStatus.length >= 2) {
      ecosystemBonus += 5;
      bonuses.push(t("🌟 Bonus Kepatuhan: Kedisiplinan perawatan tangki 100%.", "🌟 Compliance Bonus: 100% tank maintenance discipline."));
    }
  }
  maintenanceScore = clampScore(maintenanceScore);

  // --- 3. FLORA HEALTH ENGINE ---
  let plantScore: number | null = null;
  let missingPlantBioloadPenalty = 0; 
  const totalPlantQuantity = plants.reduce((acc, curr) => acc + curr.quantity, 0);

  if (totalPlantQuantity > 0 && aquarium.volume_liters > 0) {
    let totalPlantBiomassValue = 0;
    let rootFeederCount = 0;
    let co2DeficitPenalty = 0;
    let lightDeficitPenalty = 0;

    const co2Type = aquarium.co2_type?.toLowerCase() || "none";
    const lightType = aquarium.light_type?.toLowerCase() || "none";
    const hasLiquidOrCylinderCo2 = co2Type !== "none";
    const hasWrgbOrHighLED = lightType.includes("wrgb") || lightType.includes("rgb") || lightType.includes("high");

    plants.forEach(p => {
      let multiplier = 1.0;
      const growthRate = p.plant?.growth_rate?.toLowerCase();
      const nitrate = p.plant?.nitrate_consumption?.toLowerCase();
      const oxygen = p.plant?.oxygen_production?.toLowerCase();
      const lightReq = p.plant?.light_requirement?.toLowerCase() || "medium";

      if (growthRate === 'fast' || growthRate === 'very fast') multiplier += 0.5;
      if (nitrate === 'high') multiplier += 0.5;
      if (nitrate === 'low') multiplier -= 0.2;
      if (oxygen === 'high') multiplier += 0.3; 
      if (p.plant?.root_feeder) rootFeederCount += p.quantity;
      
      if (p.plant?.co2_mandatory === true && !hasLiquidOrCylinderCo2) co2DeficitPenalty += (10 * p.quantity);
      if (lightReq === "high" && !hasWrgbOrHighLED) lightDeficitPenalty += (8 * p.quantity);

      totalPlantBiomassValue += (p.quantity * multiplier);
    });

    // 🚀 UPGRADE 3: GAUSSIAN BELL CURVE (Skoring Kepadatan Tanaman Halus)
    const density = totalPlantBiomassValue / aquarium.volume_liters; 
    const mu = 0.35; // Puncak optimal
    const sigma = 0.15; // Lebar kurva toleransi
    const bellCurveScore = 100 * Math.exp(-Math.pow(density - mu, 2) / (2 * Math.pow(sigma, 2)));
    
    let basePlantScore = Math.max(40, Math.round(bellCurveScore));
    
    if (density < 0.05) { deductions["Critically Low Plant Density"] = 100 - basePlantScore; }
    else if (density < 0.15) { deductions["Low Plant Density"] = 100 - basePlantScore; }
    else if (density > 0.60) { deductions["Choking Plant Overcrowding"] = 100 - basePlantScore; }
    else if (density > 0.45) { deductions["High Plant Density"] = 100 - basePlantScore; }

    if (co2DeficitPenalty > 0) {
      const p = Math.min(35, co2DeficitPenalty);
      basePlantScore -= p; deductions["Missing CO2 for High-Tech Plants"] = p;
      recommendations.push(t("Suntikkan CO₂ cair/gas, atau ganti dengan flora Low-Tech.", "Inject liquid/gas CO₂, or switch to Low-Tech flora."));
    }
    if (lightDeficitPenalty > 0) {
      const p = Math.min(25, lightDeficitPenalty);
      basePlantScore -= p; deductions["Inadequate Lighting for Demanding Flora"] = p;
      recommendations.push(t("Naikkan intensitas lampu dengan armatur WRGB.", "Increase lighting lux with WRGB fixtures."));
    }

    const substrate = aquarium.substrate_type?.toLowerCase() || "";
    const isInertSubstrate = substrate === "sand" || substrate === "gravel" || substrate === "bare bottom";
    if (rootFeederCount > 0 && isInertSubstrate) {
      basePlantScore -= 15; deductions["Inert Substrate for Root Feeders"] = 15;
      recommendations.push(t("Gunakan pupuk tancap (root tabs) untuk tanaman jenis akar.", "Inject root tabs for root-feeder plants."));
    }

    if (basePlantScore >= 95 && co2DeficitPenalty === 0 && lightDeficitPenalty === 0) {
      ecosystemBonus += 5;
      bonuses.push(t("🌟 Bonus Flora: Kepadatan vegetasi luar biasa harmonis.", "🌟 Flora Bonus: Vegetation density is beautifully harmonious."));
    }

    plantScore = clampScore(basePlantScore);
  } else if (totalFishQuantity > 5 && aquarium.aquascape_style !== "Blackwater" && aquarium.aquascape_style !== "Iwagumi") {
    deductions["Zero Plant Ecosystem Risk"] = 30;
    missingPlantBioloadPenalty = 15; 
    alerts.push(t("Risiko Ekosistem: Ketiadaan flora merusak siklus alami.", "Ecosystem Risk: Zero flora damages natural cycles."));
  }

  // --- 4. BEBAN BIOLOGIS (BIOLOAD & AGGRESSIVE TERRITORIAL SCORE) ---
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

    if (layers.size >= 3 && bioloadRatio <= 1.0) {
      ecosystemBonus += 5;
      bonuses.push(t("🌟 Bonus Biodiversitas: Distribusi lapisan renang sempurna.", "🌟 Biodiversity Bonus: Perfect swimming layer distribution."));
    }

    if (bioloadRatio > 1.0) {
      const p = Math.min(60, bioloadRatio > 1.5 ? 60 : 30);
      bioloadScore -= p; deductions[bioloadRatio > 1.5 ? "Severe Tank Overstocking" : "Mild Tank Overstocking"] = p;
      recommendations.push(t("Kurangi kepadatan populasi (Overstock).", "Reduce population density (Overstocking)."));
    }

    // 🚀 UPGRADE 4: MENGGUNAKAN SHARED HELPER UNTUK KONFLIK IKAN
    const uniqueFishesArray = Array.from(groupedFishes.values()).map(d => d.fishInfo);
    const conflictReports = evaluateCompatibility(uniqueFishesArray);
    
    let maxConflictSeverity = 0;
    let totalConflictAccumulation = 0;
    
    conflictReports.forEach(rep => {
      if (rep.conflictSeverity > maxConflictSeverity) maxConflictSeverity = rep.conflictSeverity;
      totalConflictAccumulation += rep.conflictSeverity;
    });

    if (maxConflictSeverity > 0) {
      const footprintFactor = aquarium.length_cm * (aquarium.width_cm || 30);
      if (footprintFactor < 2700 || aquarium.volume_liters < 90) { 
        const compatibilityPenalty = maxConflictSeverity + (totalConflictAccumulation - maxConflictSeverity) * 0.2;
        const p = Math.min(45, Math.round(compatibilityPenalty));
        bioloadScore -= p; 
        deductions["Severe Species Relationship Conflict"] = p;
        alerts.push(t(`Konflik Spesies: Terjadi bentrok sosial mematikan di dalam tangki.`, `Species Conflict: Lethal social clashing within the tank.`));
      }
    }

    const filterFlow = aquarium.filter_flow_lph;
    if (filterFlow == null) {
      const missingFilterPenalty = aquarium.volume_liters > 200 ? 25 : 15;
      bioloadScore -= missingFilterPenalty; 
      deductions["Missing Filtration Data"] = missingFilterPenalty;
      recommendations.push(t("Isi data kekuatan LPH pompa Anda untuk analisis akurat.", "Input your pump's LPH flow rate for accurate analysis."));
    } else {
      const turnoverRate = filterFlow / aquarium.volume_liters;
      if (bioloadRatio >= 0.8 && turnoverRate < 4.0) {
        bioloadScore -= 20; deductions["Inadequate Filtration Turnover"] = 20;
      }
      if (turnoverRate >= 6.0 && bioloadRatio <= 1.2) {
        ecosystemBonus += 5;
        bonuses.push(t("🌟 Bonus Oksigenasi: Laju sirkulasi (LPH) menjamin kebersihan mutlak.", "🌟 Oxygenation Bonus: High LPH turnover guarantees absolute cleanliness."));
      }
    }
  }
  bioloadScore = clampScore(bioloadScore - missingPlantBioloadPenalty);

  // --- 5. KESEHATAN FAUNA ---
  let fishHealthScore = 100;
  if (totalFishQuantity > 0) {
    let sickPenaltyScore = 0; 
    
    fishes.forEach(f => {
      if (f.health_status === "Sick" || f.health_status === "Quarantined") {
        sickPenaltyScore += (f.quantity * 25);
      }
    });

    if (activeTreatments && activeTreatments.length > 0) {
      const activeCasesCount = activeTreatments.filter(t => t.status === "Active").length;
      if (activeCasesCount > 0) {
        sickPenaltyScore += (activeCasesCount * 35); 
        alerts.push(t(`🚨 Wabah Aktif: Terdapat ${activeCasesCount} infeksi yang diobati.`, `🚨 Active Outbreak: ${activeCasesCount} active infections in treatment.`));
      }
    }

    if (sickPenaltyScore > 0) {
      const penalty = Math.min(80, sickPenaltyScore); 
      fishHealthScore -= penalty; 
      deductions["Active Disease Outbreak"] = penalty;
    }

    let schoolingStressPenalties = 0;
    groupedFishes.forEach((data) => {
      const f = data.fishInfo;
      if (f.min_group_size != null && f.min_group_size > 1 && data.totalQty < f.min_group_size) {
        schoolingStressPenalties += 15;
      }
    });

    if (schoolingStressPenalties > 0) {
      const p = Math.min(30, schoolingStressPenalties);
      fishHealthScore -= p; deductions["Schooling Isolation Stress"] = p;
      recommendations.push(t("Lengkapi minimal ukuran kawanan (schooling) agar ikan tidak depresi.", "Fulfill minimum schooling sizes to prevent isolation depression."));
    } 
  }
  fishHealthScore = clampScore(fishHealthScore);

  // --- 6. OVERALL SCORE & LIMITING FACTOR ---
  let overallScore = 0;
  if (plantScore !== null) {
    overallScore = (waterScore * 0.30) + (fishHealthScore * 0.25) + (maintenanceScore * 0.15) + (bioloadScore * 0.15) + (plantScore * 0.15);
  } else {
    overallScore = (waterScore * 0.35) + (fishHealthScore * 0.30) + (maintenanceScore * 0.15) + (bioloadScore * 0.20);
  }

  const lowestScore = Math.min(waterScore, fishHealthScore, bioloadScore, maintenanceScore, plantScore !== null ? plantScore : 100);
  const ecosystemCollapsed = lowestScore <= 40;
  const finalBonuses = ecosystemCollapsed ? [] : bonuses;

  if (!ecosystemCollapsed && ecosystemBonus > 0 && overallScore >= 80) {
    overallScore += ecosystemBonus; 
  }
  overallScore = clampScore(overallScore);

  if (lowestScore < 60) {
    overallScore = Math.min(overallScore, lowestScore);
    alerts.push(t("⚠️ Kritis: Salah satu pilar ekosistem jatuh drastis menghancurkan pilar lainnya.", "⚠️ Critical: One ecosystem pillar has collapsed, destroying the others."));
  } else if (lowestScore < 75) {
    overallScore = Math.min(overallScore, lowestScore + 10);
  }
  overallScore = clampScore(overallScore);

  return {
    scores: { waterQuality: waterScore, maintenance: maintenanceScore, bioload: bioloadScore, fishHealth: fishHealthScore, plant: plantScore, overall: overallScore },
    alerts,
    recommendations,
    deductions,
    bonuses: finalBonuses,
    overdueTasks
  };
}

export function analyzeAquariumHealth({ aquarium, parameters, plants, fishes, maintenanceStatus = [], activeTreatments = [], lang = "id" }: AnalyzeProps): HealthAnalysisResult {
  const sortedParams = [...parameters].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const currentSnapshot = getEcosystemSnapshot(aquarium, sortedParams, plants, fishes, maintenanceStatus, activeTreatments, new Date(), lang);

  let healthTrend: HealthTrend = "stable";
  if (sortedParams.length > 1) {
    const historicalSlice = sortedParams.slice(1);
    const historicalAnchorDate = sortedParams[1].record_date ? new Date(sortedParams[1].record_date) : new Date();
    const prevSnapshot = getEcosystemSnapshot(aquarium, historicalSlice, plants, fishes, maintenanceStatus, activeTreatments, historicalAnchorDate, lang);

    if (currentSnapshot.scores.overall > prevSnapshot.scores.overall + 3) healthTrend = "improving";
    else if (currentSnapshot.scores.overall < prevSnapshot.scores.overall - 3) healthTrend = "declining";
  }

  return {
    scores: currentSnapshot.scores,
    status: getStatusFromScore(currentSnapshot.scores.overall),
    trend: healthTrend,
    alerts: currentSnapshot.alerts,
    recommendations: Array.from(new Set(currentSnapshot.recommendations)), 
    overdueTasks: currentSnapshot.overdueTasks,
    deductions: currentSnapshot.deductions,
    bonuses: currentSnapshot.bonuses
  };
}