// features/diseases/actions/generate-disease-commentary.ts
"use server";

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai"; // Konsisten menggunakan SDK modern terbaru
import { createClient } from "@/lib/supabase/server";
import { verifyAquariumOwnership } from "@/features/aquariums/repositories/security.repository";
import type { DiseaseMatchResult } from "../types/disease.types";
import type { HealthAnalysisResult } from "@/features/aquariums/utils/health-engine";

interface CommentaryPayload {
  aquariumId: string;
  diagnosisResults: DiseaseMatchResult[];
  waterHealthStatus: HealthAnalysisResult;
  lang?: "id" | "en";
}

export async function generateDiseaseCommentaryAction({
  aquariumId,
  diagnosisResults,
  waterHealthStatus,
  lang = "id"
}: CommentaryPayload): Promise<{ success: boolean; commentary?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Validasi Keamanan (Anti-IDOR)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };
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

    // 2. Token Saver & Ambang Batas Keyakinan
    if (primaryMatch.confidenceScore < 35) {
      return {
        success: true,
        commentary: lang === "id"
          ? "Data gejala belum cukup komprehensif untuk diagnosis definitif. Sistem Pakar tidak dapat menyimpulkan penyakit dengan pasti. Tambahkan observasi gejala lain atau periksa parameter air dasar."
          : "Insufficient symptom data for a definitive diagnosis. The Expert System cannot conclude a specific disease. Please observe for more symptoms or check basic water parameters."
      };
    }
    
    // 3. Differential Diagnosis Mapping (Top 3) dengan Fallback Null Safety
    const topMatchesText = diagnosisResults
      .slice(0, 3)
      .map((m, i) => {
        const dName = lang === 'id' ? m.disease.name_id : m.disease.name_en;
        const dSci = m.disease.scientific_name ? ` (${m.disease.scientific_name})` : "";
        return `${i + 1}. ${dName}${dSci} - ${m.confidenceScore}%`;
      })
      .join("\n");

    // 4. Defensive Programming untuk Deductions (Menghindari array object runtime bug)
    let deductionsText = lang === 'id' ? "Tidak ada penalti lingkungan" : "No environmental penalties";
    if (waterHealthStatus.deductions && typeof waterHealthStatus.deductions === 'object' && !Array.isArray(waterHealthStatus.deductions)) {
      const deductionEntries = Object.entries(waterHealthStatus.deductions);
      if (deductionEntries.length > 0) {
        deductionsText = deductionEntries
          .map(([reason, penalty]) => `${reason} (-${penalty} Poin)`)
          .join(", ");
      }
    }

    // 5. Arsitektur Prompt Medis
    const systemInstruction = `
      Anda adalah seorang Ichthyologist (Ahli Biologi Ikan) dan Dokter Hewan Akuatik Senior dari AquaExpert Expert System.
      Tugas Anda adalah memberikan ulasan klinis diagnosis diferensial singkat (maksimal 3 paragraf) berdasarkan hasil komputasi sistem pakar kami.
      
      Aturan Ketat Konseptual:
      1. JANGAN PERNAH mengubah atau mendiagnosis ulang nama penyakit atau skor persentase keyakinan yang diberikan oleh sistem. Jalankan analisis berdasarkan data tersebut sebagai fakta mutlak.
      2. Berdasarkan daftar Kandidat Penyakit Teratas, jelaskan secara ilmiah MENGAPA kandidat #1 menjadi kemungkinan terbesar, dan bedakan tipis gejalanya dengan kandidat di bawahnya jika ada.
      3. Hubungkan secara ekologis mengapa penyakit tersebut bisa pecah wabahnya dengan melihat data pemotongan skor lingkungan (deductions) yang dikirimkan.
      4. Gunakan bahasa ilmiah yang ramah pengguna, berwibawa, edukatif, dan taktis.
      5. Selalu berikan respon sesuai instruksi bahasa yang diminta (${lang === "id" ? "Bahasa Indonesia" : "English"}).
    `;

    const userPrompt = `
      Data Analisis Diagnosis Diferensial Sistem Pakar:
      Kandidat Penyakit Teratas (Top Candidates):
      ${topMatchesText}
      
      Gejala Fisik yang Dikonfirmasi Pengguna: ${primaryMatch.matchedSymptoms.map(s => lang === 'id' ? s.name_id : s.name_en).join(", ")}
      
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
    // MESIN 1: GROQ CLOUD (UTAMA - FAST INFERENCE)
    // =====================================================================
    if (process.env.GROQ_API_KEY && !aiSuccess) {
      try {
        console.log("\n🩺 [DISEASE AI] Menghubungi Mesin Utama: Groq (Llama 3)...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const responsePromise = groq.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2, // Ketat dan presisi
        });

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("AI Gateway Timeout")), 10000) // Timeout lebih ketat untuk Groq agar cepat fallback
        );
        
        const aiResult = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;

        if (aiResult?.choices?.[0]?.message?.content) {
          finalCommentary = aiResult.choices[0].message.content.trim();
          aiSuccess = true;
          console.log("✅ [DISEASE AI] Groq Llama 3 sukses menarasikan laporan medis!");
        }
      } catch (err) {
        console.warn("⚠️ [DISEASE AI] Groq sibuk/limit, fallback ke Gemini...");
        // TODO: Ganti ke logger (e.g. Sentry.captureMessage) di production
      }
    }

    // =====================================================================
    // MESIN 2: GOOGLE GEMINI (CADANGAN - REDUNDANCY LAYER)
    // =====================================================================
    if (process.env.GEMINI_API_KEY && !aiSuccess) {
      try {
        console.log("\n🩺 [DISEASE AI] Menghubungi Mesin Cadangan: Google Gemini...");
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

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("AI Gateway Timeout")), 15000)
        );
        
        const aiResult = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
        
        if (aiResult?.text) {
          finalCommentary = aiResult.text.trim();
          aiSuccess = true;
          console.log("✅ [DISEASE AI] Gemini 2.5 Flash sukses menyelamatkan laporan medis!");
        }
      } catch (err) {
        console.error("❌ [DISEASE AI] Kedua mesin AI mengalami kendala Timeout/Limit.");
      }
    }

    // Tanggapan ramah pengguna jika seluruh infrastruktur AI down
    if (!aiSuccess) {
      return {
        success: false,
        error: lang === "id"
          ? "Asisten AI Medis sedang sibuk memproses antrean. Silakan klik analisis ulang beberapa saat lagi."
          : "The medical AI assistant is currently experiencing heavy traffic. Please try analyzing again shortly."
      };
    }

    return { success: true, commentary: finalCommentary };

  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kegagalan penulisan narasi medis oleh AI Consultant." 
    };
  }
}