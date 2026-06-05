"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Daftar 120 slug tanaman, di-ekstrak akurat dari AquaExpert_120_Knowledge_Base_V3.csv
const plantSlugs = [
  "alternanthera-reineckii-mini", "amazon-frogbit", "amazon-sword", "ammannia-gracilis", 
  "ammannia-pedicellata", "anubias-barteri", "anubias-coffeefolia", "anubias-nana", 
  "anubias-nana-petite", "aponogeton-madagascariensis", "bacopa-caroliniana", "blyxa-japonica", 
  "bolbitis-heudelotii", "bucephalandra-brownie", "bucephalandra-green-wavy", "bucephalandra-kedagang", 
  "bucephalandra-skeleton-king", "cabomba-caroliniana", "cabomba-furcata", "cardinal-plant", 
  "ceratophyllum-demersum", "christmas-moss", "corkscrew-vallisneria", "crinum-calamistratum", 
  "cryptocoryne-balansae", "cryptocoryne-beckettii", "cryptocoryne-flamingo", "cryptocoryne-lutea", 
  "cryptocoryne-parva", "cryptocoryne-spiralis", "cryptocoryne-wendtii-brown", "cryptocoryne-wendtii-green", 
  "cyperus-helferi", "didiplis-diandra", "dwarf-hairgrass", "egeria-densa", "elatine-hydropiper", 
  "eleocharis-parvula", "eriocaulon-cinereum", "fissidens-fontanus", "flame-moss", "giant-hygro", 
  "glossostigma-elatinoides", "hc-cuba", "helanthium-tenellum", "hydrocotyle-tripartita-japan", 
  "hygrophila-corymbosa", "hygrophila-difformis", "hygrophila-pinnatifida", "hygrophila-polysperma", 
  "java-fern", "java-fern-narrow", "java-fern-trident", "java-fern-windelov", "java-moss", 
  "lagenandra-meeboldii-red", "lilaeopsis-brasiliensis", "limnophila-aromatica", "limnophila-hippuridoides", 
  "limnophila-sessiliflora", "ludwigia-arcuata", "ludwigia-brevipes", "ludwigia-glandulosa", 
  "ludwigia-inclinata", "ludwigia-palustris", "ludwigia-repens", "ludwigia-super-red", "marsilea-crenata", 
  "marsilea-hirsuta", "micranthemum-umbrosum", "mini-pellia", "monte-carlo", "murdannia-keisak", 
  "myriophyllum-mattogrossense", "myriophyllum-tuberculatum", "pogostemon-erectus", "pogostemon-helferi", 
  "proserpinaca-palustris", "red-root-floater", "red-tiger-lotus", "rotala-blood-red", "rotala-colorata", 
  "rotala-green", "rotala-hra", "rotala-indica", "rotala-macrandra", "rotala-nanjenshan", 
  "rotala-orange-juice", "rotala-rotundifolia", "rotala-wallichii", "sagittaria-subulata", "salvinia-natans", 
  "staurogyne-repens", "syngonanthus-belem", "taiwan-moss", "tonina-fluviatilis", "utricularia-graminifolia", 
  "vallisneria-nana", "vallisneria-spiralis", "water-lettuce", "weeping-moss", "bacopa-monnieri", 
  "echinodorus-ozelot", "pearl-weed", "riccia-fluitans", "lemna-minor", "hydrocotyle-verticillata", 
  "bucephalandra-catherinae", "anubias-nana-pangolino", "ludwigia-rubin", "rotala-bonsai", 
  "hygrophila-araguaia", "eriocaulon-polaris", "cryptocoryne-undulata", "bucephalandra-deep-blue", 
  "blyxa-aubertii", "rotala-macrandra-mini", "staurogyne-porto-velho", "limnobium-spongia", "fissidens-nobilis"
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

    alert(`Selesai! ${plantSlugs.length} Folder berhasil dibuat di Supabase Storage.`);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-lg">
      <h3 className="mb-4 text-xl font-bold text-slate-100">Setup Supabase Storage V3</h3>
      <p className="mb-6 text-sm text-slate-400">
        Klik tombol di bawah untuk membuat {plantSlugs.length} folder tanaman secara otomatis di bucket <strong>plant-images</strong>.
      </p>
      
      <button
        onClick={handleCreateFolders}
        disabled={loading}
        className="rounded-md bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
      >
        {loading ? `Memproses... (${progress}/${plantSlugs.length})` : `Buat ${plantSlugs.length} Folder Sekarang`}
      </button>
    </div>
  );
}