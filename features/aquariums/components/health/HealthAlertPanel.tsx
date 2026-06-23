// features/aquariums/components/health/HealthAlertPanel.tsx
"use client";

import { AlertCircle, XCircle, AlertTriangle } from "lucide-react";
import { HealthStatus } from "../../utils/health-engine";

interface Props {
  alerts: string[];
  status: HealthStatus;
  lang: "id" | "en";
}

export default function HealthAlertPanel({ alerts, status, lang }: Props) {
  
  const isCriticalAlert = (alertText: string) => {
    if (status === 'Critical') return true;
    const text = alertText.toLowerCase();
    return text.includes('kritis') || text.includes('bahaya') || text.includes('critical') || text.includes('danger');
  };

  const translateAlert = (text: string) => {
    if (lang === 'id') return text;
    let translated = text;
    translated = translated.replace(/Bahaya: Amonia mematikan terdeteksi/gi, "Danger: Lethal ammonia detected");
    translated = translated.replace(/Kritis: Puncak toksisitas Nitrit/gi, "Critical: Nitrite toxicity peak");
    translated = translated.replace(/Data LPH filter kosong/gi, "Filter LPH data is missing");
    translated = translated.replace(/Skala tangki/gi, "Tank volume of");
    translated = translated.replace(/memicu risiko penumpukan limbah/gi, "triggers a high risk of waste accumulation");
    translated = translated.replace(/Tanpa heater/gi, "No heater installed");
    translated = translated.replace(/rentan fluktuasi suhu/gi, "vulnerable to temperature fluctuations");
    return translated;
  };

  return (
    <div className="bg-rose-50/50 dark:bg-rose-950/10 p-5 rounded-[2rem] border-2 border-rose-200 dark:border-rose-900/50 shadow-sm relative overflow-hidden group">
      <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-rose-500/5 transform group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      
      <h4 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
        <AlertCircle className="w-5 h-5" /> 
        {lang === 'id' ? "Peringatan Sistem" : "System Alerts"}
      </h4>
      
      <ul className="space-y-3 relative z-10">
        {alerts.length === 0 ? (
          <p className="text-sm font-bold text-rose-600/70 dark:text-rose-400/70 italic">
            {lang === 'id' ? "Ekosistem stabil, tidak ada anomali." : "Ecosystem stable, no anomalies."}
          </p>
        ) : (
          alerts.map((alert, i) => (
            <li key={i} className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-start gap-2.5 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
              {isCriticalAlert(alert) ? (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{translateAlert(alert)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}