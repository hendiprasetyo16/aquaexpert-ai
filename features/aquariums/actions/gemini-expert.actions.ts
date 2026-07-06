// features/aquariums/actions/gemini-expert.actions.ts
"use server";

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

    // 1. Eksekusi Mesin Kalkulasi Lokal (Akurasi Pasti 100%)
    const healthResult = analyzeAquariumHealth({ aquarium, parameters: paramsList, plants, fishes });
    const localDiagnosis = generateDeepDiagnosis({ aquarium, health: healthResult, parameters: paramsList, fishes, plants, lang });

    // Fallback Bawaan Jika Semua AI Mati
    let expertCommentary = lang === 'id' 
      ? "Catatan pakar generatif sementara tidak tersedia. Silakan ikuti rencana eksekusi dan aksi tindakan dari sistem kontrol mekanis lokal di bawah."
      : "Generative expert commentary is temporarily unavailable. Please follow the local systemic action plans below.";
    
    let generatedByAI = false;
    let aiSuccess = false;

    if (localDiagnosis.rootCauses.length > 0) {
      
      const issuesSummary = localDiagnosis.rootCauses.map(c => `- ${c.title}: ${c.description}`).join("\n");
      const actionsSummary = localDiagnosis.nextActions.map(a => `[${a.priority.toUpperCase()}] ${a.instruction}`).join("\n");
      
      const systemPrompt = `You are a world-class professional aquascaper and aquatic veterinarian expert. 
Your job is to write an empathetic, deeply educational, and scientifically solid commentary for the aquarist based on this raw data.
Strictly adhere to these rules:
1. Write exactly 2 paragraphs.
2. Explain the biological consequence of the issues.
3. Output your response entirely in the requested language: ${lang === 'id' ? 'Indonesian' : 'English'}.`;
      
      const userPrompt = `Aquarium Name: ${aquarium.name}
Style: ${aquarium.aquascape_style}
Volume: ${aquarium.volume_liters} Liters
Score: ${healthResult.scores.overall}/100
Status: ${localDiagnosis.riskLevel}

Root Causes:
${issuesSummary}

Actions:
${actionsSummary}`;

      const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
      const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

      // =====================================================================
      // MESIN 1: GEMINI 2.5 FLASH (PRIORITAS UTAMA KARENA SUPER CERDAS)
      // =====================================================================
      if (GEMINI_KEY && !aiSuccess) {
        try {
          console.log("\n🤖 [AI ENGINE] Mencoba Mesin 1: GOOGLE GEMINI 2.5 Flash...");
          
          // Struktur pesan anti-gagal
          const geminiContents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood. I will provide the analysis strictly following your rules." }] },
            { role: "user", parts: [{ text: userPrompt }] }
          ];

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
          
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: geminiContents }),
            cache: "no-store"
          });

          if (geminiRes.ok) {
            const result = await geminiRes.json();
            if (result.candidates && result.candidates.length > 0) {
              expertCommentary = result.candidates[0].content.parts[0].text.trim();
              generatedByAI = true;
              aiSuccess = true;
              console.log("✅ [GEMINI SUCCESS] Analisis Gemini berhasil!");
            }
          } else {
             console.warn(`Gemini sibuk (Status: ${geminiRes.status}), beralih ke Groq...`);
          }
        } catch (err: unknown) {
          console.warn("⚠️ [GEMINI GAGAL] Mengalihkan ke mesin cadangan Groq...", err instanceof Error ? err.message : String(err));
        }
      }

      // =====================================================================
      // MESIN 2: GROQ (CADANGAN JIKA GEMINI GAGAL/LIMIT - MENGGUNAKAN LLAMA 3.3)
      // =====================================================================
      if (GROQ_KEY && !aiSuccess) {
        try {
          console.log("\n🚀 [AI ENGINE] Mencoba Mesin 2: GROQ (Llama 3.3 70B)...");
          
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${GROQ_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.6,
              max_tokens: 1500
            }),
            cache: "no-store" 
          });

          if (groqRes.ok) {
            const aiResult = await groqRes.json();
            if (aiResult.choices && aiResult.choices[0]?.message?.content) {
              expertCommentary = aiResult.choices[0].message.content.trim();
              generatedByAI = true;
              aiSuccess = true;
              console.log("✅ [GROQ SUCCESS] Analisis Groq berhasil!");
            }
          } else {
            console.error("❌ [GROQ GAGAL] API Groq mengembalikan status:", groqRes.status);
          }
        } catch (err: unknown) {
          console.error("❌ [GROQ GAGAL] Kedua mesin AI tumbang. Menggunakan fallback lokal.", err instanceof Error ? err.message : String(err));
        }
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