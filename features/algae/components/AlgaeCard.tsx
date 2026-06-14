// features/algae/components/AlgaeCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Algae } from "../types/algae.types";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider";
import { AlertTriangle, Info, Skull, Edit, Droplets, Leaf } from "lucide-react";

interface AlgaeCardProps {
  algae: Algae;
}

export default function AlgaeCard({ algae }: AlgaeCardProps) {
  const { role } = useAuth();
  const { language } = useLanguage();

  const displayName = language === "id" ? algae.name_id : algae.name_en;
  
  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) {
      return (
        // PERBAIKAN WARNA: Kontras lebih tinggi di Dark Mode (bg-red-950/80 & text-red-300)
        <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-300 dark:border-red-700 shadow-sm relative z-10">
          <Skull className="w-3 h-3" /> {language === "id" ? "Bahaya Tinggi" : "High Risk"}
        </span>
      );
    }
    if (severity === 3) {
      return (
        // PERBAIKAN WARNA: Kontras lebih tinggi di Dark Mode (bg-amber-950/80 & text-amber-300)
        <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-300 dark:border-amber-700 shadow-sm relative z-10">
          <AlertTriangle className="w-3 h-3" /> {language === "id" ? "Risiko Sedang" : "Medium Risk"}
        </span>
      );
    }
    return (
      // PERBAIKAN WARNA: Kontras lebih tinggi di Dark Mode (bg-green-950/80 & text-green-300)
      <span className="flex items-center gap-1 bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-green-300 dark:border-green-700 shadow-sm relative z-10">
        <Info className="w-3 h-3" /> {language === "id" ? "Risiko Rendah" : "Low Risk"}
      </span>
    );
  };

  // FUNGSI WARNA TINGKAT KESULITAN
  const getDifficultyColor = (difficulty: string | null | undefined) => {
    const diff = (difficulty || "Easy").toLowerCase();
    if (diff === "hard") {
      return "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/80";
    }
    if (diff === "medium") {
      return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80";
    }
    return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80";
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group transition-all hover:border-teal-500 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-600/10 dark:hover:shadow-teal-900/20 relative z-0">
      
      {/* UKIRAN / ORNAMEN AKUARIUM (WATERMARK LATAR BELAKANG) */}
      <div className="absolute -bottom-6 -right-6 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:opacity-10 dark:group-hover:opacity-10 transition-opacity duration-700 rotate-12">
        <Leaf className="w-32 h-32 text-teal-900 dark:text-teal-100" />
      </div>
      <div className="absolute top-1/2 -left-4 z-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none group-hover:opacity-5 transition-opacity duration-700 -rotate-12">
        <Droplets className="w-24 h-24 text-blue-900 dark:text-blue-100" />
      </div>

      {role !== "user" && (
        <Link
          href={`/dashboard/algae/${algae.id}/edit`}
          className="absolute right-3 top-3 z-20 rounded-lg bg-teal-600 p-2 text-white opacity-0 transition-all hover:bg-teal-500 group-hover:opacity-100 shadow-md"
          title={language === 'id' ? "Edit Alga" : "Edit Algae"}
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}

      <Link href={`/dashboard/algae/${algae.id}`} className="block cursor-pointer flex-1 flex flex-col relative z-10">
        <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0">
          {algae.image_url ? (
            <Image 
              src={algae.image_url} 
              alt={displayName} 
              fill 
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
              <AlertTriangle className="h-12 w-12 opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none" />
          <div className="absolute top-2 left-2 z-10">
            {getSeverityBadge(algae.severity)}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="mb-3">
            <h3 className="text-lg font-black text-teal-700 dark:text-teal-400 leading-tight mb-1 truncate transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-300">
              {displayName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate font-serif">
              {algae.scientific_name || "Algae species"}
            </p>
          </div>

          <div className="space-y-2 mt-auto border-t border-slate-200 dark:border-slate-800/60 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold uppercase tracking-wider opacity-70">Alias:</span>
              <span className="font-semibold text-gray-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 truncate max-w-[120px]">
                {algae.alias || "-"}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold uppercase tracking-wider opacity-70">Tingkat:</span>
              <span className={`font-bold uppercase px-2 py-0.5 rounded border ${getDifficultyColor(algae.difficulty)}`}>
                {algae.difficulty || "Easy"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}