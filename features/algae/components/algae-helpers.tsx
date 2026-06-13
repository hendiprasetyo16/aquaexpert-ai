// features/algae/components/algae-helpers.tsx

export const getAlgaeDifficultyDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Mudah Diatasi";
    if (l === "medium") return "Lumayan Bandel";
    if (l === "hard") return "Sangat Sulit (Butuh Waktu)";
  } else {
    if (l === "easy") return "Easy to Treat";
    if (l === "medium") return "Moderately Stubborn";
    if (l === "hard") return "Very Difficult (Takes Time)";
  }
  return level;
};

export const getSeverityDesc = (severity: number | null | undefined, lang: "id" | "en" = "id") => {
  if (severity === undefined || severity === null) return "-";
  if (severity >= 4) return lang === "id" ? "Bahaya Tinggi" : "High Risk";
  if (severity === 3) return lang === "id" ? "Risiko Sedang" : "Medium Risk";
  return lang === "id" ? "Risiko Rendah" : "Low Risk";
};

// --- FUNGSI BARU: PENERJEMAH TAG SISTEM PAKAR ALGAE ---
export const getAlgaeTagDesc = (tag: string, lang: "id" | "en" = "id") => {
  const t = tag.toLowerCase();
  if (lang === "id") {
    // Colors
    if (t === "green") return "Hijau";
    if (t === "brown") return "Coklat";
    if (t === "black") return "Hitam";
    if (t === "gray") return "Abu-abu";
    if (t === "white") return "Putih";
    if (t === "light_green") return "Hijau Muda";
    if (t === "blue_green") return "Biru Kehijauan";
    if (t === "dark_green") return "Hijau Gelap";
    if (t === "dark_gray") return "Abu-abu Gelap";
    if (t === "reddish") return "Kemerahan";

    // Textures
    if (t === "tuft") return "Mengelompok (Kuas)";
    if (t === "hairy") return "Seperti Rambut";
    if (t === "dust") return "Serbuk / Berdebu";
    if (t === "hard_spot") return "Titik Keras";
    if (t === "slime") return "Berlendir";
    if (t === "branching") return "Bercabang";
    if (t === "brush") return "Seperti Sikat";
    if (t === "flat") return "Datar / Ceper";
    if (t === "powdery") return "Seperti Bedak";
    if (t === "easily_wiped") return "Mudah Diusap";
    if (t === "wiry") return "Kaku / Seperti Kawat";
    if (t === "long_thread") return "Benang Panjang";
    if (t === "soft") return "Lembut";
    if (t === "sheet") return "Membentuk Lembaran";
    if (t === "smelly") return "Berbau Busuk";

    // Locations
    if (t === "glass") return "Kaca Akuarium";
    if (t === "hardscape") return "Batu / Kayu";
    if (t === "leaf_edges") return "Pinggiran Daun";
    if (t === "plants") return "Permukaan Tanaman";
    if (t === "substrate") return "Pasir / Substrat";
    if (t === "slow_leaves") return "Daun Tumbuh Lambat";
    if (t === "equipment") return "Pipa / Filter";
    if (t === "moss") return "Di dalam Lumut";
    if (t === "everywhere") return "Di Seluruh Tank";
    if (t === "high_flow") return "Area Arus Kencang";

    // Triggers
    if (t === "new_tank") return "Akuarium Baru (< 2 bln)";
    if (t === "co2_fluctuation") return "CO2 Tidak Stabil";
    if (t === "high_light") return "Lampu Terlalu Terang";
    if (t === "poor_circulation") return "Arus Air Buruk";
    if (t === "nutrient_imbalance") return "Nutrisi Tidak Seimbang";
    if (t === "low_phosphate") return "Fosfat (PO4) Rendah";
    if (t === "low_flow") return "Kurang Arus Air";
    if (t === "high_ammonia") return "Amonia Tinggi / Kotor";
    if (t === "iron_imbalance") return "Kelebihan Zat Besi (Fe)";
    if (t === "low_co2") return "Kekurangan CO2";
    if (t === "low_nitrate") return "Nitrat (NO3) Rendah";
    if (t === "high_silicate") return "Silikat Tinggi";
    if (t === "high_organics") return "Penumpukan Sisa Organik";
  } else {
    // English Formatting (Fallback)
    if (t === "light_green") return "Light Green";
    if (t === "blue_green") return "Blue-Green";
    if (t === "dark_green") return "Dark Green";
    if (t === "dark_gray") return "Dark Gray";
    if (t === "hard_spot") return "Hard Spots";
    if (t === "easily_wiped") return "Easily Wiped";
    if (t === "long_thread") return "Long Threads";
    if (t === "leaf_edges") return "Leaf Edges";
    if (t === "slow_leaves") return "Slow-growing Leaves";
    if (t === "high_flow") return "High Flow Areas";
    if (t === "new_tank") return "New Tank (< 2 mo)";
    if (t === "co2_fluctuation") return "CO2 Fluctuation";
    if (t === "high_light") return "Light Too High";
    if (t === "poor_circulation") return "Poor Circulation";
    if (t === "nutrient_imbalance") return "Nutrient Imbalance";
    if (t === "low_phosphate") return "Low Phosphate";
    if (t === "low_flow") return "Low Water Flow";
    if (t === "high_ammonia") return "High Ammonia";
    if (t === "iron_imbalance") return "Iron Imbalance";
    if (t === "low_co2") return "Low CO2";
    if (t === "low_nitrate") return "Low Nitrate";
    if (t === "high_silicate") return "High Silicate";
    if (t === "high_organics") return "High Organics";
  }
  
  // Format bawaan jika tidak ada di list: ganti "_" dengan spasi dan jadikan huruf kapital awal
  return tag.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};