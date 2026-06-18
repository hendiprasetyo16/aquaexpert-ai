// features/aquariums/components/aquarium-helpers.tsx

export const getTankTypeDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Community": "Komunitas (Ikan Campur / Ramah Pemula)",
    "Species Only": "Spesies Tunggal (Species Only)",
    "Shrimp": "Tangki Khusus Udang Hias",
    "Breeding": "Tangki Pemijahan / Perawatan Burayak",
    "Paludarium": "Paludarium (Kombinasi Air & Daratan)"
  };
  return map[type] || type;
};

export const getAquascapeStyleDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Bebas": "Bebas / Tanpa Tema Khusus",
    "Nature": "Gaya Alami (Nature Aquascape)",
    "Dutch": "Gaya Belanda (Fokus Tanaman Berwarna)",
    "Iwagumi": "Iwagumi (Dominan Bebatuan & Karpet)",
    "Biotope": "Biotope (Meniru Habitat Asli Alam)",
    "Blackwater": "Air Gelap (Blackwater / Banyak Daun Ketapang)"
  };
  return map[type] || type;
};

export const getSubstrateDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Aquasoil": "Tanah Khusus Akuarium (Aquasoil)",
    "Sand": "Pasir (Malang / Silika / Kosmik)",
    "Gravel": "Kerikil / Batu Kecil",
    "Bare Bottom": "Tanpa Substrat (Bare Bottom)",
    "Mixed": "Kombinasi (Mixed)"
  };
  return map[type] || type;
};

export const getFilterDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Canister": "Filter Tabung (Canister)",
    "Hang on Back (HOB)": "Filter Gantung (Hang on Back)",
    "Sponge": "Filter Busa (Sponge Filter)",
    "Undergravel": "Filter Bawah Pasir (Undergravel)",
    "Sump": "Filter Bawah Tank (Sump Filter)",
    "Internal": "Filter Celup Dalam (Internal Filter)",
    "None": "Tanpa Filter (Walstad Method)"
  };
  return map[type] || type;
};

export const getLightDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "WRGB LED": "WRGB LED (Khusus Aquascape)",
    "RGB LED": "RGB LED Standar",
    "White LED": "LED Putih Biasa",
    "T5 / T8 Fluorescent": "Lampu Neon T5/T8 (Fluorescent)",
    "Halogen": "Lampu Sorot Halogen",
    "Natural Sunlight": "Sinar Matahari Langsung (Outdoor)",
    "Mixed (Sunlight + Artificial)": "Kombinasi (Sinar Matahari + Lampu)",
    "None": "Tanpa Lampu Khusus"
  };
  return map[type] || type;
};

export const getCO2Desc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Pressurized Cylinder": "Tabung Gas CO2 Bertekanan",
    "DIY (Yeast/Citric)": "CO2 Rakitan (Ragi / Citric Acid)",
    "Liquid Carbon": "Karbon Cair (Liquid Carbon)",
    "None": "Tanpa Suplai CO2 Tambahan"
  };
  return map[type] || type;
};

export const getFertilizerDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!type) return "-";
  if (lang === "en") return type;
  const map: Record<string, string> = {
    "Estimative Index (EI)": "Metode Dosis Tinggi (Estimative Index)",
    "PPS-Pro": "Metode Harian Ringan (PPS-Pro)",
    "All-in-One (Liquid)": "Pupuk Cair Praktis (All-in-One)",
    "Root Tabs Only": "Hanya Pupuk Tancap Dasar",
    "Custom": "Racikan / Jadwal Khusus",
    "None": "Tanpa Pemupukan"
  };
  return map[type] || type;
};

// ============================================================================
// DICTIONARY INTERFACES & CALCULATIONS
// ============================================================================

export interface AquariumDictionary {
  dashboard?: {
    title: string;
    subtitle: string;
    btnAdd: string;
    emptyTitle: string;
    emptyDesc: string;
  };
  card?: {
    primary: string;
    setup: string;
    volume: string;
    age: string; // FIX: Tambahkan properti age
    plants: string;
    fishes: string;
    primaryBadge: string; // FIX: Tambahkan properti primaryBadge
    days: string;   // FIX: Tambahkan properti days
    months: string; // FIX: Tambahkan properti months
    years: string;  // FIX: Tambahkan properti years
  };
  detail?: {
    btnBack: string;
    btnEdit: string;
    btnDelete: string;
    btnArchive: string;
    btnMakePrimary: string;
    primaryBadge: string;
    specs: string;
    plants: string;
    fishes: string;
    equipment: string;
    filter: string;
    light: string;
    co2: string;
    maintenance: string;
    waterChange: string;
    fertilizer: string;
    tabs: {
      params: string;
      inventory: string;
      tasks: string;
      ai: string;
    };
  };
  wizard?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    btnNext: string;
    btnPrev: string;
    btnSave: string;
    btnCancel: string;
    labels: Record<string, string>;
    hints: Record<string, string>;
  };
}

export const calculateTankAge = (setupDateStr: string, dict: AquariumDictionary, lang: "id" | "en" = "id") => {
  if (!setupDateStr) return "-";
  
  const setupDate = new Date(setupDateStr);
  const today = new Date();

  if (setupDate > today) return lang === "id" ? "0 hari" : "0 days";

  const diffTime = today.getTime() - setupDate.getTime(); 
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const daysTxt = dict?.card?.days || (lang === "id" ? "hari" : "days");
  const monthsTxt = dict?.card?.months || (lang === "id" ? "bulan" : "months");
  const yearsTxt = dict?.card?.years || (lang === "id" ? "tahun" : "years");

  if (diffDays < 30) {
    return `${diffDays} ${daysTxt}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    const remDays = diffDays % 30;
    return remDays > 0 ? `${months} ${monthsTxt}, ${remDays} ${daysTxt}` : `${months} ${monthsTxt}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remMonths = Math.floor((diffDays % 365) / 30);
    return remMonths > 0 ? `${years} ${yearsTxt}, ${remMonths} ${monthsTxt}` : `${years} ${yearsTxt}`;
  }
};