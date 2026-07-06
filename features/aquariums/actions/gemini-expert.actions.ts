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

    // 💡 PERBAIKAN: Teks Fallback Profesional tanpa menyebut 'Offline'
    let expertCommentary = lang === 'id' 
      ? "Sistem bio-analitik kami telah memetakan kondisi akuarium Anda secara komprehensif. Berdasarkan data parameter saat ini, terdapat beberapa indikator yang memerlukan penyesuaian untuk mencapai harmoni ekosistem yang ideal.\n\nSilakan ikuti 'Rencana Eksekusi' di bawah ini secara seksama untuk menstabilkan kualitas air dan memulihkan kesehatan biota Anda."
      : "Our bio-analytic system has comprehensively mapped your aquarium's condition. Based on current parameter data, several indicators require adjustment to achieve ideal ecosystem harmony.\n\nPlease follow the 'Action Plan' below carefully to stabilize water quality and restore livestock health.";
    
    let generatedByAI = false;
    let aiSuccess = false;

    if (localDiagnosis.rootCauses.length > 0) {
      
      const issuesSummary = localDiagnosis.rootCauses.map(c => `- ${c.title}: ${c.description}`).join("\n");
      const actionsSummary = localDiagnosis.nextActions.map(a => `[${a.priority.toUpperCase()}] ${a.instruction}`).join("\n");
      
      const systemPrompt = `You are an expert aquascaper and aquatic veterinarian. 
Write an empathetic, deeply educational, and scientifically solid commentary based on this data.
Strictly:
1. Max 2 short paragraphs.
2. Explain the biological consequence of the issues.
3. Output entirely in: ${lang === 'id' ? 'Indonesian' : 'English'}.`;
      
      const userPrompt = `Aquarium: ${aquarium.name} (${aquarium.volume_liters}L, ${aquarium.aquascape_style})
Score: ${healthResult.scores.overall}/100
Status: ${localDiagnosis.riskLevel}

Issues:
${issuesSummary}

Actions:
${actionsSummary}`;

      const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
      const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

      // =====================================================================
      // MESIN 1: GEMINI 2.5 FLASH (Prioritas Utama)
      // =====================================================================
      if (GEMINI_KEY && !aiSuccess) {
        try {
          const geminiContents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood." }] },
            { role: "user", parts: [{ text: userPrompt }] }
          ];

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
          
          // Pembatasan Waktu (Timeout 8 Detik)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); 

          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: geminiContents }),
            cache: "no-store",
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (geminiRes.ok) {
            const result = await geminiRes.json();
            if (result.candidates && result.candidates.length > 0) {
              expertCommentary = result.candidates[0].content.parts[0].text.trim();
              generatedByAI = true;
              aiSuccess = true;
            }
          }
        } catch (err: unknown) {
          console.warn("Gemini Timeout/Error, fallback to Groq...");
        }
      }

      // =====================================================================
      // MESIN 2: GROQ LLAMA 3.3 70B (Cadangan Cepat)
      // =====================================================================
      if (GROQ_KEY && !aiSuccess) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // Timeout 6 Detik

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
            cache: "no-store",
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (groqRes.ok) {
            const aiResult = await groqRes.json();
            if (aiResult.choices && aiResult.choices[0]?.message?.content) {
              expertCommentary = aiResult.choices[0].message.content.trim();
              generatedByAI = true;
              aiSuccess = true;
            }
          }
        } catch (err: unknown) {
          console.warn("Groq Timeout/Error, falling back to System default...");
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