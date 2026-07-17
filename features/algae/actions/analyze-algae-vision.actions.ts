// features/algae/actions/analyze-algae-vision.actions.ts
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function analyzeAlgaeImageAction(base64Image: string) {
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY tidak dikonfigurasi di server." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Menggunakan model flash yang cepat
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Membersihkan string base64 dari prefix (data:image/jpeg;base64, dll)
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    // 💡 PROMPT ENGINEERING KHUSUS ALGA AQUASCAPE
    const prompt = `
      Anda adalah ahli biologi akuatik dan aquascaper profesional. 
      Tugas Anda adalah menganalisis foto alga/lumut akuarium ini dan mengkategorikannya berdasarkan 3 parameter utama: Warna, Tekstur, dan Lokasi.

      PENTING: Anda HARUS mengembalikan respons HANYA dalam format JSON yang valid. Jangan gunakan markdown \`\`\`json.
      
      Pilih nilai yang PALING MENDEKATI dari opsi berikut untuk masing-masing parameter:

      1. "color" (Pilih satu):
         - "green" (Hijau biasa)
         - "light_green" (Hijau muda / neon)
         - "dark_green" (Hijau gelap / tua)
         - "blue_green" (Biru kehijauan / Cyanobacteria)
         - "brown" (Coklat / Keemasan / Diatom)
         - "black" (Hitam / BBA)
         - "gray" (Abu-abu / Staghorn mati)
         - "dark_gray" (Abu-abu gelap)
         - "white" (Putih pucat / Jamur kayu)
         - "reddish" (Kemerahan)
         - "" (Kosongkan jika tidak yakin)

      2. "texture" (Pilih satu):
         - "tuft" (Mengelompok seperti kuas / BBA)
         - "hairy" (Seperti rambut pendek / Hair Algae)
         - "long_thread" (Benang panjang menjuntai / Thread Algae)
         - "wiry" (Kaku / Bercabang seperti tanduk rusa / Staghorn)
         - "branching" (Bercabang)
         - "dust" (Debu halus nempel di kaca / GDA)
         - "powdery" (Seperti bedak)
         - "hard_spot" (Titik keras susah dikerok / GSA)
         - "slime" (Berlendir / Lembaran lendir / BGA)
         - "sheet" (Membentuk lembaran)
         - "flat" (Datar menempel)
         - "soft" (Lembut/lunak)
         - "" (Kosongkan jika tidak ada tekstur yang jelas)

      3. "location" (Pilih satu):
         - "glass" (Kaca akuarium)
         - "hardscape" (Batu / Kayu)
         - "substrate" (Pasir / Tanah)
         - "plants" (Menyelimuti tanaman)
         - "leaf_edges" (Hanya di pinggiran daun)
         - "slow_leaves" (Daun tanaman tumbuh lambat seperti Anubias)
         - "moss" (Menyelinap di dalam lumut/moss)
         - "equipment" (Pipa / Filter)
         - "everywhere" (Menyebar di mana-mana)
         - "" (Kosongkan jika tidak jelas)

      Format Output JSON:
      {
        "color": "...",
        "texture": "...",
        "location": "..."
      }
    `;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Ekstraksi JSON (berjaga-jaga jika Gemini mengembalikan markdown block)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Format respons AI tidak valid.");
    }

    const aiData = JSON.parse(jsonMatch[0]);

    return { 
      success: true, 
      aiFilters: {
        color: aiData.color || "",
        texture: aiData.texture || "",
        location: aiData.location || ""
      } 
    };

  } catch (error: any) {
    console.error("Algae Vision Error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan saat memproses gambar alga." };
  }
}