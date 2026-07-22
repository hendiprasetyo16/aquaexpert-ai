// components/layout/ExpertModules.tsx
"use client";

import { Database, Fish, Leaf, Bug, Cpu, HeartPulse, ArrowRight, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExpertModules({ lang }: { lang: "id" | "en" }) {
  const router = useRouter();

  return (
    <div className="lg:col-span-2 space-y-8">
      
      {/* Encyclopedia */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-500" /> {lang === 'id' ? "Ensiklopedia Spesies" : "Species Encyclopedia"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div onClick={() => router.push("/dashboard/fishes")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_35px_rgba(59,130,246,0.35)] shadow-sm">
            <Fish className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-blue-500 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">{lang === 'id' ? "Data Ikan" : "Fishes"}</span>
          </div>
          <div onClick={() => router.push("/dashboard/plants")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_35px_rgba(16,185,129,0.35)] shadow-sm">
            <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-center">{lang === 'id' ? "Tanaman Air" : "Plants"}</span>
          </div>
          <div onClick={() => router.push("/dashboard/algae")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] shadow-sm">
            <Bug className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-amber-500 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-center">{lang === 'id' ? "Jenis Alga" : "Algae"}</span>
          </div>
          <div onClick={() => router.push("/dashboard/diseases")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] dark:hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] shadow-sm">
            <Database className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-red-500 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors text-center">{lang === 'id' ? "Penyakit" : "Diseases"}</span>
          </div>
        </div>
      </div>

      {/* Diagnostic */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-500" /> {lang === 'id' ? "Sistem Pakar Diagnostik" : "Expert Diagnostic Systems"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div onClick={() => router.push("/dashboard/disease-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] dark:hover:shadow-[0_0_40px_rgba(225,29,72,0.5)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/20 blur-3xl rounded-full group-hover:bg-rose-500/20 dark:group-hover:bg-rose-500/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300"><HeartPulse className="w-6 h-6 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]" /></div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Disease Expert</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Pemindaian klinis dan identifikasi patogen menggunakan pemindai visual terotomasi." : "Clinical scanning and pathogen identification using automated visual scanners."}</p>
              <div className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Mulai Pemindaian" : "Start Scan"} <ArrowRight className="w-4 h-4" /></div>
            </div>
          </div>

          <div onClick={() => router.push("/dashboard/fish-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300"><Fish className="w-6 h-6 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /></div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Fish Expert</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Sistem pakar terkait nutrisi harian, perhitungan bioload, dan sengketa teritorial ikan." : "Expert system for daily nutrition, bioload calculations, and territorial disputes."}</p>
              <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Konsultasi Ahli" : "Expert Consult"} <ArrowRight className="w-4 h-4" /></div>
            </div>
          </div>

          <div onClick={() => router.push("/dashboard/plant-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300"><Leaf className="w-6 h-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /></div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Plant Expert</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Analisis defisiensi nutrisi dan panduan optimalisasi flora aquascape." : "Nutrient deficiency analysis and aquascape flora optimization guide."}</p>
              <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-4 h-4" /></div>
            </div>
          </div>

          <div onClick={() => router.push("/dashboard/algae-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/20 blur-3xl rounded-full group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300"><Bug className="w-6 h-6 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /></div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Algae Expert</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Sistem pendeteksi parameter penyebab ledakan alga dan protokol pembasmiannya." : "Parameter detection system for algae blooms and eradication protocols."}</p>
              <div className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Analisis Alga" : "Analyze Algae"} <ArrowRight className="w-4 h-4" /></div>
            </div>
          </div>

          <div onClick={() => router.push("/dashboard/analytics")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] sm:col-span-2 xl:col-span-1">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300"><BarChart className="w-6 h-6 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" /></div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lang === 'id' ? "Analisis Klinis" : "Clinical Analytics"}</h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Dasbor statistik dan pemantauan mendalam dari parameter biologis akuarium." : "Statistical dashboard and in-depth monitoring of aquarium biological parameters."}</p>
              <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Analitik" : "Open Analytics"} <ArrowRight className="w-4 h-4" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}