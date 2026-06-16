// features/aquariums/components/health/AIDeepDiagnosisPanel.tsx
"use client";

import { useState } from "react";
import { getDeepDiagnosisAction } from "../../actions/deep-diagnosis.actions";
import { DeepDiagnosisResult } from "../../utils/deep-diagnosis";
import { ShieldAlert, Sparkles, Loader2, AlertTriangle, CheckCircle, Clock, Activity, Flame, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  aquariumId: string;
  lang: "id" | "en";
}

export default function AIDeepDiagnosisPanel({ aquariumId, lang }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepDiagnosisResult | null>(null);
  const [error, setError] = useState("");

  const handleRunDiagnosis = async () => {
    setLoading(true);
    setError("");
    const res = await getDeepDiagnosisAction(aquariumId, lang);
    if (res.success && res.diagnosis) {
      setResult(res.diagnosis as DeepDiagnosisResult);
    } else {
      setError(res.error || "Gagal memproses diagnosis.");
    }
    setTimeout(() => setLoading(false), 800); 
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-rose-600 text-white shadow-rose-600/20";
      case "HIGH": return "bg-red-500 text-white shadow-red-500/20";
      case "MEDIUM": return "bg-amber-500 text-white shadow-amber-500/20";
      default: return "bg-teal-500 text-white shadow-teal-500/20";
    }
  };

  // FUNGSI BARU: Menerjemahkan level risiko ke bahasa UI
  const getRiskLevelText = (level: string) => {
    if (lang === 'en') return level;
    switch (level) {
      case "CRITICAL": return "KRITIS";
      case "HIGH": return "TINGGI";
      case "MEDIUM": return "SEDANG";
      default: return "RENDAH";
    }
  };

  const getSeverityColor = (sev: string) => {
    if (sev === "high") return "text-red-600 bg-red-100 dark:bg-red-900/40";
    if (sev === "medium") return "text-amber-600 bg-amber-100 dark:bg-amber-900/40";
    return "text-teal-600 bg-teal-100 dark:bg-teal-900/40";
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ", " + date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 mt-4">
      {/* TOMBOL PEMICU AWAL / LOADING PANEL */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-3xl border border-dashed border-indigo-200 dark:border-indigo-900/50 shadow-inner text-center">
          <Activity className="w-16 h-16 text-indigo-500/60 mb-4 animate-pulse" />
          <h4 className="text-2xl font-black text-indigo-800 dark:text-indigo-200 mb-2">Deep Diagnosis Engine</h4>
          <p className="text-sm font-medium text-slate-500 max-w-md leading-relaxed mb-6">
            {lang === 'id' 
              ? "Orkestrasikan seluruh parameter, bioload, dan catatan perawatan Anda ke dalam Expert Engine kami untuk mendeteksi akar masalah secara real-time."
              : "Orchestrate your variables into our Expert Engine to trace precise ecosystem anomalies."}
          </p>
          <Button onClick={handleRunDiagnosis} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-indigo-500/20 tracking-wide">
            <Activity className="w-4 h-4 mr-2" /> {lang === 'id' ? "MULAI DIAGNOSIS SISTEM" : "START DIAGNOSIS"}
          </Button>
        </div>
      )}

      {/* ANIMASI MEMPROSES */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 animate-pulse">
            {lang === 'id' ? "Mengeksekusi Algoritma Diagnosis..." : "Executing Diagnostic Rules..."}
          </h4>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 text-red-600 border border-red-200 rounded-2xl flex items-start gap-3 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> <p>{error}</p>
        </div>
      )}

      {/* DASHBOARD HASIL ANALISIS */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          
          {/* BANNER ATAS: SUMMARY + RISK LEVEL */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
            <div className="md:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-md flex flex-col justify-center">
              <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1.5 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> {lang === 'id' ? "Ringkasan Diagnosis" : "Diagnostic Summary"}
              </h5>
              <p className="text-slate-700 dark:text-slate-300 font-bold text-base leading-relaxed">
                {result.summary}
              </p>
            </div>
            
            <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden group ${getRiskBadge(result.riskLevel)}`}>
              <Flame className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 transform group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{lang === 'id' ? "Tingkat Risiko" : "Risk Level"}</span>
              <span className="text-2xl lg:text-3xl font-black drop-shadow-md uppercase tracking-wider">
                {getRiskLevelText(result.riskLevel)}
              </span>
            </div>
          </div>

          {/* DUAL COMPONENT: ROOT CAUSES & NEXT ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* PANEL AKAR MASALAH */}
            <div className="bg-rose-50/30 dark:bg-rose-950/10 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/40 shadow-sm relative overflow-hidden group">
              <AlertTriangle className="absolute -right-6 -bottom-6 w-32 h-32 text-rose-500/5 -rotate-12" />
              <h4 className="text-sm font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
                <ShieldAlert className="w-5 h-5" /> {lang === 'id' ? "Akar Masalah Utama" : "Root Causes Identified"}
              </h4>
              
              {result.rootCauses.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium italic relative z-10">{lang === 'id' ? "Tidak ada masalah mendesak terdeteksi." : "No critical issues found."}</p>
              ) : (
                <ul className="space-y-4 relative z-10">
                  {result.rootCauses.map((cause, i) => (
                    <li key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getSeverityColor(cause.severity)}`}>
                          {cause.severity}
                        </span>
                        <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{cause.title}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 pl-1 leading-snug">{cause.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PANEL URUTAN EKSEKUSI JANGKA PENDEK */}
            <div className="bg-amber-50/30 dark:bg-amber-950/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/40 shadow-sm relative overflow-hidden group">
              <Activity className="absolute -right-6 -bottom-6 w-32 h-32 text-amber-500/5" />
              <h4 className="text-sm font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
                <Clock className="w-5 h-5" /> {lang === 'id' ? "Langkah Tindakan Instan" : "Immediate Next Actions"}
              </h4>
              <ul className="space-y-3.5 relative z-10">
                {result.nextActions.map((action, i) => (
                  <li key={i} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-start gap-3 leading-snug">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* PANEL REKOMENDASI JANGKA PANJANG */}
          <div className="bg-teal-50/30 dark:bg-teal-950/10 p-6 rounded-3xl border border-teal-100 dark:border-teal-900/40 shadow-sm relative overflow-hidden group">
            <CheckCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-teal-500/5" />
            <h4 className="text-sm font-black uppercase text-teal-600 dark:text-teal-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
              <Sparkles className="w-5 h-5" /> {lang === 'id' ? "Saran Pemeliharaan Sistem" : "System Recommendations"}
            </h4>
            
            {result.recommendations.length === 0 ? (
               <p className="text-sm text-slate-500 font-medium italic relative z-10">{lang === 'id' ? "Lanjutkan jadwal perawatan reguler Anda." : "Keep up the good work."}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-teal-50/50 dark:border-teal-950/50 flex items-start gap-3 shadow-sm font-semibold text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOG DATA REFRESH BUTTON */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
            <span>{lang === 'id' ? 'DIHITUNG PADA:' : 'COMPUTED:'} {formatDateTime(result.generatedAt)}</span>
            <button onClick={handleRunDiagnosis} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" /> {lang === 'id' ? "Analisis Ulang" : "Re-Diagnose"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}