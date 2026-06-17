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

export default function FishCard({ fish }: FishCardProps) {
  const { role } = useAuth(); 
  const { language } = useLanguage(); 

  const displayName = language === 'en' && fish.name_en ? fish.name_en : fish.name_id;

  return (
    <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-600/10 dark:hover:shadow-blue-900/20">

      {role !== "user" && (
        <Link
          href={`/dashboard/fishes/${fish.id}/edit`}
          className="absolute right-3 top-3 z-20 rounded-lg bg-blue-600 p-2 text-white opacity-0 transition-all hover:bg-blue-500 group-hover:opacity-100 shadow-md"
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}

      <Link href={`/dashboard/fishes/${fish.id}`} className="block cursor-pointer">
        <div className="h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative transition-colors duration-300">
          {fish.image_url ? (
            <img src={fish.image_url} alt={displayName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Fish className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10 dark:group-hover:bg-black/20" />
          
          {/* Badge Agresivitas di pojok kiri atas foto */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/90 shadow-sm ${getCompatibilityBadgeStyle(fish.compatibility)}`}>
            {getCompatibilityDesc(fish.compatibility, language)}
          </div>
        </div>

        <CardHeader>
          <CardTitle className="text-xl text-blue-700 dark:text-blue-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300 truncate" title={displayName}>
            {displayName}
          </CardTitle>
          <p className="italic text-slate-500 dark:text-slate-400 truncate text-sm" title={fish.scientific_name || ""}>
            {fish.scientific_name || (language === 'id' ? "Nama ilmiah tidak diketahui" : "Unknown scientific name")}
          </p>
        </CardHeader>
      </Link>

      <CardContent>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-blue-600 dark:text-blue-500 shrink-0" />
            <span className="font-medium shrink-0">Volume Min.</span>
            <span className="truncate">{fish.min_tank_size ? `${fish.min_tank_size} L` : '-'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-600 dark:text-cyan-500 shrink-0" />
            <span className="font-medium shrink-0">pH Ideal:</span>
            <span className="truncate">{fish.ideal_ph_min && fish.ideal_ph_max ? `${fish.ideal_ph_min} - ${fish.ideal_ph_max}` : '-'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500 dark:text-orange-400 shrink-0" />
            <span className="font-medium shrink-0">Suhu:</span>
            <span className="truncate">{fish.ideal_temp_min && fish.ideal_temp_max ? `${fish.ideal_temp_min} - ${fish.ideal_temp_max} °C` : '-'}</span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 mt-3 transition-colors duration-300">
            <Info className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="font-medium shrink-0">Perawatan:</span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border transition-colors ${
                fish.difficulty?.toLowerCase() === 'easy' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' 
                : fish.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50' 
                : fish.difficulty?.toLowerCase() === 'hard' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' 
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