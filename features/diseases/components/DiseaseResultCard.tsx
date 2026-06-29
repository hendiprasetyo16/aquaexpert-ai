// features/diseases/components/DiseaseResultCard.tsx
"use client";

import { AlertTriangle, ShieldAlert, Award, ChevronRight, Activity } from "lucide-react";
import type { DiseaseMatchResult } from "@/features/diseases/types/disease.types";

interface Props {
  result: DiseaseMatchResult;
  lang?: "id" | "en";
  isTopMatch?: boolean; 
  onDetailClick: (diseaseId: string) => void;
}

export function DiseaseResultCard({ result, lang = "id", isTopMatch = false, onDetailClick }: Props) {
  const { disease, confidenceScore, susceptibilityWarning, hasHallmarkMatch } = result;

  // Skema warna menggabungkan efek Neon dengan warna box yang tegas
  const getColorScheme = (score: number) => {
    if (score >= 80) return { 
      border: "border-emerald-200 dark:border-emerald-800", 
      bg: "bg-white dark:bg-slate-900", 
      progress: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]", 
      text: "text-emerald-600 dark:text-emerald-400",
      accent: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      neonHover: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
      neonBlob: "bg-emerald-500"
    };
    if (score >= 60) return { 
      border: "border-amber-200 dark:border-amber-800", 
      bg: "bg-white dark:bg-slate-900", 
      progress: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]", 
      text: "text-amber-600 dark:text-amber-400",
      accent: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      neonHover: "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]",
      neonBlob: "bg-amber-500"
    };
    if (score >= 40) return { 
      border: "border-orange-200 dark:border-orange-800", 
      bg: "bg-white dark:bg-slate-900", 
      progress: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]", 
      text: "text-orange-600 dark:text-orange-400",
      accent: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      neonHover: "hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]",
      neonBlob: "bg-orange-500"
    };
    return { 
      border: "border-rose-200 dark:border-rose-800", 
      bg: "bg-white dark:bg-slate-900", 
      progress: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]", 
      text: "text-rose-600 dark:text-rose-400",
      accent: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
      neonHover: "hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]",
      neonBlob: "bg-rose-500"
    };
  };

  const style = getColorScheme(confidenceScore);
  const diseaseName = lang === "id" ? disease.name_id : disease.name_en;
  const isCritical = (disease.severity ?? 1) >= 4;

  const translateCategory = (cat: string | null | undefined) => {
    if (!cat) return lang === 'id' ? "Umum" : "General";
    if (lang === 'en') return cat;
    const map: Record<string, string> = {
      "Parasitic": "Parasit", "Bacterial": "Bakteri", "Fungal": "Jamur", 
      "Viral": "Virus", "Environmental": "Lingkungan", "Nutritional": "Nutrisi"
    };
    return map[cat] || cat;
  };

  return (
    <div 
      onClick={() => onDetailClick(disease.id)}
      className={`group cursor-pointer w-full rounded-2xl border-2 p-5 md:p-6 transition-all duration-300 relative overflow-hidden flex flex-col hover:-translate-y-1 ${style.bg} ${style.border} ${style.neonHover}`}
    >
      {/* Efek Neon Glow Blob */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[50px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${style.neonBlob}`}></div>

      {isTopMatch && (
        <div className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl tracking-widest flex items-center gap-1.5 shadow-md z-20">
          <Activity className="w-3.5 h-3.5" /> PRIMARY MATCH
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
             <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-transparent group-hover:border-current transition-colors ${style.accent}`}>
               {translateCategory(disease.disease_category)}
             </span>
          </div>
          <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {diseaseName}
              </h3>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 shrink-0 hidden sm:block" />
          </div>
        </div>
        
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 shrink-0 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Kecocokan" : "Match Score"}</span>
          <span className={`text-3xl font-black ${style.text}`}>{confidenceScore}%</span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5 relative z-10">
        <div className={`h-full ${style.progress} transition-all duration-1000 ease-out`} style={{ width: `${confidenceScore}%` }} />
      </div>

      {/* Kotak Peringatan (Desain Awal yang Tegas & Jelas) */}
      {(susceptibilityWarning || hasHallmarkMatch || isCritical) && (
        <div className="space-y-2.5 relative z-10">
          {hasHallmarkMatch && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40">
              <Award className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold leading-relaxed">{lang === "id" ? "Tanda Mutlak (Pathognomonic) Terpenuhi. Akurasi Sangat Tinggi." : "Pathognomonic Hallmark Match. High Accuracy."}</span>
            </div>
          )}
          {susceptibilityWarning && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold leading-relaxed">{susceptibilityWarning}</span>
            </div>
          )}
          {isCritical && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs transition-colors group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="font-semibold leading-relaxed">{lang === "id" ? "Peringatan: Penyakit dengan Risiko Kematian Sangat Tinggi / Kritis." : "Warning: Critical Mortality Risk Disease."}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}