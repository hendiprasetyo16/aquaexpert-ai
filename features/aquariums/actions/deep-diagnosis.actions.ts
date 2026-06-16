// features/aquariums/actions/deep-diagnosis.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getParametersAction } from "./parameter.actions";
import { getTankInventoryAction } from "./inventory.actions";
import { getMaintenanceDashboardAction } from "./maintenance.actions";
import { analyzeAquariumHealth } from "../utils/health-engine";
import { generateDeepDiagnosis } from "../utils/deep-diagnosis";
import { AquariumParameterLog } from "../types/parameter.types";
import { TankFish, TankPlant } from "../types/inventory.types";

export async function getDeepDiagnosisAction(aquariumId: string, lang: "id" | "en") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: aquarium, error: aqError } = await supabase
      .from("my_aquariums")
      .select("*")
      .eq("id", aquariumId)
      .single();

    if (aqError || !aquarium) throw new Error("Aquarium tidak ditemukan.");

    const [paramRes, invRes, maintRes] = await Promise.all([
      getParametersAction(aquariumId),
      getTankInventoryAction(aquariumId),
      getMaintenanceDashboardAction(aquariumId)
    ]);

    const parameters = paramRes.success ? (paramRes.data as AquariumParameterLog[]) : [];
    const plants = invRes.success ? (invRes.plants as TankPlant[]) : [];
    const fishes = invRes.success ? (invRes.fishes as TankFish[]) : [];
    const maintenanceStatus = maintRes.success ? maintRes.tasksStatus : [];

    const health = analyzeAquariumHealth({
      aquarium,
      parameters,
      plants,
      fishes,
      maintenanceStatus
    });

    // Panggil Local Rule-Based Engine (Super cepat, 0 Latency, 0 Rupiah)
    const diagnosis = generateDeepDiagnosis({
      aquarium,
      health,
      parameters,
      fishes,
      plants,
      lang
    });

    return { success: true, health, diagnosis };

  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan." };
  }
}