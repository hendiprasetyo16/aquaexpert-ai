"use client";

import { AlertTriangle, ShieldAlert, Award, ChevronRight } from "lucide-react";
import type { DiseaseMatchResult } from "@/features/diseases/types/disease.types";

interface Props {
  result: DiseaseMatchResult;
  lang?: "id" | "en";
  onDetailClick: (diseaseId: string) => void;
}

export function DiseaseResultCard({ result, lang = "id", onDetailClick }: Props) {
  const { disease, confidenceScore, matchedSymptoms, susceptibilityWarning, hasHallmarkMatch } = result;

  const getColorScheme = (score: number) => {
    if (score >= 80) return {
      border: "border-emerald-200 dark:border-emerald-800/50",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
      progress: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    };
    if (score >= 60) return {
      border: "border-amber-200 dark:border-amber-800/50",
      bg: "bg-amber-50/50 dark:bg-amber-950/10",
      progress: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
    };
    if (score >= 40) return {
      border: "border-orange-200 dark:border-orange-800/50",
      bg: "bg-orange-50/50 dark:bg-orange-950/10",
      progress: "bg-orange-500",
      text: "text-orange-700 dark:text-orange-400",
    };
    return {
      border: "border-rose-200 dark:border-rose-800/50",
      bg: "bg-rose-50/50 dark:bg-rose-950/10",
      progress: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
    };
  };

  const style = getColorScheme(confidenceScore);
  const diseaseName = lang === "id" ? disease.name_id : disease.name_en;

  // FIX TEMUAN #2: Defensif normalisasi string casing tingkat keparahan kualitatif
  const isCritical = disease.severity_level?.toLowerCase() === "critical";

  return (
    <div className={`w-full rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${style.border} ${style.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {diseaseName}
            </h3>
            {disease.scientific_name && (
              <span className="text-xs italic text-slate-500 font-mono mt-0.5">
                ({disease.scientific_name})
              </span>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kategori: {disease.disease_category || "Umum"}
          </p>
        </div>

        <div className="flex sm:flex-col items-end gap-2 sm:gap-1 shrink-0 bg-white dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Keyakinan</span>
          <span className={`text-2xl font-black ${style.text}`}>
            {confidenceScore}%
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4 shadow-inner">
        <div className={`h-full ${style.progress} transition-all duration-700`} style={{ width: `${confidenceScore}%` }} />
      </div>

      {/* FIX TEMUAN #3: Conditional rendering untuk mendukung luaran deteksi Vision AI tanpa gejala manual */}
      {matchedSymptoms && matchedSymptoms.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {lang === "id" ? "Gejala yang Cocok" : "Matched Symptoms"} ({matchedSymptoms.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSymptoms.map((sym) => (
              <span 
                key={sym.id} 
                className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
              >
                {lang === "id" ? sym.name_id : sym.name_en}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BLOK TINDAKAN KLINIS & ALERT INDIKATOR */}
      {(susceptibilityWarning || hasHallmarkMatch || isCritical) && (
        <div className="space-y-2 mb-4">
          
          {susceptibilityWarning && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-medium leading-relaxed">{susceptibilityWarning}</span>
            </div>
          )}

          {/* FIX TEMUAN #1: Render lencana hallmark murni berbasis data penentu dari backend */}
          {hasHallmarkMatch && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 text-xs">
              <Award className="w-4 h-4 shrink-0" />
              <span className="font-medium leading-relaxed">
                {lang === "id" 
                  ? "🎯 Tanda Mutlak Terpenuhi: Gejala klinis yang terdeteksi merujuk kuat pada patogen ini." 
                  : "🎯 Hallmark Match: Identified clinical traits strongly pinpoint this pathogen."}
              </span>
            </div>
          )}

          {isCritical && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-500/20 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold leading-relaxed">
                {lang === "id"
                  ? "⚠️ Bahaya Tingkat Tinggi: Laju mortalitas patogen ini sangat destruktif. Segera lakukan tindakan penanganan obat!"
                  : "⚠️ High Mortality Risk: This pathogen is highly destructive. Immediate medication triage required!"}
              </span>
            </div>
          )}

        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={() => onDetailClick(disease.id)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors group"
        >
          {lang === "id" ? "Lihat Solusi Pengobatan" : "View Treatment Guide"}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}