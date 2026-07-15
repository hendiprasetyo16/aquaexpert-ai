// features/treatments/actions/protocol.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, unstable_noStore } from "next/cache"; // <-- IMPORT BARU UNTUK CACHE

export interface ProtocolDiseaseDto {
  id: string;
  name_id: string;
  name_en: string;
  is_active: boolean;
}

export interface ProtocolMedicationDto {
  id: string;
  name_id: string;
  name_en: string;
  active_ingredient: string;
  is_active: boolean;
}

export interface DiseaseMedicationDto {
  disease_id: string;
  medication_id: string;
  priority: "Primary" | "Alternative";
}

export interface ProtocolMasterDataResponse {
  success: boolean;
  error?: string;
  diseases: ProtocolDiseaseDto[];
  medications: ProtocolMedicationDto[];
  relations: DiseaseMedicationDto[];
}

export interface BaseResponse {
  success: boolean;
  error?: string;
}

export async function getProtocolMasterDataAction(): Promise<ProtocolMasterDataResponse> {
  unstable_noStore(); // <-- MEMATIKAN CACHE NEXT.JS SECARA PAKSA

  try {
    const supabase = await createClient();
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized access.", diseases: [], medications: [], relations: [] };
    }

    const [diseasesRes, medsRes, relationsRes] = await Promise.all([
      supabase.from("diseases").select("id, name_id, name_en, is_active").eq("is_active", true).order("name_id"),
      supabase.from("medications").select("id, name_id, name_en, active_ingredient, is_active").eq("is_active", true).order("name_id"),
      supabase.from("disease_medications").select("disease_id, medication_id, priority")
    ]);

    if (diseasesRes.error) throw new Error(diseasesRes.error.message);
    if (medsRes.error) throw new Error(medsRes.error.message);
    if (relationsRes.error) throw new Error(relationsRes.error.message);

    return {
      success: true,
      diseases: diseasesRes.data as ProtocolDiseaseDto[],
      medications: medsRes.data as ProtocolMedicationDto[],
      relations: relationsRes.data as DiseaseMedicationDto[]
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message, diseases: [], medications: [], relations: [] };
  }
}

export async function updateProtocolAction(
  diseaseId: string, 
  primaryMedIds: string[], 
  alternativeMedIds: string[]
): Promise<BaseResponse> {
  try {
    const supabase = await createClient();
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized access." };
    }

    // A: Hapus relasi lama
    const { error: deleteError } = await supabase
      .from("disease_medications")
      .delete()
      .eq("disease_id", diseaseId);
      
    if (deleteError) throw new Error(`Gagal menghapus data lama: ${deleteError.message}`);

    // B: Siapkan array relasi baru
    const newRelations: DiseaseMedicationDto[] = [];
    primaryMedIds.forEach(medId => {
      newRelations.push({ disease_id: diseaseId, medication_id: medId, priority: "Primary" });
    });
    alternativeMedIds.forEach(medId => {
      newRelations.push({ disease_id: diseaseId, medication_id: medId, priority: "Alternative" });
    });

    // C: Simpan relasi baru
    if (newRelations.length > 0) {
      const { error: insertError } = await supabase
        .from("disease_medications")
        .insert(newRelations);
        
      if (insertError) throw new Error(`Gagal menyimpan data baru: ${insertError.message}`);
    }

    // REVALIDASI HALAMAN AGAR UI LANGSUNG TER-UPDATE
    revalidatePath("/dashboard/protocols");
    revalidatePath("/dashboard/treatments");

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

// Tambahkan fungsi ini di PALING BAWAH file: protocol.actions.ts
// KODE INI MENGGUNAKAN ARSITEKTUR MULTI-API (GEMINI -> GROQ) 

export async function generateAIProtocolAction(
  diseaseNameEn: string, 
  availableMeds: { id: string, name_en: string, active_ingredient: string }[]
) {
  try {
    const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
    const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

    if (!GROQ_KEY && !GEMINI_KEY) {
      return { success: false, error: "API Key kosong di sistem." };
    }

    // Susun prompt untuk AI
    const medsListString = availableMeds.map(m => `- ID: ${m.id} | Name: ${m.name_en} | Ingredient: ${m.active_ingredient}`).join("\n");
    
    const systemPrompt = `You are an expert veterinary aquatic doctor.
Your task is to prescribe the most effective medications for a fish disease.
Disease: "${diseaseNameEn}"

Here is the ONLY available medication inventory (DO NOT invent new IDs):
${medsListString}

Respond ONLY with a valid RAW JSON object matching this schema without any markdown formatting, backticks, or the word 'json':
{
  "primary_ids": ["id_1", "id_2"],
  "alternative_ids": ["id_3"]
}
Choose 1 or 2 most effective meds as primary, and 1 or 2 as alternatives.`;

    let aiResponseText = "";

    // ====================================================================
    // 1. GEMINI API (Prioritas UTAMA)
    // ====================================================================
    if (GEMINI_KEY) {
      try {
        const geminiContents = [
          { role: "user", parts: [{ text: systemPrompt }] }
        ];

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            contents: geminiContents,
            generationConfig: { temperature: 0.1 } // Suhu rendah agar JSON konsisten
          }),
          cache: "no-store" 
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          if (data.candidates && data.candidates.length > 0) {
            aiResponseText = data.candidates[0].content.parts[0].text;
          }
        } else {
          console.warn(`Gemini API Protocol sibuk (Status: ${geminiRes.status}), beralih ke Groq...`);
        }
      } catch (e) {
        console.warn("Koneksi Gemini API Protocol gagal, melompat ke Groq...", e);
      }
    }

    // ====================================================================
    // 2. GROQ API (Fallback/Cadangan)
    // ====================================================================
    if (!aiResponseText && GROQ_KEY) {
      try {
        const groqMessages = [
          { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON without any markdown tags." },
          { role: "user", content: systemPrompt }
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            temperature: 0.1,
          }),
          cache: "no-store" 
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          aiResponseText = data.choices[0].message.content;
        } else {
          throw new Error(`Groq API Error: ${groqRes.status}`);
        }
      } catch (e) {
        console.warn("Groq gagal menyambung...", e);
        if (!GEMINI_KEY) throw e; 
      }
    }

    if (!aiResponseText) {
       return { success: false, error: "Semua server AI (Gemini & Groq) sedang sibuk. Coba lagi." };
    }

    // Membersihkan respon dari format markdown jika AI membandel
    const cleanJsonString = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJsonString);

    return { success: true, data: parsedData };

  } catch (error: any) {
    console.error("AI Protocol Error:", error);
    return { success: false, error: "Gagal mendapatkan/memparsing JSON rekomendasi dari AI API." };
  }
}