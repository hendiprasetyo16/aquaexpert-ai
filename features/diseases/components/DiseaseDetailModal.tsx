// features/diseases/components/DiseaseDetailModal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { X, AlertTriangle, ShieldCheck, Clock, Heart, Zap, Bug, Info, ZoomIn, ZoomOut } from "lucide-react";
import type { Disease } from "@/features/diseases/types/disease.types";

interface Props {
  disease: Disease;
  isOpen: boolean;
  onClose: () => void;
  lang?: "id" | "en";
}

export function DiseaseDetailModal({ disease, isOpen, onClose, lang = "id" }: Props) {
  // STATE FOR LIGHTBOX (ZOOM)
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1); 
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickStartPos, setClickStartPos] = useState({ x: 0, y: 0 });
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);

  if (!isOpen) return null;

  const diseaseName = lang === "id" ? disease.name_id : disease.name_en;
  const descriptionText = lang === "id" ? disease.description_id : disease.description_en;
  const symptomsText = lang === "id" ? disease.symptoms_id : disease.symptoms_en;
  const treatmentText = lang === "id" ? disease.treatments_id : disease.treatments_en;
  const preventionText = lang === "id" ? disease.prevention_id : disease.prevention_en;
  const expertNotes = lang === "id" ? disease.expert_notes_id : disease.expert_notes_en;

  const urgency = disease.urgency_level?.toLowerCase() ?? "low";
  const isEmergency = urgency === "critical" || urgency === "emergency" || urgency === "high";

  const translateCategory = (cat: string | null | undefined) => {
    if (!cat) return lang === 'id' ? "Umum" : "General";
    if (lang === 'en') return cat;
    const map: Record<string, string> = {
      "Parasitic": "Parasit", "Bacterial": "Bakteri", "Fungal": "Jamur", 
      "Viral": "Virus", "Environmental": "Lingkungan", "Nutritional": "Nutrisi", 
      "Protozoan": "Protozoa", "Genetic": "Genetik"
    };
    return map[cat] || cat;
  };

  const translateUrgency = (urg: string | null | undefined) => {
    if (!urg) return "Medium";
    if (lang === 'en') return urg;
    const map: Record<string, string> = {
      "low": "Rendah", "medium": "Sedang", "high": "Tinggi", 
      "critical": "Kritis", "emergency": "Darurat"
    };
    return map[urg.toLowerCase()] || urg;
  };

  const handleCloseZoom = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsZoomed(false);
    setTimeout(() => {
      setZoomScale(1);
      setPosition({ x: 0, y: 0 });
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null); 
      setTouchStart(e.targetTouches[0].clientX); 
      setInitialPinchDistance(null);
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      setInitialPinchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomScale === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      const pinchRatio = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(1, zoomScale * pinchRatio), 5);
      setZoomScale(newScale); 
      setInitialPinchDistance(currentDistance);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) setInitialPinchDistance(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />

        {/* FIXED: Removed arbitrary hex colors, strictly using Tailwind slate-900 for dark mode */}
        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          
          <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${isEmergency ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"}`}>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{diseaseName}</h2>
                {disease.scientific_name && (
                  <span className="text-sm font-medium italic text-slate-500 dark:text-slate-400">({disease.scientific_name})</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${isEmergency ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"}`}>
                  {lang === "id" ? "Urgensi:" : "Urgency:"} {translateUrgency(disease.urgency_level)}
                </span>
                <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                  {translateCategory(disease.disease_category)}
                </span>
              </div>
            </div>
            {/* Close Button - Main Modal */}
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
              title={lang === "id" ? "Tutup" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
            
            {disease.image_url ? (
              <div 
                className="w-full h-48 sm:h-64 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm cursor-zoom-in group bg-slate-100 dark:bg-slate-950 flex justify-center"
                onClick={() => setIsZoomed(true)}
              >
                 <Image src={disease.image_url} alt={diseaseName} fill className="object-contain p-2 hover:scale-105 transition-transform duration-500" unoptimized />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-bold uppercase tracking-wider">{lang === 'id' ? "Klik Untuk Memperbesar" : "Click to Enlarge"}</span>
                 </div>
              </div>
            ) : (
              <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800/60">
                <Bug className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Tidak Ada Foto Tersedia" : "No Photo Available"}</p>
              </div>
            )}

            {isEmergency && disease.emergency_actions && disease.emergency_actions.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 mb-3">
                  <Zap className="w-5 h-5 fill-rose-500 animate-pulse" />
                  <h4 className="text-sm font-black uppercase tracking-wider">{lang === "id" ? "Tindakan Darurat (Triage)" : "Immediate Emergency Actions"}</h4>
                </div>
                <ul className="space-y-2">
                  {disease.emergency_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-300 font-medium">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">{idx + 1}</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                  <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{lang === "id" ? "Karakter Penularan" : "Transmission Traits"}</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{lang === "id" ? "Menular:" : "Contagious:"}</span>
                      <span className={`font-bold ${disease.contagious ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500"}`}>{disease.contagious ? (lang === "id" ? "Ya (Tinggi)" : "Yes (High)") : (lang === "id" ? "Tidak" : "No")}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{lang === "id" ? "Karantina Wajib:" : "Quarantine:"}</span>
                      <span className={`font-bold ${disease.quarantine_required ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500"}`}>{disease.quarantine_required ? (lang === "id" ? "Wajib Pindah" : "Mandatory") : (lang === "id" ? "Opsional" : "Optional")}</span>
                    </div>
                  </div>
              </div>

              {disease.quarantine_required ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/10 text-xs font-medium">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <span>{lang === "id" ? "Pindahkan ikan terinfeksi ke wadah terisolasi secepatnya untuk mencegah penyebaran wabah." : "Move infected fish to an isolated tank immediately to prevent outbreak."}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/10 text-xs font-medium">
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <span>{lang === "id" ? "Aman dirawat di tangki utama. Tidak memerlukan pemindahan karantina darurat." : "Safe to treat in the main display tank. No emergency isolation required."}</span>
                </div>
              )}
            </div>

            {descriptionText && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> {lang === "id" ? "Gambaran Umum Penyakit" : "Disease Overview"}
                </h4>
                <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/30 dark:bg-slate-950 p-4 rounded-xl border border-blue-100/50 dark:border-slate-800/60 whitespace-pre-line">
                  {descriptionText}
                </p>
              </div>
            )}

            {symptomsText && (
              <div className="space-y-2">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{lang === "id" ? "Karakteristik Klinis (Gejala)" : "Clinical Symptoms"}</h4>
                <div className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 whitespace-pre-line">
                  {symptomsText}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-5 rounded-xl border border-blue-100 dark:border-slate-800/60 bg-blue-50/30 dark:bg-slate-950 space-y-4 shadow-inner">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">{lang === "id" ? "Panduan Pengobatan Klinis" : "Clinical Treatment Protocol"}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">{lang === "id" ? "Durasi Standar" : "Standard Duration"}</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{disease.treatment_duration_days != null ? `${disease.treatment_duration_days} ${lang === 'id' ? 'Hari' : 'Days'}` : "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">{lang === "id" ? "Peluang Hidup" : "Survival Rate"}</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{disease.recovery_probability != null ? `${disease.recovery_probability}%` : "N/A"}</p>
                  </div>
                </div>
              </div>
              
              {treatmentText && (
                <div className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-3 border-t border-blue-200/60 dark:border-slate-800/60 mt-3">
                  {treatmentText}
                </div>
              )}
            </div>

            {(preventionText || expertNotes) && (
              <div className="space-y-4">
                {preventionText && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{lang === "id" ? "Langkah Pencegahan" : "Prevention Protocol"}</h4>
                    <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 whitespace-pre-line">
                      {preventionText}
                    </p>
                  </div>
                )}

                {expertNotes && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                    <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 flex items-center gap-1.5 mt-4">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {lang === "id" ? "Catatan Khusus Pakar Akuatik" : "Aquatic Expert Notes"}
                    </h4>
                    <div className="text-xs sm:text-sm italic text-amber-900 dark:text-amber-200/80 border-l-4 border-amber-500/50 pl-4 py-1">
                      {expertNotes}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* OVERLAY MODAL ZOOM GAMBAR FULLSCREEN (INTERAKTIF) */}
      {isZoomed && disease.image_url && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onWheel={(e) => {
            if (e.deltaY < 0) setZoomScale(s => Math.min(s + 0.25, 5));
            else setZoomScale(s => Math.max(s - 0.25, 1));
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* AREA GAMBAR YANG BISA DI-PAN & DRAG */}
          <div 
            className={`relative flex h-full w-full items-center justify-center ${zoomScale > 1 ? 'overflow-hidden' : ''}`}
            onClick={(e) => {
              if (hasDragged) return;
              if (e.target === e.currentTarget && zoomScale === 1) handleCloseZoom(e as any);
            }}
            onMouseDown={(e) => {
              if (zoomScale > 1) {
                e.preventDefault(); 
                setIsDragging(true); 
                setHasDragged(false);
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                setClickStartPos({ x: e.clientX, y: e.clientY });
              }
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              const moveDist = Math.hypot(e.clientX - clickStartPos.x, e.clientY - clickStartPos.y);
              if (moveDist > 5) setHasDragged(true); 
              setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }}
            onMouseUp={(e) => { e.stopPropagation(); setIsDragging(false); }}
            onMouseLeave={(e) => { if (isDragging) { e.stopPropagation(); setIsDragging(false); } }}
          >
            <img 
              src={disease.image_url} 
              alt="Detail Gambar" 
              draggable={false} 
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale})`, 
                transition: isDragging ? 'none' : 'transform 0.2s ease-out', 
                cursor: isDragging ? 'grabbing' : (zoomScale > 1 ? 'grab' : 'zoom-in') 
              }} 
              className="max-h-[85vh] w-auto max-w-[95vw] rounded-lg shadow-2xl object-contain border border-white/10" 
            />
            
            {zoomScale === 1 && (
              <p className="absolute bottom-28 md:bottom-10 text-white/80 text-sm font-medium tracking-wide animate-in fade-in duration-300 bg-black/60 px-6 py-2 rounded-full pointer-events-none hidden sm:block">
                {lang === 'en' ? "Scroll or pinch to zoom" : "Scroll atau cubit untuk perbesar"}
              </p>
            )}
          </div>

          {/* FIX: TOMBOL TUTUP ZOOM - Improved visibility and hover effect */}
          <button 
            type="button"
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-slate-800/50 hover:bg-red-600 text-white rounded-full transition-all z-[10000] cursor-pointer shadow-lg border border-white/20 hover:border-red-500"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseZoom();
            }}
            title={lang === "id" ? "Tutup" : "Close"}
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* PANEL KONTROL ZOOM */}
          <div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 px-6 py-3 rounded-full backdrop-blur-md border border-slate-700/50 z-[10000]" 
            onClick={(e) => e.stopPropagation()}
          >
             <button 
                onClick={() => setZoomScale(s => Math.max(s - 0.5, 1))} 
                className="text-white hover:text-blue-400 disabled:opacity-30 transition-colors p-1" 
                disabled={zoomScale <= 1}
             >
                <ZoomOut className="w-5 h-5" />
             </button>
             
             <span className="text-white text-xs font-black w-14 text-center">
                {Math.round(zoomScale * 100)}%
             </span>
             
             <button 
                onClick={() => setZoomScale(s => Math.min(s + 0.5, 5))} 
                className="text-white hover:text-blue-400 disabled:opacity-30 transition-colors p-1" 
                disabled={zoomScale >= 5}
             >
                <ZoomIn className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}
    </>
  );
}