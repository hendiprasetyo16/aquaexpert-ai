// features/fishes/services/fish-expert.service.ts
import { Fish } from "../types/fish.types";
import { RawEvaluation, processExpertResults, ConfidenceKey } from "@/lib/expert-engine";

export interface ExistingFishRecord {
  fish: Fish;
  quantity: number;
}

export interface UserFishAnswers {
  experience: "Pemula" | "Menengah" | "Mahir" | string;
  tankVolumeLiters: number;
  tankLengthCm: number; 
  currentPH: number;
  currentTemp: number;
  currentGH?: number; 
  wantSchoolingFish: boolean;
  fishTypePref: string;
  hasShrimp: boolean; 
  hasPlants: boolean; 
  aquascapeStyle: string; 
  existingFishes: ExistingFishRecord[]; 
}

export interface RecommendedFish extends Fish {
  matchScore: number;
  matchReasons: string[];
  matchConfidenceKey: ConfidenceKey;
}

export interface FishExpertDictionary {
  reasonTankSizeOK?: string;
  reasonTankSizeBad?: string;
  reasonPHMatch?: string;
  reasonPHMismatch?: string;
  reasonTempMatch?: string;
  reasonTempMismatch?: string;
  reasonSchooling?: string;
  reasonBeginnerFriendly?: string;
  reasonExpertOnly?: string;
  reasonCompatibility?: string;
}

export function generateFishRecommendations(
  allFishes: Fish[], 
  answers: UserFishAnswers, 
  dictInput: FishExpertDictionary,
  lang: "id" | "en" = "id"
): RecommendedFish[] {
  const rawEvaluations: RawEvaluation<Fish>[] = [];

  // ==========================================
  // HARDCODE BILINGUAL FALLBACKS MUTLAK
  // ==========================================
  const dictEE = {
    reasonTankSizeOK: lang === 'en' ? "Your tank volume is perfectly spacious for this species." : "Volume tangki Anda sangat leluasa untuk spesies ini.",
    reasonTankSizeBad: lang === 'en' ? "Tank is too narrow, risking stunting the fish's growth." : "Tangki terlalu sempit, berisiko mengerdilkan ikan (stunting).",
    reasonPHMatch: lang === 'en' ? "Your water pH falls within the ideal range for this species." : "Kondisi pH air Anda masuk dalam rentang ideal spesies ini.",
    reasonPHMismatch: lang === 'en' ? "Current water pH risks causing stress or illness to the fish." : "pH air saat ini berisiko membuat ikan stres atau sakit.",
    reasonTempMatch: lang === 'en' ? "Perfect water temperature for this fish's metabolism." : "Suhu air sempurna untuk metabolisme ikan ini.",
    reasonTempMismatch: lang === 'en' ? "Temperature mismatch, may weaken the fish's immune system." : "Suhu tidak sesuai, dapat melemahkan imun ikan.",
    reasonSchooling: lang === 'en' ? "Perfect for swimming in groups" : "Cocok untuk berenang bergerombol",
    reasonBeginnerFriendly: lang === 'en' ? "Very disease-resistant and easy for beginners to keep." : "Sangat kebal penyakit dan mudah dipelihara pemula.",
    reasonExpertOnly: lang === 'en' ? "Requires highly stable water quality (For experts only)." : "Membutuhkan kualitas air yang super stabil (Hanya untuk ahli).",
    reasonCompatibility: lang === 'en' ? "Its behavior matches your planned tank ecosystem." : "Sifatnya cocok dengan rencana ekosistem tangki Anda.",
    
    // V4 SPECIFIC REASONS
    reasonGHMatch: lang === 'en' ? "Water hardness (GH) is ideal for this species." : "Tingkat kekerasan air (GH) sudah sesuai habitat aslinya.",
    reasonGHMismatch: lang === 'en' ? "Water hardness (GH) is not optimal." : "Kekerasan air (GH) kurang sesuai untuk spesies ini.",
    reasonBioloadBad: lang === 'en' ? "Your tank's filtration capacity has reached its limit (overstocked)." : "Kapasitas filtrasi tangki Anda sudah mencapai batas (overstock).",
    reasonNotPlantSafe: lang === 'en' ? "DANGER: Risks eating and destroying your aquascape plants." : "BERBAHAYA: Berisiko memakan dan merusak tanaman aquascape Anda.",
    reasonStyleMatch: lang === 'en' ? `Aesthetically and biologically perfect for ${answers.aquascapeStyle} style.` : `Sangat sesuai secara estetika & biologis untuk akuarium tema ${answers.aquascapeStyle}.`,
    reasonActivityNeedsSpace: lang === 'en' ? "This hyperactive fish needs a tank length of at least 80cm to sprint." : "Ikan hiperaktif ini membutuhkan panjang akuarium minimal 80cm agar bisa bermanuver lari.",
    reasonLayerBalance: lang === 'en' ? "Perfect for filling the empty swimming layer in your aquarium." : "Sempurna untuk mengisi area/zona renang yang masih kosong di akuarium Anda.",
    reasonLayerCrowded: lang === 'en' ? "The swimming layer (Water Layer) for this fish is already quite crowded." : "Area renang (Water Layer) yang biasa dihuni ikan ini sudah cukup padat.",
    reasonPredatorRisk: lang === 'en' ? "PREDATOR DANGER: This fish's mouth size poses a risk of eating your existing tank inhabitants." : "BAHAYA PREDATOR: Mulut ikan ini berisiko memangsa penghuni lama tangki Anda.",
    reasonPreyRisk: lang === 'en' ? "PREY DANGER: This fish risks being eaten alive by existing larger/predatory fish." : "BAHAYA DIMANGSA: Ikan ini berisiko dimakan hidup-hidup oleh ikan besar/predator yang sudah ada.",
    reasonFinNipperRisk: lang === 'en' ? "DANGER: High risk of fin-nipping conflicts with your existing fish." : "BAHAYA: Ada risiko saling gigit sirip (Fin-nipping) dengan ikan lama Anda."
  };

  const layerBioload: Record<string, number> = { "Top": 0, "Middle": 0, "Bottom": 0, "All Levels": 0 };
  let currentTotalBioload = 0;

  answers.existingFishes.forEach(record => {
    const size = record.fish.estimated_adult_size_cm || 5;
    const factor = record.fish.bioload_factor || 1;
    const load = size * factor * record.quantity;
    const layer = record.fish.water_layer || "Middle";
    
    if (layerBioload[layer] !== undefined) layerBioload[layer] += load;
    currentTotalBioload += load;
  });

  for (const fish of allFishes) {
    let score = 0;
    let reasons: string[] = [];
    let isFatal = false; 

    if (answers.existingFishes.some(ef => ef.fish.id === fish.id)) {
      continue;
    }

    const candidateSize = fish.estimated_adult_size_cm || 5;
    const candidateTempScore = fish.temperament_score || 2;
    const candidateMouthSize = fish.mouth_size_factor || 1; 

    // TAHAP A: V4 EXISTING FISH COMPATIBILITY (HUKUM RIMBA)
    for (const record of answers.existingFishes) {
      const existingSize = record.fish.estimated_adult_size_cm || 5;
      const existingTempScore = record.fish.temperament_score || 2;
      const existingMouthSize = record.fish.mouth_size_factor || 1;

      const candidateEatingCapacity = (candidateSize * candidateMouthSize) / 2.5; 
      if (candidateTempScore >= 3 && candidateEatingCapacity > existingSize) {
        isFatal = true;
        break;
      }

      const existingEatingCapacity = (existingSize * existingMouthSize) / 2.5;
      if (existingTempScore >= 3 && existingEatingCapacity > candidateSize) {
        isFatal = true;
        break;
      }

      if ((fish.fish_type === "Betta" || fish.fish_type === "Cichlid") && record.fish.fish_type === "Barb") {
        score -= 40;
        reasons.push(dictEE.reasonFinNipperRisk);
      } else if ((record.fish.fish_type === "Betta" || record.fish.fish_type === "Cichlid") && fish.fish_type === "Barb") {
        score -= 40;
        reasons.push(dictEE.reasonFinNipperRisk);
      }
    }

    // TAHAP B: HARD FILTERS
    if (answers.hasShrimp && fish.shrimp_safe === false) isFatal = true;

    if (answers.hasPlants && fish.plant_safe === false) {
      if (answers.aquascapeStyle === "Dutch" || answers.aquascapeStyle === "Nature") isFatal = true;
      else {
        score -= 60;
        reasons.push(dictEE.reasonNotPlantSafe);
      }
    }

    if (answers.fishTypePref === "Community Tank" && candidateTempScore >= 4) isFatal = true; 

    if (isFatal) continue; 

    // TAHAP C: V4 WATER LAYER & BIOLOAD
    if (fish.min_tank_size && answers.tankVolumeLiters < fish.min_tank_size) {
      const deficit = fish.min_tank_size - answers.tankVolumeLiters;
      score -= Math.min(50, deficit * 0.8);
      reasons.push(dictEE.reasonTankSizeBad);
    } else if (fish.min_tank_size && answers.tankVolumeLiters >= fish.min_tank_size * 2) {
      score += 15; 
      reasons.push(dictEE.reasonTankSizeOK);
    }

    const candidateGroupSize = fish.schooling ? (fish.min_group_size || 6) : 1;
    const candidateLoad = candidateSize * (fish.bioload_factor || 1) * candidateGroupSize;
    const projectedTotalBioload = currentTotalBioload + candidateLoad;

    if (answers.tankVolumeLiters < projectedTotalBioload) {
       const bioloadDeficit = projectedTotalBioload - answers.tankVolumeLiters;
       score -= Math.min(60, bioloadDeficit * 0.5);
       reasons.push(dictEE.reasonBioloadBad);
    }

    const layer = fish.water_layer || "Middle";
    if (layer !== "All Levels") {
      const layerCapacityMax = answers.tankVolumeLiters * 0.4; 
      if (layerBioload[layer] >= layerCapacityMax) {
        score -= 20; 
        reasons.push(dictEE.reasonLayerCrowded);
      } else if (layerBioload[layer] === 0) {
        score += 20; 
        reasons.push(dictEE.reasonLayerBalance);
      } else {
        score += 5; 
      }
    }

    if (fish.activity_level === "High" && answers.tankLengthCm < (fish.minimum_tank_length_cm || 80)) {
      score -= 25; 
      reasons.push(dictEE.reasonActivityNeedsSpace);
    }

    if (answers.aquascapeStyle !== "Bebas" && fish.recommended_tank_styles?.includes(answers.aquascapeStyle)) {
      score += 15;
      reasons.push(dictEE.reasonStyleMatch);
    }

    // TAHAP D: PARAMETER AIR (pH, Temp, GH)
    if (fish.ideal_ph_min && fish.ideal_ph_max) {
      if (answers.currentPH >= fish.ideal_ph_min && answers.currentPH <= fish.ideal_ph_max) {
        score += 15;
        reasons.push(dictEE.reasonPHMatch);
      } else {
        const phDiff = Math.min(Math.abs(answers.currentPH - fish.ideal_ph_min), Math.abs(answers.currentPH - fish.ideal_ph_max));
        if (phDiff > 1.5) score -= 40; else score -= (phDiff * 10); 
        reasons.push(dictEE.reasonPHMismatch);
      }
    }

    if (fish.ideal_temp_min && fish.ideal_temp_max) {
      if (answers.currentTemp >= fish.ideal_temp_min && answers.currentTemp <= fish.ideal_temp_max) {
        score += 15;
        reasons.push(dictEE.reasonTempMatch);
      } else {
        const tempDiff = Math.min(Math.abs(answers.currentTemp - fish.ideal_temp_min), Math.abs(answers.currentTemp - fish.ideal_temp_max));
        score -= (tempDiff * 5);
        reasons.push(dictEE.reasonTempMismatch);
      }
    }

    if (fish.hardness_min && fish.hardness_max && answers.currentGH) {
      if (answers.currentGH >= fish.hardness_min && answers.currentGH <= fish.hardness_max) {
        score += 10;
        reasons.push(dictEE.reasonGHMatch);
      } else {
        score -= 15;
        reasons.push(dictEE.reasonGHMismatch);
      }
    }

    // TAHAP E: PENGALAMAN & KELOMPOK
    if (answers.experience === "Pemula") {
      if (fish.difficulty === "Easy") { score += 20; reasons.push(dictEE.reasonBeginnerFriendly); } 
      else if (fish.difficulty === "Hard") { score -= 40; }
    } else if (answers.experience === "Mahir" && fish.difficulty === "Hard") {
      score += 15; reasons.push(dictEE.reasonExpertOnly);
    } 

    if (answers.wantSchoolingFish && fish.schooling) {
      score += 15; reasons.push(`${dictEE.reasonSchooling} (Min: ${fish.min_group_size || 6})`);
    } else if (!answers.wantSchoolingFish && fish.schooling) {
      score -= 15; 
    }

    if (answers.fishTypePref === "Community Tank") {
      if (candidateTempScore <= 2) { score += 15; reasons.push(dictEE.reasonCompatibility); } 
    } else if (answers.fishTypePref === "Semi-Aggressive") {
      if (candidateTempScore === 3 || candidateTempScore === 4) { score += 15; reasons.push(dictEE.reasonCompatibility); } 
      else if (candidateTempScore === 5) { score -= 30; }
    } else if (answers.fishTypePref === "Species Only") {
      if (candidateTempScore >= 4) { score += 15; reasons.push(dictEE.reasonCompatibility); }
    }

    if (score < 0) score = 0;
    rawEvaluations.push({ item: fish, rawScore: score, reasons });
  }

  const processedResults = processExpertResults(rawEvaluations, 25);

  return processedResults.map(result => ({
    ...result.item,
    matchScore: result.matchScore,
    matchReasons: result.matchReasons,
    matchConfidenceKey: result.matchConfidenceKey
  }));
}