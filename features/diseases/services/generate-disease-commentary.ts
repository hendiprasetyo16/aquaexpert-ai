// features/diseases/services/generate-disease-commentary.ts
"use server";

import crypto from "crypto";
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
// IN-MEMORY LRU CACHE INFRASTRUCTURE
// ============================================================================
const aiResponseCache = new Map<string, { commentary: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 Jam
const MAX_CACHE_SIZE = 500;

// FIX: Menghilangkan 'any' dengan Type Guard yang aman
interface GeminiResponseWithText {
  text: string | (() => string);
}

function hasTextProperty(obj: unknown): obj is GeminiResponseWithText {
  return typeof obj === 'object' && obj !== null && 'text' in obj;
}

function extractGeminiText(response: unknown): string | null {
  if (hasTextProperty(response)) {
    if (typeof response.text === "function") return response.text();
    if (typeof response.text === "string") return response.text;
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: lang === "id" ? "Sesi login berakhir. Silakan muat ulang halaman." : "Session expired. Please refresh the page." };
    }
    await verifyAquariumOwnership(supabase, aquariumId, user.id);

    if (diagnosisResults.length === 0) {
      return { success: true, commentary: lang === "id" ? "Tidak ada indikasi patogen aktif terdeteksi." : "No active pathogens detected." };
    }

    const primaryMatch = diagnosisResults[0];

    if (primaryMatch.confidenceScore < 35) {
      return {
        success: true,
        commentary: lang === "id"
          ? "Data gejala belum cukup komprehensif untuk diagnosis definitif. Sistem Pakar tidak dapat menyimpulkan penyakit dengan pasti. Tambahkan observasi gejala lain atau periksa parameter air dasar."
          : "Insufficient symptom data for a definitive diagnosis. The Expert System cannot conclude a specific disease. Please observe for more symptoms or check basic water parameters."
      };
    }

    const deductionsKey = waterHealthStatus.deductions && typeof waterHealthStatus.deductions === 'object' && !Array.isArray(waterHealthStatus.deductions)
      ? Object.entries(waterHealthStatus.deductions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join("|")
      : "";

    // OPTIMASI: Payload hashing
    const rawKeyPayload = JSON.stringify({
      aquariumId,
      lang,
      diseaseIds: diagnosisResults.map(d => d.disease.id).join(","),
      confidence: diagnosisResults.map(d => d.confidenceScore).join(","),
      selectedSymptoms: primaryMatch.matchedSymptoms.map(s => s.id).sort().join(","),
      waterQuality: waterHealthStatus.scores.waterQuality,
      bioload: waterHealthStatus.scores.bioload,
      alerts: [...waterHealthStatus.alerts].sort().join(","),
      deductions: deductionsKey
    });
    
    const cacheKey = crypto.createHash("sha256").update(rawKeyPayload).digest("hex");

    // OPTIMASI: Lazy Eviction & LRU Cache Promotion
    const cachedData = aiResponseCache.get(cacheKey);
    if (cachedData) {
      const isExpired = Date.now() - cachedData.timestamp > CACHE_TTL_MS;
      if (isExpired) {
        aiResponseCache.delete(cacheKey);
        logger.info("[DISEASE AI] 🧹 Stale cache deleted.");
      } else {
        // LRU Promotion
        aiResponseCache.delete(cacheKey);
        aiResponseCache.set(cacheKey, cachedData);
        
        logger.info("[DISEASE AI] ⚡ Cache Hit (LRU)! Mengembalikan ulasan dari memori.");
        return { success: true, commentary: cachedData.commentary };
      }
    }

    const isDifferential = diagnosisResults.length > 1;
    const topMatchesText = diagnosisResults
      .slice(0, 3)
      .map((m, i) => {
        const dName = lang === 'id' ? m.disease.name_id : m.disease.name_en;
        const dSci = m.disease.scientific_name ? ` (${m.disease.scientific_name})` : "";
        return `${i + 1}. ${dName}${dSci} - ${m.confidenceScore}%`;
      })
      .join("\n");

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

    const systemInstruction = `
      Anda adalah seorang Ichthyologist (Ahli Biologi Ikan) dan Dokter Hewan Akuatik Senior dari AquaExpert Expert System.
      Tugas Anda adalah memberikan ulasan klinis singkat (maksimal 3 paragraf) berdasarkan hasil komputasi sistem pakar kami.

      Aturan Ketat Konseptual:
      1. JANGAN PERNAH mengubah nama penyakit atau skor persentase keyakinan.
      2. ${isDifferential 
          ? "Jelaskan MENGAPA kandidat #1 menjadi kemungkinan terbesar, dan bedakan gejalanya dengan kandidat di bawahnya." 
          : "Jelaskan patologi dari diagnosis tunggal ini berdasarkan gejala yang dikonfirmasi."}
      3. Hubungkan secara ekologis kemungkinan pecah wabah dengan pemotongan skor lingkungan (deductions).
      4. Gunakan bahasa ilmiah yang edukatif dan taktis.
      5. Respon dalam bahasa: ${lang === "id" ? "Bahasa Indonesia" : "English"}.
    `;

    const userPrompt = `
      Data Analisis ${isDifferential ? "Diagnosis Diferensial" : "Diagnosis Tunggal"} Sistem Pakar:
      ${isDifferential ? "Kandidat Penyakit:" : "Diagnosis Utama:"}
      ${topMatchesText}

      Gejala yang Dikonfirmasi: ${symptomsText}

      Kondisi Tangki Saat Ini:
      - Kualitas Air: ${waterHealthStatus.scores.waterQuality}/100
      - Beban Biologis: ${waterHealthStatus.scores.bioload}/100
      - Penalti Lingkungan: ${deductionsText}
      - Alarm: ${waterHealthStatus.alerts.join(" | ") || "Tidak ada alarm lingkungan"}
      
      Berikan ulasan diagnosis klinis Anda sekarang.
    `;

    let finalCommentary = "";
    let aiSuccess = false;

    // =====================================================================
    // MESIN 1: GROQ CLOUD (UTAMA)
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
    // MESIN 2: GOOGLE GEMINI (CADANGAN)
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

    // =====================================================================
    // MESIN 3: GRACEFUL DEGRADATION (SISTEM LOKAL STATIS)
    // =====================================================================
    if (!aiSuccess) {
      logger.warn("[DISEASE AI] Fallback ke teks statis lokal karena semua AI eksternal tumbang.");
      const topDiseaseName = lang === 'id' ? primaryMatch.disease.name_id : primaryMatch.disease.name_en;
      
      finalCommentary = lang === 'id'
        ? `Diagnosis utama terindikasi kuat mengarah pada **${topDiseaseName}** (Kecocokan ${primaryMatch.confidenceScore}%).\n\nKondisi ekosistem tangki Anda saat ini mencatatkan beberapa penalti yang berisiko mempercepat siklus patogen. Meskipun Asisten AI Generatif sedang dalam pemeliharaan, Sistem Pakar kami sangat menyarankan Anda untuk segera mengambil tindakan korektif pada parameter air, memisahkan ikan yang terinfeksi ke tangki karantina, dan meninjau kembali beban biologis tangki Anda.`
        : `Primary diagnosis strongly indicates **${topDiseaseName}** (${primaryMatch.confidenceScore}% Confidence).\n\nYour tank's current ecosystem condition has recorded environmental penalties that risk accelerating the pathogen lifecycle. Although the Generative AI Assistant is undergoing maintenance, our Expert System highly recommends taking immediate corrective actions on water parameters, isolating infected fish to a quarantine tank, and reviewing the biological load.`;
    }

    // Memory Eviction Policy
    if (aiResponseCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = aiResponseCache.keys().next().value;
      if (oldestKey) aiResponseCache.delete(oldestKey);
      logger.info("[DISEASE AI] 🧹 Evicting oldest cache item to maintain LRU structure.");
    }

    aiResponseCache.set(cacheKey, { commentary: finalCommentary, timestamp: Date.now() });

    return { success: true, commentary: finalCommentary };

  } catch (error: unknown) {
    logger.error("[DISEASE AI FATAL]", error);
    return { success: false, error: "Terjadi kesalahan sistem internal." };
  }
}