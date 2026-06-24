// features/fishes/components/FishCard.tsx
"use client";

import { Fish as FishType } from "../types/fish.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Droplets, Thermometer, Info, Edit, Waves } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 
import { getDifficultyDesc, getCompatibilityDesc, getCompatibilityBadgeStyle } from "./fish-helpers";

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

export default function FishCard({ fish }: FishCardProps) {
  const { role } = useAuth(); 
  const { dict, language } = useLanguage(); 

  // TYPE-SAFE DICTIONARY ACCESS DENGAN DOUBLE CASTING
  const dictRoot = dict as unknown as { fishCard?: FishCardDict };
  
  // FALLBACK TRANSLATIONS (Jika JSON lambat dimuat)
  const cardDict = dictRoot.fishCard || {
    editTooltip: language === 'id' ? "Edit Ikan" : "Edit Fish",
    noScientificName: language === 'id' ? "Nama ilmiah tidak diketahui" : "Unknown scientific name",
    tankSize: language === 'id' ? "Min. Tangki:" : "Min. Tank:",
    ph: language === 'id' ? "pH Ideal:" : "Ideal pH:",
    temp: language === 'id' ? "Suhu:" : "Temp:",
    difficulty: language === 'id' ? "Perawatan:" : "Care Level:"
  };

  const displayName = language === 'en' && fish.name_en ? fish.name_en : fish.name_id;

  return (
    <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all duration-500 hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] z-0">

      {role !== "user" && (
        <Link
          href={`/dashboard/fishes/${fish.id}/edit`}
          className="absolute right-3 top-3 z-20 rounded-lg bg-cyan-600 p-2 text-white opacity-0 transition-all hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] group-hover:opacity-100 shadow-md"
          title={cardDict.editTooltip}
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}

      <Link href={`/dashboard/fishes/${fish.id}`} className="block cursor-pointer">
        <div className="h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative transition-colors duration-300">
          {fish.image_url ? (
            <img src={fish.image_url} alt={displayName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Fish className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Badge Agresivitas di pojok kiri atas foto */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/90 shadow-sm ${getCompatibilityBadgeStyle(fish.compatibility)}`}>
            {getCompatibilityDesc(fish.compatibility, language)}
          </div>
        </div>

        <CardHeader>
          <CardTitle className="text-xl text-blue-700 dark:text-cyan-400 transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-300 truncate drop-shadow-sm" title={displayName}>
            {displayName}
          </CardTitle>
          <p className="italic text-slate-500 dark:text-slate-400 truncate text-sm font-serif" title={fish.scientific_name || ""}>
            {fish.scientific_name || cardDict.noScientificName}
          </p>
        </CardHeader>
      </Link>

      <CardContent>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.tankSize}</span>
            <span className="truncate font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 ml-auto">
              {fish.min_tank_size ? `${fish.min_tank_size} L` : '-'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
            <span className="font-semibold text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.ph}</span>
            <span className="truncate font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 ml-auto">
              {fish.ideal_ph_min && fish.ideal_ph_max ? `${fish.ideal_ph_min} - ${fish.ideal_ph_max}` : '-'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500 dark:text-orange-400 shrink-0" />
            <span className="font-semibold text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.temp}</span>
            <span className="truncate font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 ml-auto">
              {fish.ideal_temp_min && fish.ideal_temp_max ? `${fish.ideal_temp_min} - ${fish.ideal_temp_max} °C` : '-'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/60 mt-3 transition-colors duration-300">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-xs uppercase tracking-wide opacity-80 shrink-0">{cardDict.difficulty}</span>
            </div>
            <span
              className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border shadow-sm transition-colors ${
                fish.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' 
                : fish.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' 
                : fish.difficulty?.toLowerCase() === 'hard' ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {getDifficultyDesc(fish.difficulty, language)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}