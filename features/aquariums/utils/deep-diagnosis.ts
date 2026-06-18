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

export function generateDeepDiagnosis({ aquarium, health, parameters, fishes, plants, lang, masterPlantsCandidates }: Props): DeepDiagnosisResult {
  const rootCauses: DiagnosisCause[] = [];
  const recommendations: string[] = [];
  const nextActions: string[] = [];
  const plantRecommendations: string[] = [];
  const explainabilityBreakdown: string[] = [];

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
  // 1. ADVANCED FISH COMPATIBILITY & NIGHT TERRITORY ENGINE
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

    const currentStyle = aquarium.aquascape_style || "Bebas";
    const subOptTemp: string[] = [];
    const subOptPh: string[] = [];
    const styleMismatches: string[] = [];
    const oxygenRisks: string[] = [];

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

      // FISIKA AIR: Suhu tinggi menurunkan kadar oksigen terlarut
      if (latest?.temperature != null && latest.temperature > 28 && fInfo.oxygen_requirement_score != null && fInfo.oxygen_requirement_score >= 8) {
         oxygenRisks.push(fishName);
      }
      
      if (fInfo.min_school_size != null && fInfo.min_school_size > 0 && data.totalQty < fInfo.min_school_size) {
        rootCauses.push({
          title: lang === 'id' ? "Kawanan Terlalu Sedikit" : "Insufficient Schooling Size", severity: "medium",
          description: lang === 'id' ? `${fishName} stres karena populasi kawanannya (${data.totalQty} ekor) kurang dari minimal.` : `${fishName} is stressed due to low school group count (${data.totalQty}).`
        });
      }
      if (fInfo.minimum_tank_length_cm != null && aquarium.length_cm < fInfo.minimum_tank_length_cm) {
        rootCauses.push({
          title: lang === 'id' ? "Keterbatasan Ruang Gerak" : "Inadequate Tank Space", severity: "high",
          description: lang === 'id' ? `${fishName} butuh panjang tank minimal ${fInfo.minimum_tank_length_cm} cm.` : `${fishName} requires at least ${fInfo.minimum_tank_length_cm} cm tank length.`
        });
      }
    });

    if (oxygenRisks.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Defisit Oksigen Terlarut (Suhu Tinggi)" : "Dissolved Oxygen Deficit (High Temp)", severity: "high",
        description: lang === 'id' ? `Suhu >28°C menguras oksigen terlarut, sangat berbahaya bagi spesies arus deras: ${oxygenRisks.join(", ")}.` : `Temperatures >28°C deplete oxygen, highly dangerous for high-flow species: ${oxygenRisks.join(", ")}.`
      });
      recommendations.push(lang === 'id' ? "Nyalakan aerator tambahan (batu aerasi) atau arahkan arus filter memecah permukaan air." : "Add extra air stones or aim filter output to break the surface tension.");
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
  // 2. DYNAMIC PLANT RECOMMENDATION ENGINE & AESTHETIC EVALUATION
  // =======================================================
  const co2Type = aquarium.co2_type?.toLowerCase() || "none";
  const lightType = aquarium.light_type?.toLowerCase() || "none";
  const isLowTech = co2Type === "none" && (!lightType.includes("rgb") && !lightType.includes("high"));
  const currStyleStr = aquarium.aquascape_style?.toLowerCase() || "bebas";

  // Estetika Tanaman Saat Ini
  if (plants.length > 0) {
    const unsuitablePlants: string[] = [];
    const phWarningPlants: string[] = [];

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
    });

    if (unsuitablePlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Estetika Flora Kurang Tepat" : "Sub-optimal Flora Aesthetics", severity: "low",
        description: lang === 'id' ? `Tanaman berikut kurang lazim digunakan pada gaya ${aquarium.aquascape_style}: ${unsuitablePlants.join(", ")}.` : `The following plants are unconventional for ${aquarium.aquascape_style} style: ${unsuitablePlants.join(", ")}.`
      });
    }
    if (phWarningPlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "pH Sub-Optimal untuk Flora" : "Sub-optimal pH for Flora", severity: "low",
        description: lang === 'id' ? `pH saat ini dapat menghambat pertumbuhan optimal pada: ${phWarningPlants.join(", ")}.` : `Current pH may stunt the optimal growth of: ${phWarningPlants.join(", ")}.`
      });
    }
  }

  // Rekomendasi Tanaman Database
  if (masterPlantsCandidates && masterPlantsCandidates.length > 0) {
    const dynamicFiltered = masterPlantsCandidates.filter(p => {
      if (!p) return false;
      const co2Mandatory = p.co2_mandatory ?? false;
      const lightReq = p.light_requirement?.toLowerCase() || "medium";
      
      if (isLowTech) {
        return !co2Mandatory && (lightReq === "low" || lightReq === "medium");
      } else {
        return lightReq === "high" || lightReq === "medium" || co2Mandatory;
      }
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