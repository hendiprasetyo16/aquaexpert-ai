// features/plants/components/plant-helpers.tsx
import React from "react";

export const getDifficultyDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Easy (Mudah)";
    if (l === "medium") return "Medium (Sedang)";
    if (l === "hard") return "Hard (Sulit)";
  } else {
    if (l === "easy") return "Easy (Beginner)";
    if (l === "medium") return "Medium (Intermediate)";
    if (l === "hard") return "Hard (Advanced)";
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const getIndoLevelCore = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "low" || l === "easy") return "Rendah";
    if (l === "medium" || l === "moderate") return "Sedang";
    if (l === "high" || l === "hard" || l === "aggressive") return "Tinggi";
    if (l === "slow") return "Lambat";
    if (l === "fast") return "Cepat";
  } else {
    if (l === "low" || l === "easy") return "Low";
    if (l === "medium" || l === "moderate") return "Medium";
    if (l === "high" || l === "hard" || l === "aggressive") return "High";
    if (l === "slow") return "Slow";
    if (l === "fast") return "Fast";
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const getIndoLevelDetail = (level: string | null | undefined, type: "light" | "co2" | "fert" | "growth" | "general" = "general", lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Data tidak tersedia." : "Data not available.";
  const l = level.toLowerCase();
  
  if (lang === "id") {
    if (type === "light") {
      if (l === "low") return "Lampu menyala 6-7 Jam";
      if (l === "medium") return "Lampu menyala 7-8 Jam";
      if (l === "high") return "Lampu menyala 8-10 Jam";
    }
    if (type === "co2") {
      if (l === "low") return "Tanpa tabung CO2";
      if (l === "medium") return "Disarankan pakai CO2";
      if (l === "high") return "Wajib injeksi CO2 tinggi";
    }
    if (type === "fert") {
      if (l === "low") return "Sesekali saja";
      if (l === "medium") return "Rutin (Standar)";
      if (l === "high") return "Wajib pupuk tancap & cair";
    }
    if (type === "growth") {
      if (l === "slow") return "Jarang butuh dipangkas";
      if (l === "medium" || l === "moderate") return "Perawatan standar";
      if (l === "fast" || l === "aggressive") return "Wajib sering dipangkas";
    }
  } else {
    if (type === "light") {
      if (l === "low") return "Lights on 6-7 Hours";
      if (l === "medium") return "Lights on 7-8 Hours";
      if (l === "high") return "Lights on 8-10 Hours";
    }
    if (type === "co2") {
      if (l === "low") return "Without CO2 tank";
      if (l === "medium") return "CO2 recommended";
      if (l === "high") return "High CO2 injection required";
    }
    if (type === "fert") {
      if (l === "low") return "Occasionally";
      if (l === "medium") return "Routine (Standard)";
      if (l === "high") return "Root & liquid ferts required";
    }
    if (type === "growth") {
      if (l === "slow") return "Rarely needs trimming";
      if (l === "medium" || l === "moderate") return "Standard care";
      if (l === "fast" || l === "aggressive") return "Frequent trimming required";
    }
  }
  return getIndoLevelCore(level, lang);
};

export const getMaintenanceDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "low") return "Low (Jarang Trimming/Perawatan)";
    if (l === "medium") return "Medium (Perawatan Rutin)";
    if (l === "high") return "High (Sering Trimming/Replant)";
  } else {
    if (l === "low") return "Low (Rare Trimming)";
    if (l === "medium") return "Medium (Routine Care)";
    if (l === "high") return "High (Frequent Trimming)";
  }
  return level;
};

export const getGrowthControlDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "slow") return "Slow (Terpusat)";
    if (l === "moderate") return "Moderate (Wajar)";
    if (l === "fast") return "Fast (Cepat)";
    if (l === "aggressive") return "Aggressive (Menyebar Liar)";
  } else {
    if (l === "slow") return "Slow (Compact Spread)";
    if (l === "moderate") return "Moderate (Standard Spread)";
    if (l === "fast") return "Fast (Quick Spread)";
    if (l === "aggressive") return "Aggressive (Wild Spread)";
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const getPlacementDesc = (placement: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!placement) return lang === "id" ? "Unknown (Tidak diketahui)" : "Unknown (Not specified)";
  const p = placement.toLowerCase();
  if (lang === "id") {
    if (p === "foreground") return "Foreground (Posisi Depan)";
    if (p === "midground") return "Midground (Posisi Tengah)";
    if (p === "background") return "Background (Posisi Belakang)";
    if (p === "epiphyte") return "Epiphyte (Menempel Kayu/Batu)";
    if (p === "floating") return "Floating (Apung di Atas)";
  } else {
    if (p === "foreground") return "Foreground (Front Area)";
    if (p === "midground") return "Midground (Middle Area)";
    if (p === "background") return "Background (Back Area)";
    if (p === "epiphyte") return "Epiphyte (Attached to hardscape)";
    if (p === "floating") return "Floating (Water Surface)";
  }
  return `${placement.charAt(0).toUpperCase() + placement.slice(1)}`;
};

export const getPlacementBadgeStyle = (placement: string | null | undefined) => {
  if (!placement) return "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200";
  const p = placement.toLowerCase();
  if (p === "foreground") return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300"; 
  if (p === "midground") return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300"; 
  if (p === "background") return "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300"; 
  if (p === "epiphyte") return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-300"; 
  if (p === "floating") return "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/50 text-cyan-700 dark:text-cyan-300"; 
  return "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200";
};

export const getCO2DisplayStatus = (requirement: string | null | undefined, isMandatory: boolean | null | undefined, lang: "id" | "en" = "id"): { label: string; variant: "danger" | "warning" | "success" } => {
  if (isMandatory) return { label: lang === "id" ? "Wajib Injeksi" : "Injection Mandatory", variant: "danger" };
  const req = (requirement || "").toLowerCase();
  if (req === "medium" || req === "high") return { label: lang === "id" ? "Disarankan" : "Recommended", variant: "warning" };
  return { label: lang === "id" ? "Tidak Perlu CO2" : "No CO2 Needed", variant: "success" };
};

export const getPlantTypeDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  const t = (type || "").toLowerCase();
  if (lang === "id") {
    if (t === "stem") return "Stem (Batang)";
    if (t === "rhizome") return "Rhizome (Rimpang)";
    if (t === "rosette") return "Rosette (Roset)";
    if (t === "carpet") return "Carpet (Karpet)";
    if (t === "moss") return "Moss (Lumut)";
    if (t === "floating") return "Floating (Apung)";
    if (t === "bulb") return "Bulb (Umbi)";
    if (t === "runner") return "Runner (Menjalar)";
    if (t === "crypt") return "Crypt (Cryptocoryne)";
    if (t === "epiphyte") return "Epiphyte (Menempel)";
  } else {
    if (t === "stem") return "Stem (Stalk)";
    if (t === "rhizome") return "Rhizome (Creeping Root)";
    if (t === "rosette") return "Rosette (Crown)";
    if (t === "carpet") return "Carpet (Ground Cover)";
    if (t === "moss") return "Moss (Bryophyte)";
    if (t === "floating") return "Floating (Surface)";
    if (t === "bulb") return "Bulb (Tuber)";
    if (t === "runner") return "Runner (Stolon)";
    if (t === "crypt") return "Crypt (Water Trumpet)";
    if (t === "epiphyte") return "Epiphyte (Attached)";
  }
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
};

export const getPlantTypeLongDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  const t = (type || "").toLowerCase();
  if (lang === "id") {
    if (t === "stem") return "Tanaman Batang. Tumbuh menjulang ke atas, perlu dipotong dan ditancap ulang.";
    if (t === "rhizome") return "Tanaman Rimpang. Jangan dikubur di pasir, harus diikat pada batu atau kayu.";
    if (t === "rosette") return "Tumbuh berpusat dari satu pangkal akar bawah. Sangat butuh pupuk tancap.";
    if (t === "carpet") return "Tanaman Karpet. Menjalar menutupi dasar aquarium layaknya padang rumput.";
    if (t === "moss") return "Lumut Air. Diikat pada batu/kayu. Surganya udang hias untuk bersembunyi.";
    if (t === "floating") return "Tanaman Apung. Berada di permukaan. Penyerap racun nitrat paling ampuh.";
    if (t === "bulb") return "Tumbuh dari umbi. Umbinya jangan dikubur total ke dalam pasir agar tidak busuk.";
    if (t === "runner") return "Tanaman Menjalar. Berkembang menyebar cepat lewat tunas di bawah pasir.";
    if (t === "crypt") return "Cryptocoryne. Berakar kuat, rentan terhadap daun meleleh (crypt melt) jika parameter air berubah drastis.";
    if (t === "epiphyte") return "Epiphyte. Tumbuh menempel pada hardscape (kayu/batu), tidak ditanam di substrat tanah.";
    return "Tipe tanaman akuatik standar.";
  } else {
    if (t === "stem") return "Stem plant. Grows upwards, needs to be trimmed and replanted frequently.";
    if (t === "rhizome") return "Rhizome plant. Do not bury the rhizome in sand, must be tied/glued to hardscape.";
    if (t === "rosette") return "Rosette plant. Grows from a single central base. Highly dependent on root tabs.";
    if (t === "carpet") return "Carpet plant. Spreads horizontally covering the aquarium floor like a lawn.";
    if (t === "moss") return "Aquatic moss. Attached to hardscape. A perfect hiding spot for ornamental shrimp.";
    if (t === "floating") return "Floating plant. Stays on the surface. Very effective at absorbing excess nitrates.";
    if (t === "bulb") return "Bulb plant. Do not fully bury the bulb in the substrate to prevent rotting.";
    if (t === "runner") return "Runner plant. Spreads quickly through horizontal shoots beneath the sand.";
    if (t === "crypt") return "Cryptocoryne. Strong roots, prone to 'crypt melt' if water parameters fluctuate.";
    if (t === "epiphyte") return "Epiphyte. Grows attached to hardscape (wood/rocks), not planted in the substrate.";
    return "Standard aquatic plant type.";
  }
};

export const getStyleDesc = (style: string, lang: "id" | "en" = "id") => {
  const s = style.toLowerCase();
  if (lang === "id") {
    if (s.includes("nature")) return "Alami / Nature";
    if (s.includes("dutch")) return "Padat & Berwarna";
    if (s.includes("iwagumi")) return "Padang Batu";
    if (s.includes("jungle")) return "Tumbuh Liar";
    if (s.includes("biotope")) return "Spesifik Wilayah";
    if (s.includes("taiwan")) return "Terasering";
  } else {
    if (s.includes("nature")) return "Natural Look";
    if (s.includes("dutch")) return "Dense & Colorful";
    if (s.includes("iwagumi")) return "Rock Formation";
    if (s.includes("jungle")) return "Wild Growth";
    if (s.includes("biotope")) return "Specific Habitat";
    if (s.includes("taiwan")) return "Terraced Layout";
  }
  return style;
};

export const getTankSizeDetails = (size: string, lang: "id" | "en" = "id") => {
  const s = size.trim().toLowerCase();
  const literText = lang === "id" ? "Liter" : "Liters";
  if (s.includes("nano")) return { size_cm: "≤ 40 cm", liter: `10–30 ${literText}` };
  if (s.includes("small")) return { size_cm: "40–60 cm", liter: `30–60 ${literText}` };
  if (s.includes("medium")) return { size_cm: "60–90 cm", liter: `60–150 ${literText}` };
  if (s.includes("extra")) return { size_cm: "> 120 cm", liter: `> 300 ${literText}` };
  if (s.includes("large")) return { size_cm: "90–120 cm", liter: `150–300 ${literText}` };
  return { size_cm: lang === "id" ? "Bervariasi" : "Varies", liter: lang === "id" ? "Sesuai kebutuhan" : "As needed" };
};

// PERBAIKAN: Fungsi ini telah dirombak untuk TIDAK mengembalikan teks mentahnya jika tidak perlu.
// Karena kita memakai ini sebagai Subteks (Deskripsi), maka cukup cetak penjelasan pendeknya saja.
export const getRecommendedDesc = (tag: string, lang: "id" | "en" = "id") => {
  const t = tag.toLowerCase();
  if (lang === "id") {
    if (t === "pemula" || t === "beginner") return "Sangat Mudah";
    if (t.includes("low tech")) return "Bisa Tanpa CO2";
    if (t.includes("low light")) return "Cahaya Minim";
    if (t.includes("high tech") || t.includes("co2 setup")) return "Wajib Injeksi CO2";
    if (t.includes("shrimp tank")) return "Aman bagi Udang";
    if (t.includes("betta tank")) return "Aman bagi Cupang";
    if (t.includes("community tank")) return "Untuk Beragam Ikan";
    if (t.includes("discus tank")) return "Toleran Air Hangat";
    if (t.includes("cichlid")) return "Tahan Gigitan";
    if (t.includes("nano tank")) return "Untuk Tank Kecil";
    if (t.includes("large tank") || t.includes("pond")) return "Untuk Kolam/Besar";
    if (t.includes("dutch style")) return "Rapat & Berwarna";
    if (t.includes("nature style")) return "Tampilan Alami";
    if (t.includes("paludarium")) return "Tumbuh Darat-Air";
    if (t.includes("blackwater")) return "Air Gelap / Tannin";
    if (t.includes("aquascape contest")) return "Untuk Seni Tinggi";
    if (t.includes("breeding tank")) return "Habitat Burayak";
  } else {
    if (t === "pemula" || t === "beginner") return "Very Easy";
    if (t.includes("low tech")) return "No CO2 Needed";
    if (t.includes("low light")) return "Low Light Demand";
    if (t.includes("high tech") || t.includes("co2 setup")) return "CO2 Required";
    if (t.includes("shrimp tank")) return "Safe for Shrimp";
    if (t.includes("betta tank")) return "Safe for Bettas";
    if (t.includes("community tank")) return "For Community Fish";
    if (t.includes("discus tank")) return "Warm Water Tolerant";
    if (t.includes("cichlid")) return "Resists Nipping";
    if (t.includes("nano tank")) return "For Small Tanks";
    if (t.includes("large tank") || t.includes("pond")) return "For Ponds/Large Tanks";
    if (t.includes("dutch style")) return "Dense & Colorful";
    if (t.includes("nature style")) return "Natural Look";
    if (t.includes("paludarium")) return "Emersed/Submersed";
    if (t.includes("blackwater")) return "Dark Water / Tannins";
    if (t.includes("aquascape contest")) return "High Aesthetic Value";
    if (t.includes("breeding tank")) return "Fry Habitat";
  }
  return "";
};

export const getRecommendationBadgeColor = (tag: string) => {
  const t = tag.toLowerCase();
  if (t === "pemula" || t === "beginner") return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/50";
  if (t.includes("low tech") || t.includes("low light")) return "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-900/50";
  if (t.includes("high tech")) return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-900/50";
  if (t.includes("co2 setup")) return "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-900/50";
  if (t.includes("dutch style")) return "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-900/50";
  if (t.includes("nature style")) return "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-900/50";
  if (t.includes("iwagumi")) return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
  if (t.includes("contest")) return "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-900/50";
  if (t.includes("shrimp tank")) return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900/50";
  if (t.includes("community tank")) return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-900/50";
  if (t.includes("betta tank")) return "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-300 dark:border-fuchsia-900/50";
  if (t.includes("cichlid")) return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-900/50";
  if (t.includes("breeding tank")) return "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-900/50";
  if (t.includes("nano tank")) return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-900/50";
  if (t.includes("large tank")) return "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700";
  if (t.includes("blackwater")) return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500 border-amber-300 dark:border-amber-900/50";
  if (t.includes("paludarium")) return "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border-pink-300 dark:border-pink-900/50";
  if (t.includes("pond")) return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-900/50";
  
  return "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700";
};

export const getSummaryScoreDesc = (score: number | null, lang: "id" | "en" = "id") => {
  if (!score) return lang === "id" ? "Penilaian belum tersedia." : "Score not available.";
  if (lang === "id") {
    if (score >= 8) return "Sangat direkomendasikan untuk aquascaper pemula.";
    if (score >= 6) return "Cocok jika Anda sudah memahami dasar-dasar aquascape.";
    if (score >= 4) return "Cukup menantang, butuh perhatian ekstra.";
    return "Hanya untuk aquascaper tingkat lanjut / profesional.";
  } else {
    if (score >= 8) return "Highly recommended for beginners.";
    if (score >= 6) return "Suitable if you understand the basics.";
    if (score >= 4) return "Quite challenging, requires extra attention.";
    return "Only for advanced/professional aquascapers.";
  }
};

export const renderStars = (score: number | null, lang: "id" | "en" = "id") => {
  if (!score) return "N/A";
  const filled = "★".repeat(score);
  const empty = "☆".repeat(10 - score);
  
  let colorClass = "text-red-600 dark:text-red-400"; 
  if (score >= 9) colorClass = "text-green-600 dark:text-green-400"; 
  else if (score >= 7) colorClass = "text-blue-600 dark:text-blue-400"; 
  else if (score >= 5) colorClass = "text-yellow-500 dark:text-yellow-400"; 

  return (
    <div className="flex flex-col items-center transition-colors">
      <span className={`text-[11px] tracking-widest mb-0.5 ${colorClass}`}>
        {filled}<span className="text-slate-300 dark:text-slate-600">{empty}</span>
      </span>
      <span className={`text-xl font-black ${colorClass}`}>{score}/10</span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight text-center max-w-[120px]">
        {getSummaryScoreDesc(score, lang)}
      </span>
    </div>
  );
};

export const getDifficultySubtitle = (level: string | null | undefined, lang: "id" | "en") => {
  const l = (level || "").toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Sangat Mudah";
    if (l === "medium") return "Perawatan Menengah";
    if (l === "hard") return "Butuh Pengalaman";
  } else {
    if (l === "easy") return "Beginner Friendly";
    if (l === "medium") return "Intermediate Care";
    if (l === "hard") return "Advanced Skills Needed";
  }
  return lang === "id" ? "Tidak Diketahui" : "Unknown";
};

export const getMaintenanceSubtitle = (level: string | null | undefined, lang: "id" | "en") => {
  const l = (level || "").toLowerCase();
  if (lang === "id") {
    if (l === "low") return "Jarang Trimming";
    if (l === "medium") return "Perawatan Rutin";
    if (l === "high") return "Sering Trimming";
  } else {
    if (l === "low") return "Rare Trimming";
    if (l === "medium") return "Routine Maintenance";
    if (l === "high") return "Frequent Trimming";
  }
  return lang === "id" ? "Standar" : "Standard";
};

export const getParamSubtitle = (level: string | null | undefined, lang: "id" | "en") => {
  const l = (level || "").toLowerCase();
  if (lang === "id") {
    if (l === "low") return "Intensitas Rendah";
    if (l === "medium") return "Intensitas Sedang";
    if (l === "high") return "Intensitas Tinggi";
  } else {
    if (l === "low") return "Low Intensity";
    if (l === "medium") return "Moderate Intensity";
    if (l === "high") return "High Intensity";
  }
  return "";
};

export const getPlacementSubtitle = (placement: string | null | undefined, lang: "id" | "en") => {
  const p = (placement || "").toLowerCase();
  if (lang === "id") {
    if (p === "foreground") return "Posisi Depan";
    if (p === "midground") return "Posisi Tengah";
    if (p === "background") return "Posisi Belakang";
    if (p === "epiphyte") return "Menempel di Kayu/Batu";
    if (p === "floating") return "Apung di Permukaan";
  } else {
    if (p === "foreground") return "Front Area";
    if (p === "midground") return "Middle Area";
    if (p === "background") return "Back Area";
    if (p === "epiphyte") return "Attached to Hardscape";
    if (p === "floating") return "Water Surface";
  }
  return "Standard Placement";
};