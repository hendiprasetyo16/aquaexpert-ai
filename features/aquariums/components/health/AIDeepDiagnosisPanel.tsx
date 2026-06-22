// features/aquariums/components/health/AIDeepDiagnosisPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { getHybridDeepDiagnosisAction, HybridDiagnosisResponse } from "../../actions/gemini-expert.actions";
import { RiskLevel } from "../../utils/deep-diagnosis";
import { ShieldAlert, Sparkles, AlertTriangle, Activity, AlertOctagon, Stethoscope, Flame, ShieldCheck, Eye, Leaf, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  aquariumId: string;
  lang: "id" | "en";
}

export default function AIDeepDiagnosisPanel({ aquariumId, lang }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HybridDiagnosisResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // FIX BUG 1: Bump Cache Version to v2 to prevent undefined priority crashes
    const cachedDiagnosis = sessionStorage.getItem(`aquaexpert_diagnosis_v2_${aquariumId}`);
    if (cachedDiagnosis) {
      try { setResult(JSON.parse(cachedDiagnosis)); } catch (err) {}
    }
  }, [aquariumId]);

  const handleRunDiagnosis = async () => {
    setLoading(true); setError("");
    const res = await getHybridDeepDiagnosisAction(aquariumId, lang);
    if (res.success && res.localDiagnosis) {
      setResult(res);
      // FIX BUG 1: Bump Cache Version
      sessionStorage.setItem(`aquaexpert_diagnosis_v2_${aquariumId}`, JSON.stringify(res));
    } else {
      setError(res.error || "Gagal memproses diagnosis.");
    }
    setLoading(false);
  };

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
    if (sev === "high") return "bg-rose-500 text-white border-rose-600";
    if (sev === "medium") return "bg-amber-500 text-white border-amber-600";
    return "bg-teal-500 text-white border-teal-600";
  };

  const RiskRadarCore = ({ currentRisk }: { currentRisk: RiskLevel }) => {
    const config = {
      CRITICAL: { color: "text-rose-600 dark:text-rose-500", border: "border-rose-500", bg: "bg-rose-600", icon: AlertOctagon },
      HIGH: { color: "text-orange-600 dark:text-orange-500", border: "border-orange-500", bg: "bg-orange-500", icon: Flame },
      MEDIUM: { color: "text-amber-600 dark:text-amber-500", border: "border-amber-500", bg: "bg-amber-500", icon: AlertTriangle },
      LOW: { color: "text-teal-600 dark:text-teal-500", border: "border-teal-500", bg: "bg-teal-500", icon: ShieldCheck }
    }[currentRisk];
    const Icon = config.icon;
    return (
      <div className="relative flex flex-col items-center justify-center py-8 w-full">
        <div className={`absolute inset-0 m-auto w-40 h-40 rounded-full border-4 border-dashed ${config.border} opacity-20 animate-[spin_10s_linear_infinite]`} />
        <div className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-4 ${config.border} transition-all duration-700 scale-110`}>
          <Icon className={`w-8 h-8 ${config.color} mb-1`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{getRiskLevelText(currentRisk)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4">
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] border-2 border-dashed border-indigo-200 text-center">
          <Stethoscope className="w-16 h-16 text-indigo-500 mb-4" />
          <h4 className="text-xl md:text-2xl font-black text-indigo-900 dark:text-indigo-200 mb-4">Hybrid Expert Diagnostic</h4>
          <Button onClick={handleRunDiagnosis} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-xl w-full sm:w-auto">
            <Activity className="w-5 h-5 mr-2" /> {lang === 'id' ? "MULAI DIAGNOSIS SISTEM" : "START DIAGNOSIS"}
          </Button>
          {error && <p className="text-sm font-bold text-rose-500 mt-4">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 text-indigo-600 dark:text-indigo-400 font-black animate-pulse">
          <Bot className="w-12 h-12 mb-4 animate-bounce" />
          {lang === 'id' ? "Menganalisis Ekosistem & Menghubungi Pakar AI..." : "Analyzing Ecosystem & Consulting AI..."}
        </div>
      )}

      {result && result.localDiagnosis && !loading && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col-reverse md:flex-row gap-8 items-center">
            <div className="flex-1 text-center md:text-left">
              <p className="text-slate-800 dark:text-slate-200 font-extrabold text-lg sm:text-xl md:text-2xl leading-relaxed">
                {result.localDiagnosis.summary}
              </p>
            </div>
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border-2 border-slate-200 shadow-inner flex flex-col items-center">
              <RiskRadarCore currentRisk={result.localDiagnosis.riskLevel} />
            </div>
          </div>

          <div className={`relative overflow-hidden p-6 sm:p-8 rounded-[2rem] border-2 shadow-lg ${result.expertAIExtras.generatedByGemini ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            {result.expertAIExtras.generatedByGemini && <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-indigo-500/10 rotate-12" />}
            <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${result.expertAIExtras.generatedByGemini ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
              <Bot className="w-5 h-5" /> {lang === 'id' ? "Catatan Pakar Ekologi (AI)" : "Expert Ecological Notes (AI)"}
            </h4>
            <div className="text-sm md:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300 space-y-4 whitespace-pre-wrap relative z-10">
              {result.expertAIExtras.commentary}
            </div>
          </div>

          {result.localDiagnosis.explainabilityBreakdown && result.localDiagnosis.explainabilityBreakdown.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-1.5"><Eye className="w-4 h-4"/> Log Transparansi Nilai (AI Explainability)</h4>
              <div className="flex flex-wrap gap-2">
                {result.localDiagnosis.explainabilityBreakdown.map((item, idx) => (
                  <span key={idx} className="text-xs font-bold bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg shadow-sm">{item}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-rose-50 dark:bg-rose-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-rose-200 shadow-md">
                <h4 className="text-sm font-black uppercase text-rose-700 tracking-widest mb-5 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> {lang === 'id' ? "Akar Masalah Terdeteksi" : "Core Root Causes"}</h4>
                {result.localDiagnosis.rootCauses.length === 0 ? (
                  <p className="text-sm font-bold text-rose-600/50">{lang === 'id' ? "Tidak ada masalah kritis terdeteksi." : "No critical issues detected."}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.localDiagnosis.rootCauses.map((cause, i) => (
                      <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">{cause.title}</h5>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${getSeverityColor(cause.severity)}`}>{cause.severity}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed mt-auto">{cause.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-emerald-200 shadow-md">
                <h4 className="text-sm font-black uppercase text-emerald-800 tracking-widest mb-4 flex items-center gap-2"><Leaf className="w-5 h-5"/> {lang === 'id' ? "Rekomendasi Spesies Tanaman Pendukung" : "Flora Support Recommendations"}</h4>
                <div className="space-y-2">
                  {result.localDiagnosis.plantRecommendations.map((rec, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-amber-50 dark:bg-amber-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-amber-200 shadow-md flex flex-col">
              <h4 className="text-sm font-black uppercase text-amber-800 tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5" /> {lang === 'id' ? "Rencana Eksekusi" : "Action Plan"}
              </h4>
              <div className="space-y-4 flex-1">
                {result.localDiagnosis.nextActions.map((action, i) => {
                  const getPriorityConfig = (priority: string) => {
                    switch(priority) {
                      case "critical": return { color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 border-rose-200", icon: "🔴", label: lang === 'id' ? "KRITIS" : "CRITICAL" };
                      case "high": return { color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 border-orange-200", icon: "🟠", label: lang === 'id' ? "TINGGI" : "HIGH" };
                      case "medium": return { color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-200", icon: "🟡", label: lang === 'id' ? "SEDANG" : "MEDIUM" };
                      default: return { color: "text-teal-600 bg-teal-100 dark:bg-teal-900/30 border-teal-200", icon: "🟢", label: lang === 'id' ? "RENDAH" : "LOW" };
                    }
                  }
                  const config = getPriorityConfig(action.priority);

                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{config.icon}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border ml-5 shadow-sm">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          {action.instruction}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}