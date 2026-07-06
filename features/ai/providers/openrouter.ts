// features/ai/providers/openrouter.ts
import { ChatMessage, AIProviderResponse } from "../types/ai.types";
import { SYSTEM_PROMPT } from "../prompts/system";

export async function askOpenRouter(history: ChatMessage[]): Promise<AIProviderResponse | null> {
  const OR_KEY = process.env.OPENROUTER_API_KEY?.replace(/['"]/g, '').trim();
  if (!OR_KEY) return null;

  try {
    const orMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
    ];

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aquaexpert.vercel.app", // Opsional tapi disarankan OpenRouter
        "X-Title": "AquaExpert AI"
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free", // Bisa diganti Qwen, DeepSeek, dsb
        messages: orMessages,
        temperature: 0.7,
      }),
      cache: "no-store" 
    });

    if (orRes.ok) {
      const data = await orRes.json();
      return { reply: data.choices[0].message.content };
    }
    return null;
  } catch (e) {
    console.warn("OpenRouter Error:", e);
    return null;
  }
}