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
    // 1. GROQ API (Menggunakan Llama 3.1 8B Instant - Super Stabil)
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
            // 💡 FIX 1: Menggunakan model teringan & teraman milik Groq
            model: "llama-3.1-8b-instant", 
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
        console.warn("Groq gagal menyambung, melompat ke Gemini...");
      }
    }

    // ====================================================================
    // 2. GEMINI API (Menggunakan Jalur Rilis Resmi 'v1' Anti-404)
    // ====================================================================
    if (GEMINI_KEY) {
      try {
        // 💡 FIX 2: Menyuntikkan instruksi ke dalam riwayat obrolan secara manual.
        // Ini terbukti ampuh menghindari error 400/404 pada API Key versi baru.
        const geminiContents = [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "Baik, saya mengerti. Saya siap membantu sebagai AquaExpert AI." }] },
          ...history.map(m => ({
            role: m.role === "ai" ? "model" : "user",
            parts: [{ text: m.content }]
          }))
        ];

        // 💡 FIX 3: Menggunakan endpoint /v1/ (Rilis Resmi) bukan /v1beta/
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: geminiContents
          }),
          cache: "no-store" 
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          return { reply: data.candidates[0].content.parts[0].text };
        } else {
          throw new Error(`Google API sibuk (Status: ${geminiRes.status})`);
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