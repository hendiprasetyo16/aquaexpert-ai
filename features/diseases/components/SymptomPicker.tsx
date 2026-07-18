// features/disease-expert/components/SymptomPicker.tsx
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Check, Activity, Search, AlertCircle, Info, Camera, ScanLine, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Symptom, BodyRegion } from "@/features/diseases/types/disease.types";
import { analyzeFishImageAction } from "@/features/diseases/actions/analyze-vision.actions"; 

interface Props {
  aquariumId: string;
  availableSymptoms: Symptom[];
  onSubmitDiagnosis: (aquariumId: string, selectedSymptomIds: string[]) => void;
  isLoading?: boolean;
  lang?: "id" | "en";
  initialSelectedIds?: string[];
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

export function SymptomPicker({ aquariumId, availableSymptoms, onSubmitDiagnosis, isLoading, lang = "id", initialSelectedIds = [] }: Props) {
  const [activeRegion, setActiveRegion] = useState<BodyRegion>("General");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSelectedIds.length > 0) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [initialSelectedIds]);

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

  const compressImageToBase64 = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Gagal memproses gambar")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(lang === 'id' ? "Ukuran foto maksimal 10MB." : "Max photo size is 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsScanning(true);
    const toastId = toast.loading(lang === 'id' ? "Mata AI sedang menganalisis foto..." : "AI Vision is scanning the photo...");

    try {
      const compressedBase64 = await compressImageToBase64(file);
      
      const mappedSymptoms = availableSymptoms.map(s => ({
         id: s.id,
         name_id: s.name_id,
         name_en: s.name_en
      }));

      const res = await analyzeFishImageAction(compressedBase64, mappedSymptoms);
      
      if (res.success && res.symptomIds) {
        if (res.symptomIds.length > 0) {
          setSelectedIds(prev => new Set([...prev, ...res.symptomIds!]));
          toast.success(
            lang === 'id' 
              ? `Pemindaian Selesai! AI mendeteksi ${res.symptomIds.length} gejala baru.` 
              : `Scan Complete! AI detected ${res.symptomIds.length} new symptoms.`,
            { id: toastId, duration: 4000 }
          );
        } else {
          toast.success(
            lang === 'id'
              ? "Bagus! AI tidak menemukan tanda-tanda penyakit fisik yang terlihat di foto."
              : "Great! AI found no visible physical symptoms in the photo.",
            { id: toastId, icon: "✨" }
          );
        }
      } else {
        throw new Error(res.error || "Gagal menganalisis.");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal memindai gambar.", { id: toastId });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const quality = calculateQualityMetrics(selectedIds.size, lang);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-teal-400 z-10"></div>
      
      {/* 💡 GANTI KOTAK KECIL DI SymptomPicker.tsx DENGAN INI */}
      {isScanning && (
        <div className="fixed inset-0 z-[9999] bg-white/40 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center overflow-hidden transition-all duration-300">
          
          {/* Efek Garis Scanner Biru Lembut */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.15)_50%,transparent_100%)] h-64 animate-[pulse_2s_ease-in-out_infinite]"></div>
          
          {/* Kotak Dialog Pop-up Besar & Elegan */}
          <div className="bg-white dark:bg-slate-900 px-8 py-6 rounded-2xl shadow-[0_15px_50px_rgba(59,130,246,0.25)] flex items-center gap-5 border-2 border-blue-500 relative z-10 animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-blue-50 dark:bg-blue-900/60 p-3.5 rounded-full shadow-inner">
              <ScanLine className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-base md:text-lg">
                {lang === 'id' ? "Memindai Ikan..." : "Scanning Fish..."}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mt-1">
                {lang === 'id' ? "Gemini 2.5 Vision sedang bekerja" : "Gemini 2.5 Vision is working"}
              </p>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        onChange={handleImageCapture}
        className="hidden"
      />

      <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 md:p-5 transition-colors flex flex-col">
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          {lang === 'id' ? "2. Pilih Area Terdampak" : "2. Select Body Region"}
        </h3>
        <ul className="space-y-1.5 flex-1">
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

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={isScanning}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
           >
             {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
             {lang === 'id' ? "Auto-Scan via Kamera" : "Auto-Scan via Camera"}
           </button>
           <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
             {lang === 'id' ? "*AI mendeteksi gejala otomatis dari foto" : "*AI auto-detects symptoms from photo"}
           </p>
        </div>
      </div>

      <div className="w-full md:w-2/3 p-5 md:p-6 flex flex-col h-[600px] md:h-[550px] bg-white dark:bg-slate-900 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
            {lang === 'id' ? REGION_TABS.find(t => t.id === activeRegion)?.labelId : REGION_TABS.find(t => t.id === activeRegion)?.labelEn}
          </h2>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full tracking-widest border border-slate-200 dark:border-slate-700">
              {selectedIds.size} {lang === 'id' ? "TERPILIH" : "SELECTED"}
            </span>
          </div>
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
            {/* 💡 FITUR BARU: EDUKASI DINAMIS (JALAN TENGAH) */}
            <div className="w-full sm:w-auto">
              {selectedIds.size === 0 ? (
                <span className="text-xs text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'id' ? "Pilih minimal 1 gejala" : "Select at least 1 symptom"}
                </span>
              ) : selectedIds.size === 1 ? (
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 justify-center sm:justify-start max-w-[260px] leading-tight">
                  <Info className="w-4 h-4 shrink-0" />
                  {lang === 'id' ? "Tips: Pilih 2-3 gejala atau gunakan kamera untuk hasil lebih presisi." : "Tip: Select 2-3 symptoms or use camera for better precision."}
                </span>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                  <Check className="w-4 h-4" />
                  {lang === 'id' ? "Bukti klinis optimal." : "Optimal clinical evidence."}
                </span>
              )}
            </div>

            <button
              disabled={selectedIds.size === 0 || isLoading || isScanning}
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