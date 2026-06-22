// features/aquariums/components/health/HealthBentoCards.tsx
"use client";

import { Activity, RefreshCw, Box, Leaf, HeartPulse } from "lucide-react";
import { HealthScores } from "../../utils/health-engine";

interface Props {
  scores: HealthScores;
  lang: "id" | "en";
}

export default function HealthBentoCards({ scores, lang }: Props) {
  
  // FIX V1.4: Fungsi konverter skor menjadi Lencana Visual (Severity Badges)
  const getSeverityBadge = (score: number, isNull: boolean) => {
    if (isNull) return null;
    if (score >= 90) return { text: lang === 'id' ? "SEMPURNA" : "EXCELLENT", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    if (score >= 75) return { text: lang === 'id' ? "BAIK" : "GOOD", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (score >= 60) return { text: lang === 'id' ? "WASPADA" : "WARNING", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    return { text: lang === 'id' ? "KRITIS" : "CRITICAL", bg: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" };
  };

  const cards = [
    { label: lang === 'id' ? "Kualitas Air" : "Water Quality", score: scores.waterQuality, color: "text-blue-500", fillBg: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800", icon: Activity, isNull: false },
    { label: lang === 'id' ? "Perawatan" : "Maintenance", score: scores.maintenance, color: "text-amber-500", fillBg: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800", icon: RefreshCw, isNull: false },
    { label: lang === 'id' ? "Kesehatan Ikan" : "Fish Health", score: scores.fishHealth, color: "text-rose-500", fillBg: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800", icon: HeartPulse, isNull: false },
    { label: lang === 'id' ? "Beban Biologis" : "Bioload", score: scores.bioload, color: "text-purple-500", fillBg: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800", icon: Box, isNull: false },
    { label: lang === 'id' ? "Flora" : "Flora", score: scores.plant ?? 0, color: "text-emerald-500", fillBg: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800", icon: Leaf, isNull: scores.plant === null }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((sub, i) => {
        const badge = getSeverityBadge(sub.score, sub.isNull);
        return (
          <div key={i} className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between group transition-colors ${sub.bg}`}>
            <div className="flex justify-between items-start mb-2">
              <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-slate-950/50 ${sub.color}`}>
                <sub.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xl font-black ${sub.isNull ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {sub.isNull ? '-' : sub.score}
                </span>
                {badge && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${badge.bg}`}>
                    {badge.text}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{sub.label}</p>
              <div className="w-full h-1.5 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
                {!sub.isNull && <div className={`h-full rounded-full ${sub.fillBg}`} style={{ width: `${sub.score}%` }} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}