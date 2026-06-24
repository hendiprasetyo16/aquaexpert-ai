// features/fishes/components/fish-helpers.tsx
import React from "react";

export const getDifficultyDesc = (level: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!level) return lang === "id" ? "Tidak diketahui" : "Unknown";
  const l = level.toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Mudah (Pemula)";
    if (l === "medium") return "Sedang (Menengah)";
    if (l === "hard") return "Sulit (Mahir)";
  } else {
    if (l === "easy") return "Easy (Beginner)";
    if (l === "medium") return "Medium (Intermediate)";
    if (l === "hard") return "Hard (Advanced)";
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
};

export const getDifficultySubtitle = (level: string | null | undefined, lang: "id" | "en") => {
  const l = (level || "").toLowerCase();
  if (lang === "id") {
    if (l === "easy") return "Perawatan Sangat Mudah";
    if (l === "medium") return "Butuh Perhatian Rutin";
    if (l === "hard") return "Sangat Sensitif (Pakar)";
  } else {
    if (l === "easy") return "Very Easy Care";
    if (l === "medium") return "Needs Routine Attention";
    if (l === "hard") return "Very Sensitive (Expert)";
  }
  return lang === "id" ? "Tidak Diketahui" : "Unknown";
};

export const getFishTypeDesc = (type: string | null | undefined, lang: "id" | "en" = "id") => {
  const t = (type || "").toLowerCase();
  if (lang === "id") {
    if (t === "tetra") return "Tetra / Characin";
    if (t === "cichlid") return "Cichlid (Siklid)";
    if (t === "livebearer") return "Livebearer (Beranak)";
    if (t === "betta") return "Betta / Cupang";
    if (t === "labyrinth") return "Labyrinth (Labirin)";
    if (t === "loach") return "Loach (Ikan Dasar)";
    if (t === "catfish") return "Catfish / Pleco";
    if (t === "rasbora") return "Rasbora";
    if (t === "invertebrate") return "Udang / Siput";
  } else {
    if (t === "tetra") return "Tetra / Characin";
    if (t === "cichlid") return "Cichlid";
    if (t === "livebearer") return "Livebearer";
    if (t === "betta") return "Betta / Fighter";
    if (t === "labyrinth") return "Labyrinth Fish";
    if (t === "loach") return "Loach";
    if (t === "catfish") return "Catfish / Pleco";
    if (t === "rasbora") return "Rasbora";
    if (t === "invertebrate") return "Shrimp / Snail";
  }
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
};

export const getCompatibilityDesc = (compat: string | null | undefined, lang: "id" | "en" = "id") => {
  if (!compat) return lang === "id" ? "Belum Ditentukan" : "Not Specified";
  const c = compat.toLowerCase();
  if (lang === "id") {
    if (c === "peaceful") return "Damai (Community Tank)";
    if (c === "semi-aggressive") return "Semi-Agresif (Teritorial)";
    if (c === "aggressive") return "Agresif (Predator)";
    if (c === "species only") return "Hanya Sejenis (Species Only)";
  } else {
    if (c === "peaceful") return "Peaceful (Community)";
    if (c === "semi-aggressive") return "Semi-Aggressive";
    if (c === "aggressive") return "Aggressive (Predatory)";
    if (c === "species only") return "Species Only Tank";
  }
  return compat;
};

export const getCompatibilityBadgeStyle = (compat: string | null | undefined) => {
  if (!compat) return "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200";
  const c = compat.toLowerCase();
  if (c === "peaceful") return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300"; 
  if (c === "semi-aggressive") return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300"; 
  if (c === "aggressive") return "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"; 
  if (c === "species only") return "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300"; 
  return "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200";
};

export const getSchoolingDesc = (isSchooling: boolean | null | undefined, minGroup: number | null | undefined, lang: "id" | "en" = "id") => {
  if (isSchooling === null || isSchooling === undefined) return "-";
  if (!isSchooling) return lang === "id" ? "Bisa dipelihara sendiri/sepasang" : "Can be kept solitary/pair";
  
  const min = minGroup || 6; 
  return lang === "id" 
    ? `Ikan Koloni (Wajib min. ${min} ekor)` 
    : `Schooling Fish (Min. ${min} pcs)`;
};

export const formatTankSize = (minSizeLiters: number | null | undefined, lang: "id" | "en" = "id") => {
  if (!minSizeLiters) return "-";
  return `${minSizeLiters} Liter`;
};

export const formatWaterParams = (min: number | null | undefined, max: number | null | undefined, unit: string) => {
  if (!min && !max) return "-";
  if (min && max) return `${min} - ${max} ${unit}`;
  if (min) return `> ${min} ${unit}`;
  if (max) return `< ${max} ${unit}`;
  return "-";
};

// --- FUNGSI BARU UNTUK TANK STYLES ---
export const getTankStyleDesc = (style: string, lang: "id" | "en" = "id") => {
  const s = style.toLowerCase();
  if (lang === "id") {
    if (s === "nature") return "Nature (Alami)";
    if (s === "dutch") return "Dutch (Gaya Belanda)";
    if (s === "iwagumi") return "Iwagumi (Batu)";
    if (s === "biotope") return "Biotope (Sesuai Habitat Asli)";
    if (s === "blackwater") return "Blackwater (Air Gelap)";
    if (s === "community") return "Community (Campur)";
    if (s === "predator") return "Predator Tank";
  } else {
    if (s === "nature") return "Nature Style";
    if (s === "dutch") return "Dutch Style";
    if (s === "iwagumi") return "Iwagumi Style";
    if (s === "biotope") return "Biotope Setup";
    if (s === "blackwater") return "Blackwater Setup";
    if (s === "community") return "Community Tank";
    if (s === "predator") return "Predator Tank";
  }
  return style;
};