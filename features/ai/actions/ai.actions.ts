// features/ai/actions/ai.actions.ts
"use server";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const SYSTEM_PROMPT = `Anda adalah AquaExpert AI, asisten cerdas spesialis Aquascape, ikan hias, tanaman air, dan parameter kualitas air. 
Tugas Anda adalah memberikan jawaban yang profesional, akurat, mudah dipahami, dan solutif. Gunakan format Markdown (bold, list, bullet) agar mudah dibaca.`;

// 💡 FIX 1: URL Murni (Anti-Copy-Paste Bug)
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function askAquaExpert(history: ChatMessage[]) {
  try {
    const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
    const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

    if (!GROQ_KEY && !GEMINI_KEY) {
      return { error: "API Key kosong di sistem Vercel." };
    }

    // ====================================================================
    // 1. GROQ API (Prioritas Utama)
    // ====================================================================
    if (GROQ_KEY) {
      try {
        const groqMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
        ];

        const groqRes = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192", 
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 1500
          }),
          cache: "no-store" 
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          return { reply: data.choices[0].message.content };
        }
      } catch (e: any) {
        console.warn("Groq gagal menyambung...");
      }
    }

    // ====================================================================
    // 2. GEMINI API (Fallback Darurat)
    // ====================================================================
    if (GEMINI_KEY) {
      try {
        const geminiContents = history.map(m => ({
          role: m.role === "ai" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        // 💡 FIX 2: Menggunakan nama endpoint model terbaru dari Google (Status 404 Cleared!)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: geminiContents
          }),
          cache: "no-store" 
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          return { reply: data.candidates[0].content.parts[0].text };
        } else {
          // Jika terjadi error kuota/lainnya, lempar ke catch luar
          throw new Error(`Google Gemini sibuk (Status: ${geminiRes.status})`);
        }
      } catch (e: any) {
        throw e;
      }
    }

    return { error: "Semua server AI (Groq & Gemini) sedang sibuk. Mohon coba lagi nanti." };

  } catch (error: any) {
    return { error: `Gagal memproses data AI: ${error.message}` };
  }
}