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
  // 1. MATRIKS KOMPATIBILITAS DINAMIS & LOGIKA TAG FAUNA
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
          reason = lang === 'id' ? `Matriks hubungan spesies terdata.` : `Species relationship matrix confirmed.`;
        } else if (fishB.compatibility_score && fishA.name_en && fishB.compatibility_score[fishA.name_en] !== undefined) {
          dynamicScore = fishB.compatibility_score[fishA.name_en];
          reason = lang === 'id' ? `Matriks hubungan spesies terdata.` : `Species relationship matrix confirmed.`;
        } else {
          // Sistem Otomatis Tag-Based AI Reasoning (Skalabilitas 250.000 Relasi Tanpa Input Manual)
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
            dynamicScore -= 8; reason = lang === 'id' ? "Gabungan predator karnivora dengan ikan komunitas kecil." : "Carnivorous predator mixed with small community fish.";
          } else if ((aAggressive && bPeaceful) || (bAggressive && aPeaceful)) {
            dynamicScore -= 6; reason = lang === 'id' ? "Ikan territorial agresif digabung dengan spesies pasif/rentan." : "Territorial aggressive fish mixed with peaceful/vulnerable species.";
          }

          if (fishA.native_biotope && fishB.native_biotope && fishA.native_biotope === fishB.native_biotope) {
            dynamicScore = Math.min(10, dynamicScore + 2); // Bonus keselarasan habitat alami
          }
        }

        if (dynamicScore <= 3) {
          rootCauses.push({
            title: lang === 'id' ? "Konflik Hubungan Spesies Parah" : "Severe Species Relationship Conflict", severity: "high",
            description: lang === 'id' 
              ? `${fishA.name_id} dan ${fishB.name_id} berisiko tinggi bentrok (Skor ${dynamicScore}/10). Analisis: ${reason}` 
              : `${fishA.name_en} and ${fishB.name_en} are at high risk of conflict (Score ${dynamicScore}/10). Analysis: ${reason}`
          });
        }
      }
    }

    // Biotope Intelligence Engine
    const biotopes = new Set<string>();
    groupedFishes.forEach(data => { if (data.fishInfo.native_biotope) biotopes.add(data.fishInfo.native_biotope); });
    if (biotopes.size > 1) {
      const biotopeArr = Array.from(biotopes).map(b => b.toLowerCase());
      const hasAfricanRift = biotopeArr.some(b => b.includes("african rift") || b.includes("malawi") || b.includes("tanganyika"));
      const hasAmazonian = biotopeArr.some(b => b.includes("amazon") || b.includes("blackwater") || b.includes("south american"));

      if (hasAfricanRift && hasAmazonian) {
        rootCauses.push({
          title: lang === 'id' ? "Tabrakan Ekosistem Biotope Ekstrem" : "Fatal Biotope Ecosystem Clash", severity: "high",
          description: lang === 'id' 
            ? "Mencampur fauna Danau Afrika (pH Basa, Air Keras) dengan fauna Amazon (pH Asam, Air Lunak) merusak osmoregulasi internal organ ikan." 
            : "Mixing African Rift species (Alkaline/Hard) with Amazonian species (Acidic/Soft) causes fatal internal osmoregulation failure."
        });
      }
    }

    // Penghancuran Fisik Vegetasi (Uprooting Engine)
    const plantUprooters = fishes.filter(f => f.fish?.uproots_plants === true);
    if (plants.length > 0 && plantUprooters.length > 0) {
      const uprootNames = [...new Set(plantUprooters.map(f => lang === 'id' ? f.fish?.name_id : f.fish?.name_en))].join(", ");
      rootCauses.push({
        title: lang === 'id' ? "Ancaman Destruksi Substrat Flora" : "Flora Uprooting Hazard", severity: "high",
        description: lang === 'id' ? `Spesies penggalas tanah (${uprootNames}) akan membongkar akar tanaman bertangkai (*stem plants*).` : `Substrate digging species (${uprootNames}) will uproot stem plants.`
      });
    }

    // Keamanan Udang Tingkat Lanjut (Shrimp Safety Engine Skala 0-10)
    if (hasShrimp) {
      groupedFishes.forEach((data) => {
        const riskScore = data.fishInfo.shrimp_predation_risk ?? (data.fishInfo.shrimp_safe === false ? 10 : 0);
        const fName = lang === 'id' ? data.fishInfo.name_id : data.fishInfo.name_en;
        
        if (riskScore >= 8) {
          rootCauses.push({
            title: lang === 'id' ? "Predator Udang Mutlak Terdeteksi" : "Apex Shrimp Predator Detected", severity: "high",
            description: lang === 'id' ? `${fName} memperlakukan udang hias dewasa sebagai rantai makanan prey.` : `${fName} treats adult ornamental shrimp as direct live prey.`
          });
        } else if (riskScore >= 4) {
          rootCauses.push({
            title: lang === 'id' ? "Predasi Masif Burayak Udang" : "Shrimplet Predation Risk", severity: "medium",
            description: lang === 'id' ? `${fName} aman bagi udang besar, namun akan memburu anak udang (*shrimplets*) secara agresif.` : `${fName} ignores adult shrimp but will actively hunt newborns (*shrimplets*).`
          });
        }
      });
    }

    // Verifikasi Fisiologis Penutup Tangki & Sirkulasi LPH Nyata
    const tankTurnoverRate = (aquarium.volume_liters > 0 && aquarium.filter_flow_lph) ? (aquarium.filter_flow_lph / aquarium.volume_liters) : 0;
    const isLidPresent = aquarium.lid_present === true;
    
    const jumpers: string[] = [];
    const highFlowDemands: string[] = [];
    const highNitrateSensitives: string[] = [];

    groupedFishes.forEach((data) => {
      const fInfo = data.fishInfo;
      const fishName = lang === 'id' ? fInfo.name_id : fInfo.name_en;

      if (fInfo.jump_risk === true && !isLidPresent) jumpers.push(fishName);
      if (fInfo.sensitive_to_nitrate === true && latest?.nitrate != null && latest.nitrate >= 20) highNitrateSensitives.push(fishName);
      
      const oxygenScore = fInfo.oxygen_requirement_score || 5;
      const requiresCurrent = fInfo.current_preference?.toLowerCase() === "high";
      if ((oxygenScore >= 8 || requiresCurrent) && tankTurnoverRate < 4.0) {
        highFlowDemands.push(fishName);
      }

      // Validasi Batas Minimal Volume Tangki Pengguna
      if (fInfo.minimum_tank_volume_liters != null && aquarium.volume_liters < fInfo.minimum_tank_volume_liters) {
        rootCauses.push({
          title: lang === 'id' ? "Batas Minimal Volume Terlampaui" : "Critical Volume Deficit", severity: "high",
          description: lang === 'id' ? `${fishName} membutuhkan kapasitas ruang air minimal ${fInfo.minimum_tank_volume_liters} Liter.` : `${fishName} demands at least ${fInfo.minimum_tank_volume_liters} Water Liters to thrive.`
        });
      }
    });

    if (jumpers.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Ancaman Fatal Ikan Lompat" : "Critical Jump Hazard", severity: "high",
        description: lang === 'id' ? `Spesies berikut memiliki insting melompat tinggi namun tangki tidak memiliki penutup: ${jumpers.join(", ")}.` : `Tank top is completely open while containing known jumping species: ${jumpers.join(", ")}.`
      });
      nextActions.push(lang === 'id' ? "Pasang penutup kaca/mesh pada bagian atas akuarium." : "Install a glass or mesh lid securely over the tank top.");
    }
    if (highFlowDemands.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Daya Putar Arus Malfungsi" : "Inadequate Current Circulation", severity: "high",
        description: lang === 'id' ? `Turnover rate filter saat ini (${tankTurnoverRate.toFixed(1)}x lipat/jam) tidak menghasilkan pasokan oksigen deras untuk: ${highFlowDemands.join(", ")}.` : `Current filter turnover rate (${tankTurnoverRate.toFixed(1)}x/hour) cannot sustain oxygen demands for: ${highFlowDemands.join(", ")}.`
      });
      recommendations.push(lang === 'id' ? "Gunakan powerhead atau wavemaker internal tambahan." : "Integrate an internal powerhead or wavemaker to increase surface agitation.");
    }
    if (highNitrateSensitives.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Intoksikasi Spesies Sensitif Nitrat" : "Nitrate Sensitive Distress", severity: "high",
        description: lang === 'id' ? `Akumulasi senyawa nitrogen murni menekan organ internal: ${highNitrateSensitives.join(", ")}.` : `Pure nitrogenous buildup heavily stresses sensitive organs of: ${highNitrateSensitives.join(", ")}.`
      });
    }
  }

  // =======================================================
  // 2. AUDIT MORFOLOGI FLORA & KOMPATIBILITAS GAYA ESTETIKA
  // =======================================================
  const currentStyle = aquarium.aquascape_style || "Bebas";
  const currStyleStr = currentStyle.toLowerCase();

  if (plants.length > 0) {
    const unsuitablePlants: string[] = [];
    const overgrownPlants: string[] = [];

    plants.forEach(p => {
      const pData = p.plant;
      if (!pData) return;
      const pName = lang === 'id' ? pData.name_id : (pData.name_en || pData.name_id);
      
      // Audit Aturan Desain Aquascape Klasik Dunia (Dutch & Iwagumi Rules)
      if (currStyleStr === "dutch" && (pData.epiphyte || pData.floating)) {
        unsuitablePlants.push(pName);
      } else if (currStyleStr === "iwagumi" && !pData.carpeting && pData.placement !== "Foreground") {
        unsuitablePlants.push(pName);
      }

      // Validasi Ketinggian Vertikal Kaca Tangki Nyata Pengguna
      if (pData.growth_height_cm != null && aquarium.height_cm > 0 && pData.growth_height_cm > aquarium.height_cm) {
        overgrownPlants.push(pName);
      }
    });

    if (unsuitablePlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Penyimpangan Pakem Gaya Aquascape" : "Aquascape Style Anomaly", severity: "low",
        description: lang === 'id' ? `Komposisi vegetasi ${unsuitablePlants.join(", ")} melanggar pakem standar internasional kompetisi gaya ${currentStyle}.` : `Flora composition of ${unsuitablePlants.join(", ")} violates traditional rules of a pure ${currentStyle} style.`
      });
    }
    if (overgrownPlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Flora Melebihi Batas Ketinggian" : "Flora Outgrew Tank Boundary", severity: "medium",
        description: lang === 'id' ? `Tinggi maksimal biologis spesies ${overgrownPlants.join(", ")} melampaui dimensi vertikal kaca akuarium.` : `Natural vertical growth of ${overgrownPlants.join(", ")} will outgrow the physical vertical glass bounds.`
      });
    }
  }

  // Mesin Penyaring Rekomendasi Flora Cerdas Kontekstual LPH & Cahaya
  const co2Type = aquarium.co2_type?.toLowerCase() || "none";
  const lightType = aquarium.light_type?.toLowerCase() || "none";
  const isLowTech = co2Type === "none" && (!lightType.includes("rgb") && !lightType.includes("high"));

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

  // Fallback Pengaman Jika Dataset Kosong
  if (plantRecommendations.length === 0) {
    if (isLowTech) {
      plantRecommendations.push(lang === 'id' ? "Anubias Barteri (Tahan low light & tanpa CO2 gas)" : "Anubias Barteri (Low-light resilient epiphyte)");
      plantRecommendations.push(lang === 'id' ? "Java Fern / Kadaka (Epifit pembasmi nitrat awal)" : "Java Fern (Epiphyte, excellent nitrate sink)");
    } else {
      plantRecommendations.push(lang === 'id' ? "Rotala Rotundifolia (Warna merah intens, butuh WRGB tinggi)" : "Rotala Rotundifolia (Demands high WRGB & trimming)");
      plantRecommendations.push(lang === 'id' ? "Monte Carlo (Karpet hijau rapat untuk tangki gas CO2)" : "Monte Carlo (Beautiful high-tech carpeting option)");
    }
  }

  // =======================================================
  // 3. JEJAK DEFEK DEKSTRUKTIF & HISTORI PARAMETER
  // =======================================================
  if (health.deductions) {
    Object.entries(health.deductions).forEach(([key, value]) => {
      if (value > 0) explainabilityBreakdown.push(`${key}: -${Math.floor(value)} Poin`);
    });
  }

  if (latest?.ammonia != null && latest.ammonia > 0) {
    rootCauses.push({ title: lang === 'id' ? "Akumulasi Toksin Amonia" : "Critical Ammonia Poisoning", severity: "high", description: lang === 'id' ? `Senyawa NH3/NH4+ mencapai ${latest.ammonia} ppm merusak jaringan insang.` : `Ammonia buildup of ${latest.ammonia} ppm burns respiratory gills.` });
  }
  if (latest?.nitrite != null && latest.nitrite > 0.25) {
    rootCauses.push({ title: lang === "id" ? "Penyumbatan Oksigen Darah (Nitrit)" : "Nitrite Methemoglobinemia Threat", severity: "high", description: lang === "id" ? `Kadar NO2 ${latest.nitrite} ppm menghentikan sirkulasi oksigen internal.` : `Nitrite at ${latest.nitrite} ppm blocks internal blood oxygen bonding.` });
  }

  // ==========================================
  // 4. DEDUPLIKASI AKHIR & PENENTUAN LEVEL RISIKO
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

  if (latest?.ammonia != null && latest.ammonia >= 0.5) riskLevel = "CRITICAL";
  if (latest?.nitrite != null && latest.nitrite >= 0.5) riskLevel = "CRITICAL";

  let summary = "";
  if (riskLevel === "LOW") summary = lang === 'id' ? "Sistem ekologi seimbang sempurna. Seluruh komponen hayati beroperasi optimal." : "Ecological system is in perfect equilibrium. All components operating optimally.";
  else if (riskLevel === "MEDIUM") summary = lang === 'id' ? "Ekosistem terpantau stabil, namun ditemukan indikasi penurunan efisiensi minor." : "Ecosystem stable, but minor performance bottlenecks detected.";
  else if (riskLevel === "HIGH") summary = lang === 'id' ? "Sinyal Bahaya: Ditemukan kegagalan fungsional yang mengancam siklus hidup biologis." : "System Alert: Biological stress factors detected threatening population survival.";
  else summary = lang === 'id' ? "DARURAT EKOSISTEM: Kegagalan sirkulasi biologis total! Lakukan tindakan penyelamatan." : "ECOSYSTEM FAILURE: Total biological breakdown! Immediate intervention mandatory.";

  if (nextActions.length === 0) nextActions.push(lang === 'id' ? "Pertahankan parameter air saat ini dan teruskan jadwal perawatan." : "Maintain current water logs and continue routine maintenance.");

  return { summary, riskLevel, rootCauses: finalRootCauses, recommendations, nextActions, generatedAt: new Date().toISOString(), explainabilityBreakdown, plantRecommendations };
}