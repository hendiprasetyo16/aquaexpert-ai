// features/aquariums/components/health/HealthBentoCards.tsx
"use client";

import { Activity, RefreshCw, Box, Leaf } from "lucide-react";
import { HealthScores } from "../../utils/health-engine";

interface Props {
  scores: HealthScores;
  lang: "id" | "en";
}

export default function HealthBentoCards({ scores, lang }: Props) {
  const cards = [
    { label: lang === 'id' ? "Kualitas Air" : "Water Quality", score: scores.waterQuality, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800", icon: Activity },
    { label: lang === 'id' ? "Perawatan" : "Maintenance", score: scores.maintenance, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800", icon: RefreshCw },
    { label: lang === 'id' ? "Beban Biologis" : "Bioload", score: scores.bioload, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800", icon: Box },
    { label: lang === 'id' ? "Flora" : "Flora", score: scores.plant ?? 0, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800", icon: Leaf, isNull: scores.plant === null }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((sub, i) => (
        <div key={i} className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between group transition-colors ${sub.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-slate-950/50 ${sub.color}`}><sub.icon className="w-4 h-4" /></div>
            <span className={`text-xl font-black ${sub.isNull ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{sub.isNull ? '-' : sub.score}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{sub.label}</p>
            <div className="w-full h-1.5 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
              {!sub.isNull && <div className={`h-full rounded-full ${sub.color.replace('text', 'bg')}`} style={{ width: `${sub.score}%` }} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}