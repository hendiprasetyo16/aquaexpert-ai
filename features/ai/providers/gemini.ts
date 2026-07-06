// features/ai/providers/gemini.ts
import { ChatMessage, AIProviderResponse } from "../types/ai.types";
import { SYSTEM_PROMPT } from "../prompts/system";

export async function askGemini(history: ChatMessage[]): Promise<AIProviderResponse | null> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
  if (!GEMINI_KEY) return null;

  try {
    const geminiContents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Baik, saya mengerti. Saya siap membantu sebagai AquaExpert AI." }] },
      ...history.map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    ];

    // Menggunakan Gemini 2.5 Flash (Generasi Terbaru)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: geminiContents }),
      cache: "no-store" 
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      if (data.candidates && data.candidates.length > 0) {
        return { reply: data.candidates[0].content.parts[0].text };
      }
    }
    return null; // Jika gagal (kuota habis/down), kembalikan null agar dilanjutkan ke Groq
  } catch (e) {
    console.warn("Gemini Error:", e);
    return null;
  }
}