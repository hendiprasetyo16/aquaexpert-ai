// app/(dashboard)/dashboard/medications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Pill, FlaskConical, Beaker, Leaf, Bug, AlertTriangle, ShieldCheck, Clock, Activity, Loader2, Search } from "lucide-react";
import { getMedicationsDatabaseAction, MedicationDto } from "@/features/diseases/actions/medication.actions";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function MedicationDatabasePage() {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [medications, setMedications] = useState<MedicationDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeds = async () => {
      setIsLoading(true);
      const res = await getMedicationsDatabaseAction();
      if (res.success) {
        setMedications(res.data);
      } else {
        toast.error(res.error || "Gagal memuat database obat.");
      }
      setIsLoading(false);
    };
    fetchMeds();
  }, []);

  const filteredMeds = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    med.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-sky-500/10 dark:bg-sky-500/20 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 w-full md:w-auto">
            <h1 className="text-3xl md:text-4xl font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]">
              <Pill className="h-8 w-8 md:h-10 md:w-10" /> 
              {lang === 'id' ? "Medication Database" : "Medication Database"}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
              {lang === 'id' 
                ? "Ensiklopedia medis komprehensif. Pelajari dosis, keamanan bagi flora/fauna, dan standar tingkat kesembuhan baku obat-obatan aquascape."
                : "Comprehensive medical encyclopedia. Learn dosages, flora/fauna safety, and baseline recovery rates of aquascape medications."}
            </p>
          </div>

          <div className="relative z-10 w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              type="text"
              placeholder={lang === 'id' ? "Cari nama obat atau kandungan..." : "Search medication or active ingredient..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:ring-sky-500/20 font-medium w-full"
            />
          </div>
        </div>

        {/* LOADING & DATA GRID */}
        {isLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-sky-500 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" /></div>
        ) : filteredMeds.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
             <FlaskConical className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
             <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">
               {lang === 'id' ? "Obat Tidak Ditemukan" : "Medication Not Found"}
             </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMeds.map((med, index) => (
              <div key={med.id} className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all duration-300 hover:border-sky-300 dark:hover:border-sky-700 flex flex-col group">
                
                {/* NEON NUMBERING */}
                <div className="absolute top-5 left-5 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-sm shadow-[0_0_10px_rgba(14,165,233,0.3)] group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>

                {/* HEADER KARTU OBAT */}
                <div className="p-6 pt-16 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
                  {/* ICON BACKGROUND GLOW */}
                  <div className="absolute top-4 right-4 opacity-10 dark:opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500">
                    <FlaskConical className="w-24 h-24 text-sky-500 drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight relative z-10">{med.name}</h3>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-sky-200 dark:border-sky-800/50 relative z-10">
                    <Beaker className="w-3.5 h-3.5" /> {med.active_ingredient}
                  </div>
                </div>

                {/* DESKRIPSI & DOSIS */}
                <div className="p-6 flex-1 space-y-5">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed min-h-[40px]">
                    {lang === 'id' ? med.description_id : med.description_en}
                  </p>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{lang === 'id' ? 'Dosis Standar' : 'Standard Dosage'}</p>
                      <p className="text-lg font-black text-sky-600 dark:text-sky-400 drop-shadow-[0_0_5px_rgba(14,165,233,0.2)]">
                        {med.base_dosage_per_100l} <span className="text-xs font-bold text-sky-700 dark:text-sky-500">{med.dosage_unit} / 100L</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{lang === 'id' ? 'Durasi' : 'Duration'}</p>
                      <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                        {med.treatment_duration_days} <span className="text-xs font-bold text-slate-500">{lang === 'id' ? 'Hari' : 'Days'}</span>
                      </p>
                    </div>
                  </div>

                  {/* INDIKATOR KEAMANAN FLORA & FAUNA (TERINTEGRASI MODE TERANG & GELAP) */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                      med.safe_for_plants 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)] dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)] dark:shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                    }`}>
                      {med.safe_for_plants ? <Leaf className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'id' ? 'Tanaman' : 'Plants'}</span>
                    </div>
                    
                    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                      med.safe_for_inverts 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)] dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)] dark:shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                    }`}>
                      {med.safe_for_inverts ? <Bug className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'id' ? 'Udang/Siput' : 'Inverts'}</span>
                    </div>
                  </div>
                </div>

                {/* STANDAR MEDIS (BASELINE AI) - HARMONIS MODE TERANG/GELAP */}
                <div className="p-5 bg-slate-100 dark:bg-slate-950/80 flex justify-between items-center rounded-b-3xl border-t border-slate-200 dark:border-slate-800 transition-colors">
                  <div className="text-center flex-1 border-r border-slate-300 dark:border-slate-800">
                    <Activity className="w-5 h-5 mx-auto text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)] mb-1.5" />
                    <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{lang === 'id' ? 'Skor Medis' : 'Med Score'}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{med.clinical_score_baseline}</p>
                  </div>
                  <div className="text-center flex-1 border-r border-slate-300 dark:border-slate-800">
                    <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] mb-1.5" />
                    <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{lang === 'id' ? 'Standar Sembuh' : 'Success Base'}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{med.success_rate_baseline_pct}%</p>
                  </div>
                  <div className="text-center flex-1">
                    <Clock className="w-5 h-5 mx-auto text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] mb-1.5" />
                    <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{lang === 'id' ? 'Rata-rata' : 'Avg Time'}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">{med.avg_recovery_days_baseline} <span className="text-[10px]">Hari</span></p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}