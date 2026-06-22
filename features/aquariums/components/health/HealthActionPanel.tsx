// features/aquariums/components/health/HealthActionPanel.tsx
"use client";

import { HeartPulse, CheckCircle2 } from "lucide-react";

interface Props {
  recommendations: string[];
  lang: "id" | "en";
}

export default function HealthActionPanel({ recommendations, lang }: Props) {
  return (
    <div className="bg-teal-50/50 dark:bg-teal-950/10 p-5 rounded-3xl border border-teal-100 dark:border-teal-900/50 shadow-sm relative overflow-hidden group">
      <HeartPulse className="absolute -right-4 -bottom-4 w-32 h-32 text-teal-500/5 transform group-hover:scale-110 transition-transform duration-700" />
      <h4 className="text-sm font-black uppercase text-teal-600 dark:text-teal-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
        <CheckCircle2 className="w-5 h-5" /> 
        {lang === 'id' ? "Tindakan Disarankan" : "Action Required"}
      </h4>
      <ul className="space-y-3 relative z-10">
        {recommendations.length === 0 ? (
          <p className="text-sm font-medium text-teal-600/70 dark:text-teal-400/70 italic">
            {lang === 'id' ? "Tidak ada tindakan mendesak." : "No urgent actions required."}
          </p>
        ) : (
          recommendations.map((rec, i) => (
            <li key={i} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              {/* Teks sudah bilingual dari Health Engine Backend */}
              <span className="leading-snug">{rec}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}