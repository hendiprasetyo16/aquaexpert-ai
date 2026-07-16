// features/disease-expert/actions/analyze-vision.actions.ts
"use server";

interface SymptomMinimal {
  id: string;
  name_id: string; // Menggunakan nama bahasa Indonesia agar AI lebih paham
  name_en: string;
}

export async function analyzeFishImageAction(
  base64Image: string,
  availableSymptoms: SymptomMinimal[]
): Promise<{ success: boolean; symptomIds?: string[]; error?: string }> {
  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
    if (!GEMINI_KEY) throw new Error("API Key Gemini belum dikonfigurasi.");

    // 1. Bersihkan prefix Base64 (pisahkan "data:image/jpeg;base64," dari datanya)
    const [header, base64Data] = base64Image.split(",");
    if (!base64Data) throw new Error("Format gambar Base64 tidak valid.");
    
    // Ambil MimeType (contoh: image/jpeg, image/png)
    const mimeType = header.split(";")[0].split(":")[1] || "image/jpeg";

    // 2. Siapkan Instruksi Sistem (Prompt)
    const systemInstructionText = `Anda adalah Dokter Hewan Akuatik Ahli (Ichthyologist).
Tugas Anda mendeteksi penyakit/luka/gejala klinis pada foto ikan yang dikirimkan.
Berikut daftar gejala di database kami: ${JSON.stringify(availableSymptoms)}

ATURAN WAJIB:
1. Cocokkan apa yang Anda lihat di foto dengan daftar gejala di atas.
2. Balas HANYA dengan format Array JSON murni berisi 'id' gejala (contoh: ["sym-1", "sym-2"]).
3. Jika ikan sehat atau tidak ada gejala yang cocok, balas dengan array kosong: []
4. JANGAN menulis teks apapun selain JSON.`;

    // 3. Susun Payload REST API (Gaya kode Bapak)
    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            { text: "Analisis foto ikan ini dan kembalikan ID gejalanya HANYA dalam format Array JSON." }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Suhu rendah agar tidak berimajinasi (halusinasi)
        responseMimeType: "application/json" // 💡 Ini kunci agar Gemini dipaksa membalas format JSON
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    // 4. Eksekusi Fetch (Sama persis seperti di ai.actions.ts)
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP Error dari Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    // 5. Ekstrak Balasan JSON
    if (data.candidates && data.candidates.length > 0) {
      const rawText = data.candidates[0].content.parts[0].text;
      
      // Bersihkan jika Gemini tidak sengaja menyertakan markdown ```json
      const cleanJsonString = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const detectedSymptomIds: string[] = JSON.parse(cleanJsonString);
      
      return { 
        success: true, 
        symptomIds: Array.isArray(detectedSymptomIds) ? detectedSymptomIds : [] 
      };
    }

    return { success: true, symptomIds: [] };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Kesalahan tidak dikenal.";
    console.error("[VISION AI ERROR]", errorMsg);
    return { success: false, error: "Gagal menganalisis gambar. Pastikan foto terlihat jelas." };
  }
}