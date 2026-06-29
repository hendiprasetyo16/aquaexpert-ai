// features/diseases/components/SymptomPicker.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { Check, Activity, Search, AlertCircle, Info } from "lucide-react";
import type { Symptom, BodyRegion } from "@/features/diseases/types/disease.types";

interface Props {
  aquariumId: string;
  availableSymptoms: Symptom[];
  onSubmitDiagnosis: (aquariumId: string, selectedSymptomIds: string[]) => void;
  isLoading?: boolean;
  lang?: "id" | "en";
}

const REGION_TABS: { id: BodyRegion; labelId: string; labelEn: string }[] = [
  { id: "General", labelId: "Perilaku Umum", labelEn: "General / Behavior" },
  { id: "Skin/Scales", labelId: "Kulit & Sisik", labelEn: "Skin / Scales" },
  { id: "Fins", labelId: "Sirip", labelEn: "Fins" },
  { id: "Gills", labelId: "Insang", labelEn: "Gills" },
  { id: "Eyes", labelId: "Mata", labelEn: "Eyes" },
  { id: "Belly", labelId: "Perut", labelEn: "Belly" },
  { id: "Mouth", labelId: "Mulut", labelEn: "Mouth" },
];

function calculateQualityMetrics(count: number, lang: "id"|"en") {
  if (count === 0) {
    return { percent: 0, label: lang === 'id' ? "Menunggu Input" : "Awaiting Input", color: "bg-slate-200 dark:bg-slate-700", text: "text-slate-500" };
  }
  const percent = Math.min(100, Math.round((count / 6) * 100));
  
  if (percent <= 35) {
    return { percent, label: lang === 'id' ? "Akurasi Rendah" : "Low Accuracy", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-500" };
  }
  if (percent <= 75) {
    return { percent, label: lang === 'id' ? "Akurasi Baik" : "Good Accuracy", color: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]", text: "text-blue-600 dark:text-blue-400" };
  }
  return { percent, label: lang === 'id' ? "Sangat Optimal" : "Optimal", color: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]", text: "text-emerald-600 dark:text-emerald-400" };
}

export function SymptomPicker({ aquariumId, availableSymptoms, onSubmitDiagnosis, isLoading, lang = "id" }: Props) {
  const [activeRegion, setActiveRegion] = useState<BodyRegion>("General");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Memastikan sinkronisasi data yang kebal uppercase/lowercase
  const displayedSymptoms = useMemo(() => {
    return availableSymptoms.filter(s => 
      s.body_region?.toLowerCase().trim() === activeRegion.toLowerCase().trim()
    );
  }, [availableSymptoms, activeRegion]);

  const selectedCountsByRegion = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    availableSymptoms.forEach(s => {
      if (selectedIds.has(s.id) && s.body_region) {
        const regionKey = s.body_region.toLowerCase().trim();
        counts[regionKey] = (counts[regionKey] || 0) + 1;
      }
    });
    return counts;
  }, [availableSymptoms, selectedIds]);

  const toggleSymptom = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleProcess = useCallback(() => {
    if (selectedIds.size > 0) {
      onSubmitDiagnosis(aquariumId, Array.from(selectedIds));
    }
  }, [selectedIds, onSubmitDiagnosis, aquariumId]);

  const quality = calculateQualityMetrics(selectedIds.size, lang);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-teal-400"></div>

      {/* KIRI: Navigasi Anatomis */}
      <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 md:p-5 transition-colors">
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          {lang === 'id' ? "2. Pilih Area Terdampak" : "2. Select Body Region"}
        </h3>
        <ul className="space-y-1.5">
          {REGION_TABS.map((tab) => {
            const regionCount = selectedCountsByRegion[tab.id.toLowerCase()] || 0;
            const isActive = activeRegion === tab.id;
            
            return (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveRegion(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] font-bold" 
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 font-medium"
                  }`}
                >
                  <span>{lang === 'id' ? tab.labelId : tab.labelEn}</span>
                  {regionCount > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-black ${isActive ? "bg-white text-blue-700" : "bg-blue-500 text-white"}`}>
                      {regionCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* KANAN: Daftar Gejala Interaktif */}
      <div className="w-full md:w-2/3 p-5 md:p-6 flex flex-col h-[550px] bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {lang === 'id' ? REGION_TABS.find(t => t.id === activeRegion)?.labelId : REGION_TABS.find(t => t.id === activeRegion)?.labelEn}
          </h2>
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
            {selectedIds.size} {lang === 'id' ? "Gejala Terpilih" : "Selected"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {displayedSymptoms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-bold">{lang === 'id' ? "Tidak ada daftar gejala untuk area ini." : "No symptoms for this region."}</p>
            </div>
          ) : (
            displayedSymptoms.map((sym) => {
              const isSelected = selectedIds.has(sym.id);
              return (
                <div 
                  key={sym.id}
                  onClick={() => toggleSymptom(sym.id)}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 group ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                  }`}
                >
                  <div className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors shrink-0 ${
                    isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-blue-400"
                  }`}>
                    {isSelected && <Check className="w-4 h-4 font-black" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-black mb-1 leading-snug ${isSelected ? "text-blue-900 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}>
                      {lang === 'id' ? sym.name_id : sym.name_en}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {lang === 'id' ? sym.description_id : sym.description_en}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DIAGNOSIS QUALITY METER */}
        <div className="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${quality.text}`} />
              <span className={`text-xs font-bold ${quality.text}`}>
                {lang === 'id' ? "Potensi Akurasi:" : "Accuracy Potential:"} {quality.label} ({quality.percent}%)
              </span>
            </div>
            <div className="w-24 md:w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full ${quality.color} transition-all duration-700 ease-out`} 
                style={{ width: `${quality.percent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto">
              {selectedIds.size === 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'id' ? "Pilih minimal 1 gejala" : "Select at least 1 symptom"}
                </span>
              )}
            </div>
            <button
              disabled={selectedIds.size === 0 || isLoading}
              onClick={handleProcess}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${
                selectedIds.size === 0 
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] active:scale-95"
              }`}
            >
              {isLoading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" /> {lang === 'id' ? "MEMPROSES..." : "PROCESSING..."}
                </>
              ) : (
                lang === 'id' ? "ANALISIS PATOLOGI" : "RUN DIAGNOSIS"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}