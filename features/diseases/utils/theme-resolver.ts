import type { DiagnosisStatus } from "@/features/ai/types/diagnosis.types";

export interface ThemeColors {
  border: string;
  bg: string;
  progress: string;
  text: string;
  accent: string;
  neonHover: string;
  neonBlob: string;
}

export function resolveDiagnosisTheme(status: DiagnosisStatus, score: number): ThemeColors {
  if (status === 'ELIMINATED') {
    return {
      border: "border-slate-300 dark:border-slate-700 border-dashed opacity-60 grayscale",
      bg: "bg-slate-50 dark:bg-slate-900/40",
      progress: "bg-slate-300",
      text: "text-slate-400 dark:text-slate-500",
      accent: "bg-slate-200 dark:bg-slate-800 text-slate-500",
      neonHover: "hover:opacity-100",
      neonBlob: "hidden"
    };
  }

  if (status === 'LOW_CONFIDENCE' || score < 40) {
    return { 
      border: "border-rose-200 dark:border-rose-800", 
      bg: "bg-white dark:bg-slate-900", 
      progress: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]", 
      text: "text-rose-600 dark:text-rose-400", 
      accent: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400", 
      neonHover: "hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]", 
      neonBlob: "bg-rose-500" 
    };
  }

  if (score >= 80) {
    return { 
      border: "border-emerald-200 dark:border-emerald-800", 
      bg: "bg-white dark:bg-slate-900", 
      progress: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]", 
      text: "text-emerald-600 dark:text-emerald-400", 
      accent: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", 
      neonHover: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]", 
      neonBlob: "bg-emerald-500" 
    };
  }
  
  return { 
    border: "border-amber-200 dark:border-amber-800", 
    bg: "bg-white dark:bg-slate-900", 
    progress: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]", 
    text: "text-amber-600 dark:text-amber-400", 
    accent: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", 
    neonHover: "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]", 
    neonBlob: "bg-amber-500" 
  };
}