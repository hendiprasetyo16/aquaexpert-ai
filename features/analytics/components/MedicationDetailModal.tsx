// features/analytics/components/MedicationDetailModal.tsx
"use client";

import { X, ShieldCheck, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import type { LeaderboardRow } from "../actions/analytics.actions";

interface Props {
  data: LeaderboardRow | null;
  isOpen: boolean;
  onClose: () => void;
  dict: Record<string, string>; // MENGHILANGKAN 'any'
  lang: "id" | "en";
}

export default function MedicationDetailModal({ data, isOpen, onClose, dict, lang }: Props) {
  if (!isOpen || !data) return null;

  const medName = data.medication?.name || (lang === 'id' ? "Obat Tidak Diketahui" : "Unknown Medication");
  const diseaseName = lang === 'id' ? data.disease?.name_id : data.disease?.name_en;

  const txtForDisease = dict?.forDisease || (lang === 'id' ? "Untuk Penyakit:" : "For Disease:");
  const txtScore = dict?.colScore || (lang === 'id' ? "Skor Klinis" : "Clinical Score");
  const txtCases = dict?.colCases || (lang === 'id' ? "Total Kasus" : "Evidence Cases");
  const txtSuccess = dict?.colSuccess || (lang === 'id' ? "Tingkat Sembuh" : "Success Rate");
  const txtRelapse = dict?.colRelapse || (lang === 'id' ? "Tingkat Kambuh" : "Relapse Rate");
  const txtMortality = dict?.modalMortality || (lang === 'id' ? "Tingkat Kematian" : "Mortality Rate");
  const txtAvgRecovery = dict?.modalAvgRecovery || (lang === 'id' ? "Waktu rata-rata pemulihan" : "Average recovery time");
  const txtDays = dict?.days || (lang === 'id' ? "Hari" : "Days");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/80 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative" 
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/10 dark:bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start relative z-10 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="pr-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                {txtForDisease} {diseaseName}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight drop-shadow-sm">
              {medName}
            </h2>
          </div>
          
          {/* FIX: Warna hover diterapkan penuh di button. X mewarisi (currentColor) */}
          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 rounded-full shrink-0 shadow-sm cursor-pointer transition-all duration-200 bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white active:bg-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-600 dark:hover:text-white dark:active:bg-rose-700"
          >
            <X className="w-5 h-5 font-bold currentColor" />
          </button>
        </div>

        <div className="p-6 space-y-5 relative z-10 bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar">
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group transition-all duration-300 cursor-default">
              <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 relative z-10 transition-transform duration-300 group-hover:-translate-y-1">{txtScore}</span>
              <span className="text-4xl font-extrabold text-slate-800 dark:text-indigo-300 drop-shadow-sm relative z-10 transition-transform duration-300 group-hover:scale-110">{data.clinical_score}</span>
            </div>
            
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group transition-all duration-300 cursor-default">
              <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 relative z-10 transition-transform duration-300 group-hover:-translate-y-1">{txtCases}</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 drop-shadow-sm mt-1 relative z-10 transition-transform duration-300 group-hover:scale-110">{data.total_cases.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50 dark:bg-slate-900 shadow-sm transition-colors duration-300 cursor-default">
              <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-500">
                <ShieldCheck className="w-5 h-5 drop-shadow-sm" />
                <span className="text-xs font-black uppercase tracking-wider">{txtSuccess}</span>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 drop-shadow-sm">{data.success_rate_pct}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div className="bg-emerald-500 dark:bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${data.success_rate_pct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 bg-slate-50 dark:bg-slate-900 shadow-sm transition-colors duration-300 cursor-default">
                <div className="flex items-center gap-2 mb-3 text-orange-500 dark:text-orange-400">
                  <TrendingUp className="w-5 h-5 drop-shadow-sm" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{txtRelapse}</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 drop-shadow-sm">{data.relapse_rate_pct}%</div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                  <div className="bg-orange-500 dark:bg-orange-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${data.relapse_rate_pct}%` }} />
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 bg-slate-50 dark:bg-slate-900 shadow-sm transition-colors duration-300 cursor-default">
                <div className="flex items-center gap-2 mb-3 text-rose-600 dark:text-rose-500">
                  <AlertTriangle className="w-5 h-5 drop-shadow-sm" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{txtMortality}</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 drop-shadow-sm">{data.mortality_rate_pct}%</div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                  <div className="bg-rose-500 dark:bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${data.mortality_rate_pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner mt-2">
            <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            {txtAvgRecovery}: <span className="text-blue-600 dark:text-blue-400 font-black ml-1">{data.median_recovery_days} {txtDays}</span>
          </div>
        </div>
      </div>
    </div>
  );
}