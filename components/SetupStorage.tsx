"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Daftar 50 slug tanaman yang sudah diurutkan
const plantSlugs = [
  "alternanthera-reineckii-mini", "ammannia-gracilis", "anubias-nana", "anubias-nana-petite", 
  "aponogeton-madagascariensis", "bacopa-caroliniana", "bolbitis-heudelotii", "bucephalandra-green-wavy", 
  "cabomba-furcata", "crinum-calamistratum", "cryptocoryne-wendtii-brown", "cryptocoryne-wendtii-green", 
  "didiplis-diandra", "dwarf-hairgrass", "eleocharis-parvula", "glossostigma-elatinoides", 
  "hc-cuba", "helanthium-tenellum", "hydrocotyle-tripartita-japan", "hygrophila-corymbosa", 
  "hygrophila-difformis", "hygrophila-pinnatifida", "java-fern", "java-fern-trident", 
  "lilaeopsis-brasiliensis", "limnophila-aromatica", "limnophila-sessiliflora", "ludwigia-arcuata", 
  "ludwigia-palustris", "ludwigia-repens", "ludwigia-super-red", "marsilea-crenata", 
  "marsilea-hirsuta", "monte-carlo", "myriophyllum-mattogrossense", "pogostemon-erectus", 
  "pogostemon-helferi", "proserpinaca-palustris", "rotala-blood-red", "rotala-colorata", 
  "rotala-green", "rotala-hra", "rotala-macrandra", "rotala-orange-juice", "rotala-rotundifolia", 
  "rotala-wallichii", "staurogyne-repens", "utricularia-graminifolia", "vallisneria-nana", 
  "vallisneria-spiralis"
];

export default function SetupStorage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleCreateFolders = async () => {
    setLoading(true);
    setProgress(0);
    const supabase = createClient();

    // Membuat file kosong berukuran 0 byte sebagai "Pancingan" agar folder terbentuk
    const emptyFile = new File([""], ".keep", { type: "text/plain" });

    for (let i = 0; i < plantSlugs.length; i++) {
      const slug = plantSlugs[i];
      const filePath = `${slug}/.keep`; // Ini akan otomatis membuat folder sesuai nama slug

      const { error } = await supabase.storage
        .from("plant-images") // Pastikan nama bucket Anda benar
        .upload(filePath, emptyFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error(`Gagal membuat folder untuk ${slug}:`, error.message);
      }
      
      setProgress(i + 1);
    }

    alert("Selesai! 50 Folder berhasil dibuat di Supabase Storage.");
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-lg">
      <h3 className="mb-4 text-xl font-bold text-slate-100">Setup Supabase Storage</h3>
      <p className="mb-6 text-sm text-slate-400">
        Klik tombol di bawah untuk membuat 50 folder tanaman secara otomatis di bucket <strong>plant-images</strong>.
      </p>
      
      <button
        onClick={handleCreateFolders}
        disabled={loading}
        className="rounded-md bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
      >
        {loading ? `Memproses... (${progress}/50)` : "Buat 50 Folder Sekarang"}
      </button>
    </div>
  );
}