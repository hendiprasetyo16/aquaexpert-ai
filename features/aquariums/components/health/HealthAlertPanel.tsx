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
  
  // Fungsi cerdas mendeteksi kata kunci dari Engine Lokal (Support ID & EN)
  const isCriticalAlert = (alertText: string) => {
    if (status === 'Critical') return true;
    const text = alertText.toLowerCase();
    return text.includes('kritis') || text.includes('bahaya') || text.includes('critical') || text.includes('danger');
  };

  return (
    <div className="bg-red-50/50 dark:bg-red-950/10 p-5 rounded-3xl border border-red-100 dark:border-red-900/50 shadow-sm relative overflow-hidden group">
      <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-red-500/5 transform group-hover:scale-110 transition-transform duration-700" />
      <h4 className="text-sm font-black uppercase text-red-600 dark:text-red-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
        <AlertCircle className="w-5 h-5" /> 
        {lang === 'id' ? "Peringatan Sistem" : "System Alerts"}
      </h4>
      <ul className="space-y-3 relative z-10">
        {alerts.length === 0 ? (
          <p className="text-sm font-medium text-red-600/70 dark:text-red-400/70 italic">
            {lang === 'id' ? "Ekosistem aman, tidak ada anomali." : "Ecosystem secure, no anomalies."}
          </p>
        ) : (
          alerts.map((alert, i) => (
            <li key={i} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              {isCriticalAlert(alert) ? (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{alert}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}