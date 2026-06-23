// features/plants/components/PlantCard.tsx
"use client";

import { Plant } from "../types/plant.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Sun, Wind, Droplets, Edit } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const { role } = useAuth(); 
  const { dict, language } = useLanguage(); 

  // PENDETEKSI BAHASA UNTUK NAMA TANAMAN
  const displayName = language === 'en' && plant.name_en ? plant.name_en : plant.name_id;

  // --- FUNGSI PENERJEMAH OTOMATIS (MAPPING KE DICTIONARY) ---
  const getPlacementText = (val: string | null | undefined) => {
    if (!val) return dict.plantCard.unknown;
    const lower = val.toLowerCase();
    if (lower === 'foreground') return dict.formOptions?.placeFore || val;
    if (lower === 'midground') return dict.formOptions?.placeMid || val;
    if (lower === 'background') return dict.formOptions?.placeBack || val;
    if (lower === 'floating') return dict.formOptions?.placeFloat || val;
    if (lower === 'epiphyte') return dict.formOptions?.placeEpi || val;
    return val;
  };

  const getParamText = (val: string | null | undefined) => {
    if (!val) return dict.plantCard.unknown;
    const lower = val.toLowerCase();
    if (lower === 'low') return dict.formOptions?.paramLow || val;
    if (lower === 'medium') return dict.formOptions?.paramMed || val;
    if (lower === 'high') return dict.formOptions?.paramHigh || val;
    return val;
  };

  const getDifficultyText = (val: string | null | undefined) => {
    if (!val) return dict.plantCard.unknown;
    const lower = val.toLowerCase();
    if (lower === 'easy') return dict.formOptions?.diffEasy || val;
    if (lower === 'medium') return dict.formOptions?.diffMedium || val;
    if (lower === 'hard') return dict.formOptions?.diffHard || val;
    return val;
  };

  return (
    // PERBAIKAN: Menambahkan hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] untuk efek NEON
    <Card className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] dark:hover:shadow-[0_0_25px_rgba(45,212,191,0.3)]">

      {role !== "user" && (
        <Link
          href={`/dashboard/plants/${plant.id}/edit`}
          className="absolute right-3 top-3 z-20 rounded-lg bg-teal-600 p-2 text-white opacity-0 transition-all hover:bg-teal-500 group-hover:opacity-100 shadow-[0_0_15px_rgba(20,184,166,0.6)]"
          title={dict.plantCard.editTooltip}
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}

      <Link href={`/dashboard/plants/${plant.id}`} className="block cursor-pointer">
        <div className="h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative transition-colors duration-300">
          {plant.image_url ? (
            <img src={plant.image_url} alt={displayName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Leaf className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
          )}
          {/* OVERLAY GELAP SAAT DI-HOVER */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-teal-900/20 dark:group-hover:bg-black/40" />
        </div>

        <CardHeader>
          <CardTitle className="text-xl text-teal-700 dark:text-teal-400 transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-300 truncate" title={displayName}>
            {displayName}
          </CardTitle>
          <p className="italic text-slate-500 dark:text-slate-400 truncate" title={plant.scientific_name || ""}>
            {plant.scientific_name || dict.plantCard.noScientificName}
          </p>
        </CardHeader>
      </Link>

      <CardContent>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal-600 dark:text-teal-500 shrink-0" />
            <span className="font-medium shrink-0">{dict.plantCard.placement}</span>
            <span className="truncate">{getPlacementText(plant.placement)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-500 shrink-0" />
            <span className="font-medium shrink-0">{dict.plantCard.light}</span>
            <span className="truncate">{getParamText(plant.light_requirement)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="font-medium shrink-0">{dict.plantCard.co2}</span>
            <span className="truncate">{getParamText(plant.co2_requirement)}</span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 mt-3 transition-colors duration-300">
            <Droplets className="h-4 w-4 text-cyan-600 dark:text-cyan-500 shrink-0" />
            <span className="font-medium shrink-0">{dict.plantCard.difficulty}</span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border transition-colors ${
                plant.difficulty?.toLowerCase() === 'easy' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' 
                : plant.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50' 
                : plant.difficulty?.toLowerCase() === 'hard' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {getDifficultyText(plant.difficulty)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}