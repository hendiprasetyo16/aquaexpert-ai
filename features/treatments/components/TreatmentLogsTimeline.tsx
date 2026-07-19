// features/treatments/components/TreatmentLogsTimeline.tsx
"use client";

import { useEffect, useState } from "react";
import { getTreatmentHistoryLogsAction } from "../actions/history.actions";
import { CheckCircle2, History, Syringe, Droplets, Eye, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface Props {
  sessionId: string;
  lang: "id" | "en";
  hasLoggedToday: boolean;
}

export default function TreatmentLogsTimeline({ sessionId, lang, hasLoggedToday }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchLogs() {
      const res = await getTreatmentHistoryLogsAction(sessionId);
      if (res.success && res.data) setLogs(res.data);
      setLoading(false);
    }
    if (sessionId) fetchLogs();
  }, [sessionId]);

  const parseNotes = (rawNotes: string | null) => {
    if (!rawNotes) return null;
    const lines = rawNotes.split(/\\n|\r?\n|<br\s*\/?>/i).map(line => line.trim()).filter(line => line !== '');
    return lines.map((line, idx) => (
        <span key={idx} className="block text-[11px] font-medium leading-relaxed border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5 mb-1.5 last:border-0 last:pb-0 last:mb-0">
            {line}
        </span>
    ));
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-300" /></div>;
  if (logs.length === 0) return null;

  const latestLog = logs[0];
  const pastLogs = logs.slice(1);

  return (
    <div className="space-y-3 w-full">
      {/* KOTAK LOG TERBARU */}
      <div className={`p-3 rounded-xl border ${hasLoggedToday ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800'}`}>
        <div className="flex justify-between items-start mb-2">
          <p className={`text-[10px] font-black tracking-widest flex items-center gap-1 ${hasLoggedToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {hasLoggedToday ? <><CheckCircle2 className="w-3 h-3"/> {lang === 'id' ? "SUDAH DIUPDATE HARI INI" : "UPDATED TODAY"}</> : <><History className="w-3 h-3"/> {lang === 'id' ? "LOG TERAKHIR" : "LATEST LOG"}</>}
          </p>
          <span className="text-[10px] font-black uppercase text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
            HARI {latestLog.day_number}
          </span>
        </div>
        
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 mb-2">
            {latestLog.action_taken === "Water Change" ? <Droplets className="w-3.5 h-3.5 text-blue-500"/> : latestLog.action_taken === "Redosed" ? <Syringe className="w-3.5 h-3.5 text-rose-500"/> : <Eye className="w-3.5 h-3.5 text-slate-500"/>}
            <span>
              {latestLog.action_taken === "Observed" ? (lang === 'id' ? "Hanya Observasi" : "Observed") 
              : latestLog.action_taken === "Redosed" ? (lang === 'id' ? "Dosis Ulang" : "Redosed") 
              : latestLog.action_taken === "Water Change" ? (lang === 'id' ? "Ganti Air" : "Water Change") : latestLog.action_taken}
            </span>
          </div>
          <div className="font-normal italic text-slate-500 max-h-32 overflow-y-auto custom-scrollbar flex flex-col bg-white/50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
            {parseNotes(latestLog.notes) || (lang === 'id' ? "Tidak ada catatan klinis." : "No clinical notes.")}
          </div>
        </div>
      </div>

      {/* ACCORDION RIWAYAT LAMA (Jika ada) */}
      {pastLogs.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm transition-all">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="w-full flex items-center justify-between p-3 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5"/> {lang === 'id' ? `Lihat Riwayat Jurnal Sebelumnya (${pastLogs.length} Hari)` : `View Past History (${pastLogs.length} Days)`}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
          
          {isExpanded && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              {pastLogs.map(log => (
                <div key={log.id} className="pt-2.5 mt-2.5 border-t border-slate-200 dark:border-slate-800 first:border-0 first:pt-1 first:mt-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">Hari {log.day_number}</span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                       {log.action_taken === "Water Change" ? <Droplets className="w-3 h-3 text-blue-400"/> : log.action_taken === "Redosed" ? <Syringe className="w-3 h-3 text-rose-400"/> : <Eye className="w-3 h-3 text-slate-400"/>}
                       {log.action_taken}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium italic pl-1 leading-relaxed line-clamp-2">
                    {log.notes ? log.notes.split(/\\n|\r?\n|<br\s*\/?>/i)[0] : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}