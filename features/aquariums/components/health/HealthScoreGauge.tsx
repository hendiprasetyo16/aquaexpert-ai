"use client";

import { HeartPulse } from "lucide-react";
import { HealthStatus, HealthTrend } from "../../utils/health-engine";
import { getHealthColor, getHealthBg, getHealthStatusText, getTrendIcon } from "./health-formatters";
import { getFriendlyDeductionName } from "../../utils/deduction-labels"; 

interface Props {
  score: number;
  status: HealthStatus;
  trend: HealthTrend;
  lang: "id" | "en";
  deductions?: Record<string, number>;
}

export default function HealthScoreGauge({ score, status, trend, lang, deductions }: Props) {
  
  let limitingFactor: { name: string; penalty: number } | null = null;
  let maxPen = 0;
  
  // FIX ERROR 2: Menggunakan for...of agar TypeScript bisa melacak mutasi nilai 
  // dan tidak menganggap variabel ini sebagai tipe 'never'
  if (deductions) {
    for (const [key, val] of Object.entries(deductions)) {
      if (val > maxPen) {
        maxPen = val;
        limitingFactor = { 
          name: getFriendlyDeductionName(key, lang), 
          penalty: Math.floor(val) 
        };
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full md:w-auto items-center md:items-start">
      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
          <circle 
            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
            strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100} 
            className={`${getHealthColor(status)} transition-all duration-1000 ease-out`} strokeLinecap="round" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${getHealthColor(status)}`}>{score}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className={`p-2 rounded-xl text-white ${getHealthBg(status)} shadow-lg shrink-0`}><HeartPulse className="w-6 h-6" /></div>
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
            {lang === 'id' ? "Status Tangki:" : "Tank Status:"} <br className="hidden md:block"/>
            <span className={getHealthColor(status)}>{getHealthStatusText(status, lang === 'en')}</span>
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Trend: <span className="font-bold text-slate-700 dark:text-slate-300">{getTrendIcon(trend, lang)}</span></p>
        </div>
      </div>

      {limitingFactor && (
        <div className="mt-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl p-3 flex items-start gap-2.5 w-full">
           <div className="mt-0.5 text-rose-500">🔥</div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-0.5">
               {lang === 'id' ? "Faktor Pembatas Utama" : "Main Limiting Factor"}
             </p>
             <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
               {limitingFactor.name} <span className="text-rose-600 dark:text-rose-400 font-black">(-{limitingFactor.penalty})</span>
             </p>
           </div>
        </div>
      )}
    </div>
  );
}