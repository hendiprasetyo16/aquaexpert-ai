// features/diseases/components/DiseaseResultCard.tsx
"use client";

import { AlertTriangle, ShieldAlert, Award, ChevronRight, Activity, Info, XCircle, CheckCircle2 } from "lucide-react";
import type { DiseaseMatchResult, Symptom } from "@/features/diseases/types/disease.types";
import { translateXAI } from "@/features/ai/utils/xai-translator";
import type { DiagnosisExplanation } from "@/features/ai/types/diagnosis.types";
// 💡 PERBAIKAN IMPORT PATH MENGGUNAKAN ABSOLUTE PATH
import { resolveDiagnosisTheme } from "@/features/diseases/utils/theme-resolver";

interface Props {
  result: DiseaseMatchResult;
  lang?: "id" | "en";
  isTopMatch?: boolean; 
  onDetailClick: (diseaseId: string) => void;
}

export function DiseaseResultCard({ result, lang = "id", isTopMatch = false, onDetailClick }: Props) {
  const { disease, confidenceScore, susceptibilityWarning, hasHallmarkMatch, status } = result;
  
  const displayScore = status === 'ELIMINATED' ? 0 : (result.aiMetrics?.relativeProbability ?? confidenceScore);
  
  const style = resolveDiagnosisTheme(status || 'ACTIVE', displayScore);

  const diseaseName = lang === "id" ? disease.name_id : disease.name_en;
  const isCritical = (disease.severity ?? 1) >= 4;

  const translateCategory = (cat: string | null | undefined) => {
    if (!cat) return lang === 'id' ? "Umum" : "General";
    if (lang === 'en') return cat;
    const map: Record<string, string> = { "Parasitic": "Parasit", "Bacterial": "Bakteri", "Fungal": "Jamur", "Viral": "Virus", "Environmental": "Lingkungan", "Nutritional": "Nutrisi" };
    return map[cat] || cat;
  };

  return (
    <div 
      onClick={() => onDetailClick(disease.id)}
      className={`group cursor-pointer w-full rounded-2xl border-2 p-5 md:p-6 transition-all duration-300 relative overflow-hidden flex flex-col hover:-translate-y-1 ${style.bg} ${style.border} ${style.neonHover}`}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[50px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${style.neonBlob}`}></div>

      {status === 'ELIMINATED' ? (
        <div className="absolute top-0 right-0 bg-slate-500 dark:bg-slate-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl tracking-widest flex items-center gap-1.5 shadow-md z-20">
          <XCircle className="w-3.5 h-3.5" /> {lang === 'id' ? "DIELIMINASI MUTLAK" : "ABSOLUTE EXCLUSION"}
        </div>
      ) : status === 'LOW_CONFIDENCE' ? (
        <div className="absolute top-0 right-0 bg-amber-500 dark:bg-amber-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl tracking-widest flex items-center gap-1.5 shadow-md z-20">
          <AlertTriangle className="w-3.5 h-3.5" /> {lang === 'id' ? "KEYAKINAN RENDAH" : "LOW CONFIDENCE"}
        </div>
      ) : isTopMatch ? (
        <div className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl tracking-widest flex items-center gap-1.5 shadow-md z-20">
          <Activity className="w-3.5 h-3.5" /> PRIMARY MATCH
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
             <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-transparent group-hover:border-current transition-colors ${style.accent}`}>
               {translateCategory(disease.disease_category)}
             </span>
          </div>
          <div className="flex items-center gap-2">
              <h3 className={`text-xl font-black leading-tight transition-colors ${status === 'ELIMINATED' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`}>
                {diseaseName}
              </h3>
              <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 shrink-0 hidden sm:block ${status === 'ELIMINATED' ? 'text-slate-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-blue-500'}`} />
          </div>
        </div>
        
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0 shrink-0 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Probabilitas Relatif" : "Relative Probability"}</span>
          <span className={`text-3xl font-black ${style.text}`}>{displayScore}%</span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5 relative z-10">
        <div className={`h-full ${style.progress} transition-all duration-1000 ease-out`} style={{ width: `${displayScore}%` }} />
      </div>

      {result.explanations && result.explanations.length > 0 && (
        <div className="mb-4 bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 relative z-10">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> {lang === 'id' ? "Analisis Logika AI" : "AI Logic Analysis"}
          </p>
          <ul className="space-y-2.5">
            {result.explanations.map((exp: DiagnosisExplanation, idx: number) => {
              const text = translateXAI(exp, lang);
              let Icon = Info;
              let colorClass = "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30";
              
              if (exp.severity === 'WARNING') { Icon = AlertTriangle; colorClass = "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"; } 
              else if (exp.severity === 'CRITICAL') { Icon = XCircle; colorClass = "text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30"; } 
              else if (exp.code.includes('Matched') || exp.code.includes('Fulfilled') || exp.code.includes('Chain')) { Icon = CheckCircle2; colorClass = "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"; }

              return (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  <div className={`p-1 rounded-full shrink-0 ${colorClass} mt-0.5`}><Icon className="w-3 h-3" /></div>
                  <span dangerouslySetInnerHTML={{ __html: text.replace(/\[(.*?)\]/g, '<strong class="font-black text-slate-800 dark:text-slate-100">$1</strong>') }} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {result.matchedSymptoms && result.matchedSymptoms.length > 0 && status !== 'ELIMINATED' && (
        <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
          {result.matchedSymptoms.map((sym: any) => (
            <span key={sym.id} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700/50">
              ✓ {lang === 'id' ? sym.name_id || sym.id : sym.name_en || sym.id}
            </span>
          ))}
        </div>
      )}

      {(susceptibilityWarning || hasHallmarkMatch || isCritical) && status !== 'ELIMINATED' && (
        <div className="space-y-2.5 relative z-10 mb-2">
          {hasHallmarkMatch && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40">
              <Award className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold leading-relaxed">{lang === "id" ? "Tanda Mutlak Terpenuhi. Akurasi Sangat Tinggi." : "Pathognomonic Hallmark Match. High Accuracy."}</span>
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
              <span className="font-semibold leading-relaxed">{lang === "id" ? "Peringatan: Risiko Kematian Sangat Tinggi." : "Warning: Critical Mortality Risk."}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}