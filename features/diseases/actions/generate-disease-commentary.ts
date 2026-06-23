// features/diseases/actions/generate-disease-commentary.ts
"use server";

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import { logger } from "@/lib/logger";
import type { DiseaseMatchResult } from "../types/disease.types";
import type { HealthAnalysisResult } from "@/features/aquariums/utils/health-engine";

interface CommentaryPayload {
  aquariumId: string;
  diagnosisResults: DiseaseMatchResult[];
  waterHealthStatus: HealthAnalysisResult;
  lang?: "id" | "en";
}

// ============================================================================
// IN-MEMORY CACHE INFRASTRUCTURE & CONFIGURATION
// ============================================================================
const aiResponseCache = new Map<string, { commentary: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 Jam
const MAX_CACHE_SIZE = 500;

/**
 * Helper khusus untuk mengekstrak teks respons dari SDK Google Gen AI.
 * Mengisolasi casting 'any' di satu tempat untuk menjaga Type Safety berkas.
 */
function extractGeminiText(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  
  const geminiAny = response as any;
  if (typeof geminiAny.text === "function") {
    return geminiAny.text();
  }
  if (typeof geminiAny.text === "string") {
    return geminiAny.text;
  }
  
  return null;
}

export async function generateDiseaseCommentaryAction({
  aquariumId,
  diagnosisResults,
  waterHealthStatus,
  lang = "id"
}: CommentaryPayload): Promise<{ success: boolean; commentary?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Autentikasi Keamanan & IDOR Validation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        success: false, 
        error: lang === "id" ? "Sesi login berakhir. Silakan muat ulang halaman." : "Session expired. Please refresh the page." 
      };
    }
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    if (diagnosisResults.length === 0) {
      return { 
        success: true, 
        commentary: lang === "id" 
          ? "Tidak ada indikasi patogen aktif terdeteksi berdasarkan ceklis gejala saat ini." 
          : "No active pathogens detected based on current selected symptoms." 
      };
    }

    const primaryMatch = diagnosisResults[0];

    // 2. Token Saver & Confidence Score Threshold
    if (primaryMatch.confidenceScore < 35) {
      return {
        success: true,
        commentary: lang === "id"
          ? "Data gejala belum cukup komprehensif untuk diagnosis definitif. Sistem Pakar tidak dapat menyimpulkan penyakit dengan pasti. Tambahkan observasi gejala lain atau periksa parameter air dasar."
          : "Insufficient symptom data for a definitive diagnosis. The Expert System cannot conclude a specific disease. Please observe for more symptoms or check basic water parameters."
      };
    }

    // 3. DETERMINISTIC CACHE KEY GENERATION
    // FIX: Menyertakan daftar ID gejala yang terurut (sorted) agar cache unik terhadap kombinasi gejala fisik
    const cacheKey = JSON.stringify({
      aquariumId,
      lang,
      diseaseIds: diagnosisResults.map(d => d.disease.id).join(","),
      confidence: diagnosisResults.map(d => d.confidenceScore).join(","),
      selectedSymptoms: primaryMatch.matchedSymptoms.map(s => s.id).sort().join(","),
      waterQuality: waterHealthStatus.scores.waterQuality,
      bioload: waterHealthStatus.scores.bioload
    });

    const cachedData = aiResponseCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL_MS)) {
      logger.info("[DISEASE AI] ⚡ Cache Hit! Mengembalikan ulasan dari memori.");
      return { success: true, commentary: cachedData.commentary };
    }
    
    // 4. Differential Diagnosis Core Mapping
    const isDifferential = diagnosisResults.length > 1;
    const topMatchesText = diagnosisResults
      .slice(0, 3)
      .map((m, i) => {
        const dName = lang === 'id' ? m.disease.name_id : m.disease.name_en;
        const dSci = m.disease.scientific_name ? ` (${m.disease.scientific_name})` : "";
        return `${i + 1}. ${dName}${dSci} - ${m.confidenceScore}%`;
      })
      .join("\n");

    // 5. Parameter & Symptom Text Parsers
    let deductionsText = lang === 'id' ? "Tidak ada penalti lingkungan" : "No environmental penalties";
    if (waterHealthStatus.deductions && typeof waterHealthStatus.deductions === 'object' && !Array.isArray(waterHealthStatus.deductions)) {
      const deductionEntries = Object.entries(waterHealthStatus.deductions);
      if (deductionEntries.length > 0) {
        deductionsText = deductionEntries
          .map(([reason, penalty]) => `${reason} (-${penalty} Poin)`)
          .join(", ");
      }
    }

    const symptomsText = primaryMatch.matchedSymptoms.length > 0
      ? primaryMatch.matchedSymptoms.map(s => lang === 'id' ? s.name_id : s.name_en).join(", ")
      : (lang === "id" ? "Tidak ada gejala manual yang dipilih" : "No manually selected symptoms");

    // 6. Adaptive Knowledge Engineering Prompt
    const systemInstruction = `
      Anda adalah seorang Ichthyologist (Ahli Biologi Ikan) dan Dokter Hewan Akuatik Senior dari AquaExpert Expert System.
      Tugas Anda adalah memberikan ulasan klinis singkat (maksimal 3 paragraf) berdasarkan hasil komputasi sistem pakar kami.
      
      Aturan Ketat Konseptual:
      1. JANGAN PERNAH mengubah nama penyakit atau skor persentase keyakinan. Jalankan analisis berdasarkan data tersebut sebagai fakta mutlak.
      2. ${isDifferential 
          ? "Berdasarkan daftar Kandidat Penyakit Teratas, jelaskan secara ilmiah MENGAPA kandidat #1 menjadi kemungkinan terbesar, dan bedakan tipis gejalanya dengan kandidat di bawahnya jika relevan." 
          : "Jelaskan secara ilmiah patologi dari diagnosis tunggal ini berdasarkan gejala yang dikonfirmasi."}
      3. Hubungkan secara ekologis kemungkinan pecah wabah dengan data pemotongan skor lingkungan (deductions).
      4. Gunakan bahasa ilmiah yang ramah pengguna, berwibawa, edukatif, dan taktis.
      5. Selalu berikan respon sesuai instruksi bahasa yang diminta (${lang === "id" ? "Bahasa Indonesia" : "English"}).
    `;

    const userPrompt = `
      Data Analisis ${isDifferential ? "Diagnosis Diferensial" : "Diagnosis Tunggal"} Sistem Pakar:
      ${isDifferential ? "Kandidat Penyakit Teratas (Top Candidates):" : "Diagnosis Utama:"}
      ${topMatchesText}
      
      Gejala Fisik yang Dikonfirmasi Pengguna: ${symptomsText}
      
      Kondisi Ekosistem Tangki Saat Ini (Hasil Health Engine):
      - Skor Kualitas Air: ${waterHealthStatus.scores.waterQuality}/100
      - Skor Beban Biologis (Bioload): ${waterHealthStatus.scores.bioload}/100
      - Indikasi Penalti Lingkungan (Deductions): ${deductionsText}
      - Alarm Aktif Tangki (Alerts): ${waterHealthStatus.alerts.join(" | ") || "Tidak ada alarm lingkungan"}
      
      Berikan ulasan diagnosis klinis Anda sekarang.
    `;

    let finalCommentary = "";
    let aiSuccess = false;

    // =====================================================================
    // AI ENGINE HIGH-PRIORITY LAYER: GROQ INFRASTRUCTURE
    // =====================================================================
    if (process.env.GROQ_API_KEY && !aiSuccess) {
      const groqController = new AbortController();
      let groqTimeoutId: NodeJS.Timeout | undefined;
      
      try {
        logger.info("[DISEASE AI] Menghubungi Mesin Utama: Groq (Llama 3)...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const responsePromise = groq.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2, 
        }, { signal: groqController.signal });

        const timeoutPromise = new Promise<never>((_, reject) => {
          groqTimeoutId = setTimeout(() => {
            groqController.abort(); 
            reject(new Error("AI Gateway Timeout"));
          }, 10000);
        });
        
        const aiResult = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
        if (groqTimeoutId) clearTimeout(groqTimeoutId);

        const rawText = aiResult?.choices?.[0]?.message?.content;
        if (rawText) {
          finalCommentary = String(rawText).trim();
          aiSuccess = true;
          logger.info("[DISEASE AI] Groq Llama 3 sukses menarasikan laporan medis!");
        }
      } catch (err) {
        if (groqTimeoutId) clearTimeout(groqTimeoutId);
        if (!groqController.signal.aborted) groqController.abort();
        logger.warn("[DISEASE AI] Groq sibuk/limit, fallback ke Gemini...");
      }
    }

    // =====================================================================
    // AI ENGINE FALLBACK LAYER: GOOGLE GEN AI (GEMINI 2.5 FLASH)
    // =====================================================================
    if (process.env.GEMINI_API_KEY && !aiSuccess) {
      let geminiTimeoutId: NodeJS.Timeout | undefined;
      
      try {
        logger.info("[DISEASE AI] Menghubungi Mesin Cadangan: Google Gemini...");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const responsePromise = ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: userPrompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 600
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          geminiTimeoutId = setTimeout(() => {
            reject(new Error("AI Gateway Timeout"));
          }, 15000);
        });
        
        const aiResult = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
        if (geminiTimeoutId) clearTimeout(geminiTimeoutId);
        
        // FIX: Mengekstrak teks melalui fungsi pembantu yang aman secara Type Safety & Lintas Versi SDK
        const rawText = extractGeminiText(aiResult);
        if (rawText) {
          finalCommentary = String(rawText).trim();
          aiSuccess = true;
          logger.info("[DISEASE AI] Gemini 2.5 Flash sukses menyelamatkan laporan medis!");
        }
      } catch (err) {
        if (geminiTimeoutId) clearTimeout(geminiTimeoutId);
        logger.error("[DISEASE AI] Kedua mesin AI mengalami kendala.");
      }
    }

    if (!aiSuccess) {
      return {
        success: false,
        error: lang === "id"
          ? "Asisten AI Medis sedang sibuk. Silakan coba beberapa saat lagi."
          : "The medical AI assistant is currently busy. Please try again shortly."
      };
    }

    // 7. Cache Management & Memory Eviction Strategy
    if (aiResponseCache.size > MAX_CACHE_SIZE) {
      aiResponseCache.clear();
      logger.info("[DISEASE AI] 🧹 Cache dibersihkan untuk menjaga performa memori serverless.");
    }
    aiResponseCache.set(cacheKey, { commentary: finalCommentary, timestamp: Date.now() });

    return { success: true, commentary: finalCommentary };

  } catch (error: unknown) {
    logger.error("[DISEASE AI FATAL]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kegagalan sistem internal." 
    };
  }
}