// features/aquariums/components/DoseCalculatorWidget.tsx
"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface DoseCalculatorWidgetProps {
  aquariumVolumeLiters: number;
}

export default function DoseCalculatorWidget({ aquariumVolumeLiters }: DoseCalculatorWidgetProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [recommendedDose, setRecommendedDose] = useState<number | "">("");
  const [recommendedVolume, setRecommendedVolume] = useState<number | "">("");

  // Rumus: (Dosis Anjuran / Volume Anjuran) * Volume Akuarium Aktual
  const calcValue = (typeof recommendedDose === "number" && typeof recommendedVolume === "number" && recommendedVolume > 0)
    ? ((recommendedDose / recommendedVolume) * aquariumVolumeLiters)
    : 0;
    
  const calculatedDoseStr = calcValue > 0 ? calcValue.toFixed(2) : "0.00";

  // EFEK VISUAL: Hitung persentase isi cairan (Maksimal 100%)
  const fillPercentage = Math.min(100, Math.max(0, (calcValue / 15) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm mt-4">
      
      {/* HEADER & HINT EDUKASI */}
      <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
            {lang === 'id' ? "Kalkulator Dosis Presisi" : "Precision Dose Calculator"}
          </h4>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {lang === 'id' 
              ? "Gunakan kalkulator ini untuk menakar cairan secara presisi (contoh: Obat, Pupuk Cair) agar terhindar dari overdosis."
              : "Use this to precisely measure liquids (e.g., Medications, Liquid Fertilizers) to avoid lethal overdosing."}
          </p>
        </div>
      </div>

      {/* INPUT FORM: Grid 2 Kolom */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 line-clamp-1">
            {lang === 'id' ? "Dosis (ml/tetes)" : "Dose (ml/drops)"}
          </label>
          <input 
            type="number" 
            placeholder="Cth: 5"
            value={recommendedDose}
            onChange={(e) => setRecommendedDose(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-11 px-3 sm:px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-black outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 line-clamp-1">
            {lang === 'id' ? "Per Air (Liter)" : "Per Water (Liters)"}
          </label>
          <input 
            type="number" 
            placeholder="Cth: 50"
            value={recommendedVolume}
            onChange={(e) => setRecommendedVolume(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-11 px-3 sm:px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-black outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* HASIL KALKULASI: DIBAGI DUA KIRI-KANAN (Sesuai Ide Bapak) */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 flex items-center justify-between gap-4">
        
        {/* BAGIAN KIRI: Teks & Angka */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 leading-tight">
            {lang === 'id' ? "Dosis Tangki Anda" : "Your Tank Dosage"}
          </p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 mb-2 line-clamp-1">
            {lang === 'id' ? `(Sesuai volume ${aquariumVolumeLiters} Liter)` : `(For ${aquariumVolumeLiters} Liters)`}
          </p>
          
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-4xl font-black text-blue-700 dark:text-blue-400 tracking-tighter">
              {calculatedDoseStr}
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-600/70">ml/tetes</span>
          </div>
        </div>

        {/* BAGIAN KANAN: Ikon Gelas Kimia (Beaker) */}
        <div className="relative w-16 h-16 shrink-0 flex items-end justify-center">
          {/* Ikon Gelas SVG */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-blue-300 dark:text-blue-800 z-20 relative">
            <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12" />
          </svg>
          
          {/* Efek Cairan Biru yang Naik-Turun */}
          <div 
            className="absolute bottom-[2px] w-[36px] bg-blue-500/80 rounded-b-sm transition-all duration-700 ease-out z-10"
            style={{ height: `${(fillPercentage / 100) * 44}px` }} 
          />
        </div>
        
      </div>

    </div>
  );
}