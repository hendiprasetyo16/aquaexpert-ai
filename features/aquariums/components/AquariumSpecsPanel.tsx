"use client";

import { Box, Layers, Sun, Wind, FlaskConical, LayoutTemplate, Thermometer, Leaf } from "lucide-react"; // FIX: Leaf ditambahkan ke import
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
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6">
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-6 flex items-center gap-2">
        <LayoutTemplate className="w-5 h-5 text-blue-500" />
        {lang === "id" ? "Spesifikasi & Perangkat" : "Specs & Equipments"}
      </h3>

      {/* Grid 1 Kolom di HP, 2 Kolom Tablet, 3 Kolom Desktop Lebar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
        
        {/* Gaya & Substrat */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" /> Aquascape Style
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {getAquascapeStyleDesc(aquarium.aquascape_style, lang)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Substrate System
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {getSubstrateDesc(aquarium.substrate_type, lang)}
            </p>
          </div>
        </div>

        {/* Sirkulasi & Pencahayaan */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5" /> Filtration
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {getFilterDesc(aquarium.filter_type, lang)}
              {aquarium.filter_flow_lph ? ` (${aquarium.filter_flow_lph} L/H)` : ""}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" /> Lighting
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {getLightDesc(aquarium.light_type, lang)}
              {aquarium.light_wattage ? ` - ${aquarium.light_wattage}W` : ""}
            </p>
            {aquarium.photoperiod_hours != null && (
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === "id" ? "Durasi:" : "Photoperiod:"} {aquarium.photoperiod_hours} {lang === "id" ? "jam/hari" : "hours/day"}
              </p>
            )}
          </div>
        </div>

        {/* Parameter Tambahan (CO2, Pupuk, Suhu) */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> CO2 Injection
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {getCO2Desc(aquarium.co2_type, lang)}
              {aquarium.co2_bps ? ` (${aquarium.co2_bps} BPS)` : ""}
            </p>
          </div>
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" /> Fertilizer
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {getFertilizerDesc(aquarium.fertilizer_type, lang)}
              </p>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5" /> Heater
              </p>
              <p className={`text-sm font-bold ${aquarium.heater_enabled ? "text-emerald-600" : "text-slate-500"}`}>
                {aquarium.heater_enabled ? "Active" : "None"}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}