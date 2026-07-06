// app/actions/ai.actions.ts
"use server";

export async function askAquaExpert(chatHistory: { role: "user" | "ai"; content: string }[]) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return { error: "API Key belum terdeteksi. Pastikan GEMINI_API_KEY atau GROQ_API_KEY ada di .env.local" };
    }

    // 🌟 PRIORITAS 1: Menggunakan GROQ (Sangat Cepat & Standar OpenAI)
    if (groqKey) {
      const messages = [
        { 
          role: "system", 
          content: "Kamu adalah AquaExpert AI, asisten spesialis aquascape, ikan hias, dan tanaman air. Jawablah dengan ramah, informatif, gunakan format paragraf/poin yang rapi, dan menggunakan bahasa Indonesia." 
        },
        ...chatHistory.map(msg => ({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.content
        }))
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Anda bisa ganti "mixtral-8x7b-32768" jika ingin lebih pintar
          messages: messages,
          temperature: 0.7
        })
      });

      if (!res.ok) throw new Error("Gagal mengambil respon dari Groq API");
      const data = await res.json();
      return { reply: data.choices[0].message.content };
    }

    // 🌟 PRIORITAS 2: Menggunakan GEMINI API
    if (geminiKey) {
      const contents = chatHistory.map(msg => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "Kamu adalah AquaExpert AI, asisten spesialis aquascape, ikan hias, dan tanaman air. Jawablah dengan ringkas, ramah, dan solutif dalam bahasa Indonesia." }]
          },
          contents: contents,
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!res.ok) throw new Error("Gagal mengambil respon dari Gemini API");
      const data = await res.json();
      return { reply: data.candidates[0].content.parts[0].text };
    }

  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan pada server AI" };
  }
}