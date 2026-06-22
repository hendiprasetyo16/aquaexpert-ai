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

// INJEKSI V1.3: Interface tambahan relasi kerentanan penyakit
export interface DiseaseVulnerability {
  fish_id: string;
  disease_name_id: string;
  disease_name_en: string;
  susceptibility_score: number;
}

interface Props {
  aquarium: Aquarium;
  health: HealthAnalysisResult;
  parameters: AquariumParameterLog[];
  fishes: TankFish[];
  plants: TankPlant[];
  lang: "id" | "en";
  masterPlantsCandidates?: TankPlant["plant"][]; 
  // Dipersiapkan untuk Query Action Disease Relational yang akan dibangun selanjutnya
  pathologyVulnerabilities?: DiseaseVulnerability[]; 
}

export function generateDeepDiagnosis({ aquarium, health, parameters, fishes, plants, lang, masterPlantsCandidates, pathologyVulnerabilities = [] }: Props): DeepDiagnosisResult {
  const rootCauses: DiagnosisCause[] = [];
  const recommendations: string[] = [];
  const nextActions: string[] = [];
  const plantRecommendations: string[] = [];
  const explainabilityBreakdown: string[] = [];

  const sortedParams = [...parameters].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
  const latest = sortedParams.length > 0 ? sortedParams[0] : null;

  const hasShrimp = fishes.some(f => f.fish?.fish_type === "Invertebrate" || f.fish?.fish_type?.toLowerCase().includes("shrimp"));
  const groupedFishes = new Map<string, { totalQty: number, fishInfo: NonNullable<TankFish['fish']> }>();
  
  let totalFaunaQty = 0;
  let highRiskDiseaseTriggered = false;

  fishes.forEach(f => {
    if (f.fish && f.fish_id) {
      if (!groupedFishes.has(f.fish_id)) {
        groupedFishes.set(f.fish_id, { totalQty: 0, fishInfo: f.fish });
      }
      groupedFishes.get(f.fish_id)!.totalQty += f.quantity;
      totalFaunaQty += f.quantity;
    }
  });

  // =======================================================
  // 1. ADVANCED FAUNA COMPATIBILITY & POPULATION ENGINE
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
          reason = lang === 'id' ? `Tercatat dalam matriks hubungan spesies.` : `Direct species matrix confirmed.`;
        } else if (fishB.compatibility_score && fishA.name_en && fishB.compatibility_score[fishA.name_en] !== undefined) {
          dynamicScore = fishB.compatibility_score[fishA.name_en];
          reason = lang === 'id' ? `Tercatat dalam matriks hubungan spesies.` : `Direct species matrix confirmed.`;
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
            dynamicScore -= 8; reason = lang === 'id' ? "Predator dicampur dengan ikan komunitas kecil." : "Predator mixed with small community fish.";
          } else if ((aAggressive && bPeaceful) || (bAggressive && aPeaceful)) {
            dynamicScore -= 6; reason = lang === 'id' ? "Spesies agresif menekan mental spesies ringkih." : "Aggressive species suppressing vulnerable profiles.";
          }
        }

        if (dynamicScore <= 3) {
          rootCauses.push({
            title: lang === 'id' ? "Konflik Hubungan Spesies Parah" : "Severe Species Relationship Conflict", severity: "high",
            description: lang === 'id' 
              ? `${fishA.name_id} dan ${fishB.name_id} berisiko tinggi bentrok fisik (Skor ${dynamicScore}/10). Alasan: ${reason}` 
              : `${fishA.name_en} and ${fishB.name_en} conflict warning (Score ${dynamicScore}/10). Reason: ${reason}`
          });
        }
      }
    }

    const biotopes = new Set<string>();
    groupedFishes.forEach(data => { if (data.fishInfo.native_biotope) biotopes.add(data.fishInfo.native_biotope); });
    if (biotopes.size > 1) {
      const biotopeArr = Array.from(biotopes).map(b => b.toLowerCase());
      if (biotopeArr.some(b => b.includes("african rift")) && biotopeArr.some(b => b.includes("amazon") || b.includes("blackwater"))) {
        rootCauses.push({
          title: lang === 'id' ? "Tabrakan Ekosistem Biotope Ekstrem" : "Fatal Biotope Ecosystem Clash", severity: "high",
          description: lang === 'id' 
            ? "Pencampuran fauna Rift Lake Afrika (Keras/Basa) dengan Amazonia (Lunak/Asam) memicu hancurnya organ osmoregulasi ikan." 
            : "Mixing African Rift species with Amazonian species causes fatal internal osmoregulation collapse."
        });
      }
    }

    // AUDIT PRIORITAS: PATHOLOGY LINK REASONING (DYNAMIC DB RELATION INTEGRATION)
    if (latest && pathologyVulnerabilities.length > 0) {
      groupedFishes.forEach((data) => {
        const f = data.fishInfo;
        const fishName = lang === 'id' ? f.name_id : f.name_en;
        
        // Memeriksa tabel silang untuk mencari penyakit kritis (Skor 4 atau 5)
        const criticalVulnerabilities = pathologyVulnerabilities.filter(v => v.fish_id === f.id && v.susceptibility_score >= 4);

        criticalVulnerabilities.forEach(vuln => {
          const diseaseName = lang === 'id' ? vuln.disease_name_id : vuln.disease_name_en;
          
          // Logika Reaksi Dinamis 1: Kerentanan diaktifkan oleh Toksisitas Kimia (Nitrate)
          if (latest.nitrate != null && latest.nitrate >= 25 && vuln.susceptibility_score === 5) {
            highRiskDiseaseTriggered = true;
            rootCauses.push({
              title: lang === 'id' ? `Kerentanan Kritis: ${diseaseName}` : `Critical Vulnerability: ${diseaseName}`, severity: "high",
              description: lang === 'id'
                ? `Akumulasi Nitrat (${latest.nitrate} ppm) mengaktifkan kerentanan spesifik ras ${fishName} terhadap infeksi ${diseaseName}.`
                : `Nitrate buildup (${latest.nitrate} ppm) catalyzes ${fishName}'s acute species-specific vulnerability to ${diseaseName}.`
            });
          }

          // Logika Reaksi Dinamis 2: Kerentanan diaktifkan oleh Ekstrem Suhu (Shock Termal)
          if (latest.temperature != null && f.temperature_min != null && latest.temperature < f.temperature_min) {
             highRiskDiseaseTriggered = true;
             rootCauses.push({
              title: lang === 'id' ? `Risiko Hipotermia & Penyakit: ${diseaseName}` : `Hypothermia & Disease Risk: ${diseaseName}`, severity: "high",
              description: lang === 'id'
                ? `Suhu jatuh di bawah toleransi minimal (${latest.temperature}°C). Depresi imun memicu risiko tinggi ${diseaseName} pada kawanan ${fishName}.`
                : `Temperature fell below minimum threshold (${latest.temperature}°C). Immune depression triggers high risk of ${diseaseName} for ${fishName}.`
            });
          }
        });
      });
    }

    const tankTurnoverRate = (aquarium.volume_liters > 0 && aquarium.filter_flow_lph) ? (aquarium.filter_flow_lph / aquarium.volume_liters) : 0;
    const isLidPresent = aquarium.lid_present === true;
    const jumpers: string[] = [];
    const highFlowDemands: string[] = [];

    groupedFishes.forEach((data) => {
      const fInfo = data.fishInfo;
      const fishName = lang === 'id' ? fInfo.name_id : fInfo.name_en;

      if (fInfo.schooling === true && fInfo.min_school_size != null && data.totalQty < fInfo.min_school_size) {
        rootCauses.push({
          title: lang === 'id' ? "Stres Sosial (Schooling Size Invalid)" : "Social Schooling Isolation Stress", severity: "medium",
          description: lang === 'id'
            ? `Jumlah ikan ${fishName} (${data.totalQty} ekor) kurang dari batas kawanan minimal (${fInfo.min_school_size} ekor). Mempercepat kepunahan koloni.`
            : `Colony size for ${fishName} (${data.totalQty}) is below natural schooling thresholds (${fInfo.min_school_size}). Drastically induces stress.`
        });
      }

      if (fInfo.jump_risk === true && !isLidPresent) jumpers.push(fishName);
      
      const oxygenScore = fInfo.oxygen_requirement_score || 5;
      const requiresCurrent = fInfo.current_preference?.toLowerCase() === "high";
      if ((oxygenScore >= 8 || requiresCurrent) && tankTurnoverRate < 4.0) {
        highFlowDemands.push(fishName);
      }
    });

    if (jumpers.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Ancaman Fatal Melompat Keluar" : "Critical Open-Top Jump Hazard", severity: "high",
        description: lang === 'id' ? `Akuarium tanpa tutup atas berisiko tinggi mematikan spesies pelompat: ${jumpers.join(", ")}.` : `Tank top lacks physical boundaries for high-risk jumping species: ${jumpers.join(", ")}.`
      });
      nextActions.push(lang === 'id' ? "Pasang penutup tangki rapat atau turunkan level air minimal 5 cm dari bibir kaca." : "Install a mesh or glass lid immediately, or drop water level 5 cm down.");
    }
  }

  // =======================================================
  // 2. MORFOLOGI FLORA & ESTETIKA DESAIN
  // =======================================================
  const currStyleStr = aquarium.aquascape_style?.toLowerCase() || "bebas";

  if (plants.length > 0) {
    const unsuitablePlants: string[] = [];
    const overgrownPlants: string[] = [];

    plants.forEach(p => {
      const pData = p.plant;
      if (!pData) return;
      const pName = lang === 'id' ? pData.name_id : (pData.name_en || pData.name_id);
      
      if (currStyleStr === "dutch" && (pData.epiphyte || pData.floating)) {
        unsuitablePlants.push(pName);
      } else if (currStyleStr === "iwagumi" && !pData.carpeting && pData.placement !== "Foreground") {
        unsuitablePlants.push(pName);
      }

      if (pData.growth_height_cm != null && aquarium.height_cm > 0 && pData.growth_height_cm > aquarium.height_cm) {
        overgrownPlants.push(pName);
      }
    });

    if (unsuitablePlants.length > 0) {
      rootCauses.push({
        title: lang === 'id' ? "Anomali Komposisi Kompetisi Flora" : "Layout Design Anomaly", severity: "low",
        description: lang === 'id' ? `Peletakan tanaman ${unsuitablePlants.join(", ")} menyalahi pakem baku aliran kontes ${aquarium.aquascape_style}.` : `The usage of ${unsuitablePlants.join(", ")} conflicts with classical layouts of ${aquarium.aquascape_style} style.`
      });
    }
  }

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

  // ==========================================
  // 3. LOGIKA DEDUPLIKASI & OVERRIDE RISK LEVEL
  // ==========================================
  if (health.deductions) {
    Object.entries(health.deductions).forEach(([key, value]) => {
      if (value > 0) explainabilityBreakdown.push(`${key}: -${Math.floor(value)} Poin`);
    });
  }

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

  const finalRootCauses = uniqueRootCauses.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]).slice(0, 8);

  let riskLevel: RiskLevel = "LOW";
  if (health.scores.overall < 85) riskLevel = "MEDIUM";
  if (health.scores.overall < 70) riskLevel = "HIGH";
  if (health.scores.overall < 50) riskLevel = "CRITICAL";

  if (highRiskDiseaseTriggered && riskLevel === "HIGH") {
    riskLevel = "CRITICAL";
  }

  if (latest?.ammonia != null && latest.ammonia >= 0.5) riskLevel = "CRITICAL";
  if (latest?.nitrite != null && latest.nitrite >= 0.5) riskLevel = "CRITICAL";

  let summary = "";
  if (riskLevel === "LOW") summary = lang === 'id' ? "Kondisi simulasi ekologi stabil. Parameter biologi beroperasi di titik kenyamanan tertinggi." : "Ecosystem simulation stable. All biological entities operating within ideal comfort loops.";
  else if (riskLevel === "MEDIUM") summary = lang === 'id' ? "Sistem seimbang, namun terdeteksi pembatasan ruang gerak atau stres sosial populasi." : "Balanced system, but social stress limits or population restrictions detected.";
  else if (riskLevel === "HIGH") summary = lang === 'id' ? "Peringatan Malfungsi Sistem: Faktor destruktif mengancam keselamatan populasi." : "System Alert: Highly destructive elements threatening current survival loops.";
  else summary = lang === 'id' ? "KEGAGALAN EKOSISTEM TOTAL: Terdeteksi ancaman patogen aktif atau keracunan parameter air parah!" : "TOTAL ECOSYSTEM FAILURE: Active high-vulnerability pathogens or chemical spikes detected!";

  if (nextActions.length === 0) nextActions.push(lang === 'id' ? "Pertahankan sirkulasi filter harian dan awasi tanda-tanda stres perilaku." : "Maintain baseline flow dynamics and observe behavioural mutations.");

  return { summary, riskLevel, rootCauses: finalRootCauses, recommendations, nextActions, generatedAt: new Date().toISOString(), explainabilityBreakdown, plantRecommendations };
}