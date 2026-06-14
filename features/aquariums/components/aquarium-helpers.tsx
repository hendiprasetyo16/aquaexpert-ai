// features/aquariums/components/aquarium-helpers.tsx

export const getTankTypeDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  
  const map: Record<string, string> = {
    "Community": "Komunitas (Ikan Campur)",
    "Nature": "Gaya Alami (Nature)",
    "Dutch": "Gaya Belanda (Dutch)",
    "Iwagumi": "Iwagumi (Padang Batu)",
    "Biotope": "Biotope (Spesifik Habitat)",
    "Shrimp": "Tangki Udang Hias",
    "Breeding": "Tangki Pemijahan (Breeding)",
    "Paludarium": "Paludarium (Air & Darat)",
    "Blackwater": "Air Gelap (Blackwater)"
  };
  return map[type] || type;
};

export const getSubstrateDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  
  const map: Record<string, string> = {
    "Aquasoil": "Tanah Akuarium (Aquasoil)",
    "Sand": "Pasir Silika / Kosmetik",
    "Gravel": "Kerikil / Batu Kecil",
    "Bare Bottom": "Tanpa Substrat (Bare Bottom)",
    "Mixed": "Campuran (Mixed)"
  };
  return map[type] || type;
};

export const getFilterDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  
  const map: Record<string, string> = {
    "Canister": "Filter Tabung (Canister)",
    "Hang on Back (HOB)": "Filter Gantung (HOB)",
    "Sponge": "Filter Busa (Sponge)",
    "Undergravel": "Filter Dasar (Undergravel)",
    "Sump": "Sump Filter Bawah",
    "Internal": "Filter Celup (Internal)",
    "None": "Tanpa Filter"
  };
  return map[type] || type;
};

export const getLightDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  
  const map: Record<string, string> = {
    "WRGB LED": "LED WRGB (Spektrum Penuh)",
    "RGB LED": "LED RGB",
    "White LED": "LED Putih Terang",
    "T5 / T8 Fluorescent": "Lampu Neon (T5/T8)",
    "Halogen": "Lampu Halogen",
    "Natural Sunlight": "Sinar Matahari Alami",
    "None": "Tanpa Lampu Khusus"
  };
  return map[type] || type;
};

export const getCO2Desc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  
  const map: Record<string, string> = {
    "Pressurized Cylinder": "Tabung Gas Bertekanan",
    "DIY (Yeast/Citric)": "DIY (Ragi/Sitrun)",
    "Liquid Carbon": "Karbon Cair (Liquid)",
    "None": "Tanpa Injeksi CO2"
  };
  return map[type] || type;
};

export const getFertilizerDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  
  const map: Record<string, string> = {
    "Estimative Index (EI)": "Metode EI (Estimative Index)",
    "PPS-Pro": "Metode PPS-Pro",
    "All-in-One (Liquid)": "Pupuk Cair All-in-One",
    "Root Tabs Only": "Hanya Pupuk Tancap",
    "Custom": "Dosis Kustom",
    "None": "Tanpa Pupuk"
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

// --- STRICT TYPING UNTUK DICTIONARY (BEBAS DARI 'ANY') ---
// features/aquariums/components/aquarium-helpers.tsx

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
  // TIDAK ADA LAGI 'any'!
  wizard?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    btnNext: string;
    btnPrev: string;
    btnSave: string;
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

  // Math.abs dihapus agar tidak menjadi positif jika masa depan
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