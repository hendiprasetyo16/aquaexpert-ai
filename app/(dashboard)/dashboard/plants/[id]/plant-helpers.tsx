import React from "react";

export const getCO2DisplayStatus = (
  requirement: string | null | undefined,
  isMandatory: boolean | null | undefined
): { label: string; variant: "danger" | "warning" | "success" } => {
  if (isMandatory) return { label: "Wajib Injeksi", variant: "danger" };
  const req = (requirement || "").toLowerCase();
  if (req === "medium" || req === "high") return { label: "Disarankan", variant: "warning" };
  return { label: "Tidak Perlu CO2", variant: "success" };
};

export const getSummaryScoreDesc = (score: number | null) => {
  if (!score) return "Penilaian belum tersedia.";
  if (score >= 8) return "Sangat direkomendasikan untuk aquascaper pemula.";
  if (score >= 6) return "Cocok jika Anda sudah memahami dasar-dasar aquascape.";
  if (score >= 4) return "Cukup menantang, butuh perhatian ekstra.";
  return "Hanya untuk aquascaper tingkat lanjut / profesional.";
};

export const renderStars = (score: number | null) => {
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
        {getSummaryScoreDesc(score)}
      </span>
    </div>
  );
};

export const getIndoLevelCore = (level: string | null | undefined) => {
  if (!level) return "";
  const l = level.toLowerCase();
  if (l === "low" || l === "easy") return "Rendah";
  if (l === "medium" || l === "moderate") return "Sedang";
  if (l === "high" || l === "hard" || l === "aggressive" || l === "fast") return "Tinggi";
  if (l === "slow") return "Lambat";
  return level;
};

export const getIndoLevelDetail = (level: string | null | undefined, type: "light" | "co2" | "fert" | "growth" | "general" = "general") => {
  if (!level) return "Data tidak tersedia.";
  const l = level.toLowerCase();
  
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
  return getIndoLevelCore(level);
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

export const getPlacementDesc = (placement: string | null | undefined) => {
  if (!placement) return "";
  const p = placement.toLowerCase();
  if (p === "foreground") return "Posisi Depan";
  if (p === "midground") return "Posisi Tengah";
  if (p === "background") return "Posisi Belakang";
  if (p === "epiphyte") return "Tempel Kayu/Batu";
  if (p === "floating") return "Apung di Atas";
  return "";
};

export const getTankSizeDetails = (size: string) => {
  const s = size.trim().toLowerCase();
  if (s.includes("nano")) return { size_cm: "≤ 40 cm", liter: "10–30 Liter" };
  if (s.includes("small")) return { size_cm: "40–60 cm", liter: "30–60 Liter" };
  if (s.includes("medium")) return { size_cm: "60–90 cm", liter: "60–150 Liter" };
  if (s.includes("extra")) return { size_cm: "> 120 cm", liter: "> 300 Liter" };
  if (s.includes("large")) return { size_cm: "90–120 cm", liter: "150–300 Liter" };
  return { size_cm: "Bervariasi", liter: "Sesuai kebutuhan" };
};

export const getStyleDesc = (style: string) => {
  const s = style.toLowerCase();
  if (s.includes("nature")) return "Alami seperti hutan/tebing";
  if (s.includes("dutch")) return "Fokus warna & padat";
  if (s.includes("iwagumi")) return "Formasi padang batu";
  if (s.includes("jungle")) return "Tumbuh liar & lebat";
  return "Gaya Aquascape Universal";
};

export const getPlantTypeDesc = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t === "stem") return "Tanaman Batang. Tumbuh menjulang ke atas, perlu dipotong dan ditancap ulang.";
  if (t === "rhizome") return "Tanaman Rimpang. Jangan dikubur di pasir, harus diikat pada batu atau kayu.";
  if (t === "rosette") return "Tumbuh berpusat dari satu pangkal akar bawah. Sangat butuh pupuk tancap.";
  if (t === "carpet") return "Tanaman Karpet. Menjalar menutupi dasar aquarium layaknya padang rumput.";
  if (t === "moss") return "Lumut Air. Diikat pada batu/kayu. Surganya udang hias untuk bersembunyi.";
  if (t === "floating") return "Tanaman Apung. Berada di permukaan. Penyerap racun nitrat paling ampuh.";
  if (t === "bulb") return "Tumbuh dari umbi. Umbinya jangan dikubur total ke dalam pasir agar tidak busuk.";
  if (t === "runner") return "Tanaman Menjalar. Berkembang menyebar cepat lewat tunas di bawah pasir.";
  return "Tipe tanaman akuatik standar.";
};

export const getRecommendedDesc = (tag: string) => {
  const t = tag.toLowerCase();
  if (t === "pemula" || t === "beginner") return "Sangat mudah dirawat";
  if (t.includes("expert") || t.includes("advanced")) return "Hanya profesional";
  if (t.includes("low tech") || t.includes("low light")) return "Tanpa tabung CO2";
  if (t.includes("high tech") || t.includes("co2 setup")) return "Wajib CO2 & Lampu";
  if (t.includes("mid tech")) return "Cahaya & Nutrisi Sedang";
  if (t.includes("shrimp tank")) return "Aman bagi Udang Hias";
  if (t.includes("betta tank")) return "Aman bagi Ikan Cupang";
  if (t.includes("community tank")) return "Aman bagi ragam ikan";
  if (t.includes("discus tank")) return "Toleran air suhu hangat";
  if (t.includes("cichlid")) return "Tahan digigit herbivora";
  if (t.includes("nano tank")) return "Cocok di tank kecil";
  if (t.includes("large tank")) return "Cocok di tank besar";
  if (t.includes("dutch style")) return "Kerapatan tanaman tinggi";
  if (t.includes("nature style")) return "Memberi kesan alam liar";
  if (t.includes("paludarium")) return "Tumbuh rimbun di darat";
  if (t.includes("blackwater")) return "Toleran cahaya minim";
  if (t.includes("aquascape contest")) return "Nilai seni sangat tinggi";
  if (t.includes("breeding tank")) return "Tempat sembunyi burayak";
  if (t.includes("pond")) return "Bisa hidup di kolam luar";
  return "Cocok secara umum";
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