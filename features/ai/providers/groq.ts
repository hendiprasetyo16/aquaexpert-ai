// features/ai/providers/groq.ts
import { ChatMessage, AIProviderResponse } from "../types/ai.types";
import { SYSTEM_PROMPT } from "../prompts/system";

export async function askGroq(history: ChatMessage[]): Promise<AIProviderResponse | null> {
  const GROQ_KEY = process.env.GROQ_API_KEY?.replace(/['"]/g, '').trim();
  if (!GROQ_KEY) return null;

  try {
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Upgrade ke Llama 3.3 70B
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      cache: "no-store" 
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      return { reply: data.choices[0].message.content };
    }
    return null; // Jika gagal, kembalikan null agar dilanjutkan ke OpenRouter
  } catch (e) {
    console.warn("Groq Error:", e);
    return null;
  }
}