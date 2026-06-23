// features/diseases/actions/medication-engine.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import { getTankInventoryAction } from "@/features/aquariums/actions/inventory.actions";
import { logger } from "@/lib/logger";
import type { 
  MedicationEngineResponse, 
  DbDiseaseMedication, 
  DbFaunaSafetyRule, 
  DbEnvironmentRule,
  DbMedicationInteraction,
  DbAquariumTreatment,
  SafetyAlert, 
  MedicationRecommendation,
  TypedTankFish,
  TypedWaterParameters,
  WaterParameterKey,
  DbMedication
} from "../types/medication.types";

interface Payload {
  aquariumId: string;
  diseaseId: string;
  lang?: "id" | "en";
}

// Tipe ekstensi lokal agar kita tidak menyentuh any, dan TypeScript mengenal field opsional
type ExtendedMedication = DbMedication & { reuse_interval_days?: number };

// ============================================================================
// HELPER FUNCTIONS (Strict Type Parsers & Evaluators)
// ============================================================================

function isValidParameterKey(key: string): key is WaterParameterKey {
  return ["ph", "temperature", "ammonia", "nitrite", "nitrate"].includes(key.toLowerCase());
}

function evaluateEnvironmentRule(currentValue: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '<': return currentValue < threshold;
    case '>': return currentValue > threshold;
    case '<=': return currentValue <= threshold;
    case '>=': return currentValue >= threshold;
    case '==': return currentValue === threshold;
    default: return false;
  }
}

// Type Guard Parser yang sangat ketat untuk meloloskan Strict TypeScript
function parseInventoryFishes(rawFishes: unknown[]): TypedTankFish[] {
  if (!Array.isArray(rawFishes)) return [];
  
  return rawFishes.map(item => {
    // Pastikan item adalah objek yang valid sebelum mengakses propertinya
    if (typeof item !== "object" || item === null) {
      return { fish_id: "", fish: null };
    }
    
    const record = item as Record<string, unknown>;
    let fishObj: TypedTankFish["fish"] = null;
    
    if (typeof record.fish === "object" && record.fish !== null) {
      const f = record.fish as Record<string, unknown>;
      fishObj = {
        name_id: String(f.name_id || ""),
        name_en: String(f.name_en || ""),
        fauna_group: f.fauna_group ? String(f.fauna_group) : null
      };
    }
    
    return {
      fish_id: String(record.fish_id || ""),
      fish: fishObj
    };
  });
}

export async function getMedicationRecommendationAction({
  aquariumId,
  diseaseId,
  lang = "id"
}: Payload): Promise<MedicationEngineResponse> {
  try {
    const supabase = await createClient();

    // 1. Validasi Akses (Anti-IDOR)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, netVolumeLiters: 0, recommendations: [], error: lang === "id" ? "Sesi berakhir." : "Session expired." };
    }
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    // 2. Kalkulasi Net Volume
    const { data: aquarium, error: errAq } = await supabase
      .from("my_aquariums")
      .select("volume_liters, net_water_volume_liters")
      .eq("id", aquariumId)
      .maybeSingle();

    if (errAq || !aquarium) throw new Error("Gagal memuat spesifikasi akuarium.");
    
    const grossVolume = aquarium.volume_liters;
    const netVolume = aquarium.net_water_volume_liters 
      ? aquarium.net_water_volume_liters 
      : parseFloat((grossVolume * 0.9).toFixed(2));

    // 3. Tarik Inventaris Fauna & Parameter Air Terakhir
    const inventory = await getTankInventoryAction(aquariumId);
    const activeFishesInTank = inventory.success && inventory.fishes ? parseInventoryFishes(inventory.fishes) : [];

    const { data: latestParamsRaw } = await supabase
      .from("aquarium_parameters")
      .select("ph, temperature, ammonia, nitrite, nitrate")
      .eq("aquarium_id", aquariumId)
      .eq("is_deleted", false)
      .order("record_date", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    const latestParams = latestParamsRaw as TypedWaterParameters | null;

    // 4. Tarik Relasi Penyakit - Obat
    const { data: rawDiseaseMeds, error: errMeds } = await supabase
      .from("disease_medications")
      .select(`
        priority,
        medication:medications (
          id, name, active_ingredient, description_id, description_en, base_dosage_per_100l, dosage_unit, treatment_duration_days, reuse_interval_days
        )
      `)
      .eq("disease_id", diseaseId);

    if (errMeds || !rawDiseaseMeds) throw new Error("Gagal memuat relasi data obat patogen.");
    const diseaseMedications = rawDiseaseMeds as unknown as DbDiseaseMedication[];
    
    if (diseaseMedications.length === 0) {
      return { success: true, netVolumeLiters: netVolume, recommendations: [] };
    }

    // 5. Dynamic History Window: Kalkulasi batas waktu lihat ke belakang (lookback)
    let maxLookbackDays = 30; // Default minimum
    diseaseMedications.forEach(dm => {
      const med = dm.medication as unknown as ExtendedMedication;
      if (med.reuse_interval_days && med.reuse_interval_days > maxLookbackDays) {
        maxLookbackDays = med.reuse_interval_days;
      }
    });

    const dynamicDaysAgo = new Date();
    dynamicDaysAgo.setDate(dynamicDaysAgo.getDate() - maxLookbackDays);

    // Tarik Riwayat Pengobatan dengan Type-Safe Mapper
    const { data: recentTreatmentsRaw } = await supabase
      .from("aquarium_treatments")
      .select("id, medication_id, started_at, status, medication:medications(name)")
      .eq("aquarium_id", aquariumId)
      .gte("started_at", dynamicDaysAgo.toISOString())
      .order("started_at", { ascending: false });
    
    const recentTreatments: DbAquariumTreatment[] = (recentTreatmentsRaw || []).map((t: any) => ({
      medication_id: t.medication_id,
      started_at: t.started_at,
      status: t.status,
      // FIX Supabase Join Array: Ambil elemen pertama jika Array, atau langsung ambil propertinya jika Objek
      medication: {
        name: Array.isArray(t.medication) ? t.medication[0]?.name : t.medication?.name || "Unknown Medication"
      }
    }));

    // 6. Agregasi Aturan & Pencegahan N+1 Query
    const medicationIds = diseaseMedications.map(m => m.medication.id);

    // FIX: Membelah kueri OR interaksi menjadi dua kueri IN yang terpisah dan aman
    const [faunaRulesRes, envRulesRes, interactionRes1, interactionRes2] = await Promise.all([
      supabase.from("medication_fauna_safety").select("*").in("medication_id", medicationIds),
      supabase.from("medication_environment_rules").select("*").in("medication_id", medicationIds),
      supabase.from("medication_interactions").select("*").in("medication_id", medicationIds),
      supabase.from("medication_interactions").select("*").in("interacting_medication_id", medicationIds)
    ]);

    const faunaRules = (faunaRulesRes.data || []) as DbFaunaSafetyRule[];
    const envRules = (envRulesRes.data || []) as DbEnvironmentRule[];
    
    // Gabung dan hapus duplikasi interaksi berdasarkan ID
    const mergedInteractions = [...(interactionRes1.data || []), ...(interactionRes2.data || [])];
    const uniqueInteractionMap = new Map<string, DbMedicationInteraction>();
    mergedInteractions.forEach(ir => uniqueInteractionMap.set(ir.id, ir));
    const interactionRules = Array.from(uniqueInteractionMap.values());

    // 7. O(1) LOOKUP MAPS
    const faunaRulesMap = new Map<string, DbFaunaSafetyRule[]>();
    faunaRules.forEach(r => {
      if (!faunaRulesMap.has(r.medication_id)) faunaRulesMap.set(r.medication_id, []);
      faunaRulesMap.get(r.medication_id)!.push(r);
    });

    const envRulesMap = new Map<string, DbEnvironmentRule[]>();
    envRules.forEach(r => {
      if (!envRulesMap.has(r.medication_id)) envRulesMap.set(r.medication_id, []);
      envRulesMap.get(r.medication_id)!.push(r);
    });

    const interactionMap = new Map<string, DbMedicationInteraction>();
    interactionRules.forEach(ir => {
      interactionMap.set(`${ir.medication_id}|${ir.interacting_medication_id}`, ir);
      interactionMap.set(`${ir.interacting_medication_id}|${ir.medication_id}`, ir);
    });

    const compiledRecommendations: MedicationRecommendation[] = [];

    // 8. Core Engine: Evaluasi Dosis, Fauna, Lingkungan, Histori & Interaksi
    for (const record of diseaseMedications) {
      // Cast yang aman dengan Type Intersection
      const med = record.medication as unknown as ExtendedMedication; 
      const calculatedDosage = parseFloat(((netVolume / 100) * med.base_dosage_per_100l).toFixed(2));
      
      const currentMedAlerts: SafetyAlert[] = [];
      let isSafeToUse = true;

      // A. Pengecekan Keselamatan Fauna O(1) Lookup
      const medFaunaRules = faunaRulesMap.get(med.id) || [];
      for (const tankFish of activeFishesInTank) {
        const fishGroupId = tankFish.fish?.fauna_group; 
        const matchingRule = medFaunaRules.find(r => 
          (r.fish_id && r.fish_id === tankFish.fish_id) || 
          (r.fauna_group && fishGroupId && r.fauna_group === fishGroupId)
        );
        
        if (matchingRule && !matchingRule.is_safe) {
          isSafeToUse = false;
          const fishName = lang === 'id' ? tankFish.fish?.name_id || "Spesies Fauna" : tankFish.fish?.name_en || "Fauna Species";
          currentMedAlerts.push({
            type: "FAUNA",
            target: `Fauna: ${fishName}`,
            isSafe: false,
            reason: lang === 'id' ? matchingRule.note_id : matchingRule.note_en
          });
        }
      }

      // B. Pengecekan Lingkungan Air O(1) Lookup
      const medEnvRules = envRulesMap.get(med.id) || [];
      if (latestParams) {
        for (const envRule of medEnvRules) {
          const paramKey = envRule.parameter.toLowerCase();
          
          if (isValidParameterKey(paramKey)) {
            const currentValue = latestParams[paramKey];
            if (currentValue !== undefined && currentValue !== null) {
              const isTriggered = evaluateEnvironmentRule(currentValue, envRule.operator, envRule.threshold);
              if (isTriggered) {
                isSafeToUse = false;
                currentMedAlerts.push({
                  type: "ENVIRONMENT",
                  target: `Parameter: ${envRule.parameter.toUpperCase()} (${currentValue})`,
                  isSafe: false,
                  reason: lang === 'id' ? envRule.note_id : envRule.note_en
                });
              }
            }
          }
        }
      }

      // C. Pengecekan Riwayat Pengobatan & Interaksi Obat
      const reuseIntervalDays = med.reuse_interval_days || 7; 
      const reuseIntervalMs = reuseIntervalDays * 24 * 60 * 60 * 1000;

      for (const treatment of recentTreatments) {
        const msSinceTreatment = Date.now() - new Date(treatment.started_at).getTime();

        // C.1. Peringatan Histori Dinamis
        if (treatment.medication_id === med.id && msSinceTreatment < reuseIntervalMs) {
          isSafeToUse = false;
          const remainingDays = Math.ceil((reuseIntervalMs - msSinceTreatment) / (1000 * 60 * 60 * 24));
          currentMedAlerts.push({
            type: "HISTORY",
            target: `History: ${med.name}`,
            isSafe: false,
            reason: lang === 'id' 
              ? `Obat ini baru saja digunakan. Berikan jeda ${remainingDays} hari lagi atau lakukan Water Change minimal 50% sebelum re-dosis.`
              : `Recently used. Wait ${remainingDays} more days or perform a 50% Water Change before re-dosing.`
          });
          continue; 
        }

        // C.2. Peringatan Interaksi O(1) Lookup Simetris
        const interaction = interactionMap.get(`${med.id}|${treatment.medication_id}`);
        if (interaction && msSinceTreatment < (7 * 24 * 60 * 60 * 1000)) { 
          isSafeToUse = false;
          currentMedAlerts.push({
            type: "INTERACTION",
            target: `Interaction: ${treatment.medication.name}`,
            isSafe: false,
            reason: lang === 'id' 
              ? `Berbahaya mencampur ${med.name} dengan ${treatment.medication.name} yang baru saja digunakan. ${interaction.note_id}`
              : `Dangerous to mix ${med.name} with recently used ${treatment.medication.name}. ${interaction.note_en}`
          });
        }
      }

      compiledRecommendations.push({
        medicationId: med.id,
        name: med.name,
        activeIngredient: med.active_ingredient,
        priority: record.priority,
        description: lang === 'id' ? med.description_id : med.description_en,
        calculatedDosage,
        dosageUnit: med.dosage_unit,
        durationDays: med.treatment_duration_days,
        safetyAlerts: currentMedAlerts,
        isSafeToUse
      });
    }

    // 9. Sorting Prioritas yang Handal
    const priorityWeight: Record<"Primary" | "Alternative", number> = { Primary: 0, Alternative: 1 };
    compiledRecommendations.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

    return {
      success: true,
      netVolumeLiters: netVolume,
      recommendations: compiledRecommendations
    };

  } catch (error: unknown) {
    logger.error("[MEDICATION ENGINE FATAL]", error);
    return {
      success: false,
      netVolumeLiters: 0,
      recommendations: [],
      error: error instanceof Error ? error.message : "Internal system failure."
    };
  }
}