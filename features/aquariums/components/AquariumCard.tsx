// features/aquariums/components/AquariumCard.tsx
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
  const fishCount = aquarium.aquarium_fishes?.length || 0;
  const plantCount = aquarium.aquarium_plants?.length || 0;
  
  const tankAge = calculateTankAge(aquarium.setup_date, dict, lang);
  const tankType = getTankTypeDesc(aquarium.tank_type, lang);
  
  return (
    <Link 
      href={`/dashboard/my-aquarium/${aquarium.id}`} 
      className="group flex flex-col md:flex-row w-full h-full min-h-[220px] bg-white dark:bg-slate-900 rounded-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden outline-none focus:ring-4 focus:ring-teal-500/30 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-xl"
    >
      {/* SEKTOR GAMBAR */}
      <div className="relative w-full md:w-48 shrink-0 h-48 md:h-auto bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {aquarium.image_url ? (
          <Image 
            src={aquarium.image_url} 
            alt={aquarium.name} 
            fill 
            sizes="(max-width: 768px) 100vw, 192px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <Container className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 text-center px-4 leading-tight">{tankType}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-950/20"></div>

        {aquarium.is_primary && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-teal-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md shadow-md">
            <Star className="w-2.5 h-2.5 fill-white" />
            {dict?.card?.primaryBadge || (lang === "id" ? "Tangki Utama" : "Primary")}
          </div>
        )}
      </div>

      {/* SEKTOR KONTEN & DATA */}
      <div className="flex-1 flex flex-col justify-between p-4 bg-white dark:bg-slate-900 min-w-0">
        
        {/* Header Kartu */}
        <div className="mb-3 w-full">
          <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight line-clamp-1 group-hover:text-teal-600 transition-colors" title={aquarium.name}>
            {aquarium.name}
          </h3>
          {/* FIX: Mengganti truncate menjadi line-clamp-2 agar teks tipe tangki panjang bisa membungkus ke baris bawah */}
          <div className="flex items-start gap-1.5 text-[11px] font-medium text-slate-500 mt-1">
             <Container className="w-3 h-3 shrink-0 mt-0.5" /> 
             <span className="line-clamp-2 leading-snug">{tankType}</span>
          </div>
        </div>

        {/* Badge Perangkat Keras */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {aquarium.length_cm > 0 && (
            <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
              <Ruler className="w-2.5 h-2.5 mr-1 opacity-70" /> {aquarium.length_cm}x{aquarium.width_cm}x{aquarium.height_cm} cm
            </span>
          )}
          {aquarium.light_type && aquarium.light_type !== 'None' && (
            <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40">
              <Sun className="w-2.5 h-2.5 mr-1 opacity-70" /> {aquarium.light_type}
            </span>
          )}
          {aquarium.co2_type && aquarium.co2_type !== 'None' && (
            <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40">
              <Wind className="w-2.5 h-2.5 mr-1 opacity-70" /> {aquarium.co2_type}
            </span>
          )}
        </div>

        {/* Spesifikasi Grid: Volume & Umur */}
        <div className="grid grid-cols-2 gap-2 mb-3 w-full">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-blue-100 dark:group-hover:border-blue-900/50 min-w-0">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg shrink-0">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
            </div>
            {/* FIX: Hapus truncate dari nilai Volume agar teks panjang tidak digantikan titik-titik */}
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{dict?.card?.volume || "Volume"}</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 leading-tight whitespace-normal break-words">{aquarium.volume_liters} L</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-amber-100 dark:group-hover:border-amber-900/50 min-w-0">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-lg shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
            </div>
            {/* FIX: Menggunakan whitespace-normal break-words agar "1 bulan, 10 hari" otomatis turun baris */}
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{dict?.card?.age || "Umur"}</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 leading-tight whitespace-normal break-words">{tankAge}</span>
            </div>
          </div>
        </div>

        {/* Footer Inventori (Ikan & Tanaman) */}
        <div className="grid grid-cols-2 mt-auto divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-2.5">
          <div className="flex items-center justify-center gap-2 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors py-1 rounded-l-lg">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded-full text-emerald-600 dark:text-emerald-400 shrink-0">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{plantCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-tight">{dict?.card?.plants || "Tanaman"}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 transition-colors py-1 rounded-r-lg">
            <div className="bg-sky-100 dark:bg-sky-900/50 p-1.5 rounded-full text-sky-600 dark:text-sky-400 shrink-0">
              <Fish className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{fishCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-tight">{dict?.card?.fishes || "Ikan"}</span>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}