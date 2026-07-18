// features/ai/providers/openrouter.ts
import { ChatMessage, AIProviderResponse } from "../types/ai.types";
import { SYSTEM_PROMPT } from "../prompts/system";

export async function askOpenRouter(history: ChatMessage[]): Promise<AIProviderResponse | null> {
  // 💡 Deteksi kunci dummy
  const OR_KEY = process.env.OPENROUTER_API_KEY?.includes("your_") ? "" : process.env.OPENROUTER_API_KEY?.replace(/['"]/g, '').trim();
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
        "HTTP-Referer": "https://aquaexpert.vercel.app", 
        "X-Title": "AquaExpert AI"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free", // Update ke model chat gratis terbaru
        messages: orMessages,
        temperature: 0.7,
      }),
      cache: "no-store" 
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      console.warn(`[OpenRouter Chat API Error] ${orRes.status}: ${errText}`);
      return null;
    }

    const data = await orRes.json();
    return { reply: data.choices[0].message.content };
  } catch (e) {
    console.warn("OpenRouter Chat Catch Error:", (e as Error).message);
    return null;
  }
}