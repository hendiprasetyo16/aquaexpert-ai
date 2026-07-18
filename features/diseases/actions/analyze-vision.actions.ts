// features/disease-expert/actions/analyze-vision.actions.ts
"use server";

interface SymptomMinimal {
  id: string;
  name_id: string; 
  name_en: string;
}

export async function analyzeFishImageAction(
  base64Image: string,
  availableSymptoms: SymptomMinimal[]
): Promise<{ success: boolean; symptomIds?: string[]; error?: string }> {
  
  const GEMINI_KEY = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
  // 💡 Cek apakah API Key benar-benar ada dan BUKAN teks bawaan (placeholder)
  const GROQ_KEY = process.env.GROQ_API_KEY?.includes("your_") ? "" : process.env.GROQ_API_KEY?.replace(/['"]/g, '').trim();
  const OR_KEY = process.env.OPENROUTER_API_KEY?.includes("your_") ? "" : process.env.OPENROUTER_API_KEY?.replace(/['"]/g, '').trim();

  if (!GEMINI_KEY) return { success: false, error: "API Key Gemini belum dikonfigurasi." };

  const [header, base64Data] = base64Image.split(",");
  const mimeType = header.split(";")[0].split(":")[1] || "image/jpeg";
  const fullDataUri = base64Image.startsWith("data:") ? base64Image : `data:image/jpeg;base64,${base64Image}`;

  const systemInstructionText = `Anda adalah Dokter Hewan Akuatik Ahli (Ichthyologist).
Tugas Anda mendeteksi penyakit/luka/gejala klinis pada foto ikan yang dikirimkan.
Berikut daftar gejala di database kami: ${JSON.stringify(availableSymptoms)}

ATURAN WAJIB:
1. Cocokkan apa yang Anda lihat di foto dengan daftar gejala di atas.
2. Balas HANYA dengan format Array JSON murni berisi 'id' gejala (contoh: ["sym-1", "sym-2"]).
3. Jika ikan sehat atau tidak ada gejala yang cocok, balas dengan array kosong: []
4. JANGAN menulis teks apapun selain Array JSON.`;

  const extractJSONArray = (text: string): string[] => {
    const cleanStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleanStr.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return []; 
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  };

  // ==========================================
  // 1. PERCOBAAN PERTAMA: GEMINI VISION 
  // ==========================================
  try {
    const payload = {
      systemInstruction: { parts: [{ text: systemInstructionText }] },
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: "Analisis foto ikan ini dan kembalikan ID gejalanya HANYA dalam format Array JSON." }
        ]
      }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini HTTP Error ${response.status}: ${errText}`);
    }
    
    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const rawText = data.candidates[0].content.parts[0].text;
      return { success: true, symptomIds: extractJSONArray(rawText) };
    }
    return { success: true, symptomIds: [] };

  } catch (geminiError) {
    console.warn("⚠️ Gemini Gagal di Disease Vision. Mencoba Groq...", (geminiError as Error).message);

    // ==========================================
    // 2. PERCOBAAN KEDUA: GROQ VISION
    // ==========================================
    try {
      if (!GROQ_KEY) throw new Error("GROQ_KEY kosong atau tidak valid.");

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages: [
            { 
              // 💡 PERBAIKAN: System prompt digabung ke User agar model Vision tidak error
              role: "user", 
              content: [
                { type: "text", text: `${systemInstructionText}\n\nAnalisis foto ikan ini.` },
                { type: "image_url", image_url: { url: fullDataUri } }
              ] 
            }
          ],
          temperature: 0.1
        }),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq HTTP ${groqRes.status}: ${errText}`);
      }
      
      const groqData = await groqRes.json();
      const groqText = groqData.choices[0].message.content;
      return { success: true, symptomIds: extractJSONArray(groqText) };

    } catch (groqError) {
      console.warn("⚠️ Groq Gagal di Disease Vision. Mencoba OpenRouter...", (groqError as Error).message);

      // ==========================================
      // 3. PERCOBAAN KETIGA: OPENROUTER VISION
      // ==========================================
      try {
        if (!OR_KEY) throw new Error("OPENROUTER_KEY kosong atau tidak valid.");

        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${OR_KEY}`, 
            "Content-Type": "application/json",
            // 💡 PERBAIKAN: Header wajib untuk OpenRouter model gratis
            "HTTP-Referer": "https://aquaexpert.vercel.app", 
            "X-Title": "AquaExpert AI"
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.2-11b-vision-instruct:free",
            messages: [
              { 
                role: "user", 
                content: [
                  { type: "text", text: `${systemInstructionText}\n\nAnalisis foto ikan ini.` },
                  { type: "image_url", image_url: { url: fullDataUri } }
                ] 
              }
            ],
            temperature: 0.1
          }),
        });

        if (!orRes.ok) {
          const errText = await orRes.text();
          throw new Error(`OpenRouter HTTP ${orRes.status}: ${errText}`);
        }
        
        const orData = await orRes.json();
        const orText = orData.choices[0].message.content;
        return { success: true, symptomIds: extractJSONArray(orText) };

      } catch (orError) {
        console.error("❌ SEMUA AI GAGAL (Disease Vision):", (orError as Error).message);
        return { success: false, error: "Semua server AI sibuk. Pastikan foto terlihat jelas dan coba lagi." };
      }
    }
  }
}