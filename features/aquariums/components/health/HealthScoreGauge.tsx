// features/aquariums/components/health/HealthScoreGauge.tsx
"use client";

import { HeartPulse } from "lucide-react";
import { HealthStatus, HealthTrend } from "../../utils/health-engine";
import { getHealthColor, getHealthBg, getHealthStatusText, getTrendIcon } from "./health-formatters";

interface Props {
  score: number;
  status: HealthStatus;
  trend: HealthTrend;
  lang: "id" | "en";
}

export default function HealthScoreGauge({ score, status, trend, lang }: Props) {
  return (
    <>
      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center mx-auto md:mx-0">
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

      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className={`p-2 rounded-xl text-white ${getHealthBg(status)} shadow-lg`}><HeartPulse className="w-6 h-6" /></div>
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
            {lang === 'id' ? "Kesehatan Ekosistem:" : "Ecosystem Health:"} <span className={getHealthColor(status)}>{getHealthStatusText(status, lang === 'en')}</span>
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Trend: <span className="font-bold text-slate-700 dark:text-slate-300">{getTrendIcon(trend, lang)}</span></p>
        </div>
      </div>
    </>
  );
}