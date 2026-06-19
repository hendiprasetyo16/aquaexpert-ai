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
  explainabilityBreakdown: string[]; 
  plantRecommendations: string[];    
}

interface Props {
  aquarium: Aquarium;
  health: HealthAnalysisResult;
  parameters: AquariumParameterLog[];
  fishes: TankFish[];
  plants: TankPlant[];
  lang: "id" | "en";
  masterPlantsCandidates?: TankPlant["plant"][]; 
}

// Extensi aman untuk mengakomodasi fleksibilitas penamaan kolom fisik aquarium tanpa memicu error "any" di TypeScript
interface ExtendedAquarium extends Aquarium {
  filter_capacity_lph?: number | null;
  filter_flow_lph?: number | null;
  lid_present?: boolean | null;
}

export function generateDeepDiagnosis({ aquarium, health, parameters, fishes, plants, lang, masterPlantsCandidates }: Props): DeepDiagnosisResult {
  const rootCauses: DiagnosisCause[] = [];
  const recommendations: string[] = [];
  const nextActions: string[] = [];
  const plantRecommendations: string[] = [];
  const explainabilityBreakdown: string[] = [];

  const extAq = aquarium as ExtendedAquarium;

  const sortedParams = [...parameters].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const latest = sortedParams.length > 0 ? sortedParams[0] : null;

  const hasShrimp = fishes.some(f => f.fish?.fish_type === "Invertebrate" || f.fish?.fish_type?.toLowerCase().includes("shrimp"));
  const sickFishCount = fishes.filter(f => f.health_status === "Sick").reduce((sum, f) => sum + f.quantity, 0);

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
  // 1. BEHAVIORAL, COMPATIBILITY & ECOLOGICAL AI (FISH)
  // =======================================================
  if (groupedFishes.size > 0) {
    const uniqueFishes = Array.from(groupedFishes.values());

    for (let i = 0; i < uniqueFishes.length; i++) {
      for (let j = i + 1; j < uniqueFishes.length; j++) {
        const fishA = uniqueFishes[i].fishInfo;
        const fishB = uniqueFishes[j].fishInfo;
        
        let dynamicScore = 10;
        let reason = "";

        if (fishA.compatibility_score && fishB.name_en && fishA.compatibility_score[fishB.name_en] !== undefined) {
          dynamicScore = fishA.compatibility_score[fishB.name_en];
          reason = lang === 'id' ? `Tercatat dalam matriks spesies.` : `Direct matrix mapping.`;
        } else if (fishB.compatibility_score && fishA.name_en && fishB.compatibility_score[fishA.name_en] !== undefined) {
          dynamicScore = fishB.compatibility_score[fishA.name_en];
          reason = lang === 'id' ? `Tercatat dalam matriks spesies.` : `Direct matrix mapping.`;
        } else {
          const tagsA = fishA.compatibility_tags?.map(t => t.toLowerCase()) || [];
          const tagsB = fishB.compatibility_tags?.map(t => t.toLowerCase()) || [];

          const aPredator = tagsA.includes("predator") || fishA.predatory;
          const bPredator = tagsB.includes("predator") || fishB.predatory;
          const aCommunity = tagsA.includes("community");
          const bCommunity = tagsB.includes("community");
          const aAggressive = tagsA.includes("aggressive") || (fishA.temperament_score != null && fishA.temperament_score >= 7);
          const bAggressive = tagsB.includes("aggressive") || (fishB.temperament_score != null && fishB.temperament_score >= 7);
          const aPeaceful = tagsA.includes("peaceful") || (fishA.temperament_score != null && fishA.temperament_score <= 3);
          const bPeaceful = tagsB.includes("peaceful") || (fishB.temperament_score != null && fishB.temperament_score <= 3);

          if ((aPredator && (bCommunity || bPeaceful)) || (bPredator && (aCommunity || aPeaceful))) {
            dynamicScore -= 8; reason = lang === 'id' ? "Predator digabung dengan ikan damai/komunitas." : "Predator mixed with community fish.";
          } else if ((aAggressive && bPeaceful) || (bAggressive && aPeaceful)) {
            dynamicScore -= 6; reason = lang === 'id' ? "Ikan agresif menekan ikan rentan." : "Aggressive fish suppressing vulnerable ones.";
          }

          if (fishA.native_biotope && fishB.native_biotope && fishA.native_biotope === fishB.native_biotope) {
            dynamicScore = Math.min(10, dynamicScore + 2);
          }
        }

        if (dynamicScore <= 3) {
          const nameA = lang === 'id' ? fishA.name_id : fishA.name_en;
          const nameB = lang === 'id' ? fishB.name_id : fishB.name_en;
          rootCauses.push({
            title: lang === 'id' ? "Konflik Kompatibilitas Parah" : "Severe Compatibility Conflict", severity: "high",
            description: lang === 'id' ? `${nameA} dan ${nameB} berkonflik (Skor ${dynamicScore}/10). Alasan: ${reason}` : `${nameA} and ${nameB} conflict (Score ${dynamicScore}/10). Reason: ${reason}`
          });
        }
      }
    }

    const biotopes = new Set<string>();
    groupedFishes.forEach(data => {
      if (data.fishInfo.native_biotope) biotopes.add(data.fishInfo.native_biotope);
    });
    
    if (biotopes.size > 1) {
      const biotopeArr = Array.from(biotopes).map(b => b.toLowerCase());
      const hasAfricanRift = biotopeArr.some(b => b.includes("african rift") || b.includes("malawi") || b.includes("tanganyika"));
      const hasAmazonian = biotopeArr.some(b => b.includes("amazon") || b.includes("blackwater") || b.includes("south american"));

      if (hasAfricanRift && hasAmazonian) {
        rootCauses.push({
          title: lang === 'id' ? "Fatal Mismatch: Biotope Afrika vs Amazon" : "Fatal Biotope Mismatch", severity: "high",
          description: lang === 'id' 
            ? `Pencampuran ikan Danau Afrika (Air Keras/Basa) dengan ikan Amazon (Air Lunak/Asam) sangat mematikan.` 
            : `Mixing African Rift Lake species with Amazonian species causes severe osmotic failure.`
        });
      } else if (biotopes.size >= 3) {
        rootCauses.push({
          title: lang === 'id' ? "Sup Ekologi (Terlalu Banyak Biotope)" : "Ecological Soup (Mixed Biotopes)", severity: "low",
          description: lang === 'id' ? `Tangki Anda mencampur fauna dari ${biotopes.size} ekosistem alami yang berbeda secara drastis.` : `Your tank mixes fauna from ${biotopes.size} vastly different natural ecosystems.`
        });
      }
    }

    const plantUprooters = fishes.filter(f => f.fish?.uproots_plants === true);
    if (plants.length > 0 && plantUprooters.length > 0) {
      const uprootNames = [...new Set(plantUprooters.map(f => lang === 'id' ? f.fish?.name_id : f.fish?.name_en))].join(", ");
      rootCauses.push({
        title: lang === 'id' ? "Ancaman Flora (Uprooting)" : "Flora Uprooting Threat", severity: "high",
        description: lang === 'id' ? `${uprootNames} akan membongkar atau mencabut paksa tanaman dari substrat.` : `${uprootNames} will actively dig up and uproot stem plants.`
      });
    }

    if (hasShrimp) {
      groupedFishes.forEach((data) => {
        const riskScore = data.fishInfo.shrimp_predation_risk ?? (data.fishInfo.shrimp_safe === false ? 10 : 0);
        const fName = lang === 'id' ? data.fishInfo.name_id : data.fishInfo.name_en;
        
        if (riskScore >= 8) {
          rootCauses.push({
            title: lang === 'id' ? "Predator Udang Terdeteksi" : "Shrimp Predator Detected", severity: "high",
            description: lang === 'id' ? `${fName} akan berburu dan melahap udang dewasa.` : `${fName} will hunt and eat adult shrimp.`
          });
        } else if (riskScore >= 4) {
          rootCauses.push({
            title: lang === 'id' ? "Risiko Kematian Anak Udang" : "Shrimplet Predation Risk", severity: "medium",
            description: lang === 'id' ? `${fName} tidak aman bagi anak udang (shrimplets) yang baru menetas.` : `${fName} will predate heavily on newly hatched shrimplets.`
          });
        }
      });
    }

    const predators = fishes.filter(f => f.fish?.predatory === true);
    if (predators.length > 0) {
      predators.forEach(p => {
        const predFish = p.fish;
        if (!predFish) return;
        const predName = lang === 'id' ? predFish.name_id : predFish.name_en;
        const predSize = predFish.estimated_adult_size_cm ?? 10;
        const mouthFactor = predFish.mouth_size_factor ?? 1.0;

        groupedFishes.forEach((data) => {
          if (data.fishInfo.id === predFish.id || data.fishInfo.predatory) return;
          const preySize = data.fishInfo.estimated_adult_size_cm ?? 3;
          
          if (preySize <= (predSize * 0.45 * mouthFactor)) {
            const preyName = lang === 'id' ? data.fishInfo.name_id : data.fishInfo.name_en;
            rootCauses.push({
              title: lang === 'id' ? "Risiko Predasi (Mouth Size)" : "Predation Risk (Mouth Size)", severity: "high",
              description: lang === 'id' ? `Anatomi mulut ${predName} memungkinkannya menelan ikan ${preyName}.` : `${predName}'s mouth allows it to swallow ${preyName}.`
            });
          }
        });
      });
    }

    const currentStyle = extAq.aquascape_style || "Bebas";
    const subOptTemp: string[] = [];
    const subOptPh: string[] = [];
    const styleMismatches: string[] = [];
    const oxygenRisks: string[] = [];
    const jumpers: string[] = [];
    const highNitrateSensitives: string[] = [];
    let totalWasteScore = 0;

    const filterCapacityLph = extAq.filter_capacity_lph ?? extAq.filter_flow_lph ?? 0;
    const tankTurnoverRate = extAq.volume_liters > 0 ? (filterCapacityLph / extAq.volume_liters) : 0;
    const isLidPresent = extAq.lid_present === true;

    groupedFishes.forEach((data) => {
      const fInfo = data.fishInfo;
      const fishName = lang === 'id' ? fInfo.name_id : fInfo.name_en;

      if (latest?.temperature != null && fInfo.preferred_temperature != null) {
        if (Math.abs(latest.temperature - fInfo.preferred_temperature) >= 2.0 && latest.temperature >= (fInfo.temperature_min ?? 0) && latest.temperature <= (fInfo.temperature_max ?? 100)) {
          subOptTemp.push(`${fishName} (Ideal: ~${fInfo.preferred_temperature}°C)`);
        }
      }
      
      if (latest?.ph != null && fInfo.preferred_ph != null) {
        if (Math.abs(latest.ph - fInfo.preferred_ph) >= 0.8 && latest.ph >= (fInfo.ph_min ?? 0) && latest.ph <= (fInfo.ph_max ?? 14)) {
          subOptPh.push(`${fishName} (Ideal: ~${fInfo.preferred_ph})`);
        }
      }

      if (currentStyle !== "None" && currentStyle !== "Bebas") {
        const pStyles = fInfo.preferred_aquascape_styles?.map(s => s.toLowerCase());
        if (pStyles && pStyles.length > 0 && !pStyles.includes(currentStyle.toLowerCase())) {
          styleMismatches.push(fishName);
        }
      }

      // FISIKA AIR: Kebutuhan Oksigen / Arus
      const oxygenScore = fInfo.oxygen_requirement_score || 5;
      const requiresCurrent = fInfo.current_preference?.toLowerCase() === "high";
      if (latest?.temperature != null && latest.temperature > 28 && oxygenScore >= 8) {
         oxygenRisks.push(fishName);
      } else if ((oxygenScore >= 8 || requiresCurrent) && filterCapacityLph > 0 && tankTurnoverRate < 4) {
         oxygenRisks.push(`${fishName} (Butuh arus kuat)`);
      }

      // Validasi Ekologi Khusus V1 Final
      if (fInfo.jump_risk === true && !isLidPresent) jumpers.push(fishName);
      if (fInfo.sensitive_to_nitrate === true && latest?.nitrate != null && latest.nitrate >= 20) highNitrateSensitives.push(fishName);
      totalWasteScore += (fInfo.waste_production_score || 5) * data.totalQty;

      // Schooling & Limit Dimensi
      if (fInfo.min_school_size != null && fInfo.min_school_size > 0 && data.totalQty < fInfo.min_school_size) {
        rootCauses.push({
          title: lang === 'id' ? "Kawanan Terlalu Sedikit" : "Insufficient Schooling Size", severity: "medium",
          description: lang === 'id' ? `${fishName} stres karena populasi kawanannya (${data.totalQty} ekor) kurang dari minimal.` : `${fishName} is stressed due to low school group count (${data.totalQty}).`
        });
      }
      if (fInfo.minimum_tank_length_cm != null && extAq.length_cm < fInfo.minimum_tank_length_cm) {
        rootCauses.push({
          title: lang === 'id' ? "Keterbatasan Ruang Gerak" : "Inadequate Tank Space", severity: "high",
          description: lang === 'id' ? `${fishName} butuh panjang tank minimal ${fInfo.minimum_tank_length_cm} cm.` : `${fishName} requires at least ${fInfo.minimum_tank_length_cm} cm tank length.`
        });
      }
      if (fInfo.minimum_tank_volume_liters != null && extAq.volume_liters < fInfo.minimum_tank_volume_liters) {
        rootCauses.push({
          title: lang === 'id' ? "Volume Air Terlalu Kecil" : "Insufficient Water Volume", severity: "high",
          description: lang === 'id' ? `${fishName} membutuhkan volume minimal ${fInfo.minimum_tank_volume_liters} Liter.` : `${fishName} requires a minimum volume of ${fInfo.minimum_tank_volume_liters} Liters.`
        });
      }
    });

    // Peringatan Ekologi Massal
    if (oxygenRisks.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Defisit Oksigen Terlarut / Arus" : "Dissolved Oxygen / Flow Deficit", severity: "high",
        description: lang === 'id' ? `Kondisi suhu atau sirkulasi saat ini mengancam spesies beroksigen tinggi: ${oxygenRisks.join(", ")}.` : `Current temp or circulation threatens high-oxygen species: ${oxygenRisks.join(", ")}.`
      });
    }
    if (jumpers.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Risiko Ikan Meloncat (Tanpa Tutup)" : "Jump Hazard (Open Top)", severity: "high",
        description: lang === 'id' ? `Akuarium tidak memiliki tutup padahal spesies ini rawan melompat keluar: ${jumpers.join(", ")}.` : `Tank is uncovered but contains known jumpers: ${jumpers.join(", ")}.`
      });
      nextActions.push(lang === 'id' ? "Pasang penutup jaring/kaca pada akuarium atau turunkan level air secara signifikan." : "Install a mesh/glass lid or lower the water line significantly.");
    }
    if (highNitrateSensitives.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Spesies Rentan Nitrat Terancam" : "Nitrate Sensitive Species Threatened", severity: "high",
        description: lang === 'id' ? `Kadar nitrat mencapai batas kritis intoleransi bagi: ${highNitrateSensitives.join(", ")}.` : `Nitrate reached critical intolerance bounds for: ${highNitrateSensitives.join(", ")}.`
      });
    }
    if (extAq.volume_liters > 0 && (totalWasteScore / extAq.volume_liters) > 1.2) {
      rootCauses.push({
        title: lang === 'id' ? "Produksi Limbah Fauna Masif" : "Heavy Waste Production", severity: "high",
        description: lang === 'id' ? "Kombinasi ikan pencetak limbah tinggi membebani filtrasi mekanis dan biologis." : "Combination of heavy waste producers is overwhelming the filtration."
      });
    }

    if (subOptTemp.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Suhu Sub-Optimal (Bukan Sweet Spot)" : "Sub-Optimal Temperature", severity: "low",
        description: lang === 'id' ? `Suhu saat ini aman, namun jauh dari titik nyaman untuk: ${subOptTemp.join(", ")}.` : `Current temp is safe but far from the sweet spot for: ${subOptTemp.join(", ")}.`
      });
    }
    if (subOptPh.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "pH Sub-Optimal" : "Sub-Optimal pH", severity: "low",
        description: lang === 'id' ? `Nilai pH tangki tidak ideal untuk kesejahteraan jangka panjang: ${subOptPh.join(", ")}.` : `Tank pH is not ideal for the long-term thriving of: ${subOptPh.join(", ")}.`
      });
    }
    if (styleMismatches.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Estetika Gaya Kurang Harmonis" : "Aesthetic Theme Mismatch", severity: "low",
        description: lang === 'id' ? `Tema ${currentStyle} kurang merepresentasikan habitat alami untuk: ${styleMismatches.join(", ")}.` : `Theme ${currentStyle} does not conceptually match the natural aesthetics of: ${styleMismatches.join(", ")}.`
      });
    }
  }

  // =======================================================
  // 2. DYNAMIC PLANT RECOMMENDATION ENGINE & ECOLOGY
  // =======================================================
  const co2Type = extAq.co2_type?.toLowerCase() || "none";
  const lightType = extAq.light_type?.toLowerCase() || "none";
  const isLowTech = co2Type === "none" && (!lightType.includes("rgb") && !lightType.includes("high"));
  const currStyleStr = extAq.aquascape_style?.toLowerCase() || "bebas";

  if (plants.length > 0) {
    const unsuitablePlants: string[] = [];
    const phWarningPlants: string[] = [];
    const invasivePlants: string[] = [];
    const highMaintenancePlants: string[] = [];
    const overgrownPlants: string[] = [];

    plants.forEach(p => {
      const pData = p.plant;
      if (!pData) return;
      const pName = lang === 'id' ? pData.name_id : (pData.name_en || pData.name_id);
      
      if (latest?.ph != null && pData.preferred_ph != null && Math.abs(latest.ph - pData.preferred_ph) >= 1.0) {
        phWarningPlants.push(pName);
      }
      if (currStyleStr === "dutch" && (pData.epiphyte || pData.floating)) {
        unsuitablePlants.push(pName);
      } else if (currStyleStr === "iwagumi" && !pData.carpeting && pData.placement !== "Foreground") {
        unsuitablePlants.push(pName);
      }

      if (pData.invasive_growth) invasivePlants.push(pName);
      if ((pData.trimming_frequency_score || 0) >= 8) highMaintenancePlants.push(pName);
      if (pData.growth_height_cm != null && extAq.height_cm > 0 && pData.growth_height_cm > extAq.height_cm) overgrownPlants.push(pName);
    });

    if (unsuitablePlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Estetika Flora Kurang Tepat" : "Sub-optimal Flora Aesthetics", severity: "low",
        description: lang === 'id' ? `Tanaman berikut kurang lazim digunakan pada gaya ${extAq.aquascape_style}: ${unsuitablePlants.join(", ")}.` : `The following plants are unconventional for ${extAq.aquascape_style} style: ${unsuitablePlants.join(", ")}.`
      });
    }
    if (invasivePlants.length > 0) {
      recommendations.push(lang === 'id' ? `Tanaman ${invasivePlants.join(", ")} sangat invasif, jadwalkan pemangkasan rutin agar tidak menutupi cahaya ke dasar.` : `Plants like ${invasivePlants.join(", ")} are highly invasive. Schedule regular trimming.`);
    }
    if (overgrownPlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Tinggi Flora Melebihi Tangki" : "Flora Exceeds Tank Height", severity: "medium",
        description: lang === 'id' ? `Sifat tumbuh alami tanaman ${overgrownPlants.join(", ")} akan melebihi tinggi akuarium Anda.` : `The natural growth height of ${overgrownPlants.join(", ")} will exceed your aquarium glass height.`
      });
    }
    if (highMaintenancePlants.length > 0 && health.scores.maintenance < 80) {
      rootCauses.push({
        title: lang === 'id' ? "Flora Pemeliharaan Tinggi Terabaikan" : "Neglected High-Maintenance Flora", severity: "medium",
        description: lang === 'id' ? `Kualitas pemeliharaan Anda menurun, padahal flora seperti ${highMaintenancePlants.join(", ")} butuh trimming ketat.` : `Maintenance discipline is slipping, yet flora like ${highMaintenancePlants.join(", ")} require strict trimming.`
      });
    }
  }

  if (masterPlantsCandidates && masterPlantsCandidates.length > 0) {
    const dynamicFiltered = masterPlantsCandidates.filter(p => {
      if (!p) return false;
      const co2Mandatory = p.co2_mandatory ?? false;
      const lightReq = p.light_requirement?.toLowerCase() || "medium";
      
      if (isLowTech) return !co2Mandatory && (lightReq === "low" || lightReq === "medium");
      return lightReq === "high" || lightReq === "medium" || co2Mandatory;
    }).slice(0, 4);

    dynamicFiltered.forEach(p => {
      if (p) {
        const pName = lang === 'id' ? p.name_id : (p.name_en || p.name_id);
        const pPlacement = lang === 'id' ? p.placement : (p.placement || "Midground");
        plantRecommendations.push(`${pName} [Pos: ${pPlacement}]`);
      }
    });
  }

  if (plantRecommendations.length === 0) {
    if (isLowTech) {
      plantRecommendations.push(lang === 'id' ? "Anubias Barteri (Tahan minim cahaya & tanpa gas CO2)" : "Anubias Barteri (Low-light resilient flora)");
      plantRecommendations.push(lang === 'id' ? "Java Fern / Kadaka (Epifit, cukup diikat pada kayu/batu)" : "Java Fern (Epiphyte, binds to driftwood)");
    } else {
      plantRecommendations.push(lang === 'id' ? "Rotala Rotundifolia (Konsumsi nitrat tinggi, butuh cahaya WRGB)" : "Rotala Rotundifolia (High nitrate consumer)");
      plantRecommendations.push(lang === 'id' ? "HC Cuba / Monte Carlo (Karpet indah untuk High-Tech tank)" : "HC Cuba (Beautiful high-tech carpeting option)");
    }
  }

  // =======================================================
  // 3. AI EXPLAINABILITY TRANSLATOR & BASIC CHEMISTRY
  // =======================================================
  if (health.deductions) {
    Object.entries(health.deductions).forEach(([key, value]) => {
      if (value > 0) explainabilityBreakdown.push(`${key}: -${Math.floor(value)} Poin`);
    });
  }

  if (latest?.ammonia != null && latest.ammonia > 0) {
    rootCauses.push({ title: lang === 'id' ? "Lonjakan Amonia" : "Ammonia Spike", severity: "high", description: lang === 'id' ? `Amonia ${latest.ammonia} ppm fatal bagi insang.` : `Ammonia ${latest.ammonia} ppm burns gills.` });
  }
  if (latest?.nitrite != null && latest.nitrite > 0.25) {
    rootCauses.push({ title: lang === "id" ? "Nitrit Berbahaya" : "Dangerous Nitrite", severity: "high", description: lang === "id" ? `Nitrit ${latest.nitrite} ppm memblokir oksigen darah.` : `Nitrite ${latest.nitrite} ppm blocks oxygen.` });
  }
  if (latest?.nitrate != null && latest.nitrate > 40) {
    rootCauses.push({ title: lang === 'id' ? "Nitrat Tinggi" : "High Nitrate", severity: "medium", description: lang === 'id' ? `Nitrat ${latest.nitrate} ppm dapat memicu stres panjang.` : `Nitrate ${latest.nitrate} ppm causes stress.` });
  }

  // ==========================================
  // 4. ROOT CAUSE DEDUPLICATION & CAPPING
  // ==========================================
  const severityWeight: Record<Required<DiagnosisCause>["severity"], number> = { "high": 3, "medium": 2, "low": 1 };
  const uniqueRootCauses: DiagnosisCause[] = [];
  const seenCauses = new Set<string>();

  rootCauses.forEach(cause => {
    const uniqueKey = `${cause.title}|${cause.description}`;
    if (!seenCauses.has(uniqueKey)) {
      seenCauses.add(uniqueKey);
      uniqueRootCauses.push(cause);
    }
  });

  const sortedRootCauses = uniqueRootCauses.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  const finalRootCauses = sortedRootCauses.slice(0, 8);

  let riskLevel: RiskLevel = "LOW";
  if (health.scores.overall < 85) riskLevel = "MEDIUM";
  if (health.scores.overall < 70) riskLevel = "HIGH";
  if (health.scores.overall < 50) riskLevel = "CRITICAL";

  if (latest?.ammonia != null && latest.ammonia >= 1) riskLevel = "CRITICAL";
  if (latest?.nitrite != null && latest.nitrite >= 1) riskLevel = "CRITICAL";

  let summary = "";
  if (riskLevel === "LOW") summary = lang === 'id' ? "Ekosistem akuarium beroperasi pada kondisi puncak dan harmonis." : "Ecosystem is operating at peak condition.";
  else if (riskLevel === "MEDIUM") summary = lang === 'id' ? "Sistem stabil, namun terdeteksi inefisiensi yang perlu penyesuaian." : "Stable system, but inefficiencies require tuning.";
  else if (riskLevel === "HIGH") summary = lang === 'id' ? "Peringatan Sistem: Ditemukan faktor risiko perusak keseimbangan biologis." : "System Warning: Risk factors detected that may break biological balance.";
  else summary = lang === 'id' ? "KRITIS: Terdeteksi kegagalan ekosistem! Tindakan triage darurat diperlukan." : "CRITICAL: Ecosystem failure detected! Immediate triage required.";

  if (nextActions.length === 0) nextActions.push(lang === 'id' ? "Pertahankan jadwal maintenance dan observasi." : "Maintain schedule and observe.");

  return { summary, riskLevel, rootCauses: finalRootCauses, recommendations, nextActions, generatedAt: new Date().toISOString(), explainabilityBreakdown, plantRecommendations };
}