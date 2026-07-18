// features/ai/providers/groq.ts
import { ChatMessage, AIProviderResponse } from "../types/ai.types";
import { SYSTEM_PROMPT } from "../prompts/system";

export async function askGroq(history: ChatMessage[]): Promise<AIProviderResponse | null> {
  // 💡 Deteksi kunci dummy agar tidak crash
  const GROQ_KEY = process.env.GROQ_API_KEY?.includes("your_") ? "" : process.env.GROQ_API_KEY?.replace(/['"]/g, '').trim();
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
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      cache: "no-store" 
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.warn(`[Groq Chat API Error] ${groqRes.status}: ${errText}`);
      return null;
    }

    const data = await groqRes.json();
    return { reply: data.choices[0].message.content };
  } catch (e) {
    console.warn("Groq Chat Catch Error:", (e as Error).message);
    return null;
  }
}