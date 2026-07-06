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

// 💡 FIX 1: Pintu Masuk (Interface) Diperbarui untuk Menerima activeTreatments
interface AnalyzeProps {
  aquarium: Aquarium;
  parameters: AquariumParameterLog[];
  plants: TankPlant[];
  fishes: TankFish[];
  maintenanceStatus?: MaintenanceDashboardStatus[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeTreatments?: any[]; 
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

function getAverage(params: AquariumParameterLog[], extractor: (p: AquariumParameterLog) => number | null | undefined, anchorDate: Date, maxLogs: number = 5, maxDays: number = 14): number | null {
  const anchorTime = anchorDate.getTime();
  const validValues: number[] = [];

  for (const p of params) {
    if (validValues.length >= maxLogs) break;
    const pDate = p.created_at ? new Date(p.created_at).getTime() : anchorTime;
    const daysDiff = Math.abs(anchorTime - pDate) / (1000 * 60 * 60 * 24);
    const val = extractor(p);
    
    if (daysDiff <= maxDays && val != null) {
      validValues.push(val);
    }
  }

  if (validValues.length === 0) return null;
  const sum = validValues.reduce((a, b) => a + b, 0);
  return sum / validValues.length;
}

// =======================================================
// CORE EVALUATION ENGINE (Mendukung Time-Travel Historis)
// =======================================================
function getEcosystemSnapshot(
  aquarium: Aquarium, 
  parameters: AquariumParameterLog[], 
  plants: TankPlant[], 
  fishes: TankFish[], 
  maintenanceStatus: MaintenanceDashboardStatus[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeTreatments: any[], 
  anchorDate: Date
) {
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
      recommendations.push("Uji ulang air dan perbarui log parameter dasar minggu ini demi validitas diagnosis otomatis.");
    }

    const avgAmmonia = getAverage(parameters, p => p.ammonia, anchorDate);
    const avgNitrite = getAverage(parameters, p => p.nitrite, anchorDate);
    const avgNitrate = getAverage(parameters, p => p.nitrate, anchorDate);

    if (avgAmmonia != null && avgAmmonia > 0) {
      const p = Math.min(60, avgAmmonia * 30); waterScore -= p; deductions["Ammonia Poisoning Factor"] = p;
      recommendations.push("Segera lakukan penggantian air darurat sebesar 40% dan periksa keandalan sirkulasi media biologis filter.");
    }
    if (avgNitrite != null && avgNitrite > 0) {
      const p = Math.min(50, avgNitrite * 25); waterScore -= p; deductions["Nitrite Poisoning Factor"] = p;
      recommendations.push("Puasakan ikan selama 24 jam dan tambahkan dosis bakteri starter guna mempercepat reduksi senyawa toksik.");
    }
    
    if (avgAmmonia === 0 && avgNitrite === 0 && parameters.length >= 3) {
      ecosystemBonus += 5;
      bonuses.push("🌟 Bonus Siklus Nitrogen: Histori kualitas air terbebas dari racun Amonia & Nitrit.");
    }

    if (groupedFishes.size > 0 && latestParam.ph != null && totalFishQuantity > 0) {
      let totalWeightedPhPenalty = 0;
      let totalWeightedTempPenalty = 0;
      
      const phMismatchSpecies: string[] = [];
      const tempMismatchSpecies: string[] = [];

      groupedFishes.forEach((data) => {
        const f = data.fishInfo;
        const qty = data.totalQty;
        const populationRatio = qty / totalFishQuantity;

        // 💡 FIX: Sesuaikan nama variabel dengan Database (ideal_ph_min, ideal_temp_min, dll)
        const phSweetSpot = f.preferred_ph ?? ((f.ideal_ph_min ?? 6.5) + (f.ideal_ph_max ?? 7.5)) / 2;
        const tempSweetSpot = f.preferred_temperature ?? ((f.ideal_temp_min ?? 24) + (f.ideal_temp_max ?? 28)) / 2;

        let phPenalty = 0;
        if (latestParam.ph! < (f.ideal_ph_min ?? 5.5) || latestParam.ph! > (f.ideal_ph_max ?? 8.5)) {
          phPenalty = 20; 
          phMismatchSpecies.push(f.name_id || f.name_en || "Unknown Species");
        } else if (Math.abs(latestParam.ph! - phSweetSpot) >= 0.8) {
          phPenalty = 8; 
        }
        totalWeightedPhPenalty += (phPenalty * populationRatio);

        let tempPenalty = 0;
        if (latestParam.temperature != null) {
          if (latestParam.temperature < (f.ideal_temp_min ?? 20) || latestParam.temperature > (f.ideal_temp_max ?? 32)) {
            tempPenalty = 25;
            tempMismatchSpecies.push(f.name_id || f.name_en || "Unknown Species");
          } else if (Math.abs(latestParam.temperature - tempSweetSpot) >= 2.5) {
            tempPenalty = 10;
          }
        }
        totalWeightedTempPenalty += (tempPenalty * populationRatio);
      });

      if (phMismatchSpecies.length > 0) {
        alerts.push(`Peringatan: Tingkat pH (${latestParam.ph}) merusak osmoregulasi ${phMismatchSpecies.length} kawanan (${phMismatchSpecies.join(", ")}).`);
        recommendations.push("Gunakan buffer pengontrol pH atau periksa kandungan dekorasi internal tangki yang mendistorsi keasaman.");
      }
      if (tempMismatchSpecies.length > 0) {
        alerts.push(`Kritis: Suhu (${latestParam.temperature}°C) memicu shock termal pada ${tempMismatchSpecies.length} kawanan (${tempMismatchSpecies.join(", ")}).`);
        recommendations.push("Pasang termostat heater penyeimbang suhu atau integrasikan cooling fan pendingin.");
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
      recommendations.push("Tingkatkan frekuensi penggantian air berkala secara disiplin untuk menurunkan akumulasi senyawa nitrat.");
      
      const hasNitrateSensitiveFish = Array.from(groupedFishes.values()).some(d => d.fishInfo.sensitive_to_nitrate === true);
      if (hasNitrateSensitiveFish && avgNitrate >= 25) {
        waterScore -= 15; deductions["Nitrate Sensitive Species Stress"] = 15;
        alerts.push("Bahaya: Akumulasi nitrat menekan imunitas spesies rentan (Risiko Penyakit Kronis).");
      }
    }

    if (latestParam.ammonia != null && latestParam.ammonia >= 1.0) {
      alerts.push(`Bahaya: Amonia mematikan terdeteksi (${latestParam.ammonia} ppm)`);
      waterScore = Math.min(waterScore, 40); 
    }
  } else {
    waterScore = 50; deductions["Missing Water Logs"] = 50;
    alerts.push("Tidak ada log parameter air terdata.");
    recommendations.push("Masukkan data log parameter air dasar (pH, Amonia, Nitrat) untuk memicu fungsi diagnosa.");
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
      recommendations.push("Selesaikan seluruh sisa tunggakan pemeliharaan fisik yang terjadwal guna menghindari kelelahan ekosistem.");
    }
    
    if (criticalCount === 0 && warningCount === 0 && maintenanceStatus.length >= 2) {
      ecosystemBonus += 5;
      bonuses.push("🌟 Bonus Kepatuhan: Kedisiplinan perawatan tangki 100% terpenuhi.");
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

    const density = totalPlantBiomassValue / aquarium.volume_liters; 
    let basePlantScore = 100;
    
    if (density < 0.05) { basePlantScore = 40; deductions["Critically Low Plant Density"] = 60; }
    else if (density < 0.1) { basePlantScore = 80; deductions["Low Plant Density"] = 20; }
    else if (density <= 0.35) basePlantScore = 100; 
    else if (density <= 0.55) { basePlantScore = 80; deductions["High Plant Density"] = 20; }
    else { basePlantScore = 60; deductions["Choking Plant Overcrowding"] = 40; }

    if (co2DeficitPenalty > 0) {
      const p = Math.min(35, co2DeficitPenalty);
      basePlantScore -= p; deductions["Missing CO2 for High-Tech Plants"] = p;
      recommendations.push("Tambahkan sistem injeksi CO₂ gas/cair atau gantilah tanaman bertipe hitech dengan spesies low-tech.");
    }
    if (lightDeficitPenalty > 0) {
      const p = Math.min(25, lightDeficitPenalty);
      basePlantScore -= p; deductions["Inadequate Lighting for Demanding Flora"] = p;
      recommendations.push("Tingkatkan intensitas lux/wattage pencahayaan menggunakan armatur lampu berspektrum penuh WRGB.");
    }

    const substrate = aquarium.substrate_type?.toLowerCase() || "";
    const isInertSubstrate = substrate === "sand" || substrate === "gravel" || substrate === "bare bottom";
    if (rootFeederCount > 0 && isInertSubstrate) {
      basePlantScore -= 15; deductions["Inert Substrate for Root Feeders"] = 15;
      recommendations.push("Suntikkan pupuk tancap nutrisi (root tabs) secara berkala di dasar perakaran tanaman jenis root feeder.");
    }

    if (basePlantScore === 100 && co2DeficitPenalty === 0 && lightDeficitPenalty === 0 && !deductions["Inert Substrate for Root Feeders"]) {
      ecosystemBonus += 5;
      bonuses.push("🌟 Bonus Flora: Kepadatan vegetasi dan infrastruktur botani sangat sempurna.");
    }

    plantScore = clampScore(basePlantScore);
  } else if (totalFishQuantity > 5 && aquarium.aquascape_style !== "Blackwater" && aquarium.aquascape_style !== "Iwagumi") {
    deductions["Zero Plant Ecosystem Risk"] = 30;
    missingPlantBioloadPenalty = 15; 
    alerts.push("Risiko Ekosistem: Absennya tanaman hidup menurunkan daya filtrasi biologis alami secara signifikan.");
    recommendations.push("Pertimbangkan menanam flora tangguh minim perawatan (seperti Java Fern/Anubias) sebagai filter penyerap racun alami.");
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
      bonuses.push("🌟 Bonus Biodiversitas: Distribusi fauna harmonis di seluruh lapisan (Atas, Tengah, Dasar).");
    }

    if (bioloadRatio > 1.0) {
      const p = Math.min(60, bioloadRatio > 1.5 ? 60 : 30);
      bioloadScore -= p; deductions[bioloadRatio > 1.5 ? "Severe Tank Overstocking" : "Mild Tank Overstocking"] = p;
      recommendations.push("Kurangi kepadatan populasi fauna atau upgrade dimensi tangki ke ukuran kapasitas volume air yang lebih besar.");
    }

    let territorialAggressionScore = 0;
    groupedFishes.forEach((data) => {
      if (data.fishInfo.territorial === true) {
        const agresiMultiplier = (data.fishInfo.temperament_score ?? 2) / 2;
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
        recommendations.push("Sediakan rintangan visual seperti susunan batu/hardscape guna memecah dominasi area agresi.");
      }
    }

    const filterFlow = aquarium.filter_flow_lph;
    if (filterFlow == null) {
      const missingFilterPenalty = aquarium.volume_liters > 200 ? 25 : 15;
      bioloadScore -= missingFilterPenalty; 
      deductions["Missing Filtration Data"] = missingFilterPenalty;
      alerts.push(`Data LPH filter kosong. Skala tangki ${aquarium.volume_liters}L memicu risiko penumpukan limbah.`);
      recommendations.push("Segera input daya laju alir LPH filter pompa Anda untuk memicu akurasi kalkulasi sirkulasi air.");
    } else {
      const turnoverRate = filterFlow / aquarium.volume_liters;
      if (bioloadRatio >= 0.8 && turnoverRate < 4.0) {
        bioloadScore -= 20; deductions["Inadequate Filtration Turnover"] = 20;
        recommendations.push("Tingkatkan kapasitas volume sirkulasi pompa filter atau pasang internal powerhead tambahan.");
      }
      if (turnoverRate >= 6.0 && bioloadRatio <= 1.2) {
        ecosystemBonus += 5;
        bonuses.push("🌟 Bonus Oksigenasi: Sistem filtrasi (Turnover LPH tinggi) memasok oksigen dan kebersihan absolut.");
      }
    }
  }
  bioloadScore = clampScore(bioloadScore - missingPlantBioloadPenalty);

  // --- 5. KESEHATAN FAUNA (FAUNA HEALTH & POPULATION ENGINE) ---
  let fishHealthScore = 100;
  if (totalFishQuantity > 0) {
    let sickPenaltyScore = 0; 
    
    // 💡 FIX 2: MENYEDOT DATA PENYAKIT DARI INVENTORY & TAB PENGOBATAN
    fishes.forEach(f => {
      if (f.health_status === "Sick" || f.health_status === "Quarantined") {
        sickPenaltyScore += (f.quantity * 25); // Penalti berat jika inventory ditandai sakit
      }
    });

    if (activeTreatments && activeTreatments.length > 0) {
      const activeCasesCount = activeTreatments.filter(t => t.status === "Active").length;
      if (activeCasesCount > 0) {
        sickPenaltyScore += (activeCasesCount * 35); // Penalti sangat berat jika ada wabah aktif
        alerts.push(`🚨 Wabah Aktif: Terdapat ${activeCasesCount} infeksi/penyakit yang sedang diobati.`);
      }
    }

    if (sickPenaltyScore > 0) {
      const penalty = Math.min(80, sickPenaltyScore); 
      fishHealthScore -= penalty; 
      deductions["Active Disease/Quarantine Event"] = penalty;
      recommendations.push("Lanjutkan protokol pengobatan harian dan pantau ketat penyebaran gejala pada fauna lain.");
    }

    let schoolingStressPenalties = 0;
    let hasSchoolingSpecies = false;
    let allSchoolingValid = true;
    const invalidSchoolingSpecies: string[] = []; 

    groupedFishes.forEach((data) => {
      const f = data.fishInfo;
      if (f.min_school_size != null && f.min_school_size > 1) {
        hasSchoolingSpecies = true;
        const minRequired = f.min_school_size;
        if (data.totalQty < minRequired) {
          schoolingStressPenalties += 15;
          invalidSchoolingSpecies.push(`${f.name_id || f.name_en || "Unknown Species"} (${data.totalQty}/${minRequired})`);
          allSchoolingValid = false; 
        }
      }
    });

    if (invalidSchoolingSpecies.length > 0) {
      alerts.push(`Populasi Invalid: Ekosistem kekurangan populasi minimum untuk ${invalidSchoolingSpecies.join(", ")}.`);
      recommendations.push("Tambahkan populasi spesies ikan koloni hingga memenuhi ambang batas ukuran kawanan minimum.");
    }

    if (schoolingStressPenalties > 0) {
      const p = Math.min(30, schoolingStressPenalties);
      fishHealthScore -= p; deductions["Schooling Isolation Stress"] = p;
    } 
    else if (hasSchoolingSpecies && allSchoolingValid) {
      ecosystemBonus += 5;
      bonuses.push("🌟 Bonus Sosial Ekosistem: Kebutuhan koloni/kawanan fauna terpenuhi secara mutlak.");
    }

    if (groupedFishes.size > 1) {
      let maxConflictSeverity = 0;
      let totalConflictAccumulation = 0;
      const uniqueFishes = Array.from(groupedFishes.values());
      
      for (let i = 0; i < uniqueFishes.length; i++) {
        for (let j = i + 1; j < uniqueFishes.length; j++) {
          const fishA = uniqueFishes[i].fishInfo;
          const fishB = uniqueFishes[j].fishInfo;
          let dynamicScore = 10;

          if (fishA.compatibility_score && fishB.name_en && fishA.compatibility_score[fishB.name_en] !== undefined) {
             dynamicScore = fishA.compatibility_score[fishB.name_en] as number;
          } else if (fishB.compatibility_score && fishA.name_en && fishB.compatibility_score[fishA.name_en] !== undefined) {
             dynamicScore = fishB.compatibility_score[fishA.name_en] as number;
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
             } 
             else if ((aAggressive && bPeaceful) || (bAggressive && aPeaceful)) dynamicScore = 3;
          }

          let conflictSeverity = 0;
          if (dynamicScore <= 1) conflictSeverity = 20;
          else if (dynamicScore <= 3) conflictSeverity = 10;
          else if (dynamicScore <= 5) conflictSeverity = 5;

          if (conflictSeverity > 0) {
            if (conflictSeverity > maxConflictSeverity) maxConflictSeverity = conflictSeverity;
            totalConflictAccumulation += conflictSeverity;
          }
        }
      }

      if (maxConflictSeverity > 0) {
         const compatibilityPenalty = maxConflictSeverity + (totalConflictAccumulation - maxConflictSeverity) * 0.2;
         const p = Math.min(45, compatibilityPenalty);
         fishHealthScore -= p;
         deductions["Severe Species Relationship Conflict"] = p;
         alerts.push(`Risiko Agresi: Konflik kompatibilitas spesies menekan kesehatan ikan.`);
         recommendations.push("Segera pisahkan atau keluarkan spesies predator/agresif yang mengancam silsilah hidup ikan damai.");
      }
    }
  }
  fishHealthScore = clampScore(fishHealthScore);

  // --- 6. OVERALL SCORE & CRITICAL INHERITANCE (PERBAIKAN TOTAL) ---
  let overallScore = 0;
  if (plantScore !== null) {
    overallScore = (waterScore * 0.30) + (fishHealthScore * 0.25) + (maintenanceScore * 0.15) + (bioloadScore * 0.15) + (plantScore * 0.15);
  } else {
    overallScore = (waterScore * 0.35) + (fishHealthScore * 0.30) + (maintenanceScore * 0.15) + (bioloadScore * 0.20);
  }
  
  const ecosystemCollapsed = waterScore <= 40 || fishHealthScore <= 40 || bioloadScore <= 40 || maintenanceScore <= 40;
  const finalBonuses = ecosystemCollapsed ? [] : bonuses;

  if (!ecosystemCollapsed && ecosystemBonus > 0 && overallScore >= 80) {
    overallScore += ecosystemBonus; 
  }
  overallScore = clampScore(overallScore);

  // 💡 FIX 3: CRITICAL INHERITANCE (Jika ada 1 panel hancur lebur, nilai total wajib jatuh)
  if (waterScore <= 40) overallScore = Math.min(overallScore, waterScore);
  if (bioloadScore <= 40) overallScore = Math.min(overallScore, bioloadScore);
  if (fishHealthScore <= 40) overallScore = Math.min(overallScore, fishHealthScore);
  
  // Jika Perawatan 25, maka Skor Total TIDAK BOLEH melebihi 25 + 15 (Max 40)
  if (maintenanceScore <= 40) {
    overallScore = Math.min(overallScore, maintenanceScore + 15);
    alerts.push("⚠️ Kritis: Penelantaran jadwal perawatan merusak stabilitas ekosistem secara drastis.");
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

// ==========================================
// MAIN EXPORT & SYSTEMIC TREND ENGINE WRAPPER
// ==========================================
export function analyzeAquariumHealth({ aquarium, parameters, plants, fishes, maintenanceStatus = [], activeTreatments = [] }: AnalyzeProps): HealthAnalysisResult {
  const sortedParams = [...parameters].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  
  // 💡 Meneruskan Data Treatment ke Mesin Snapshot
  const currentSnapshot = getEcosystemSnapshot(aquarium, sortedParams, plants, fishes, maintenanceStatus, activeTreatments, new Date());

  let healthTrend: HealthTrend = "stable";
  if (sortedParams.length > 1) {
    const currentParamLog = sortedParams[0];
    const prevParamLog = sortedParams[1];

    const historicalSlice = sortedParams.slice(1);
    const historicalAnchorDate = prevParamLog.record_date ? new Date(prevParamLog.record_date) : new Date();
    const prevSnapshot = getEcosystemSnapshot(aquarium, historicalSlice, plants, fishes, maintenanceStatus, activeTreatments, historicalAnchorDate);

    let improvePoints = 0; 
    let declinePoints = 0;

    if ((currentParamLog.ammonia ?? 0) < (prevParamLog.ammonia ?? 0)) improvePoints++;
    else if ((currentParamLog.ammonia ?? 0) > (prevParamLog.ammonia ?? 0)) declinePoints++;

    if ((currentParamLog.nitrite ?? 0) < (prevParamLog.nitrite ?? 0)) improvePoints++;
    else if ((currentParamLog.nitrite ?? 0) > (prevParamLog.nitrite ?? 0)) declinePoints++;

    if ((currentParamLog.nitrate ?? 0) < (prevParamLog.nitrate ?? 0)) improvePoints++;
    else if ((currentParamLog.nitrate ?? 0) > (prevParamLog.nitrate ?? 0)) declinePoints++;

    if (currentParamLog.ph != null && prevParamLog.ph != null && Math.abs(currentParamLog.ph - prevParamLog.ph) >= 0.8) declinePoints += 2; 
    if (currentParamLog.temperature != null && prevParamLog.temperature != null && Math.abs(currentParamLog.temperature - prevParamLog.temperature) >= 1.5) declinePoints += 2; 

    if (currentSnapshot.scores.overall > prevSnapshot.scores.overall + 5) improvePoints += 4;
    else if (currentSnapshot.scores.overall < prevSnapshot.scores.overall - 5) declinePoints += 4;

    if (currentSnapshot.scores.fishHealth < prevSnapshot.scores.fishHealth - 10) declinePoints += 3;
    if (currentSnapshot.scores.bioload < prevSnapshot.scores.bioload - 10) declinePoints += 2;
    if (
      currentSnapshot.scores.plant !== null &&
      prevSnapshot.scores.plant !== null &&
      currentSnapshot.scores.plant < prevSnapshot.scores.plant - 10
    ) {
      declinePoints += 2;
    }

    if (declinePoints > improvePoints) healthTrend = "declining";
    else if (improvePoints > declinePoints) healthTrend = "improving";
  }

  const uniqueRecs = Array.from(new Set(currentSnapshot.recommendations));

  return {
    scores: currentSnapshot.scores,
    status: getStatusFromScore(currentSnapshot.scores.overall),
    trend: healthTrend,
    alerts: currentSnapshot.alerts,
    recommendations: uniqueRecs, 
    overdueTasks: currentSnapshot.overdueTasks,
    deductions: currentSnapshot.deductions,
    bonuses: currentSnapshot.bonuses
  };
}