// features/aquariums/components/AquariumCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Aquarium } from "../types/aquarium.types";
import { AquariumDictionary, calculateTankAge, getTankTypeDesc } from "./aquarium-helpers";
import { 
  Leaf, 
  Fish, 
  Droplets, 
  CalendarDays, 
  Star, 
  Container, 
  Wind, 
  Sun,
  Ruler 
} from "lucide-react";

interface AquariumCardProps {
  aquarium: Aquarium;
  dict: AquariumDictionary; // STRICT TYPING!
  lang: "id" | "en";
}

export default function AquariumCard({ aquarium, dict, lang }: AquariumCardProps) {
  const plantCount = aquarium.aquarium_plants?.length || 0;
  const fishCount = aquarium.aquarium_fishes?.length || 0;

  const tankType = getTankTypeDesc(aquarium.tank_type, lang);
  const tankAge = calculateTankAge(aquarium.setup_date, dict, lang);

  return (
    <Link href={`/dashboard/my-aquarium/${aquarium.id}`} className="block h-full outline-none focus:ring-4 focus:ring-teal-500/30 rounded-2xl">
      <div className={`relative flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${
        aquarium.is_primary 
          ? "border-2 border-teal-500 shadow-md shadow-teal-500/10 dark:shadow-teal-900/20" 
          : "border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700"
      }`}>
        
        {/* GAMBAR COVER & OVERLAY HEADER */}
        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
          {aquarium.image_url ? (
            <Image 
              src={aquarium.image_url} 
              alt={aquarium.name} 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <Container className="h-12 w-12 mb-2 opacity-50" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-50">{tankType}</span>
            </div>
          )}
          
          {/* GRADIENT OVERLAY (Diperhalus agar teks lebih mudah dibaca) */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent"></div>

          {/* PRIMARY BADGE */}
          {aquarium.is_primary && (
            <div className="absolute top-3 right-3 bg-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg tracking-wider">
              <Star className="w-3 h-3 fill-white" /> 
              {dict.card?.primaryBadge || "PRIMARY TANK"}
            </div>
          )}

          {/* INFORMASI TEKS DI ATAS GAMBAR */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="text-xl font-black leading-tight drop-shadow-md truncate mb-1" title={aquarium.name}>
              {aquarium.name}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200 drop-shadow truncate">
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                <Container className="w-3 h-3" /> {tankType}
              </span>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                <Droplets className="w-3 h-3 text-blue-300" /> {aquarium.volume_liters}L
              </span>
            </div>
          </div>
        </div>

        {/* ISI KARTU BAWAH */}
        <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-blue-100 dark:group-hover:border-blue-900/50">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg">
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{dict.card?.volume || "Volume"}</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{aquarium.volume_liters} Liter</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-amber-100 dark:group-hover:border-amber-900/50">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-lg">
                <CalendarDays className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{dict.card?.age || "Umur"}</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{tankAge}</span>
              </div>
            </div>
          </div>

          {/* AREA TAG/BADGE (DIMENSI, LAMPU, CO2) */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {aquarium.length_cm > 0 && (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                <Ruler className="w-3 h-3 mr-1.5 opacity-70" /> {aquarium.length_cm}x{aquarium.width_cm}x{aquarium.height_cm} cm
              </span>
            )}
            {aquarium.light_type && aquarium.light_type !== 'None' && (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40">
                <Sun className="w-3 h-3 mr-1.5 opacity-70" /> {aquarium.light_type}
              </span>
            )}
            {aquarium.co2_type && aquarium.co2_type !== 'None' && (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                <Wind className="w-3 h-3 mr-1.5 opacity-70" /> {aquarium.co2_type}
              </span>
            )}
          </div>
        </div>

        {/* FOOTER INVENTORI */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-3 flex items-center justify-center gap-3 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded-full text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-800 dark:text-slate-200 leading-none">{plantCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{dict.card?.plants || "Tanaman"}</span>
            </div>
          </div>
          
          <div className="p-3 flex items-center justify-center gap-3 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 transition-colors">
            <div className="bg-sky-100 dark:bg-sky-900/50 p-1.5 rounded-full text-sky-600 dark:text-sky-400">
              <Fish className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-slate-800 dark:text-slate-200 leading-none">{fishCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{dict.card?.fishes || "Ikan"}</span>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}