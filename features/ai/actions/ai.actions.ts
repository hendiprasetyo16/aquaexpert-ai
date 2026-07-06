// features/ai/actions/ai.actions.ts
"use server";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

// Instruksi kepribadian AI (System Prompt)
const SYSTEM_PROMPT = `Anda adalah AquaExpert AI, asisten cerdas spesialis Aquascape, ikan hias, tanaman air, dan parameter kualitas air. 
Tugas Anda adalah memberikan jawaban yang profesional, akurat, mudah dipahami, dan solutif. Gunakan format Markdown (bold, list, bullet) agar mudah dibaca.`;

export async function askAquaExpert(history: ChatMessage[]) {
  try {
    
    // ====================================================================
    // 1. PRIORITAS UTAMA: GROQ API (Llama 3) - Sangat Cepat
    // ====================================================================
    if (process.env.GROQ_API_KEY) {
      try {
        const groqMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192", // Model unggulan Groq
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          // Jika sukses, langsung kembalikan jawaban dan hentikan proses di sini
          return { reply: data.choices[0].message.content };
        }
        console.warn("⚠️ Groq API gagal/sibuk, mencoba pindah ke Gemini...");
      } catch (e) {
        console.warn("⚠️ Koneksi Groq terputus, mencoba pindah ke Gemini...", e);
      }
    }

    // ====================================================================
    // 2. FALLBACK/CADANGAN: GOOGLE GEMINI API (Gemini 1.5 Flash)
    // ====================================================================
    if (process.env.GEMINI_API_KEY) {
      const geminiContents = history.map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: geminiContents
        })
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        // Jika sukses menggunakan Gemini, kembalikan jawaban
        return { reply: data.candidates[0].content.parts[0].text };
      }
      throw new Error("Gemini API juga gagal merespons.");
    }

    // Jika di file .env Bapak belum memasukkan KEY sama sekali
    return { error: "API Keys (GROQ_API_KEY atau GEMINI_API_KEY) belum dikonfigurasi di file .env" };

  } catch (error: any) {
    console.error("❌ AI FALLBACK ERROR FINAL:", error);
    return { error: "Mohon maaf, seluruh server AI (Groq & Gemini) sedang sibuk. Silakan coba beberapa saat lagi." };
  }
}