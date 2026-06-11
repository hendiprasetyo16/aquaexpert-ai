import React from "react";

export const getDifficultyDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Easy (Mudah)";
    if (l === "medium") return "Medium (Sedang)";
    if (l === "hard") return "Hard (Sulit)";
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const getIndoLevelCore = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  
  if (lang === "id") {
    if (l === "low" || l === "easy") return "Low (Rendah)";
    if (l === "medium" || l === "moderate") return "Medium (Sedang)";
    if (l === "high" || l === "hard" || l === "aggressive") return "High (Tinggi)";
    if (l === "slow") return "Slow (Lambat)";
    if (l === "fast") return "Fast (Cepat)";
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
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const getPlacementDesc = (placement: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!placement) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const p = placement.toLowerCase();
  if (lang === "id") {
    if (p === "foreground") return "Foreground (Posisi Depan)";
    if (p === "midground") return "Midground (Posisi Tengah)";
    if (p === "background") return "Background (Posisi Belakang)";
    if (p === "epiphyte") return "Epiphyte (Menempel Kayu/Batu)";
    if (p === "floating") return "Floating (Apung di Atas)";
  }
  return placement.charAt(0).toUpperCase() + placement.slice(1);
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
  }
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
};

export const getStyleDesc = (style: string, lang: "id" | "en" = "id") => {
  const s = style.toLowerCase();
  if (lang === "id") {
    if (s.includes("nature")) return "Nature (Alami)";
    // PERBAIKAN: Dutch (Padat & Berwarna)
    if (s.includes("dutch")) return "Dutch (Padat & Berwarna)";
    if (s.includes("iwagumi")) return "Iwagumi (Padang Batu)";
    if (s.includes("jungle")) return "Jungle (Tumbuh Liar)";
    if (s.includes("biotope")) return "Biotope (Spesifik Wilayah)";
    if (s.includes("taiwan")) return "Taiwan (Terasering)";
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

export const getRecommendedDesc = (tag: string, lang: "id" | "en" = "id") => {
  const t = tag.toLowerCase();
  if (lang === "id") {
    if (t === "pemula" || t === "beginner") return "Beginner (Mudah)";
    // PERBAIKAN: Pemisahan Low Tech dan Low Light secara eksplisit
    if (t.includes("low tech")) return "Low Tech (Tanpa CO2)";
    if (t.includes("low light")) return "Low Light (Cahaya Minim)";
    if (t.includes("high tech") || t.includes("co2 setup")) return "High Tech (Wajib CO2)";
    if (t.includes("shrimp tank")) return "Shrimp Tank (Aman untuk Udang)";
    if (t.includes("betta tank")) return "Betta Tank (Aman untuk Cupang)";
    if (t.includes("community tank")) return "Community Tank (Ragam Ikan)";
    if (t.includes("discus tank")) return "Discus Tank (Toleran Hangat)";
    if (t.includes("cichlid")) return "Cichlid Tank (Tahan Gigitan)";
    if (t.includes("nano tank")) return "Nano Tank (Akuarium Kecil)";
    if (t.includes("large tank") || t.includes("pond")) return "Pond / Large Tank (Kolam/Besar)";
    if (t.includes("dutch style")) return "Dutch Style (Rapat & Berwarna)";
    if (t.includes("nature style")) return "Nature Style (Alami)";
    if (t.includes("paludarium")) return "Paludarium (Darat & Air)";
    // PERBAIKAN: Blackwater menjadi Air Gelap/Tannin
    if (t.includes("blackwater")) return "Blackwater (Air Gelap / Tannin)";
    if (t.includes("aquascape contest")) return "Contest (Seni Tinggi)";
    if (t.includes("breeding tank")) return "Breeding Tank (Burayak)";
  }
  return tag;
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