// features/aquariums/components/aquarium-helpers.tsx

export const getTankTypeDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Community": "Komunitas (Ikan Campur / Ramah Pemula)",
    "Nature": "Gaya Alami (Nature Aquascape)",
    "Dutch": "Gaya Belanda (Banyak Tanaman Berwarna)",
    "Iwagumi": "Iwagumi (Dominan Bebatuan & Karpet)",
    "Biotope": "Biotope (Meniru Habitat Asli Alam)",
    "Shrimp": "Tangki Khusus Udang Hias (Neocaridina/Caridina)",
    "Breeding": "Tangki Pemijahan / Perawatan Burayak",
    "Paludarium": "Paludarium (Kombinasi Air & Daratan)",
    "Blackwater": "Air Gelap (Blackwater / Banyak Daun Ketapang)"
  };
  return map[type] || type;
};

export const getSubstrateDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Aquasoil": "Tanah Khusus Akuarium (Aquasoil)",
    "Sand": "Pasir Halus (Silika / Pasir Malang Halus)",
    "Gravel": "Kerikil Kasar (Gravel / Pasir Malang Kasar)",
    "Bare Bottom": "Tanpa Substrat (Dasar Kaca Kosong)",
    "Mixed": "Campuran (Misal: Pasir di depan, Soil di belakang)"
  };
  return map[type] || type;
};

export const getFilterDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Canister": "Filter Tabung (Canister Pabrikan / DIY Pipa PVC)",
    "Hang on Back (HOB)": "Filter Gantung (Hang-On Back)",
    "Sponge": "Filter Busa (Sponge Filter ditiup Aerator)",
    "Undergravel": "Filter Dasar (Undergravel Filter / UGF)",
    "Sump": "Sump Filter (Filter Kotak Kaca di Bawah)",
    "Internal": "Filter Celup (Powerhead + Busa di dalam air)",
    "None": "Tanpa Filter (Hanya Tanaman / Walstad)"
  };
  return map[type] || type;
};

export const getLightDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "WRGB LED": "LED WRGB (Lampu Khusus Aquascape / Berwarna)",
    "RGB LED": "LED RGB (Lampu Merah-Hijau-Biru standar)",
    "White LED": "LED Putih Terang (Lampu Biasa / HPL)",
    "T5 / T8 Fluorescent": "Lampu Neon Tabung (T5 / T8)",
    "Halogen": "Lampu Halogen / Sorot",
    "Natural Sunlight": "Sinar Matahari Alami (Outdoor / Teras)",
    "Mixed (Sunlight + Artificial)": "Kombinasi (Matahari + Lampu Buatan Malam)", // <--- OPSI BARU
    "None": "Tanpa Lampu Khusus"
  };
  return map[type] || type;
};

export const getCO2Desc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Pressurized Cylinder": "Tabung Gas Bertekanan (Besi / Alumunium)",
    "DIY (Yeast/Citric)": "CO2 Rakitan / DIY (Sitrun + Baking Soda / Ragi)",
    "Liquid Carbon": "Karbon Cair (Pupuk Cair Pengganti CO2)",
    "None": "Tanpa Injeksi CO2 (Low-Tech)"
  };
  return map[type] || type;
};

export const getFertilizerDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Estimative Index (EI)": "Metode EI (Pupuk Cair Dosis Tinggi + Kuras Air)",
    "PPS-Pro": "Metode PPS-Pro (Pupuk Cair Dosis Harian Presisi)",
    "All-in-One (Liquid)": "Pupuk Cair Botolan Praktis (All-in-One)",
    "Root Tabs Only": "Hanya Pupuk Tancap (Kapsul Akar di Pasir/Soil)",
    "Custom": "Dosis Kustom (Racikan Pupuk Sendiri)",
    "None": "Tanpa Pupuk Tambahan"
  };
  return map[type] || type;
};

export const getHeaterDesc = (enabled: boolean | null | undefined, lang: "id" | "en" = "id") => {
  if (enabled === null || enabled === undefined) return "-";
  if (lang === "id") {
    return enabled ? "Heater Aktif" : "Tanpa Heater";
  } else {
    return enabled ? "Heater Active" : "No Heater";
  }
};

// ... (Bawahnya biarkan interface AquariumDictionary dan calculateTankAge tetap sama seperti sebelumnya) ...
// --- STRICT TYPING UNTUK DICTIONARY ---
export interface AquariumDictionary {
  dashboard?: {
    title?: string;
    subtitle?: string;
    btnAdd?: string;
    emptyTitle?: string;
    emptyDesc?: string;
  };
  card?: {
    volume?: string;
    age?: string;
    plants?: string;
    fishes?: string;
    primaryBadge?: string;
    days?: string;
    months?: string;
    years?: string;
  };
  wizard?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    btnNext: string;
    btnPrev: string;
    btnSave: string;
    btnCancel: string; // <--- TAMBAHKAN BARIS INI
    labels: Record<string, string>;
    hints: Record<string, string>;
  };
}

// --- FUNGSI MENGHITUNG UMUR OTOMATIS DARI TANGGAL SETUP ---
export const calculateTankAge = (
  setupDateStr: string, 
  dict: AquariumDictionary, 
  lang: "id" | "en" = "id"
) => {
  if (!setupDateStr) return "-";
  
  const setupDate = new Date(setupDateStr);
  const today = new Date();

  // VALIDASI BUG: Jika tanggal setup di masa depan
  if (setupDate > today) return lang === "id" ? "0 hari" : "0 days";

  const diffTime = today.getTime() - setupDate.getTime(); 
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const daysTxt = dict?.card?.days || (lang === "id" ? "hari" : "days");
  const monthsTxt = dict?.card?.months || (lang === "id" ? "bulan" : "months");
  const yearsTxt = dict?.card?.years || (lang === "id" ? "tahun" : "years");

  if (diffDays < 30) {
    return `${diffDays} ${daysTxt}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${monthsTxt}`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${yearsTxt}`;
};