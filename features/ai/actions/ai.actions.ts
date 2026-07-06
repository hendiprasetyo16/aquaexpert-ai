// features/ai/actions/ai.actions.ts
"use server";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const SYSTEM_PROMPT = `Anda adalah AquaExpert AI, asisten cerdas spesialis Aquascape, ikan hias, tanaman air, dan parameter kualitas air. 
Tugas Anda adalah memberikan jawaban yang profesional, akurat, mudah dipahami, dan solutif. Gunakan format Markdown (bold, list, bullet) agar mudah dibaca.`;

export async function askAquaExpert(history: ChatMessage[]) {
  let groqDiagnostic = "";
  let geminiDiagnostic = "";

  try {
    const GROQ_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.replace(/['"]/g, '').trim() : null;
    const GEMINI_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : null;

    if (!GROQ_KEY && !GEMINI_KEY) {
      return { error: "API Key Kosong. Vercel tidak mendeteksi Environment Variables." };
    }

    // ====================================================================
    // 1. UJI COBA GROQ API
    // ====================================================================
    if (GROQ_KEY) {
      try {
        const groqMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
        ];

        const groqRes = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
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
          // X-RAY: Tangkap alasan asli Groq menolak
          const errText = await groqRes.text();
          groqDiagnostic = `(Status ${groqRes.status}) ${errText}`;
        }
      } catch (e: any) {
        groqDiagnostic = `Fetch Error: ${e.message}`;
      }
    } else {
      groqDiagnostic = "API Key tidak dipasang";
    }

    // ====================================================================
    // 2. UJI COBA GEMINI API
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
          // X-RAY: Tangkap alasan asli Google menolak
          const errText = await geminiRes.text();
          geminiDiagnostic = `(Status ${geminiRes.status}) ${errText}`;
        }
      } catch (e: any) {
        geminiDiagnostic = `Fetch Error: ${e.message}`;
      }
    } else {
      geminiDiagnostic = "API Key tidak dipasang";
    }

    // Jika kode sampai ke titik ini, berarti kedua API GAGAL total.
    // Kita tembakkan laporannya langsung ke layar chat Bapak!
    return { 
      error: `[DIAGNOSTIK SISTEM] \n\n🔴 GROQ: ${groqDiagnostic} \n\n🔵 GEMINI: ${geminiDiagnostic}` 
    };

  } catch (error: any) {
    return { error: `[CRITICAL ERROR FATAL]: ${error.message}` };
  }
}