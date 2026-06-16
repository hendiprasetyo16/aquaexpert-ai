// features/aquariums/components/health/AIDeepDiagnosisPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { getDeepDiagnosisAction } from "../../actions/deep-diagnosis.actions";
import { DeepDiagnosisResult, RiskLevel } from "../../utils/deep-diagnosis";
import { ShieldAlert, Sparkles, Loader2, AlertTriangle, CheckCircle2, Clock, Activity, AlertOctagon, ListTodo, Stethoscope, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  aquariumId: string;
  lang: "id" | "en";
}

export default function AIDeepDiagnosisPanel({ aquariumId, lang }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepDiagnosisResult | null>(null);
  const [error, setError] = useState("");

  // FITUR: Memori Sesi (Mencegah data hilang saat pindah tab)
  useEffect(() => {
    const cachedDiagnosis = sessionStorage.getItem(`aquaexpert_diagnosis_${aquariumId}`);
    if (cachedDiagnosis) {
      try {
        setResult(JSON.parse(cachedDiagnosis));
      } catch (err) {
        console.error("Gagal membaca memori diagnosis:", err);
      }
    }
  }, [aquariumId]);

  const handleRunDiagnosis = async () => {
    setLoading(true);
    setError("");
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
    if (sev === "high") return "bg-rose-500 text-white shadow-md shadow-rose-500/30 border-rose-600";
    if (sev === "medium") return "bg-amber-500 text-white shadow-md shadow-amber-500/30 border-amber-600";
    return "bg-teal-500 text-white shadow-md shadow-teal-500/30 border-teal-600";
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ", " + date.toLocaleDateString();
  };

  // =========================================================================
  // KOMPONEN BARU: VERTICAL RISK THERMOMETER (Visual Premium, Anti Monoton)
  // =========================================================================
  const RiskMeter = ({ currentRisk }: { currentRisk: RiskLevel }) => {
    // Urutan dari Kritis (Atas) ke Rendah (Bawah)
    const levels = [
      { id: "CRITICAL", color: "from-rose-600 to-rose-400", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
      { id: "HIGH", color: "from-orange-500 to-amber-400", dot: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
      { id: "MEDIUM", color: "from-amber-400 to-yellow-300", dot: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
      { id: "LOW", color: "from-teal-500 to-emerald-400", dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" }
    ];
    
    const activeIdx = levels.findIndex(l => l.id === currentRisk);
    
    // Kalkulasi ketinggian cairan (fill) berdasarkan status
    const fillHeight = currentRisk === 'CRITICAL' ? '100%' : currentRisk === 'HIGH' ? '75%' : currentRisk === 'MEDIUM' ? '50%' : '25%';
    
    return (
      <div className="flex mt-6 gap-6 items-center w-full">
        {/* Batang Tabung Reaksi (Thermometer) */}
        <div className="relative w-5 h-44 bg-slate-200 dark:bg-slate-800 rounded-full shadow-inner overflow-hidden flex shrink-0 border border-slate-300 dark:border-slate-700">
           {/* Cairan Indikator */}
           <div 
             className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-t ${levels[activeIdx].color}`}
             style={{ height: fillHeight }}
           />
           {/* Garis-garis penggaris kaca */}
           <div className="absolute inset-0 flex flex-col justify-between py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full h-0.5 bg-white/60 dark:bg-slate-900/60" />
              ))}
           </div>
        </div>
        
        {/* Label Teks dan Penunjuk Aktif */}
        <div className="flex flex-col justify-between h-44 py-2 w-full">
          {levels.map((lvl, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div key={lvl.id} className={`flex items-center gap-3 transition-all duration-500 ${isActive ? 'translate-x-2 scale-110' : 'opacity-40 grayscale'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? `${lvl.dot} animate-pulse shadow-[0_0_10px_currentColor]` : 'bg-slate-400 dark:bg-slate-600'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? lvl.text : 'text-slate-500 dark:text-slate-400'}`}>
                  {getRiskLevelText(lvl.id)}
                </span>
                {isActive && <ChevronRight className={`w-4 h-4 ml-auto ${lvl.text} animate-pulse`} />}
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4">
      
      {/* ----------------------------------------------------
          TOMBOL PEMICU AWAL / LOADING PANEL
      ---------------------------------------------------- */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] border-2 border-dashed border-indigo-200 dark:border-indigo-800 shadow-sm text-center">
          <Stethoscope className="w-16 h-16 text-indigo-500 mb-4 animate-bounce drop-shadow-sm" />
          <h4 className="text-2xl font-black text-indigo-900 dark:text-indigo-200 mb-2">Expert Diagnostic Engine</h4>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-6">
            {lang === 'id' 
              ? "Sistem pakar kami akan menganalisis matriks parameter air, populasi bioload, dan rekam jejak pemeliharaan untuk menemukan akar masalah ekosistem Anda."
              : "Our expert system will analyze water parameters, bioload matrix, and maintenance logs to trace ecosystem root causes."}
          </p>
          <Button onClick={handleRunDiagnosis} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-xl shadow-xl shadow-indigo-500/20 tracking-wide transition-all active:scale-95 border border-indigo-500">
            <Activity className="w-5 h-5 mr-2" /> {lang === 'id' ? "MULAI DIAGNOSIS SISTEM" : "START DIAGNOSIS"}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl text-center">
          <Loader2 className="w-14 h-14 animate-spin text-indigo-600 mb-4" />
          <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 animate-pulse">
            {lang === 'id' ? "Memindai Anomali Sistem..." : "Scanning for Anomalies..."}
          </h4>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 text-red-600 border-2 border-red-200 rounded-2xl flex items-start gap-3 font-bold text-sm shadow-sm">
          <AlertTriangle className="w-6 h-6 shrink-0" /> <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* ----------------------------------------------------
          DASHBOARD HASIL ANALISIS (KONTRAST TINGGI)
      ---------------------------------------------------- */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* BANNER ATAS: SUMMARY & VISUAL RISK METER VERTIKAL */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] dark:opacity-5 pointer-events-none">
              <Activity className="w-64 h-64 text-indigo-900" />
            </div>
            
            <div className="flex-1 relative z-10 w-full flex flex-col justify-center">
              <div className="inline-flex items-center self-start gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-200 dark:border-indigo-800 shadow-sm">
                <Stethoscope className="w-3 h-3" /> {lang === 'id' ? "Hasil Diagnosa Utama" : "Diagnostic Verdict"}
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-extrabold text-lg sm:text-xl md:text-2xl leading-relaxed">
                {result.summary}
              </p>
            </div>

            <div className="w-full md:w-80 shrink-0 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-inner relative z-10 flex flex-col">
              <div className="flex justify-between items-end mb-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{lang === 'id' ? "Indikator Risiko" : "Risk Indicator"}</span>
                <AlertOctagon className={`w-5 h-5 ${result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <RiskMeter currentRisk={result.riskLevel} />
            </div>
          </div>

          {/* ASYMMETRICAL BENTO GRID: KIRI (Finding/Saran) vs KANAN (Action Plan) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* KOLOM KIRI (Lebar 2/3): Root Causes & Recommendations */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              
              {/* ROOT CAUSES CARDS */}
              <div className="bg-rose-50 dark:bg-rose-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-rose-200 dark:border-rose-900/50 shadow-md flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle className="w-32 h-32 text-rose-600 -rotate-12" />
                </div>
                
                <h4 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400 tracking-widest mb-5 flex items-center gap-2 relative z-10">
                  <ShieldAlert className="w-5 h-5" /> 
                  {lang === 'id' ? "Akar Masalah Terdeteksi" : "Detected Root Causes"}
                </h4>
                
                {result.rootCauses.length === 0 ? (
                  <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 border-2 border-dashed border-rose-200 dark:border-rose-800/50 rounded-2xl relative z-10">
                    <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto mb-3 opacity-80" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">{lang === 'id' ? "Tidak ditemukan anomali kritikal." : "No critical anomalies found."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    {result.rootCauses.map((cause, i) => (
                      <div key={i} className="p-5 rounded-2xl border-2 border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-tight">{cause.title}</h5>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 border ${getSeverityColor(cause.severity)}`}>
                            {cause.severity}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">{cause.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RECOMMENDATIONS */}
              <div className="bg-teal-50 dark:bg-teal-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-teal-200 dark:border-teal-900/40 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-32 h-32 text-teal-600" />
                </div>

                <h4 className="text-sm font-black uppercase text-teal-800 dark:text-teal-400 tracking-widest mb-5 flex items-center gap-2 relative z-10">
                  <CheckCircle2 className="w-5 h-5" /> 
                  {lang === 'id' ? "Saran Jangka Panjang" : "Long-term Maintenance Advice"}
                </h4>
                
                {result.recommendations.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-bold relative z-10">{lang === 'id' ? "Pertahankan jadwal saat ini." : "Maintain current schedule."}</p>
                ) : (
                  <ul className="space-y-3 relative z-10">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-teal-100 dark:border-teal-800/50 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>

            {/* KOLOM KANAN (Lebar 1/3): Action Plan Timeline */}
            <div className="lg:col-span-1 bg-amber-50 dark:bg-amber-950/20 p-6 sm:p-8 rounded-[2rem] border-2 border-amber-200 dark:border-amber-900/40 shadow-md flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ListTodo className="w-32 h-32 text-amber-600 -rotate-6" />
              </div>

              <h4 className="text-sm font-black uppercase text-amber-800 dark:text-amber-400 tracking-widest mb-6 flex items-center gap-2 relative z-10">
                <Clock className="w-5 h-5" /> 
                {lang === 'id' ? "Rencana Eksekusi" : "Action Plan"}
              </h4>
              
              <div className="relative flex-1 z-10">
                {/* Garis vertikal timeline yang lebih tegas */}
                <div className="absolute left-4 top-2 bottom-4 w-1 bg-amber-200 dark:bg-amber-800/50 rounded-full"></div>
                
                <div className="space-y-6 relative z-10">
                  {result.nextActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-4 group/step">
                      <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-4 border-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-md z-10">
                        {i + 1}
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-amber-100 dark:border-amber-800/50 flex-1 shadow-sm transition-colors mt-[-4px]">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* TOMBOL REFRESH */}
              <Button onClick={handleRunDiagnosis} className="mt-8 relative z-10 w-full bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 font-black rounded-xl h-14 border-2 border-amber-200 dark:border-amber-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" /> {lang === 'id' ? "PERBARUI ANALISIS" : "REFRESH ANALYSIS"}
              </Button>
            </div>

          </div>

          {/* TIMESTAMP FOOTER */}
          <div className="text-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-4 pb-2">
            {lang === 'id' ? 'LAPORAN DIHASILKAN PADA:' : 'REPORT GENERATED AT:'} {formatDateTime(result.generatedAt)}
          </div>

        </div>
      )}
    </div>
  );
}