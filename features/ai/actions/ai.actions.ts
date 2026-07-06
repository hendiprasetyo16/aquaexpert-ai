// features/ai/actions/ai.actions.ts
"use server";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const SYSTEM_PROMPT = `Anda adalah AquaExpert AI, asisten cerdas spesialis Aquascape, ikan hias, tanaman air, dan parameter kualitas air. 
Tugas Anda adalah memberikan jawaban yang profesional, akurat, mudah dipahami, dan solutif. Gunakan format Markdown (bold, list, bullet) agar mudah dibaca.`;

export async function askAquaExpert(history: ChatMessage[]) {
  try {
    // Membaca API Key dengan aman
    const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
    const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

    if (!GROQ_KEY && !GEMINI_KEY) {
      return { error: "API Key (GROQ_API_KEY atau GEMINI_API_KEY) belum ditambahkan di Vercel Dashboard -> Environment Variables." };
    }

    // ====================================================================
    // 1. PRIORITAS UTAMA: GROQ API (Llama 3)
    // ====================================================================
    if (GROQ_KEY) {
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
        } else {
          console.warn(`⚠️ Groq API sibuk/error (Status: ${groqRes.status}), melompat ke Gemini...`);
        }
      } catch (e) {
        console.warn("⚠️ Koneksi Groq terputus, melompat ke Gemini...", e);
      }
    }

    // ====================================================================
    // 2. FALLBACK/CADANGAN: GOOGLE GEMINI API (Gemini 1.5 Flash)
    // ====================================================================
    if (GEMINI_KEY) {
      try {
        const geminiContents = history.map(m => ({
          role: m.role === "ai" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
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
          throw new Error(`Gemini merespons dengan status: ${geminiRes.statusText}`);
        }
      } catch (e) {
        console.error("⚠️ Koneksi Gemini terputus...", e);
        throw e;
      }
    }

    return { error: "Semua API AI gagal diakses. Pastikan pengaturan kunci di Vercel sudah benar." };

  } catch (error: any) {
    console.error("❌ AI FALLBACK ERROR FINAL:", error);
    return { error: "Gagal menyambung ke server AI. Mohon pastikan API Key di Vercel valid dan tidak ada pemblokiran." };
  }
}