// features/diseases/components/DiseaseResultCard.tsx
"use client";

import { AlertTriangle, ShieldAlert, Award, ChevronRight, Activity } from "lucide-react";
import type { DiseaseMatchResult } from "@/features/diseases/types/disease.types";

interface Props {
  result: DiseaseMatchResult;
  lang?: "id" | "en";
  isTopMatch?: boolean; // Untuk memberikan efek spesial pada hasil tertinggi
  onDetailClick: (diseaseId: string) => void;
}

export function DiseaseResultCard({ result, lang = "id", isTopMatch = false, onDetailClick }: Props) {
  const { disease, confidenceScore, susceptibilityWarning, hasHallmarkMatch } = result;

  const getColorScheme = (score: number) => {
    if (score >= 80) return { 
      border: "border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500", 
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20", 
      progress: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]", 
      text: "text-emerald-700 dark:text-emerald-400",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
    };
    if (score >= 60) return { 
      border: "border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500", 
      bg: "bg-amber-50/50 dark:bg-amber-950/20", 
      progress: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]", 
      text: "text-amber-700 dark:text-amber-400",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
    };
    if (score >= 40) return { 
      border: "border-orange-200 dark:border-orange-800/60 hover:border-orange-400 dark:hover:border-orange-500", 
      bg: "bg-orange-50/50 dark:bg-orange-950/20", 
      progress: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]", 
      text: "text-orange-700 dark:text-orange-400",
      glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
    };
    return { 
      border: "border-rose-200 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-500", 
      bg: "bg-rose-50/50 dark:bg-rose-950/20", 
      progress: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]", 
      text: "text-rose-700 dark:text-rose-400",
      glow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]"
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
    <div className={`w-full rounded-2xl border-2 p-5 md:p-6 transition-all duration-300 relative overflow-hidden group bg-white dark:bg-[#111827] ${style.border} ${style.glow}`}>
      
      {isTopMatch && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10">
          <Activity className="w-3 h-3" /> PRIMARY MATCH
        </div>
      )}

      {/* BACKGROUND GLOW */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-30 pointer-events-none transition-all group-hover:opacity-50 ${style.progress}`}></div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 relative z-10">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{diseaseName}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {translateCategory(disease.disease_category)}
            </span>
          </p>
        </div>
        
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 shrink-0 bg-slate-50 dark:bg-[#0B1120] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'id' ? "Kecocokan" : "Match Score"}</span>
          <span className={`text-3xl font-black ${style.text} drop-shadow-sm`}>{confidenceScore}%</span>
        </div>
      </div>

      <div className="w-full h-2.5 bg-slate-100 dark:bg-[#0B1120] rounded-full overflow-hidden mb-5 shadow-inner relative z-10">
        <div className={`h-full ${style.progress} transition-all duration-1000 ease-out`} style={{ width: `${confidenceScore}%` }} />
      </div>

      {(susceptibilityWarning || hasHallmarkMatch || isCritical) && (
        <div className="space-y-2 mb-5 relative z-10">
          {susceptibilityWarning && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
              <span className="font-semibold leading-relaxed">{susceptibilityWarning}</span>
            </div>
          )}
          {hasHallmarkMatch && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 text-xs">
              <Award className="w-5 h-5 shrink-0 text-emerald-500" />
              <span className="font-bold leading-relaxed">{lang === "id" ? "Tanda Mutlak (Pathognomonic) Terpenuhi. Akurasi Tinggi." : "Pathognomonic Hallmark Match. High Accuracy."}</span>
            </div>
          )}
          {isCritical && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-500/20 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
              <span className="font-bold leading-relaxed">{lang === "id" ? "Penyakit dengan Risiko Kematian Sangat Tinggi / Kritis." : "Critical Mortality Risk Disease."}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
        <button 
          onClick={() => onDetailClick(disease.id)} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-blue-600 hover:text-white dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-blue-600 transition-all duration-300 group"
        >
          {lang === "id" ? "Buka Panduan Medis" : "Open Medical Guide"}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}