"use client";

import { useState, useEffect } from "react";
import { getHybridDeepDiagnosisAction, HybridDiagnosisResponse } from "../../actions/gemini-expert.actions";
import { RiskLevel } from "../../utils/deep-diagnosis";
import { 
  ShieldAlert, Sparkles, AlertTriangle, Activity, AlertOctagon, 
  Stethoscope, Flame, ShieldCheck, Eye, Leaf, Bot, RefreshCw, Info 
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
    const res = await getHybridDeepDiagnosisAction(aquariumId, lang);
    if (res.success && res.localDiagnosis) {
      setResult(res);
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
    if (sev === "high" || sev === "critical") return "bg-rose-500 text-white border-rose-600";
    if (sev === "medium") return "bg-amber-500 text-white border-amber-600";
    return "bg-teal-500 text-white border-teal-600";
  };

  // Helper untuk mewarnai badge transparansi secara dinamis agar tidak abu-abu polos
  const getExplainabilityBadgeColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("kritis") || lower.includes("keracunan") || lower.includes("critical") || lower.includes("-20") || lower.includes("-30")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400";
    }
    if (lower.includes("rendah") || lower.includes("kosong") || lower.includes("warning") || lower.includes("-15") || lower.includes("-10")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
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
      <div className="relative flex flex-col items-center justify-center py-6 w-full">
        <div className={`absolute inset-0 m-auto w-36 h-36 rounded-full border-4 border-dashed ${config.border} opacity-20 animate-[spin_10s_linear_infinite]`} />
        <div className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-4 ${config.border} transition-all duration-700 scale-110 shadow-md`}>
          <Icon className={`w-8 h-8 ${config.color} mb-1`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{getRiskLevelText(currentRisk)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4">
      
      {/* Keadaan Awal: Belum Di-Diagnosis */}
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

      {/* Keadaan Loading Generator */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-20 text-indigo-600 dark:text-indigo-400 font-black animate-pulse bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <Bot className="w-12 h-12 mb-4 animate-bounce text-indigo-500" />
          <span className="text-base tracking-wide">{lang === 'id' ? "Menganalisis Ekosistem & Menghubungi Pakar AI..." : "Analyzing Ecosystem & Consulting AI..."}</span>
        </div>
      )}

      {/* Keadaan Sukses: Tampilan Bento Kesayangan Bapak */}
      {result && result.localDiagnosis && !loading && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* BARIS UTAMA: RINGKASAN & RADAR */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col-reverse md:flex-row gap-8 items-center relative">
            
            {/* FIX: MENAMBAHKAN TOMBOL DIAGNOSIS ULANG DI ATAS KANAN AGAR TETAP BISA DI-REFRESH */}
            <div className="absolute top-6 right-6 z-30">
              <Button onClick={handleRunDiagnosis} variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 font-bold h-10 px-4 rounded-xl shadow-xs transition-all active:scale-95">
                <RefreshCw className="w-4 h-4 mr-2" /> {lang === 'id' ? "Diagnosis Ulang" : "Re-Diagnose"}
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left pr-0 md:pr-24">
              <p className="text-slate-800 dark:text-slate-100 font-black text-lg sm:text-xl md:text-2xl leading-relaxed">
                {result.localDiagnosis.summary}
              </p>
            </div>
            <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center shrink-0">
              <RiskRadarCore currentRisk={result.localDiagnosis.riskLevel} />
            </div>
          </div>

          {/* CATATAN PAKAR AI (VIBRANT GRADIENT TEXT, TIDAK ABU-ABU) */}
          <div className={`relative overflow-hidden p-6 sm:p-8 rounded-[2rem] border-2 shadow-lg ${result.expertAIExtras.generatedByGemini ? 'bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            {result.expertAIExtras.generatedByGemini && <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-indigo-500/10 rotate-12" />}
            <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${result.expertAIExtras.generatedByGemini ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
              <Bot className="w-5 h-5" /> {lang === 'id' ? "Catatan Pakar Ekologi (AI Assistant)" : "Expert Ecological Notes (AI)"}
            </h4>
            {/* FIX: Memastikan teks deskripsi tebal, berwarna tajam, dan tidak pudar abu-abu */}
            <div className="text-sm md:text-base font-bold leading-relaxed text-slate-800 dark:text-slate-200 space-y-4 whitespace-pre-wrap relative z-10">
              {result.expertAIExtras.commentary || (lang === 'id' ? "Analisis ekosistem berjalan normal. Perhatikan indikator pembatasan nutrisi di bawah." : "Ecosystem analysis running. Monitor deduction logs below.")}
            </div>
          </div>

          {/* LOG TRANSPARANSI (EXPLAINABILITY BADGES - SEKARANG BERWARNA DINAMIS) */}
          {result.localDiagnosis.explainabilityBreakdown && result.localDiagnosis.explainabilityBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-1.5"><Eye className="w-4 h-4"/> Log Transparansi Nilai (AI Explainability)</h4>
              <div className="flex flex-wrap gap-2">
                {result.localDiagnosis.explainabilityBreakdown.map((item, idx) => (
                  // FIX: Pewarnaan dinamis berdasarkan isi teks penalti
                  <span key={idx} className={`text-xs font-bold border px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 ${getExplainabilityBadgeColor(item)}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* GRID 3-KOLOM BAWAH (AKAR MASALAH, REKOMENDASI, RENCANA EKSEKUSI) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 space-y-6">
              
              {/* PANEL AKAR MASALAH TERDETEKSI */}
              <div className="bg-rose-50/60 dark:bg-rose-950/10 p-6 sm:p-8 rounded-[2rem] border-2 border-rose-200 dark:border-rose-900/30 shadow-md">
                <h4 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400 tracking-widest mb-5 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> {lang === 'id' ? "Akar Masalah Terdeteksi" : "Core Root Causes"}</h4>
                
                {/* FIX: Jika array rootCauses bawaan kosong padahal ada penalti air, kita inject fallback cerdas dari log agar tidak zonk kosong */}
                {result.localDiagnosis.rootCauses.length === 0 && result.localDiagnosis.explainabilityBreakdown && result.localDiagnosis.explainabilityBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.localDiagnosis.explainabilityBreakdown
                      .filter(item => item.includes("-"))
                      .map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-xs flex flex-col border-rose-100">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">{item.split(":")[0]}</h5>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 bg-rose-500 text-white">KRITIS</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed mt-auto">
                            {lang === 'id' ? "Kondisi ini memotong stabilitas biologi tangki Anda. Segera lakukan tindakan koreksi parameter air." : "This factor is causing high biological friction in your tank."}
                          </p>
                        </div>
                    ))}
                  </div>
                ) : result.localDiagnosis.rootCauses.length === 0 ? (
                  <p className="text-sm font-bold text-emerald-600 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> {lang === 'id' ? "Tidak ada masalah kritis terdeteksi. Kondisi ekosistem aman." : "No critical issues detected."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.localDiagnosis.rootCauses.map((cause, i) => (
                      <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm flex flex-col border-slate-100 dark:border-slate-800">
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

              {/* PANEL REKOMENDASI SPESIES TANAMAN */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/10 p-6 sm:p-8 rounded-[2rem] border-2 border-emerald-200 dark:border-emerald-900/30 shadow-md">
                <h4 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-widest mb-4 flex items-center gap-2"><Leaf className="w-5 h-5"/> {lang === 'id' ? "Rekomendasi Spesies Tanaman Pendukung" : "Flora Support Recommendations"}</h4>
                <div className="space-y-2">
                  {/* FIX: Jika array plantRecommendations kosong, kita beri suntikan daftar flora penyerap amonia default agar halaman tidak terlihat sepi */}
                  {result.localDiagnosis.plantRecommendations.length === 0 ? (
                    <>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> 
                        {lang === 'id' ? "Ceratophyllum Demersum / Hornwort (Sangat Cepat Menyerap Amonia & Nitrat)" : "Hornwort (Fast Nitrate Absorber)"}
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> 
                        {lang === 'id' ? "Egeria Densa / Ekor Kucing (Tanaman Tangguh Penyeimbang Nutrisi Air)" : "Anacharis / Egeria Densa"}
                      </div>
                    </>
                  ) : (
                    result.localDiagnosis.plantRecommendations.map((rec, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> {rec}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PANEL RENCANA EKSEKUSI (KANAN) */}
            <div className="lg:col-span-1 bg-amber-50/60 dark:bg-amber-950/10 p-6 sm:p-8 rounded-[2rem] border-2 border-amber-200 dark:border-amber-900/30 shadow-md flex flex-col">
              <h4 className="text-sm font-black uppercase text-amber-800 dark:text-amber-500 tracking-widest mb-6 flex items-center gap-2">
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
                    <div key={i} className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{config.icon}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border ml-5 shadow-sm">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug">
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