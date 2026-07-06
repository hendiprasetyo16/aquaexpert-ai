// features/ai/actions/ai.actions.ts
"use server";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const SYSTEM_PROMPT = `Anda adalah AquaExpert AI, asisten cerdas spesialis Aquascape, ikan hias, tanaman air, dan parameter kualitas air. 
Tugas Anda adalah memberikan jawaban yang profesional, akurat, mudah dipahami, dan solutif. Gunakan format Markdown (bold, list, bullet) agar mudah dibaca.`;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function askAquaExpert(history: ChatMessage[]) {
  try {
    const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
    const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

    if (!GROQ_KEY && !GEMINI_KEY) {
      return { error: "API Key kosong di sistem Vercel." };
    }

    // ====================================================================
    // 1. GEMINI API (Prioritas UTAMA - Menggunakan Gemini 2.5 Flash)
    // Sangat cerdas untuk Biologi dan siap untuk fitur Vision (Gambar)
    // ====================================================================
    if (GEMINI_KEY) {
      try {
        const geminiContents = [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "Baik, saya mengerti. Saya siap membantu sebagai AquaExpert AI." }] },
          ...history.map(m => ({
            role: m.role === "ai" ? "model" : "user",
            parts: [{ text: m.content }]
          }))
        ];

        // 💡 Upgrade ke gemini-2.5-flash
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
        } else {
          console.warn(`Gemini sibuk (Status: ${geminiRes.status}), beralih ke Groq...`);
        }
      } catch (e: unknown) {
        console.warn("Koneksi Gemini gagal, melompat ke Groq...", e instanceof Error ? e.message : String(e));
      }
    }

    // ====================================================================
    // 2. GROQ API (Fallback/Cadangan - Menggunakan Llama 3.3 70B)
    // Sangat cepat dan stabil jika Gemini sedang limit
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
            // 💡 Upgrade ke model tercerdas Groq saat ini
            model: "llama-3.3-70b-versatile", 
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 1500
          }),
          cache: "no-store" 
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          return { reply: data.choices[0].message.content };
        } else {
          throw new Error(`Groq API Error: ${groqRes.status}`);
        }
      } catch (e: unknown) {
        console.warn("Groq gagal menyambung...", e instanceof Error ? e.message : String(e));
        if (!GEMINI_KEY) throw e; 
      }
    }

    return { error: "Semua server AI (Gemini & Groq) sedang sibuk. Mohon coba lagi nanti." };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal memproses data AI: ${errorMsg}` };
  }
}