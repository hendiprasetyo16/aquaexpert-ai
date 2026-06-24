// features/fishes/components/FishCard.tsx
"use client";

import { Fish as FishType } from "../types/fish.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Droplets, Thermometer, Info, Edit, Waves } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 
import { getCompatibilityDesc, getCompatibilityBadgeStyle } from "./fish-helpers";

interface FishCardProps {
  fish: FishType;
}

// ==========================================
// INTERFACE UNTUK TYPE-SAFE DICTIONARY
// ==========================================
interface FishCardDict {
  editTooltip?: string;
  noScientificName?: string;
  tankSize?: string;
  ph?: string;
  temp?: string;
  difficulty?: string;
}

// KITA BUAT FUNGSI HELPER LOKAL UNTUK MEMECAH TEKS DIFFICULTY MENJADI 2 BARIS
const renderDifficultyBadge = (level: string | null | undefined, lang: "id" | "en") => {
  if (!level) {
    return (
      <>
        <span className="font-black leading-none mb-0.5">{lang === 'id' ? "TIDAK TAHU" : "UNKNOWN"}</span>
      </>
    );
  }

  const l = level.toLowerCase();
  
  if (lang === "id") {
    if (l === "easy") return <><span className="font-black leading-none mb-0.5">MUDAH</span><span className="text-[8px] sm:text-[9px] opacity-80">(PEMULA)</span></>;
    if (l === "medium") return <><span className="font-black leading-none mb-0.5">SEDANG</span><span className="text-[8px] sm:text-[9px] opacity-80">(MENENGAH)</span></>;
    if (l === "hard") return <><span className="font-black leading-none mb-0.5">SULIT</span><span className="text-[8px] sm:text-[9px] opacity-80">(MAHIR)</span></>;
  } else {
    if (l === "easy") return <><span className="font-black leading-none mb-0.5">EASY</span><span className="text-[8px] sm:text-[9px] opacity-80">(BEGINNER)</span></>;
    if (l === "medium") return <><span className="font-black leading-none mb-0.5">MEDIUM</span><span className="text-[8px] sm:text-[9px] opacity-80">(INTERMEDIATE)</span></>;
    if (l === "hard") return <><span className="font-black leading-none mb-0.5">HARD</span><span className="text-[8px] sm:text-[9px] opacity-80">(ADVANCED)</span></>;
  }

  return <span className="font-black leading-none">{level.toUpperCase()}</span>;
};

export default function FishCard({ fish }: FishCardProps) {
  const { role } = useAuth(); 
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";

  const rootDict = dict as unknown as { fishCard?: FishCardDict };
  
  const cardDict = rootDict.fishCard || {
    editTooltip: lang === 'id' ? "Edit Ikan" : "Edit Fish",
    noScientificName: lang === 'id' ? "Nama ilmiah tidak diketahui" : "Unknown scientific name",
    tankSize: lang === 'id' ? "Min. Tangki:" : "Min. Tank:",
    ph: lang === 'id' ? "pH Ideal:" : "Ideal pH:",
    temp: lang === 'id' ? "Suhu:" : "Temp:",
    difficulty: lang === 'id' ? "Perawatan:" : "Care Level:"
  };

  const displayName = lang === 'en' && fish.name_en ? fish.name_en : fish.name_id;

  return (
    <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all duration-500 hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] z-0 flex flex-col h-full">

      {role !== "user" && (
        <Link
          href={`/dashboard/fishes/${fish.id}/edit`}
          className="absolute right-3 top-3 z-20 rounded-lg bg-cyan-600 p-2 text-white opacity-0 transition-all hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] group-hover:opacity-100 shadow-md"
          title={cardDict.editTooltip}
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}

      <Link href={`/dashboard/fishes/${fish.id}`} className="block cursor-pointer flex-shrink-0">
        <div className="h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative transition-colors duration-300">
          {fish.image_url ? (
            // PERBAIKAN: Menghapus unoptimized yang error dan menggunakan Image standar yang aman
            <Image 
              src={fish.image_url} 
              alt={displayName} 
              fill 
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Fish className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/90 shadow-sm ${getCompatibilityBadgeStyle(fish.compatibility)}`}>
            {getCompatibilityDesc(fish.compatibility, lang)}
          </div>
        </div>

        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg sm:text-xl text-blue-700 dark:text-cyan-400 transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-300 truncate drop-shadow-sm" title={displayName}>
            {displayName}
          </CardTitle>
          <p className="italic text-slate-500 dark:text-slate-400 truncate text-[13px] sm:text-sm font-serif mt-0.5" title={fish.scientific_name || ""}>
            {fish.scientific_name || cardDict.noScientificName}
          </p>
        </CardHeader>
      </Link>

      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.tankSize}</span>
            <span className="truncate font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 ml-auto">
              {fish.min_tank_size ? `${fish.min_tank_size} L` : '-'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.ph}</span>
            <span className="truncate font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 ml-auto">
              {fish.ideal_ph_min && fish.ideal_ph_max ? `${fish.ideal_ph_min} - ${fish.ideal_ph_max}` : '-'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500 dark:text-orange-400 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.temp}</span>
            <span className="truncate font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 ml-auto">
              {fish.ideal_temp_min && fish.ideal_temp_max ? `${fish.ideal_temp_min} - ${fish.ideal_temp_max} °C` : '-'}
            </span>
          </div>

          {/* PERBAIKAN FINAL: DIBUAT DUA BARIS AGAR TIDAK BOCOR / OVERFLOW */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/60 mt-3 transition-colors duration-300 gap-2.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-[11px] sm:text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.difficulty}</span>
            </div>
            
            <div
              className={`flex flex-col items-center justify-center text-center rounded-md px-3 py-1.5 min-h-[36px] uppercase tracking-wider border shadow-sm transition-colors w-full xl:w-fit xl:ml-auto break-words ${
                fish.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700' 
                : fish.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' 
                : fish.difficulty?.toLowerCase() === 'hard' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {renderDifficultyBadge(fish.difficulty, lang)}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}