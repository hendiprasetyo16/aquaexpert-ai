// features/aquariums/actions/gemini-expert.actions.ts
"use server";

import Groq from "groq-sdk"; // FIX: Kita panggil SDK Groq
import { generateDeepDiagnosis } from "../utils/deep-diagnosis";
import { analyzeAquariumHealth } from "../utils/health-engine";
import { getTankInventoryAction } from "./inventory.actions";
import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "../repositories/security.repository";

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

    const inventory = await getTankInventoryAction(aquariumId);
    if (!inventory.success) throw new Error(inventory.error || "Inventory synchronization failure.");

    const fishes = inventory.fishes || [];
    const plants = inventory.plants || [];
    const paramsList = parameters || [];

    const healthResult = analyzeAquariumHealth({ aquarium, parameters: paramsList, plants, fishes });
    const localDiagnosis = generateDeepDiagnosis({ aquarium, health: healthResult, parameters: paramsList, fishes, plants, lang });

    let expertCommentary = lang === 'id' 
      ? "Catatan pakar generatif sementara tidak tersedia. Silakan ikuti rencana eksekusi dan aksi tindakan dari sistem kontrol mekanis lokal di bawah."
      : "Generative expert commentary is temporarily unavailable. Please follow the local systemic action plans below.";
    
    let generatedByGemini = false;

    // FIX: Menggunakan GROQ_API_KEY sebagai nyawa utama AI sekarang
    if (process.env.GROQ_API_KEY && localDiagnosis.rootCauses.length > 0) {
      try {
        console.log("\n🚀 [GROQ START] Menghubungi mesin Groq Llama 3...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const issuesSummary = localDiagnosis.rootCauses.map(c => `- ${c.title}: ${c.description}`).join("\n");
        const actionsSummary = localDiagnosis.nextActions.map(a => `[${a.priority.toUpperCase()}] ${a.instruction}`).join("\n");
        
        const systemPrompt = `You are a world-class professional aquascaper and aquatic veterinarian expert. 
You will be provided with a raw technical diagnosis report from an aquarium ecosystem monitoring software. 
Your job is to write an empathetic, deeply educational, and scientifically solid commentary for the aquarist.
Strictly adhere to these rules:
1. Write exactly 2 paragraphs.
2. Do not repeat the raw numbers verbatim, instead explain the biological consequence of those issues.
3. Be supportive but firm about urgent threats like Ammonia or Biotope Mismatches.
4. Output your response entirely in the requested language: ${lang === 'id' ? 'Indonesian' : 'English'}.`;
        
        const userPrompt = `Aquarium Name: ${aquarium.name}
Style: ${aquarium.aquascape_style}
Volume: ${aquarium.volume_liters} Liters
Calculated Overall Ecosystem Score: ${healthResult.scores.overall}/100
Ecosystem Risk Level Status: ${localDiagnosis.riskLevel}

Detected Core Root Causes:
${issuesSummary}

Recommended Next Actions:
${actionsSummary}`;

        // Menggunakan model Llama-3.3 terbaru dari Meta via Groq (Sangat pintar bahasa Indonesia & Instan)
        const responsePromise = groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.6,
        });

        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Groq Gateway Timeout")), 15000));
        
        const aiResult = await Promise.race([responsePromise, timeoutPromise]);

        if (aiResult && aiResult.choices && aiResult.choices[0]?.message?.content) {
          expertCommentary = aiResult.choices[0].message.content.trim();
          generatedByGemini = true; // Flag ini tetap kita true-kan agar efek bintang berkilau di UI tetap menyala
          console.log("✅ [GROQ SUCCESS] Teks AI berhasil didapatkan!");
        }
      } catch (aiErr) {
        console.error("❌ [GROQ ERROR] Gagal menghubungi Groq:", aiErr);
      }
    }

    return { success: true, localDiagnosis, expertAIExtras: { commentary: expertCommentary, generatedByGemini } };
  } catch (error: unknown) {
    return { success: false, localDiagnosis: null, expertAIExtras: { commentary: "", generatedByGemini: false }, error: error instanceof Error ? error.message : "Fatal error inside Hybrid Layer" };
  }
}