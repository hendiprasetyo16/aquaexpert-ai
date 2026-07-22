// features/aquariums/components/health/AIDeepDiagnosisPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { getHybridDeepDiagnosisAction, HybridDiagnosisResponse } from "../../services/gemini-expert.actions";
import { RiskLevel } from "../../utils/deep-diagnosis";
import { 
  ShieldAlert, Sparkles, AlertTriangle, Activity, AlertOctagon, 
  Stethoscope, Flame, ShieldCheck, Eye, Leaf, Bot, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider"; 
import MarkdownRenderer from "@/components/ui/MarkdownRenderer"; // 💡 FIX 1: Import Markdown Renderer

interface Props {
  aquariumId: string;
  lang: "id" | "en";
}

export default function AIDeepDiagnosisPanel({ aquariumId, lang }: Props) {
  const { dict } = useLanguage();
  
  const dictRoot = dict as { aquarium?: { diagnosis?: Record<string, string> } };
  const diagDict = dictRoot.aquarium?.diagnosis || {}; 

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HybridDiagnosisResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cachedDiagnosis = sessionStorage.getItem(`aquaexpert_diagnosis_v2_${aquariumId}_${lang}`);
    if (cachedDiagnosis) {
      try { setResult(JSON.parse(cachedDiagnosis)); } catch (err) {}
    } else {
      setResult(null); 
    }
  }, [aquariumId, lang]); 

  const handleRunDiagnosis = async () => {
    setLoading(true); setError("");
    sessionStorage.removeItem(`aquaexpert_diagnosis_v2_${aquariumId}_id`);
    sessionStorage.removeItem(`aquaexpert_diagnosis_v2_${aquariumId}_en`);
    
    const res = await getHybridDeepDiagnosisAction(aquariumId, lang);
    
    if (res.success && res.localDiagnosis) {
      setResult(res);
      sessionStorage.setItem(`aquaexpert_diagnosis_v2_${aquariumId}_${lang}`, JSON.stringify(res));
    } else {
      setResult(null);
      setError(res.error || "Gagal memproses diagnosis.");
    }
    setLoading(false);
  };

  const tr = (text: string) => {
    if (lang === 'id' || !text) return text;
    let en = text;

    const phMatch = en.match(/Peringatan: Tingkat pH \((.*?)\) merusak osmoregulasi (.*?) kawanan \((.*?)\)\./i);
    if (phMatch) return (diagDict.phAlert || "Warning: pH level ({ph}) damages osmoregulation of {count} group(s) ({species}).").replace("{ph}", phMatch[1]).replace("{count}", phMatch[2]).replace("{species}", phMatch[3]);

    const outbreakMatch = en.match(/Wabah Aktif: Terdapat (.*?) infeksi\/penyakit yang sedang diobati\./i);
    if (outbreakMatch) return (diagDict.activeOutbreak || "🚨 Active Outbreak: There are {count} active infections being treated.").replace("{count}", outbreakMatch[1]);

    const popMatch = en.match(/Populasi Invalid: Ekosistem kekurangan populasi minimum untuk (.*?)\./i);
    if (popMatch) return (diagDict.invalidPopulation || "Invalid Population: Ecosystem lacks minimum population for {species}.").replace("{species}", popMatch[1]);

    if (en.includes("Tambahkan populasi spesies ikan koloni")) return diagDict.addSchooling || "Add more schooling species to meet minimum natural colony thresholds.";
    if (en.includes("Kritis: Penelantaran jadwal perawatan")) return diagDict.maintenanceCritical || "⚠️ Critical: Neglecting maintenance schedules drastically destroys ecosystem stability.";

    if (en.includes("KEGAGALAN EKOSISTEM TOTAL")) return "TOTAL ECOSYSTEM FAILURE: Active pathogen threat or severe water toxicity detected!";
    if (en.includes("Kondisi simulasi ekologi stabil")) return "Stable ecological simulation. Biological parameters are operating at peak comfort levels.";
    if (en.includes("Peringatan Malfungsi Sistem:")) return "System Alert: Highly destructive elements threatening current survival loops.";

    if (en.includes("Keracunan Amonia Berbahaya")) return "Dangerous Ammonia Poisoning";
    if (en.includes("Penyumbatan Oksigen")) return "Oxygen Depletion (Nitrite/Nitrate)";
    if (en.includes("pH Merugikan Populasi")) return "Harmful pH Levels";
    if (en.includes("Kepadatan Tanaman Sangat Rendah")) return "Critically Low Plant Density";
    if (en.includes("Data LPH Filtrasi Kosong")) return "Missing Filter LPH Data";
    if (en.includes("Suhu Air Mematikan")) return "Lethal Water Temperature";
    if (en.includes("Konflik Hubungan Spesies Parah")) return "Severe Species Relationship Conflict";
    if (en.includes("Tabrakan Ekosistem Biotope Ekstrem")) return "Fatal Biotope Ecosystem Clash";
    if (en.includes("Ancaman Fatal Melompat Keluar")) return "Critical Open-Top Jump Hazard";
    if (en.includes("Defisit Suplai Arus & Oksigen")) return "Oxygen & Flow Deficit Alert";
    if (en.includes("Anomali Komposisi Kompetisi Flora")) return "Layout Design Anomaly";
    if (en.includes("Flora Melebihi Batas Ketinggian")) return "Flora Outgrew Vertical Bounds";
    
    if (en.includes("Kerentanan Kritis:")) return en.replace("Kerentanan Kritis:", "Critical Vulnerability:");
    if (en.includes("Risiko Hipotermia & Penyakit:")) return en.replace("Risiko Hipotermia & Penyakit:", "Hypothermia & Disease Risk:");

    if (en.includes("menyalahi pakem baku aliran kontes")) {
      return en.replace(/Peletakan tanaman (.*?) menyalahi pakem baku aliran kontes (.*?)\.?$/i, "The usage of $1 conflicts with classical layouts of $2 style.");
    }
    if (en.includes("tumbuh menembus ketinggian permukaan air")) {
      return en.replace(/Tanaman bertangkai (.*?) telah tumbuh menembus ketinggian permukaan air kaca tangki\.?/i, "Stem plants like $1 outgrew the vertical water surface line.");
    }
    if (en.includes("berisiko tinggi mematikan spesies pelompat")) {
      return en.replace(/Akuarium tanpa tutup atas berisiko tinggi mematikan spesies pelompat: (.*?)\.?$/i, "Tank top lacks physical boundaries for high-risk jumping species: $1.");
    }
    if (en.includes("tidak mencukupi kebutuhan pasokan metabolisme aktif untuk")) {
      return en.replace(/Laju perputaran filter saat ini tidak mencukupi kebutuhan pasokan metabolisme aktif untuk: (.*?)\.?$/i, "Current filter turnover is suboptimal to support high-flow demand species: $1.");
    }
    if (en.includes("berisiko tinggi bentrok fisik")) {
      en = en.replace(/(.*?) dan (.*?) berisiko tinggi bentrok fisik \(Skor (.*?)\)\. Alasan: (.*)/i, "$1 and $2 conflict warning (Score $3). Reason: $4");
      en = en.replace("Tercatat dalam matriks hubungan spesies.", "Direct species matrix confirmed.");
      en = en.replace("Predator dicampur dengan ikan komunitas kecil.", "Predator mixed with small community fish.");
      en = en.replace("Spesies agresif menekan mental spesies ringkih.", "Aggressive species suppressing vulnerable profiles.");
      return en;
    }
    if (en.includes("Pencampuran fauna Rift Lake Afrika")) return "Mixing African Rift species with Amazonian species causes fatal internal osmoregulation collapse.";
    if (en.includes("mengaktifkan kerentanan spesifik ras")) {
      return en.replace(/Akumulasi Nitrat \((.*?)\) mengaktifkan kerentanan spesifik ras (.*?) terhadap infeksi (.*?)\.?$/i, "Nitrate buildup ($1) catalyzes $2's acute species-specific vulnerability to $3.");
    }
    if (en.includes("Suhu jatuh di bawah toleransi minimal")) {
      return en.replace(/Suhu jatuh di bawah toleransi minimal \((.*?)\)\. Depresi imun memicu risiko tinggi (.*?) pada kawanan (.*?)\.?$/i, "Temperature fell below minimum threshold ($1). Immune depression triggers high risk of $2 for $3.");
    }

    if (en.includes("Segera evakuasi ikan")) return "Immediately evacuate fish or perform a 50% water change to reduce toxins.";
    if (en.includes("Tambahkan bakteri starter")) return "Add starter bacteria and extra aeration to boost oxygen binding.";
    if (en.includes("Pertahankan sirkulasi")) return "Maintain daily filter circulation and monitor fish behavior.";
    if (en.includes("Pasang penutup tangki rapat")) return "Install a mesh or glass lid immediately, or drop water level 5 cm down.";
    if (en.includes("Lakukan pemangkasan (*trimming*) berkala")) {
      return en.replace(/Lakukan pemangkasan \(\*trimming\*\) berkala pada bagian atas tanaman (.*?)\.?$/i, "Perform routine top trimming for overgrown stems: $1.");
    }
    if (en.includes("Pindahkan udang hias ke tank terisolasi")) {
      return en.replace(/Pindahkan udang hias ke tank terisolasi sebelum menjadi mangsa fauna (.*?)\.?$/i, "Relocate ornamental shrimp before they get predated by $1.");
    }
    if (en.includes("Lakukan water change berkala untuk menekan nitrat")) {
      return en.replace(/Lakukan water change berkala untuk menekan nitrat di bawah 15 ppm demi keselamatan (.*?)\.?$/i, "Perform water changes to drop nitrate below 15 ppm for $1.");
    }

    if (en.includes("Keracunan Amonia Berbahaya")) en = en.replace("Keracunan Amonia Berbahaya", "Dangerous Ammonia Poisoning");
    if (en.includes("Penyumbatan Oksigen (Nitrite/Nitrate)")) en = en.replace("Penyumbatan Oksigen (Nitrite/Nitrate)", "Oxygen Depletion (Nitrite/Nitrate)");
    if (en.includes("Penyumbatan Oksigen (Nitrit)")) en = en.replace("Penyumbatan Oksigen (Nitrit)", "Nitrite Poisoning");
    if (en.includes("Penumpukan Nitrat Berlebih")) en = en.replace("Penumpukan Nitrat Berlebih", "Excessive Nitrate Buildup");
    if (en.includes("pH Merugikan Populasi")) en = en.replace("pH Merugikan Populasi", "Harmful pH Levels");
    if (en.includes("Suhu Air Mematikan")) en = en.replace("Suhu Air Mematikan", "Lethal Water Temperature");
    if (en.includes("Kepadatan Tanaman Sangat Rendah")) en = en.replace("Kepadatan Tanaman Sangat Rendah", "Critically Low Plant Density");
    if (en.includes("Tidak Ada Aktivitas Fauna")) en = en.replace("Tidak Ada Aktivitas Fauna", "No Fauna Activity");
    if (en.includes("Kepadatan Fauna Sangat Ekstrem (Overstock)")) en = en.replace("Kepadatan Fauna Sangat Ekstrem (Overstock)", "Extreme Fauna Overstocking");
    if (en.includes("Konflik Sosial/Teritorial Spesies")) en = en.replace("Konflik Sosial/Teritorial Spesies", "Social/Territorial Species Conflict");
    if (en.includes("Tugas Perawatan Tertunda Parah")) en = en.replace("Tugas Perawatan Tertunda Parah", "Severely Overdue Maintenance Tasks");
    if (en.includes("Sirkulasi Filter Kurang Memadai")) en = en.replace("Sirkulasi Filter Kurang Memadai", "Insufficient Filter Circulation");
    if (en.includes("Sengketa Area (Konflik Teritorial)")) en = en.replace("Sengketa Area (Konflik Teritorial)", "Territorial Density Conflict");

    en = en.replace(/Poin/g, "Pts");
    return en;
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
    const penaltyMatch = text.match(/-(\d+)/);
    const penaltyValue = penaltyMatch ? parseInt(penaltyMatch[1], 10) : 0;

    if (penaltyValue >= 20 || lower.includes("kritis") || lower.includes("keracunan") || lower.includes("critical") || lower.includes("bahaya") || lower.includes("fatal")) {
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50";
    }
    if (penaltyValue >= 10 || lower.includes("rendah") || lower.includes("kosong") || lower.includes("warning")) {
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50";
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
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 text-center">
          <Stethoscope className="w-16 h-16 text-indigo-500 mb-4" />
          <h4 className="text-xl md:text-2xl font-black text-indigo-900 dark:text-indigo-200 mb-4">Hybrid Expert Diagnostic</h4>
          <Button onClick={handleRunDiagnosis} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-14 rounded-xl w-full sm:w-auto transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5 mr-2" /> {lang === 'id' ? "MULAI DIAGNOSIS SISTEM" : "START DIAGNOSIS"}
          </Button>
          
          {error && (
            <div className="mt-6 p-4 bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-3 text-left max-w-lg mx-auto">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300">{error}</p>
            </div>
          )}
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

              <div className={`relative flex-1 overflow-hidden p-5 sm:p-6 rounded-[1.5rem] border shadow-sm ${
                result.expertAIExtras.generatedByGemini 
                ? 'bg-indigo-50 dark:bg-slate-900 border-indigo-300 dark:border-indigo-800' 
                : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
              }`}>
                {result.expertAIExtras.generatedByGemini && <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-indigo-500/20 rotate-12 pointer-events-none" />}
                
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${result.expertAIExtras.generatedByGemini ? 'text-indigo-800 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    <Bot className="w-4 h-4" /> {lang === 'id' ? "Catatan Pakar Ekologi" : "Ecological Expert Notes"}
                  </h4>
                  
                  {lang === 'en' && result.expertAIExtras.commentary.includes("Saya memahami") && (
                    <Button onClick={handleRunDiagnosis} size="sm" variant="ghost" className="h-7 text-[10px] text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100">
                      Translate Notes
                    </Button>
                  )}
                </div>
                
                {/* 💡 FIX 2: Render teks Markdown AI menggunakan komponen MarkdownRenderer yang elegan */}
                <div className={`text-sm md:text-base font-medium leading-relaxed relative z-10 ${result.expertAIExtras.generatedByGemini ? 'text-indigo-950 dark:text-slate-300' : 'text-slate-700 dark:text-slate-400'}`}>
                  <MarkdownRenderer content={result.expertAIExtras.commentary} />
                </div>
              </div>
            </div>
          </div>

          {result.localDiagnosis.explainabilityBreakdown && result.localDiagnosis.explainabilityBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-1.5"><Eye className="w-4 h-4"/> {lang === 'id' ? "Log Transparansi Nilai (Explainability)" : "Value Transparency Log"}</h4>
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
                        <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm flex flex-col border-rose-200 dark:border-rose-900/50">
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
                  <p className="text-sm font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
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
                <h4 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-widest mb-4 flex items-center gap-2"><Leaf className="w-5 h-5"/> {lang === 'id' ? "Rekomendasi Tanaman Pendukung" : "Flora Support Recommendations"}</h4>
                <div className="space-y-2">
                  {result.localDiagnosis.plantRecommendations.length === 0 ? (
                    <>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> 
                        {lang === 'id' ? "Ceratophyllum Demersum / Hornwort (Sangat Cepat Menyerap Amonia)" : "Hornwort (Fast Ammonia Absorber)"}
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" /> 
                        {lang === 'id' ? "Egeria Densa (Tanaman Tangguh Penyeimbang Nutrisi Air)" : "Anacharis / Egeria Densa"}
                      </div>
                    </>
                  ) : (
                    result.localDiagnosis.plantRecommendations.map((rec, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-2 shadow-sm">
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