// features/aquariums/components/health/AIDeepDiagnosisPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { getHybridDeepDiagnosisAction, HybridDiagnosisResponse } from "../../actions/gemini-expert.actions";
import { RiskLevel } from "../../utils/deep-diagnosis";
import { 
  ShieldAlert, Sparkles, AlertTriangle, Activity, AlertOctagon, 
  Stethoscope, Flame, ShieldCheck, Eye, Leaf, Bot, RefreshCw 
} from "lucide-react";
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
    const cachedDiagnosis = sessionStorage.getItem(`aquaexpert_diagnosis_v2_${aquariumId}`);
    if (cachedDiagnosis) {
      try { setResult(JSON.parse(cachedDiagnosis)); } catch (err) {}
    }
  }, [aquariumId]);

  const handleRunDiagnosis = async () => {
    setLoading(true); setError("");
    sessionStorage.removeItem(`aquaexpert_diagnosis_v2_${aquariumId}`);
    const res = await getHybridDeepDiagnosisAction(aquariumId, lang);
    if (res.success && res.localDiagnosis) {
      setResult(res);
      sessionStorage.setItem(`aquaexpert_diagnosis_v2_${aquariumId}`, JSON.stringify(res));
    } else {
      setError(res.error || "Gagal memproses diagnosis.");
    }
    setLoading(false);
  };

  // KAMUS PENERJEMAH OTOMATIS YANG LEBIH TANGGUH
  const tr = (text: string) => {
    if (lang === 'id' || !text) return text;
    let en = text;
    // Triage & Summary
    if (en.includes("KEGAGALAN EKOSISTEM TOTAL")) return "TOTAL ECOSYSTEM FAILURE: Active pathogen threat or severe water toxicity detected!";
    if (en.includes("Kondisi simulasi ekologi stabil")) return "Stable ecological simulation. Biological parameters are operating at peak comfort levels.";
    if (en.includes("Tekanan biologis tahap awal")) return "Early biological stress detected. Review limiting factors below.";
    // Root Causes
    if (en.includes("Keracunan Amonia Berbahaya")) return "Dangerous Ammonia Poisoning";
    if (en.includes("Penyumbatan Oksigen")) return "Oxygen Depletion (Nitrite/Nitrate)";
    if (en.includes("pH Merugikan Populasi")) return "Harmful pH Levels";
    if (en.includes("Kepadatan Tanaman Sangat Rendah")) return "Critically Low Plant Density";
    if (en.includes("Data LPH Filtrasi Kosong")) return "Missing Filter LPH Data";
    if (en.includes("Suhu Air Mematikan")) return "Lethal Water Temperature";
    // Actions
    if (en.includes("Segera evakuasi ikan")) return "Immediately evacuate fish or perform a 50% water change to reduce toxins.";
    if (en.includes("Tambahkan bakteri starter")) return "Add starter bacteria and extra aeration to boost oxygen binding.";
    if (en.includes("Pertahankan sirkulasi")) return "Maintain daily filter circulation and monitor fish behavior.";
    // Generic
    return en.replace(/Poin/g, "Pts");
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
    if (sev === "high" || sev === "critical") return "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/30";
    if (sev === "medium") return "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30";
    return "bg-teal-500 text-white border-teal-600 shadow-md shadow-teal-500/30";
  };

  const getExplainabilityBadgeColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("kritis") || lower.includes("keracunan") || lower.includes("critical") || lower.includes("-20") || lower.includes("-30") || lower.includes("bahaya")) {
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300";
    }
    if (lower.includes("rendah") || lower.includes("kosong") || lower.includes("warning") || lower.includes("-15") || lower.includes("-10")) {
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300";
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300";
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
      <div className="relative flex flex-col items-center justify-center py-4 w-full">
        <div className={`absolute inset-0 m-auto w-32 h-32 rounded-full border-4 border-dashed ${config.border} opacity-20 animate-[spin_10s_linear_infinite]`} />
        <div className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-4 ${config.border} transition-all duration-700 scale-110 shadow-lg`}>
          <Icon className={`w-7 h-7 ${config.color} mb-0.5`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>{getRiskLevelText(currentRisk)}</span>
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
          <Button onClick={handleRunDiagnosis} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-xl w-full sm:w-auto transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5 mr-2" /> {lang === 'id' ? "MULAI DIAGNOSIS SISTEM" : "START DIAGNOSIS"}
          </Button>
          {error && <p className="text-sm font-bold text-rose-500 mt-4">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 text-indigo-600 dark:text-indigo-400 font-black animate-pulse bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <Bot className="w-12 h-12 mb-4 animate-bounce text-indigo-500" />
          <span className="text-base tracking-wide">{lang === 'id' ? "Menganalisis Ekosistem & Menghubungi Pakar AI..." : "Analyzing Ecosystem & Consulting AI..."}</span>
        </div>
      )}

      {result && result.localDiagnosis && !loading && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 sm:gap-8 items-stretch">
            
            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center shrink-0">
              <RiskRadarCore currentRisk={result.localDiagnosis.riskLevel} />
              
              <Button onClick={handleRunDiagnosis} variant="outline" className="w-full mt-6 bg-white dark:bg-slate-900 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 font-bold h-11 rounded-xl shadow-sm transition-all active:scale-95">
                <RefreshCw className="w-4 h-4 mr-2" /> {lang === 'id' ? "Diagnosis Ulang" : "Re-Diagnose"}
              </Button>
            </div>

            <div className="flex-1 flex flex-col justify-start min-w-0">
              <div className="mb-5 px-1">
                <h3 className="text-slate-900 dark:text-white font-black text-lg sm:text-xl leading-relaxed">
                  {tr(result.localDiagnosis.summary)}
                </h3>
              </div>

              <div className={`relative flex-1 overflow-hidden p-5 sm:p-6 rounded-[1.5rem] border shadow-sm ${result.expertAIExtras.generatedByGemini ? 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-300 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
                {result.expertAIExtras.generatedByGemini && <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-indigo-500/20 rotate-12 pointer-events-none" />}
                
                <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${result.expertAIExtras.generatedByGemini ? 'text-indigo-800 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  <Bot className="w-4 h-4" /> {lang === 'id' ? "Catatan Pakar Ekologi (AI Assistant)" : "Expert Ecological Notes (AI)"}
                </h4>
                
                {result.expertAIExtras.generatedByGemini ? (
                  <div className="text-sm md:text-base font-bold leading-relaxed text-indigo-950 dark:text-indigo-100 space-y-3 whitespace-pre-wrap relative z-10">
                    {result.expertAIExtras.commentary}
                  </div>
                ) : (
                  <div className="text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300 relative z-10">
                    {lang === 'id' 
                      ? "Pakar AI Generatif saat ini sedang offline (Kendala API Key/Jaringan). Jangan khawatir, Sistem Kalkulasi Mekanis Lokal kami tetap beroperasi penuh dengan presisi 100%. Silakan ikuti rencana eksekusi dan rekomendasi tindakan di bawah." 
                      : "Generative AI is currently offline (Network/API Key issue). Don't worry, our Local Mechanical Calculation System is operating at 100% precision. Please follow the execution plan below."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {result.localDiagnosis.explainabilityBreakdown && result.localDiagnosis.explainabilityBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-1.5"><Eye className="w-4 h-4"/> {lang === 'id' ? "Log Transparansi Nilai (AI Explainability)" : "Value Transparency Log"}</h4>
              <div className="flex flex-wrap gap-2">
                {result.localDiagnosis.explainabilityBreakdown.map((item, idx) => (
                  <span key={idx} className={`text-xs font-black border-2 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 ${getExplainabilityBadgeColor(tr(item))}`}>
                    {tr(item)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-rose-50/80 dark:bg-rose-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-rose-300 dark:border-rose-900/50 shadow-md">
                <h4 className="text-sm font-black uppercase text-rose-800 dark:text-rose-400 tracking-widest mb-5 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> {lang === 'id' ? "Akar Masalah Terdeteksi" : "Core Root Causes"}</h4>
                
                {result.localDiagnosis.rootCauses.length === 0 && result.localDiagnosis.explainabilityBreakdown && result.localDiagnosis.explainabilityBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.localDiagnosis.explainabilityBreakdown
                      .filter(item => item.includes("-"))
                      .map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm flex flex-col border-rose-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-tight">{tr(item.split(":")[0])}</h5>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 bg-rose-600 text-white">KRITIS</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed mt-auto">
                            {lang === 'id' ? "Faktor ini sangat merusak harmoni biologis tangki Anda." : "This factor heavily damages biological harmony."}
                          </p>
                        </div>
                    ))}
                  </div>
                ) : result.localDiagnosis.rootCauses.length === 0 ? (
                  <p className="text-sm font-black text-emerald-700 bg-emerald-100 p-4 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> {lang === 'id' ? "Tidak ada masalah kritis terdeteksi. Kondisi ekosistem aman." : "No critical issues detected."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.localDiagnosis.rootCauses.map((cause, i) => (
                      <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm flex flex-col border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-tight">{tr(cause.title)}</h5>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${getSeverityColor(cause.severity)}`}>{cause.severity}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed mt-auto">{tr(cause.description)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-emerald-50/80 dark:bg-emerald-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-emerald-300 dark:border-emerald-900/50 shadow-md">
                <h4 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-widest mb-4 flex items-center gap-2"><Leaf className="w-5 h-5"/> {lang === 'id' ? "Rekomendasi Spesies Tanaman Pendukung" : "Flora Support Recommendations"}</h4>
                <div className="space-y-2">
                  {result.localDiagnosis.plantRecommendations.length === 0 ? (
                    <>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> 
                        {lang === 'id' ? "Ceratophyllum Demersum / Hornwort (Sangat Cepat Menyerap Amonia)" : "Hornwort (Fast Ammonia Absorber)"}
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> 
                        {lang === 'id' ? "Egeria Densa (Tanaman Tangguh Penyeimbang Nutrisi Air)" : "Anacharis / Egeria Densa"}
                      </div>
                    </>
                  ) : (
                    result.localDiagnosis.plantRecommendations.map((rec, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> {rec}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-amber-50/80 dark:bg-amber-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-amber-300 dark:border-amber-900/50 shadow-md flex flex-col">
              <h4 className="text-sm font-black uppercase text-amber-900 dark:text-amber-500 tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5" /> {lang === 'id' ? "Rencana Eksekusi" : "Action Plan"}
              </h4>
              <div className="space-y-4 flex-1">
                {result.localDiagnosis.nextActions.map((action, i) => {
                  const getPriorityConfig = (priority: string) => {
                    switch(priority) {
                      case "critical": return { color: "text-rose-700 bg-rose-100 dark:bg-rose-900/40 border-rose-300", icon: "🔴", label: lang === 'id' ? "KRITIS" : "CRITICAL" };
                      case "high": return { color: "text-orange-700 bg-orange-100 dark:bg-orange-900/40 border-orange-300", icon: "🟠", label: lang === 'id' ? "TINGGI" : "HIGH" };
                      case "medium": return { color: "text-amber-700 bg-amber-100 dark:bg-amber-900/40 border-amber-300", icon: "🟡", label: lang === 'id' ? "SEDANG" : "MEDIUM" };
                      default: return { color: "text-teal-700 bg-teal-100 dark:bg-teal-900/40 border-teal-300", icon: "🟢", label: lang === 'id' ? "RENDAH" : "LOW" };
                    }
                  }
                  const config = getPriorityConfig(action.priority);

                  return (
                    <div key={i} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{config.icon}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border-2 ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 ml-5 shadow-sm">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug">
                          {tr(action.instruction)}
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