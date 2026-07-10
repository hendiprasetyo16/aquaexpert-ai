// features/aquariums/components/DoseCalculatorWidget.tsx
"use client";

import { useState } from "react";
import { Calculator, Info, ChevronUp } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface DoseCalculatorWidgetProps {
  aquariumVolumeLiters: number;
}

export default function DoseCalculatorWidget({ aquariumVolumeLiters }: DoseCalculatorWidgetProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [recommendedDose, setRecommendedDose] = useState<number | "">("");
  const [recommendedVolume, setRecommendedVolume] = useState<number | "">("");
  
  // 💡 STATE UNTUK MENAMPILKAN PANDUAN
  const [showGuide, setShowGuide] = useState(false);

  // Rumus: (Dosis Anjuran / Volume Anjuran) * Volume Akuarium Aktual
  const calcValue = (typeof recommendedDose === "number" && typeof recommendedVolume === "number" && recommendedVolume > 0)
    ? ((recommendedDose / recommendedVolume) * aquariumVolumeLiters)
    : 0;
    
  const calculatedDoseStr = calcValue > 0 ? calcValue.toFixed(2) : "0.00";

  // EFEK VISUAL: Hitung persentase isi cairan untuk SVG
  const fillHeight = calcValue > 0 ? Math.min(16, Math.max(2, (calcValue / 15) * 16)) : 0;
  const fillY = 20.5 - fillHeight;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm mt-4">
      
      {/* HEADER & TOMBOL BANTUAN */}
      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
          <Calculator className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
            {lang === 'id' ? "Kalkulator Dosis Presisi" : "Precision Dose Calculator"}
          </h4>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {lang === 'id' 
              ? "Takaran otomatis agar fauna/flora tidak overdosis."
              : "Automatic scaling to prevent fauna/flora overdosing."}
          </p>
        </div>
        
        {/* 💡 TOMBOL INTERAKTIF PANDUAN */}
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className={`p-1.5 rounded-lg transition-colors shrink-0 flex items-center justify-center ${showGuide ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'}`}
          title={lang === 'id' ? "Cara Pakai" : "How to Use"}
        >
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        </button>
      </div>

      {/* 💡 PANEL PANDUAN PENGGUNAAN (MUNCUL SAAT DIKLIK) */}
      {showGuide && (
        <div className="mb-5 p-3.5 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl animate-in slide-in-from-top-2 duration-300">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
            <Info className="w-3 h-3" /> {lang === 'id' ? "Panduan Singkat:" : "Quick Guide:"}
          </h5>
          <ol className="list-decimal list-outside text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-400 space-y-2 ml-4 font-medium leading-relaxed">
            <li>{lang === 'id' ? "Baca aturan pakai di botol kemasan (contoh: \"Tuangkan 5ml untuk 50 Liter air\")." : "Read the product label (e.g., \"Pour 5ml for 50 Liters of water\")."}</li>
            <li>{lang === 'id' ? "Ketik angka Dosis (contoh: 5) pada kotak sebelah kiri." : "Enter the Dose amount (e.g., 5) in the left box."}</li>
            <li>{lang === 'id' ? "Ketik angka Volume Acuan (contoh: 50) pada kotak sebelah kanan." : "Enter the Reference Volume (e.g., 50) in the right box."}</li>
            <li>{lang === 'id' ? "Sistem akan menghitung rasio aman secara instan ke dalam gelas kimia di bawah sesuai dengan ukuran tangki Bapak/Ibu." : "The system will instantly calculate the exact safe ratio into the beaker below based on your specific tank size."}</li>
          </ol>
        </div>
      )}

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

      {/* HASIL KALKULASI */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 flex items-center justify-between gap-4 relative overflow-hidden">
        
        {/* BAGIAN KIRI: Teks & Angka */}
        <div className="flex flex-col items-start flex-1 min-w-0 z-20 relative">
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

        {/* BAGIAN KANAN: Ikon Gelas SVG + Animasi Cairan */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center z-20 relative mr-2">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            
            <rect 
              x="6.5" 
              y={fillY} 
              width="11" 
              height={fillHeight} 
              fill="currentColor" 
              className="text-blue-500 dark:text-blue-500 transition-all duration-1000 ease-out"
              rx="0.5" 
            />
            
            <path 
              d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-slate-800 dark:text-slate-300"
            />
          </svg>
        </div>
        
      </div>

    </div>
  );
}