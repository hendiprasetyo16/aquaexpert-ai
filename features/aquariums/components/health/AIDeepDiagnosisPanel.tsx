// features/aquariums/components/health/AIDeepDiagnosisPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { getDeepDiagnosisAction } from "../../actions/deep-diagnosis.actions";
import { DeepDiagnosisResult, RiskLevel } from "../../utils/deep-diagnosis";
import { ShieldAlert, Sparkles, Loader2, AlertTriangle, CheckCircle2, Clock, Activity, AlertOctagon, ListTodo, Stethoscope, RefreshCw, Flame, ShieldCheck, Eye, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  aquariumId: string;
  lang: "id" | "en";
}

export default function AIDeepDiagnosisPanel({ aquariumId, lang }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepDiagnosisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cachedDiagnosis = sessionStorage.getItem(`aquaexpert_diagnosis_${aquariumId}`);
    if (cachedDiagnosis) {
      try { setResult(JSON.parse(cachedDiagnosis)); } catch (err) {}
    }
  }, [aquariumId]);

  const handleRunDiagnosis = async () => {
    setLoading(true); setError("");
    const res = await getDeepDiagnosisAction(aquariumId, lang);
    if (res.success && res.diagnosis) {
      setResult(res.diagnosis as DeepDiagnosisResult);
      sessionStorage.setItem(`aquaexpert_diagnosis_${aquariumId}`, JSON.stringify(res.diagnosis));
    } else {
      setError(res.error || "Gagal memproses diagnosis.");
    }
    setTimeout(() => setLoading(false), 800); 
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
        <div className="flex flex-col items-center justify-center p-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] border-2 border-dashed border-indigo-200 text-center">
          <Stethoscope className="w-16 h-16 text-indigo-500 mb-4" />
          <h4 className="text-2xl font-black text-indigo-900 dark:text-indigo-200">Expert Diagnostic Engine</h4>
          <Button onClick={handleRunDiagnosis} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-xl">
            <Activity className="w-5 h-5 mr-2" /> {lang === 'id' ? "MULAI DIAGNOSIS SISTEM" : "START DIAGNOSIS"}
          </Button>
        </div>
      )}

      {loading && <div className="p-20 text-center font-black animate-pulse">{lang === 'id' ? "Memindai Anomali..." : "Scanning..."}</div>}

      {result && !loading && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <p className="text-slate-800 dark:text-slate-200 font-extrabold text-lg sm:text-xl md:text-2xl leading-relaxed">{result.summary}</p>
            </div>
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border-2 border-slate-200 shadow-inner flex flex-col items-center">
              <RiskRadarCore currentRisk={result.riskLevel} />
            </div>
          </div>

          {/* PRIORITY 3 PANEL: TRANSPARANSI NILAI (AI EXPLAINABILITY) */}
          {result.explainabilityBreakdown && result.explainabilityBreakdown.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-1.5"><Eye className="w-4 h-4"/> Log Transparansi Nilai (AI Explainability)</h4>
              <div className="flex flex-wrap gap-2">
                {result.explainabilityBreakdown.map((item, idx) => (
                  <span key={idx} className="text-xs font-bold bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg shadow-sm">{item}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-rose-50 dark:bg-rose-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-rose-200 shadow-md">
                <h4 className="text-sm font-black uppercase text-rose-700 tracking-widest mb-5 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> {lang === 'id' ? "Akar Masalah Terdeteksi (Max 8)" : "Top 8 Findings"}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.rootCauses.map((cause, i) => (
                    <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">{cause.title}</h5>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${getSeverityColor(cause.severity)}`}>{cause.severity}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">{cause.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRIORITY 2 PANEL: FLORA RECOMMENDATION ENGINE */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-emerald-200 shadow-md">
                <h4 className="text-sm font-black uppercase text-emerald-800 tracking-widest mb-4 flex items-center gap-2"><Leaf className="w-5 h-5"/> Rekomendasi Spesies Tanaman Pendukung</h4>
                <div className="space-y-2">
                  {result.plantRecommendations.map((rec, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-md" /> {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-amber-50 dark:bg-amber-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-amber-200 shadow-md flex flex-col">
              <h4 className="text-sm font-black uppercase text-amber-800 tracking-widest mb-6 flex items-center gap-2"><Clock className="w-5 h-5" /> {lang === 'id' ? "Rencana Eksekusi" : "Action Plan"}</h4>
              <div className="space-y-4 flex-1">
                {result.nextActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-400 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">{i + 1}</div>
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border flex-1"><p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{action}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}