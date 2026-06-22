"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Droplets, 
  Leaf, 
  Fish, 
  CalendarDays, 
  Star, 
  Container, 
  ChevronRight,
  Sun,
  Wind,
  Ruler
} from "lucide-react";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";
import { 
  getTankTypeDesc, 
  calculateTankAge, 
  type AquariumDictionary 
} from "./aquarium-helpers";

export interface AquariumCardProps {
  aquarium: Aquarium;
  dict: AquariumDictionary;
  lang?: "id" | "en";
}

export default function AquariumCard({ aquarium, dict, lang = "id" }: AquariumCardProps) {
  // Mengekstrak jumlah fauna dan flora murni dari relasi database
  const fishCount = aquarium.aquarium_fishes?.length || 0;
  const plantCount = aquarium.aquarium_plants?.length || 0;
  
  const tankAge = calculateTankAge(aquarium.setup_date, dict, lang);
  const tankType = getTankTypeDesc(aquarium.tank_type, lang);
  
  return (
    <Link 
      href={`/dashboard/my-aquarium/${aquarium.id}`} 
      className="group flex flex-col md:flex-row w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden outline-none focus:ring-4 focus:ring-teal-500/30"
    >
      {/* SEKTOR GAMBAR (Atas di HP, Kiri di Desktop) */}
      <div className="relative w-full md:w-56 lg:w-64 h-52 md:h-auto shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
            <span className="text-xs font-bold uppercase tracking-widest opacity-50 text-center px-4">{tankType}</span>
          </div>
        )}

        {/* Gradient Overlay Transparan */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-950/20"></div>

        {/* Lencana Tangki Utama */}
        {aquarium.is_primary && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-teal-500 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
            <Star className="w-3 h-3 fill-white" />
            {dict?.card?.primaryBadge || (lang === "id" ? "Tangki Utama" : "Primary")}
          </div>
        )}
      </div>

      {/* SEKTOR KONTEN & DATA */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 md:p-6 justify-between">
        
        {/* Header Kartu */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="overflow-hidden">
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate" title={aquarium.name}>
              {aquarium.name}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 truncate">
              {tankType}
            </p>
          </div>
          <div className="hidden md:flex shrink-0 p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
          </div>
        </div>

        {/* Badge Perangkat Keras (Muncul dari versi Lama) */}
        <div className="flex flex-wrap gap-2 mb-5">
          {aquarium.length_cm > 0 && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Ruler className="w-3 h-3 mr-1.5 opacity-70" /> {aquarium.length_cm}x{aquarium.width_cm}x{aquarium.height_cm} cm
            </span>
          )}
          {aquarium.light_type && aquarium.light_type !== 'None' && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
              <Sun className="w-3 h-3 mr-1.5 opacity-70" /> {aquarium.light_type}
            </span>
          )}
          {aquarium.co2_type && aquarium.co2_type !== 'None' && (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <Wind className="w-3 h-3 mr-1.5 opacity-70" /> {aquarium.co2_type}
            </span>
          )}
        </div>

        {/* Spesifikasi Grid (Responsive: 2 Kolom di HP, 4 Kolom di Tablet/Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-auto border-t border-slate-100 dark:border-slate-800/80 pt-4">
          
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{dict?.card?.volume || "Volume"}</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{aquarium.volume_liters} L</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{dict?.card?.age || "Umur"}</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{tankAge}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 transition-colors">
            <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
              <Fish className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{dict?.card?.fishes || "Fauna"}</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{fishCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{dict?.card?.plants || "Flora"}</p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{plantCount}</p>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}