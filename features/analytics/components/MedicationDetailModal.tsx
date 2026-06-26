// features/analytics/components/MedicationDetailModal.tsx
"use client";

import { X, Activity, ShieldCheck, AlertTriangle, TrendingUp, Clock, Info } from "lucide-react";
import { LeaderboardRow } from "../actions/analytics.actions";
import { useLanguage } from "@/providers/LanguageProvider";

interface Props {
  data: LeaderboardRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicationDetailModal({ data, isOpen, onClose }: Props) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  if (!isOpen || !data) return null;

  const medName = data.medication?.name || "Unknown Medication";
  const diseaseName = lang === 'id' ? data.disease?.name_id : data.disease?.name_en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" 
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                data.evidence_grade === 'High' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' 
                : data.evidence_grade === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
              }`}>
                {data.evidence_grade} Evidence
              </span>
              <span className="text-xs font-bold text-slate-500">
                {data.total_cases.toLocaleString()} {lang === 'id' ? 'Kasus' : 'Cases'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{medName}</h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> {lang === 'id' ? 'Untuk Pengobatan:' : 'For Treating:'} <strong className="text-slate-700 dark:text-slate-300">{diseaseName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ISI MODAL */}
        <div className="p-6 space-y-6">
          
          {/* Clinical Score Besar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/50">
            <div className="flex items-center gap-3">
              <div className="bg-teal-500 text-white p-2.5 rounded-xl shadow-sm shadow-teal-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-700 dark:text-teal-500 uppercase tracking-widest mb-0.5">Clinical Score</p>
                <p className="text-sm font-medium text-teal-800 dark:text-teal-300 leading-tight">
                  {lang === 'id' ? 'Berdasarkan formula pembobotan efikasi' : 'Based on efficacy weighting formula'}
                </p>
              </div>
            </div>
            <div className="text-3xl font-black text-teal-600 dark:text-teal-400">
              {data.clinical_score}
            </div>
          </div>

          {/* Grid Statistik */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Success Rate</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{data.success_rate_pct}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${data.success_rate_pct}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Median Recovery</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
                {data.median_recovery_days} <span className="text-sm text-slate-500">{lang === 'id' ? 'Hari' : 'Days'}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Waktu rata-rata pemulihan</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2 text-orange-500 dark:text-orange-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Relapse Rate</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{data.relapse_rate_pct}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${data.relapse_rate_pct}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Mortality</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{data.mortality_rate_pct}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${data.mortality_rate_pct}%` }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}