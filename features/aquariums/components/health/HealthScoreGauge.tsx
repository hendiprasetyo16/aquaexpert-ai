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
    // Membentuk kolom vertikal rapi di sebelah kiri
    <div className="flex flex-col items-center text-center gap-6 w-full lg:w-56 shrink-0">
      
      {/* Radar Bulat */}
      <div className="relative w-40 h-40 md:w-48 md:h-48 shrink-0 flex items-center justify-center drop-shadow-xl">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
          <circle 
            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
            strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100} 
            className={`${getHealthColor(status)} transition-all duration-1000 ease-out`} strokeLinecap="round" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl md:text-5xl font-black ${getHealthColor(status)}`}>{score}</span>
          <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
        </div>
      </div>

      {/* Status Teks */}
      <div className="flex flex-col items-center">
        <div className={`p-2.5 rounded-2xl text-white ${getHealthBg(status)} shadow-lg inline-flex mb-3`}>
          <HeartPulse className="w-6 h-6" />
        </div>
        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">
          {lang === 'id' ? "Status Tangki:" : "Tank Status:"} <br />
          <span className={getHealthColor(status)}>{getHealthStatusText(status, lang === 'en')}</span>
        </h3>
        <p className="text-sm md:text-base font-medium text-slate-500 mt-2 flex items-center gap-2 justify-center">
          Trend: <span className="font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">{getTrendIcon(trend, lang)}</span>
        </p>
      </div>

    </div>
  );
}