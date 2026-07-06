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

    if (errAq || !aquarium) throw new Error("Aquarium core infrastructure data not found.");

    const { data: parameters, error: errParam } = await supabase
      .from("aquarium_parameters")
      .select("*")
      .eq("aquarium_id", aquariumId)
      .eq("is_deleted", false)
      .order("record_date", { ascending: false });

    if (errParam) throw new Error("Failed to retrieve parameter history.");

    const paramsList = parameters || [];

    // 💡 PERBAIKAN: Mencegah Crash jika Akuarium belum memiliki data parameter air sama sekali
    if (paramsList.length === 0) {
      throw new Error(
        lang === 'id' 
        ? "Belum ada data Tes Air. Silakan input Parameter Air (Suhu, pH, dll) minimal 1 kali di tab 'Parameter Air' sebelum memulai diagnosa."
        : "No Water Test data available. Please log Water Parameters at least once in the 'Water Parameters' tab first."
      );
    }

    const inventory = await getTankInventoryAction(aquariumId);
    if (!inventory.success) throw new Error(inventory.error || "Inventory synchronization failure.");

    const fishes = inventory.fishes || [];
    const plants = inventory.plants || [];

    // 1. Eksekusi Mesin Kalkulasi Lokal (Akurasi Pasti 100%)
    const healthResult = analyzeAquariumHealth({ aquarium, parameters: paramsList, plants, fishes });
    const localDiagnosis = generateDeepDiagnosis({ aquarium, health: healthResult, parameters: paramsList, fishes, plants, lang });

    // Fallback Bawaan Jika Semua AI Mati / Timeout
    let expertCommentary = lang === 'id' 
      ? "Sistem bio-analitik kami telah memetakan kondisi akuarium Anda secara komprehensif. Berdasarkan data parameter saat ini, terdapat beberapa indikator yang memerlukan penyesuaian untuk mencapai harmoni ekosistem yang ideal.\n\nSilakan ikuti 'Rencana Eksekusi' di bawah ini secara seksama untuk menstabilkan kualitas air dan memulihkan kesehatan biota Anda."
      : "Our bio-analytic system has comprehensively mapped your aquarium's condition. Based on current parameter data, several indicators require adjustment to achieve ideal ecosystem harmony.\n\nPlease follow the 'Action Plan' below carefully to stabilize water quality and restore livestock health.";
    
    let generatedByAI = false;

    if (localDiagnosis.rootCauses.length > 0) {
      const issuesSummary = localDiagnosis.rootCauses.map(c => `- ${c.title}: ${c.description}`).join("\n");
      const actionsSummary = localDiagnosis.nextActions.map(a => `[${a.priority.toUpperCase()}] ${a.instruction}`).join("\n");
      
      const diagnosisPrompt = `I need you to act as an expert aquatic veterinarian. 
Please write an empathetic, educational, and scientifically solid commentary based on the following aquarium data.
Strictly adhere to these rules:
1. Write exactly 2 short paragraphs.
2. Explain the biological consequence of the issues.
3. Output your response entirely in: ${lang === 'id' ? 'Indonesian' : 'English'}.

Aquarium Data:
Name: ${aquarium.name} (${aquarium.volume_liters}L, ${aquarium.aquascape_style})
Score: ${healthResult.scores.overall}/100
Status: ${localDiagnosis.riskLevel}

Issues:
${issuesSummary}

Actions:
${actionsSummary}`;

      try {
        // Waktu tunggu dimaksimalkan menjadi 15 Detik
        const timeoutPromise = new Promise<{error: string}>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 15000)
        );
        
        const aiCallPromise = askAquaExpert([{ role: "user", content: diagnosisPrompt }]);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aiResponse = await Promise.race([aiCallPromise, timeoutPromise]) as any;

        if (aiResponse && !aiResponse.error && aiResponse.reply) {
          expertCommentary = aiResponse.reply.trim();
          generatedByAI = true;
          console.log("✅ [DIAGNOSIS AI SUCCESS] Menggunakan Otak Utama ai.actions.ts");
        }
      } catch (err) {
        console.warn("⚠️ [DIAGNOSIS AI TIMEOUT] AI terlalu lama berpikir. Menggunakan teks fallback.");
      }
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