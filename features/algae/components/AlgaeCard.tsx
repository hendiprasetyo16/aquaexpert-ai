// features/algae/components/AlgaeCard.tsx
"use client";

import Image from "next/image";
import { Algae } from "../types/algae.types";
import { useLanguage } from "@/providers/LanguageProvider";
import { AlertTriangle, Info, Skull } from "lucide-react";

interface AlgaeCardProps {
  algae: Algae;
}

export default function AlgaeCard({ algae }: AlgaeCardProps) {
  const { language } = useLanguage();

  const displayName = language === "id" ? algae.name_id : algae.name_en;
  
  // Fungsi penentu warna tingkat bahaya (Severity)
  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) {
      return (
        <span className="flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-200 dark:border-red-800">
          <Skull className="w-3 h-3" /> {language === "id" ? "Bahaya Tinggi" : "High Risk"}
        </span>
      );
    }
    if (severity === 3) {
      return (
        <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3 h-3" /> {language === "id" ? "Risiko Sedang" : "Medium Risk"}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-green-200 dark:border-green-800">
        <Info className="w-3 h-3" /> {language === "id" ? "Risiko Rendah" : "Low Risk"}
      </span>
    );
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group transition-all">
      {/* Gambar Alga */}
      <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0">
        {algae.image_url ? (
          <Image 
            src={algae.image_url} 
            alt={displayName} 
            fill 
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
            <AlertTriangle className="h-12 w-12 opacity-50" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getSeverityBadge(algae.severity)}
        </div>
      </div>

      {/* Detail Konten */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="text-lg font-black text-teal-700 dark:text-teal-400 leading-tight mb-1 truncate">
            {displayName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate font-serif">
            {algae.scientific_name || "Algae species"}
          </p>
        </div>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="font-bold uppercase tracking-wider opacity-70 w-16">Alias:</span>
            <span className="font-semibold text-gray-900 dark:text-slate-100">{algae.alias || "-"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="font-bold uppercase tracking-wider opacity-70 w-16">Tingkat:</span>
            <span className="font-semibold uppercase">{algae.difficulty || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}