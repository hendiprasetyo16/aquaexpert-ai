// features/diseases/actions/generate-disease-commentary.ts
"use server";

import { GoogleGenAI } from "@google/genai";
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

    if (primaryMatch.confidenceScore < 35) {
      return {
        success: true,
        commentary: lang === "id"
          ? "Data gejala yang dimasukkan belum cukup komprehensif untuk menyusun diagnosis klinis yang pasti. Mohon tambahkan observasi visual tambahan."
          : "The provided symptom data is insufficient for a definitive clinical diagnosis. Please include additional visual observations."
      };
    }

    // Ekstraksi 3 Kandidat Teratas
    const topMatches = diagnosisResults.slice(0, 3);
    const topCandidatesText = topMatches.map((d, idx) => 
      `${idx + 1}. ${d.disease.name_en} (${d.confidenceScore}%)`
    ).join("\n");
    
    // FIX: Pengamanan eksekusi jika ENV belum ada
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: true,
        commentary: lang === "id"
          ? "Asisten AI saat ini tidak tersedia karena kunci API sistem belum dikonfigurasi."
          : "AI Assistant is currently unavailable because the system API key is not configured."
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `
      Anda adalah seorang Ichthyologist (Ahli Biologi Ikan) dan Dokter Hewan Akuatik Senior dari AquaExpert Expert System.
      Tugas Anda adalah memberikan ulasan klinis komparatif singkat (maksimal 3 paragraf).
      
      Aturan Ketat Konseptual:
      1. JANGAN PERNAH mengubah, menolak, atau mendiagnosis ulang nama penyakit dari sistem. 
      2. Jika terdapat lebih dari 1 kandidat dengan probabilitas yang berdekatan, jelaskan secara ilmiah mengapa Kandidat #1 menjadi diagnosis utama yang paling relevan.
      3. Hubungkan secara ekologis mengapa penyakit tersebut pecah dengan melihat indikasi penalti lingkungan (deductions) atau skor kualitas air yang dikirimkan.
      4. Gunakan bahasa ilmiah yang presisi, berwibawa, tanpa basa-basi kreatif, dan selalu respons sesuai instruksi bahasa: ${lang === "id" ? "Bahasa Indonesia" : "English"}.
    `;

    const userPrompt = `
      Kandidat Diagnosis Patologi Tertinggi:
      ${topCandidatesText}
      
      Karakteristik Fisik Valid: ${primaryMatch.matchedSymptoms.map(s => s.name_en).join(", ")}
      
      Kondisi Ekosistem Tangki Saat Ini (Health Engine Data):
      - Skor Kualitas Air: ${waterHealthStatus.scores.waterQuality}/100
      - Skor Beban Biologis (Bioload): ${waterHealthStatus.scores.bioload}/100
      - Indikasi Penalti Lingkungan (Deductions): ${JSON.stringify(waterHealthStatus.deductions)}
      - Alarm Aktif Tangki (Alerts): ${waterHealthStatus.alerts.join(" | ") || "Tidak ada alarm lingkungan ekstrim"}
      
      Berikan narasi ulasan klinis Anda.
    `;

    const fetchAIPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, 
        maxOutputTokens: 600
      }
    });

    // FIX: Menggunakan Promise<never> mutlak untuk Type Safety
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000);
    });

    const response = await Promise.race([fetchAIPromise, timeoutPromise]);
    
    // Type Safety dijamin berhasil (response.text sudah dikenal)
    const commentary = response.text;
    if (!commentary) throw new Error("Gagal mengekstrak teks respons dari Gemini.");

    return { success: true, commentary };

  } catch (error: unknown) {
    if (error instanceof Error && error.message === "AI_TIMEOUT") {
      return { 
        success: false, 
        error: lang === "id" 
          ? "Waktu permintaan habis. Server asisten AI sedang sibuk." 
          : "Request timeout. The AI assistant server is currently busy." 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Terjadi kegagalan fungsional pada Konsultan AI." 
    };
  }
}