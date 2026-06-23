// features/aquariums/actions/gemini-expert.actions.ts
"use server";

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
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
    generatedByGemini: boolean; // Menandakan bahwa teks ini asli buatan AI (Groq atau Gemini)
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

      // =====================================================================
      // MESIN 1: GROQ (PRIORITAS UTAMA KARENA SUPER CEPAT)
      // =====================================================================
      if (process.env.GROQ_API_KEY && !aiSuccess) {
        try {
          console.log("\n🚀 [AI ENGINE] Mencoba Mesin 1: GROQ (Llama 3)...");
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
          
          const responsePromise = groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
          });

          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Groq Timeout")), 10000));
          const aiResult = await Promise.race([responsePromise, timeoutPromise]);

          if (aiResult && aiResult.choices && aiResult.choices[0]?.message?.content) {
            expertCommentary = aiResult.choices[0].message.content.trim();
            generatedByAI = true;
            aiSuccess = true;
            console.log("✅ [GROQ SUCCESS] Analisis Groq berhasil!");
          }
        } catch (err) {
          console.warn("⚠️ [GROQ GAGAL] Mengalihkan ke mesin cadangan Gemini...", err instanceof Error ? err.message : err);
        }
      }

      // =====================================================================
      // MESIN 2: GOOGLE GEMINI (CADANGAN JIKA GROQ GAGAL/LIMIT)
      // =====================================================================
      if (process.env.GEMINI_API_KEY && !aiSuccess) {
        try {
          console.log("\n🤖 [AI ENGINE] Mencoba Mesin 2: GOOGLE GEMINI...");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });

          const responsePromise = model.generateContent(userPrompt);
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gemini Timeout")), 15000));
          
          const result = await Promise.race([responsePromise, timeoutPromise]);
          
          if (result && result.response) {
            expertCommentary = result.response.text().trim();
            generatedByAI = true;
            aiSuccess = true;
            console.log("✅ [GEMINI SUCCESS] Analisis Gemini berhasil!");
          }
        } catch (err) {
          console.error("❌ [GEMINI GAGAL] Kedua mesin AI tumbang. Menggunakan fallback lokal.", err instanceof Error ? err.message : err);
        }
      }
    }

    return { 
      success: true, 
      localDiagnosis, 
      expertAIExtras: { 
        commentary: expertCommentary, 
        generatedByGemini: generatedByAI // Variabel ini tetap bernama generatedByGemini agar UI berkilau Bapak tetap bekerja
      } 
    };
  } catch (error: unknown) {
    return { success: false, localDiagnosis: null, expertAIExtras: { commentary: "", generatedByGemini: false }, error: error instanceof Error ? error.message : "Fatal error inside Hybrid Layer" };
  }
}