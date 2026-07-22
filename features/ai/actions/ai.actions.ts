// features/ai/actions/ai.actions.ts
"use server";

import { ChatMessage, RAGContextData } from "../types/ai.types";
import { askGemini } from "../providers/gemini";
import { askGroq } from "../providers/groq";
import { askOpenRouter } from "../providers/openrouter";
import { createClient } from "@/lib/supabase/server";

/**
 * Fungsi untuk menarik data dari Supabase (Retrieval)
 * Berdasarkan kata kunci dari pesan terakhir user
 */
async function retrieveDatabaseContext(userQuery: string): Promise<string> {
  // 💡 FIX 1: Tambahkan 'await' karena createClient() bersifat Promise di Server Actions
  const supabase = await createClient();
  const keywords = userQuery.toLowerCase().split(" ").filter(w => w.length > 3);
  
  if (keywords.length === 0) return "";

  const contextData: RAGContextData = { diseases: [], fishes: [], plants: [] };

  try {
    // 1. Cari Penyakit yang relevan
    const { data: diseases } = await supabase
      .from("diseases")
      .select("name_id, symptoms_id, treatment_id")
      .or(keywords.map(kw => `name_id.ilike.%${kw}%,symptoms_id.ilike.%${kw}%`).join(","));

    if (diseases) {
      // 💡 FIX 2: Berikan tipe data eksplisit pada parameter 'd' (Bebas Any)
      contextData.diseases = diseases.map(
        (d: { name_id: string; symptoms_id: string; treatment_id: string }) => 
          `Penyakit: ${d.name_id}. Gejala: ${d.symptoms_id}. Pengobatan: ${d.treatment_id}.`
      );
    }

    // 2. Cari Ikan yang relevan
    const { data: fishes } = await supabase
      .from("fishes")
      .select("name_id, care_level, diet_type")
      .or(keywords.map(kw => `name_id.ilike.%${kw}%`).join(","));

    if (fishes) {
      // 💡 FIX 3: Berikan tipe data eksplisit pada parameter 'f' (Bebas Any)
      contextData.fishes = fishes.map(
        (f: { name_id: string; care_level: string; diet_type: string }) => 
          `Ikan: ${f.name_id}. Perawatan: ${f.care_level}. Pakan: ${f.diet_type}.`
      );
    }

    // Susun menjadi teks konteks rahasia untuk AI
    const compiledContext = [
      ...contextData.diseases,
      ...contextData.fishes,
    ].join("\n");

    return compiledContext.length > 0 
      ? `\n\n[INFO DATABASE INTERNAL]\nBerikut adalah data dari database akuarium user yang relevan dengan pertanyaan. Gunakan data ini untuk menjawab:\n${compiledContext}` 
      : "";

  } catch (error) {
    console.error("Gagal menarik context RAG:", error);
    return ""; // Tetap kembalikan string kosong agar AI tetap jalan jika DB error
  }
}

export async function askAquaExpert(history: ChatMessage[]) {
  try {
    // 1. Ambil pertanyaan terakhir user
    const lastMessage = history[history.length - 1];
    
    // 2. Tarik data dari Database (RAG Process)
    let ragContext = "";
    if (lastMessage && lastMessage.role === "user") {
      ragContext = await retrieveDatabaseContext(lastMessage.content);
    }

    // 3. Sisipkan RAG Context ke pesan terakhir secara rahasia
    // (User tidak akan melihat ini di layar, hanya AI yang membaca)
    const modifiedHistory: ChatMessage[] = history.map((msg, index) => {
      if (index === history.length - 1 && msg.role === "user") {
        return { ...msg, content: msg.content + ragContext };
      }
      return msg;
    });

    // 4. Proses Waterfall AI (Gemini -> Groq -> OpenRouter)
    const geminiResponse = await askGemini(modifiedHistory);
    if (geminiResponse?.reply) return { reply: geminiResponse.reply };

    console.warn("⚠️ Gemini Chat Gagal. Beralih ke Groq...");
    const groqResponse = await askGroq(modifiedHistory);
    if (groqResponse?.reply) return { reply: groqResponse.reply };

    console.warn("⚠️ Groq Chat Gagal. Beralih ke OpenRouter...");
    const orResponse = await askOpenRouter(modifiedHistory);
    if (orResponse?.reply) return { reply: orResponse.reply };

    console.error("❌ SEMUA AI CHAT GAGAL.");
    return { error: "Semua server AI sedang sibuk. Mohon coba lagi nanti." };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal memproses data AI: ${errorMsg}` };
  }
}