// features/aquariums/components/AquariumSpecsPanel.tsx
"use client";

import { Box, Layers, Sun, Wind, FlaskConical, LayoutTemplate, Thermometer, Leaf } from "lucide-react";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";
import {
  getAquascapeStyleDesc,
  getSubstrateDesc,
  getFilterDesc,
  getLightDesc,
  getCO2Desc,
  getFertilizerDesc
} from "./aquarium-helpers";

interface Props {
  aquarium: Aquarium;
  lang?: "id" | "en";
}

export function AquariumSpecsPanel({ aquarium, lang = "id" }: Props) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-8 flex items-center gap-2">
        <LayoutTemplate className="w-6 h-6 text-blue-500" />
        {lang === "id" ? "Spesifikasi & Perangkat" : "Specs & Equipments"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-8">
        
        {/* KOLOM 1: Gaya & Substrat */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Box className="w-4 h-4" /> 
              </div>
              Aquascape Style
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 ml-[2.25rem]">
              {getAquascapeStyleDesc(aquarium.aquascape_style, lang)}
            </p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 rounded-lg">
                <Layers className="w-4 h-4" /> 
              </div>
              Substrate System
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 ml-[2.25rem]">
              {getSubstrateDesc(aquarium.substrate_type, lang)}
            </p>
          </div>
        </div>

        {/* KOLOM 2: Sirkulasi & Pencahayaan */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Wind className="w-4 h-4" /> 
              </div>
              Filtration
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 ml-[2.25rem]">
              {getFilterDesc(aquarium.filter_type, lang)}
              {aquarium.filter_flow_lph ? ` (${aquarium.filter_flow_lph} L/H)` : ""}
            </p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-lg">
                <Sun className="w-4 h-4" /> 
              </div>
              Lighting
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 ml-[2.25rem]">
              {getLightDesc(aquarium.light_type, lang)}
              {aquarium.light_wattage ? ` - ${aquarium.light_wattage}W` : ""}
            </p>
            {aquarium.photoperiod_hours != null && (
              <p className="text-xs font-semibold text-slate-500 mt-1 ml-[2.25rem]">
                {lang === "id" ? "Durasi:" : "Photoperiod:"} {aquarium.photoperiod_hours} {lang === "id" ? "jam/hari" : "hours/day"}
              </p>
            )}
          </div>
        </div>

        {/* KOLOM 3: CO2, Pupuk, Suhu (Tersusun Lurus Ke Bawah) */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <FlaskConical className="w-4 h-4" /> 
              </div>
              CO2 Injection
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 ml-[2.25rem]">
              {getCO2Desc(aquarium.co2_type, lang)}
              {aquarium.co2_bps ? ` (${aquarium.co2_bps} BPS)` : ""}
            </p>
          </div>
          
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-lg">
                <Leaf className="w-4 h-4" /> 
              </div>
              Fertilizer
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 ml-[2.25rem]">
              {getFertilizerDesc(aquarium.fertilizer_type, lang)}
            </p>
          </div>
            
          {/* FIX: Heater berdiri sendiri di bawah Fertilizer */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-lg">
                <Thermometer className="w-4 h-4" /> 
              </div>
              Heater
            </div>
            <p className={`text-sm font-black ml-[2.25rem] ${aquarium.heater_enabled ? "text-emerald-600" : "text-slate-400"}`}>
              {aquarium.heater_enabled ? "Active" : "None"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}