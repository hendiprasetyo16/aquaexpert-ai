// features/aquariums/actions/gemini-expert.actions.ts
"use server";

import { generateDeepDiagnosis } from "../utils/deep-diagnosis";
import { analyzeAquariumHealth } from "../utils/health-engine";
import { getTankInventoryAction } from "./inventory.actions";
import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "../repositories/security.repository";
import { askAquaExpert } from "@/features/ai/actions/ai.actions"; 

export interface HybridDiagnosisResponse {
  success: boolean;
  localDiagnosis: ReturnType<typeof generateDeepDiagnosis> | null;
  expertAIExtras: {
    commentary: string;
    generatedByGemini: boolean; 
  };
  error?: string;
}

export async function getHybridDeepDiagnosisAction(aquariumId: string, lang: "id" | "en"): Promise<HybridDiagnosisResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, localDiagnosis: null, expertAIExtras: { commentary: "", generatedByGemini: false }, error: "Unauthorized" };

    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    const { data: aquarium, error: errAq } = await supabase
      .from("my_aquariums")
      .select("*")
      .eq("id", aquariumId)
      .maybeSingle();

    if (errAq || !aquarium) throw new Error("Aquarium data not found.");

    const { data: parameters, error: errParam } = await supabase
      .from("aquarium_parameters")
      .select("*")
      .eq("aquarium_id", aquariumId)
      .eq("is_deleted", false)
      .order("record_date", { ascending: false });

    if (errParam) throw new Error("Failed to retrieve parameters.");

    const paramsList = parameters || [];

    // 💡 CEGAH CRASH: Memastikan akuarium punya data air!
    if (paramsList.length === 0) {
      return { 
        success: false, 
        localDiagnosis: null, 
        expertAIExtras: { commentary: "", generatedByGemini: false }, 
        error: lang === 'id' ? "⚠️ Belum ada data Tes Air. Silakan log Parameter Air (Suhu, pH, dll) minimal 1 kali di tab 'Parameter Air' sebelum mendiagnosa." : "⚠️ No Water Test data available. Please log Water Parameters at least once before diagnosing." 
      };
    }

    const inventory = await getTankInventoryAction(aquariumId);
    if (!inventory.success) throw new Error(inventory.error || "Inventory sync failed.");

    const fishes = inventory.fishes || [];
    const plants = inventory.plants || [];

    // 1. Eksekusi Mesin Kalkulasi Lokal (Sangat Cepat & Akurat)
    const healthResult = analyzeAquariumHealth({ aquarium, parameters: paramsList, plants, fishes });
    const localDiagnosis = generateDeepDiagnosis({ aquarium, health: healthResult, parameters: paramsList, fishes, plants, lang });

    // Fallback Bawaan
    let expertCommentary = lang === 'id' 
      ? "Sistem bio-analitik lokal telah memetakan kondisi Anda. Silakan ikuti 'Rencana Eksekusi' di bawah ini untuk menstabilkan kualitas air."
      : "Local system has mapped your condition. Follow the 'Action Plan' below to stabilize water quality.";
    
    let generatedByAI = false;

    // 💡 PERBAIKAN: Prompt Dirampingkan agar tidak memberatkan server AI
    if (localDiagnosis.rootCauses.length > 0) {
      const issues = localDiagnosis.rootCauses.map(c => `- ${c.title}`).join("\n");
      
      const diagnosisPrompt = `Act as an expert aquascaper. Write an empathetic and scientifically solid commentary (2 short paragraphs) in ${lang === 'id' ? 'Indonesian' : 'English'} regarding this tank:
Tank: ${aquarium.volume_liters}L, Score: ${healthResult.scores.overall}/100, Status: ${localDiagnosis.riskLevel}
Issues detected:
${issues}

Explain the biological impact briefly.`;

      try {
        const aiResponse = await askAquaExpert([{ role: "user", content: diagnosisPrompt }]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = aiResponse as any;

        if (result && !result.error && result.reply) {
          expertCommentary = result.reply.trim();
          generatedByAI = true;
          console.log("✅ [DIAGNOSIS AI SUCCESS]");
        } else {
          console.warn("⚠️ AI returned an error or empty reply. Using fallback.");
        }
      } catch (err) {
        console.warn("⚠️ [DIAGNOSIS AI TIMEOUT] Menggunakan teks fallback.");
      }
    } else {
       // Jika tidak ada masalah (Akuarium Sempurna)
       expertCommentary = lang === 'id' ? "Luar biasa! Ekosistem Anda beroperasi dalam harmoni sempurna. Pertahankan rutinitas pemeliharaan Anda." : "Excellent! Your ecosystem operates in perfect harmony. Keep up the maintenance routine.";
       generatedByAI = true;
    }

    return { 
      success: true, 
      localDiagnosis, 
      expertAIExtras: { 
        commentary: expertCommentary, 
        generatedByGemini: generatedByAI 
      } 
    };
  } catch (error: unknown) {
    return { 
      success: false, 
      localDiagnosis: null, 
      expertAIExtras: { commentary: "", generatedByGemini: false }, 
      error: error instanceof Error ? error.message : "Fatal error inside Hybrid Layer" 
    };
  }
}