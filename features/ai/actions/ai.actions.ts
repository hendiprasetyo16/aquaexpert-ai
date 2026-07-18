// features/ai/actions/ai.actions.ts
"use server";

import { ChatMessage } from "../types/ai.types";
import { askGemini } from "../providers/gemini";
import { askGroq } from "../providers/groq";
import { askOpenRouter } from "../providers/openrouter";

export async function askAquaExpert(history: ChatMessage[]) {
  try {
    // 1. GEMINI (Prioritas UTAMA)
    const geminiResponse = await askGemini(history);
    if (geminiResponse?.reply) return { reply: geminiResponse.reply };

    console.warn("⚠️ Gemini Chat Gagal. Beralih ke Groq...");

    // 2. GROQ (Fallback 1)
    const groqResponse = await askGroq(history);
    if (groqResponse?.reply) return { reply: groqResponse.reply };

    console.warn("⚠️ Groq Chat Gagal. Beralih ke OpenRouter...");

    // 3. OPENROUTER (Fallback 2)
    const orResponse = await askOpenRouter(history);
    if (orResponse?.reply) return { reply: orResponse.reply };

    // 4. JIKA SEMUA GAGAL
    console.error("❌ SEMUA AI CHAT GAGAL.");
    return { error: "Semua server AI sedang sibuk. Mohon coba lagi nanti." };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal memproses data AI: ${errorMsg}` };
  }
}