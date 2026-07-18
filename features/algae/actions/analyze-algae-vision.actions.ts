// features/algae/actions/analyze-algae-vision.actions.ts
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeAlgaeImageAction(base64Image: string) {
  // 💡 Seragam dengan file ikan: Pengecekan kunci dummy
  const GEMINI_KEY = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
  const GROQ_KEY = process.env.GROQ_API_KEY?.includes("your_") ? "" : process.env.GROQ_API_KEY?.replace(/['"]/g, '').trim();
  const OR_KEY = process.env.OPENROUTER_API_KEY?.includes("your_") ? "" : process.env.OPENROUTER_API_KEY?.replace(/['"]/g, '').trim();

  if (!GEMINI_KEY) {
    return { success: false, error: "API Key belum dikonfigurasi di server." };
  }

  // Pisahkan header dan data base64 murni
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  // Rekonstruksi Data URI penuh untuk format Groq/OpenRouter
  const fullDataUri = base64Image.startsWith("data:") ? base64Image : `data:image/jpeg;base64,${base64Image}`;

  const prompt = `Anda adalah ahli biologi akuatik dan aquascaper profesional. 
Tugas Anda adalah menganalisis foto alga/lumut akuarium ini dan mengkategorikannya berdasarkan 3 parameter utama: Warna, Tekstur, dan Lokasi.

PENTING: Anda HARUS mengembalikan respons HANYA dalam format JSON yang valid tanpa markdown apapun.
      
Pilih nilai yang PALING MENDEKATI dari opsi berikut:
1. "color": "green", "light_green", "dark_green", "blue_green", "brown", "black", "gray", "dark_gray", "white", "reddish", atau ""
2. "texture": "tuft", "hairy", "long_thread", "wiry", "branching", "dust", "powdery", "hard_spot", "slime", "sheet", "flat", "soft", atau ""
3. "location": "glass", "hardscape", "substrate", "plants", "leaf_edges", "slow_leaves", "moss", "equipment", "everywhere", atau ""

Format Output JSON yang diwajibkan:
{
  "color": "...",
  "texture": "...",
  "location": "..."
}`;

  // Fungsi utilitas untuk membersihkan dan mengekstrak JSON Object
  const extractJSON = (text: string) => {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Format respons AI bukan JSON.");
    const aiData = JSON.parse(jsonMatch[0]);
    return {
      color: aiData.color || "",
      texture: aiData.texture || "",
      location: aiData.location || ""
    };
  };

  // ==========================================
  // 1. PERCOBAAN PERTAMA: GEMINI VISION
  // ==========================================
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imageParts = [{ inlineData: { data: base64Data, mimeType: "image/jpeg" } }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    return { success: true, aiFilters: extractJSON(responseText) };

  } catch (geminiError) {
    console.warn("⚠️ Gemini Gagal di Algae Vision. Mencoba Groq...", (geminiError as Error).message);

    // ==========================================
    // 2. PERCOBAAN KEDUA: GROQ VISION (BACKUP 1)
    // ==========================================
    try {
      if (!GROQ_KEY) throw new Error("GROQ_KEY kosong atau tidak valid.");

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: fullDataUri } }
            ]
          }],
          temperature: 0.1
        }),
      });

      // 💡 Seragam dengan file ikan: Ekstrak detail pesan error
      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq HTTP ${groqRes.status}: ${errText}`);
      }
      
      const groqData = await groqRes.json();
      const groqText = groqData.choices[0].message.content;

      return { success: true, aiFilters: extractJSON(groqText) };

    } catch (groqError) {
      console.warn("⚠️ Groq Gagal di Algae Vision. Mencoba OpenRouter...", (groqError as Error).message);

      // ==========================================
      // 3. PERCOBAAN KETIGA: OPENROUTER VISION (BACKUP 2)
      // ==========================================
      try {
        if (!OR_KEY) throw new Error("OPENROUTER_KEY kosong atau tidak valid.");

        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          // 💡 Seragam dengan file ikan: Penambahan Header Wajib
          headers: { 
            "Authorization": `Bearer ${OR_KEY}`, 
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aquaexpert.vercel.app", 
            "X-Title": "AquaExpert AI"
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.2-11b-vision-instruct:free", 
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: fullDataUri } }
              ]
            }],
            temperature: 0.1
          }),
        });

        // 💡 Seragam dengan file ikan: Ekstrak detail pesan error
        if (!orRes.ok) {
          const errText = await orRes.text();
          throw new Error(`OpenRouter HTTP ${orRes.status}: ${errText}`);
        }
        
        const orData = await orRes.json();
        const orText = orData.choices[0].message.content;

        return { success: true, aiFilters: extractJSON(orText) };

      } catch (orError) {
        // 💡 Seragam dengan file ikan: Pesan error terminal yang lebih jelas
        console.error("❌ SEMUA AI GAGAL (Algae Vision):", (orError as Error).message);
        return { success: false, error: "Semua server AI sedang sibuk. Silakan coba sebentar lagi." };
      }
    }
  }
}