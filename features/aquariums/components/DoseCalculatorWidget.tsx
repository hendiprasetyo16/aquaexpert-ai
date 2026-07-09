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

  // 💡 EFEK VISUAL: Hitung persentase isi cairan (Maksimal 100%)
  // Asumsi: Dosis 15ml ke atas dianggap 'penuh' secara visual agar animasinya terlihat
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
            {lang === 'id' ? "Kalkulator Dosis (Kondisioner)" : "Dose Calculator (Conditioner)"}
          </h4>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {lang === 'id' 
              ? "Gunakan kalkulator ini untuk menakar cairan secara presisi (contoh: Penurun pH, Pupuk Cair) agar terhindar dari overdosis."
              : "Use this to precisely measure liquids (e.g., pH Buffers, Liquid Fertilizers) to avoid lethal overdosing."}
          </p>
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="grid grid-cols-2 gap-4 mb-4 relative z-20">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block line-clamp-1">
            {lang === 'id' ? "Dosis Kemasan (ml)" : "Package Dose (ml)"}
          </label>
          <input 
            type="number" 
            placeholder="Cth: 5"
            value={recommendedDose}
            onChange={(e) => setRecommendedDose(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-black outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block line-clamp-1">
            {lang === 'id' ? "Per Volume Air (Liter)" : "Per Volume (Liters)"}
          </label>
          <input 
            type="number" 
            placeholder="Cth: 50"
            value={recommendedVolume}
            onChange={(e) => setRecommendedVolume(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-black outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* HASIL KALKULASI DENGAN ANIMASI CAIRAN BEAKER */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex justify-between items-center gap-4 relative overflow-hidden h-[80px]">
        
        {/* 💡 EFEK VISUAL BEAKER (Gelas Kimia) */}
        <div className="absolute right-0 bottom-0 w-24 h-24 opacity-20 pointer-events-none flex items-end justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 text-blue-500 z-10 relative">
            <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12" />
          </svg>
          {/* Lapisan Cairan yang terisi secara dinamis */}
          <div 
            className="absolute bottom-[2px] w-[50px] bg-blue-500 rounded-b-md transition-all duration-700 ease-out z-0 opacity-50"
            style={{ height: `${(fillPercentage / 100) * 72}px` }} 
          />
        </div>
        
        <div className="relative z-20 flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5 leading-tight line-clamp-1">
            {lang === 'id' ? "Dosis Tangki Anda:" : "Tank Dosage:"}
          </p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
            {lang === 'id' ? `(Sesuai volume ${aquariumVolumeLiters}L)` : `(For ${aquariumVolumeLiters}L volume)`}
          </p>
        </div>
        
        <div className="relative z-20 text-right shrink-0 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/30 backdrop-blur-sm">
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tight">
            {calculatedDoseStr}
          </span>
          <span className="text-xs font-bold text-blue-600/70 ml-1">ml/gr</span>
        </div>
        
      </div>

    </div>
  );
}