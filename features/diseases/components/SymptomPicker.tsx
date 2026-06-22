"use client";

import { useState, useMemo } from "react";
import { Check, Activity, Search, AlertCircle, Info } from "lucide-react";
import type { Symptom, BodyRegion } from "@/features/diseases/types/disease.types";

interface Props {
  aquariumId: string;
  availableSymptoms: Symptom[];
  onSubmitDiagnosis: (aquariumId: string, selectedSymptomIds: string[]) => void;
  isLoading?: boolean;
}

const REGION_TABS: { id: BodyRegion; labelId: string; labelEn: string }[] = [
  { id: "General", labelId: "Perilaku", labelEn: "General / Behavior" },
  { id: "Skin/Scales", labelId: "Kulit & Sisik", labelEn: "Skin / Scales" },
  { id: "Fins", labelId: "Sirip", labelEn: "Fins" },
  { id: "Gills", labelId: "Insang", labelEn: "Gills" },
  { id: "Eyes", labelId: "Mata", labelEn: "Eyes" },
  { id: "Belly", labelId: "Perut", labelEn: "Belly" },
  { id: "Mouth", labelId: "Mulut", labelEn: "Mouth" },
];

export function SymptomPicker({ aquariumId, availableSymptoms, onSubmitDiagnosis, isLoading }: Props) {
  const [activeRegion, setActiveRegion] = useState<BodyRegion>("General");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// OPTIMASI: Indexing O(1) untuk menopang database gejala berskala masif di masa depan
  const symptomsByRegion = useMemo(() => {
    const map = new Map<BodyRegion, Symptom[]>();
    
    // Inisialisasi keranjang array kosong untuk tiap tab region
    REGION_TABS.forEach(region => map.set(region.id, []));
    
    // Distribusi gejala ke dalam keranjang region masing-masing
    availableSymptoms.forEach(symptom => {
      map.get(symptom.body_region)?.push(symptom);
    });
    
    return map;
  }, [availableSymptoms]);

  const displayedSymptoms = symptomsByRegion.get(activeRegion) ?? [];

// OPTIMASI FINAL: Agregasi dengan Strict Typing
  const selectedCountsByRegion = useMemo(() => {
    const counts: Partial<Record<BodyRegion, number>> = {};
    
    availableSymptoms.forEach(s => {
      if (selectedIds.has(s.id)) {
        counts[s.body_region] = (counts[s.body_region] || 0) + 1;
      }
    });
    
    return counts;
  }, [availableSymptoms, selectedIds]);

const toggleSymptom = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    return next;
  });
};

  const handleProcess = () => {
    if (selectedIds.size > 0) {
      onSubmitDiagnosis(aquariumId, Array.from(selectedIds));
    }
  };

  // MICRO-OPTIMIZATION: Memastikan metrik akurasi hanya dihitung saat pilihan gejala berubah
// OPTIMASI: Memanfaatkan tipe primitif .size sebagai dependency agar lebih presisi
  const quality = useMemo(() => {
    const count = selectedIds.size;
    if (count === 0) {
      return { percent: 0, label: "Menunggu Input", color: "bg-slate-200", text: "text-slate-500" };
    }
    
    const percent = Math.min(100, Math.round((count / 7) * 100));
    
    if (percent <= 35) {
      return { percent, label: "Akurasi Rendah", color: "bg-amber-500", text: "text-amber-600" };
    }
    if (percent <= 75) {
      return { percent, label: "Akurasi Baik", color: "bg-blue-500", text: "text-blue-600" };
    }
    return { percent, label: "Sangat Optimal", color: "bg-emerald-500", text: "text-emerald-600" };
  }, [selectedIds.size]); // FIX: Menggunakan .size murni

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
      
      {/* KIRI: Navigasi Anatomis */}
      <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Pilih Area Terdampak
        </h3>
        <ul className="space-y-1">
          {REGION_TABS.map((tab) => {
            const regionCount = selectedCountsByRegion[tab.id] || 0;
            
            return (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveRegion(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    activeRegion === tab.id 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium" 
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{tab.labelId}</span>
                  {regionCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
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
      <div className="w-full md:w-2/3 p-6 flex flex-col h-[550px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Gejala: {REGION_TABS.find(t => t.id === activeRegion)?.labelId}
          </h2>
          <span className="text-sm text-slate-500">
            {selectedIds.size} Gejala Terpilih
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {displayedSymptoms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Search className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">Tidak ada daftar gejala untuk area ini.</p>
            </div>
          ) : (
            displayedSymptoms.map((sym) => {
              const isSelected = selectedIds.has(sym.id);
              return (
                <div 
                  key={sym.id}
                  onClick={() => toggleSymptom(sym.id)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-sm ring-1 ring-blue-500" 
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded border ${
                    isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold mb-1 ${isSelected ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>
                      {sym.name_id}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {sym.description_id}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DIAGNOSIS QUALITY METER & ACTION PANEL */}
        <div className="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${quality.text}`} />
              <span className={`text-xs font-semibold ${quality.text}`}>
                Potensi Akurasi: {quality.label} ({quality.percent}%)
              </span>
            </div>
            <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${quality.color} transition-all duration-500`} 
                style={{ width: `${quality.percent}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-4">
            {selectedIds.size === 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Pilih minimal 1 gejala
              </span>
            )}
            <button
              disabled={selectedIds.size === 0 || isLoading}
              onClick={handleProcess}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                selectedIds.size === 0 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> Memproses...
                </span>
              ) : (
                "Analisis Patologi"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}