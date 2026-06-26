// features/diseases/components/DiseaseDetailModal.tsx
"use client";

import { X, AlertTriangle, ShieldCheck, Clock, Heart, Zap } from "lucide-react";
import type { Disease } from "@/features/diseases/types/disease.types";

interface Props {
  disease: Disease;
  isOpen: boolean;
  onClose: () => void;
  lang?: "id" | "en";
}

export function DiseaseDetailModal({ disease, isOpen, onClose, lang = "id" }: Props) {
  if (!isOpen) return null;

  const diseaseName = lang === "id" ? disease.name_id : disease.name_en;
  
  // SEKARANG MEMBACA LANGSUNG DARI KOLOM RESMI SUPABASE
  const descriptionText = lang === "id" ? disease.description_id : disease.description_en;
  const symptomsText = lang === "id" ? disease.symptoms_id : disease.symptoms_en;
  const treatmentText = lang === "id" ? disease.treatments_id : disease.treatments_en;
  const preventionText = lang === "id" ? disease.prevention_id : disease.prevention_en;
  const expertNotes = lang === "id" ? disease.expert_notes_id : disease.expert_notes_en;

  const urgency = disease.urgency_level?.toLowerCase() ?? "low";
  const isEmergency = urgency === "critical" || urgency === "emergency" || urgency === "high";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${isEmergency ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"}`}>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{diseaseName}</h2>
              {disease.scientific_name && (
                <span className="text-sm font-medium italic text-slate-500">({disease.scientific_name})</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${isEmergency ? "bg-rose-500 text-white shadow-sm" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                {lang === "id" ? "Urgensi:" : "Urgency:"} {disease.urgency_level || "Medium"}
              </span>
              <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-500 font-medium border border-slate-200 dark:border-slate-700">
                {disease.disease_category || "Uncategorized"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* BODY MODAL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* EMERGENCY ACTIONS */}
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

          {/* GRID INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{lang === "id" ? "Karakter Penularan" : "Transmission Traits"}</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="text-slate-500">{lang === "id" ? "Menular:" : "Contagious:"}</span>
                    <span className={`font-bold ${disease.contagious ? "text-rose-600" : "text-emerald-600"}`}>{disease.contagious ? (lang === "id" ? "Ya (Tinggi)" : "Yes (High)") : (lang === "id" ? "Tidak" : "No")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="text-slate-500">{lang === "id" ? "Karantina Wajib:" : "Quarantine:"}</span>
                    <span className={`font-bold ${disease.quarantine_required ? "text-rose-600" : "text-emerald-600"}`}>{disease.quarantine_required ? (lang === "id" ? "Wajib Pindah" : "Mandatory") : (lang === "id" ? "Opsional" : "Optional")}</span>
                  </div>
                </div>
            </div>
            {disease.quarantine_required && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/10 text-xs font-medium">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <span>{lang === "id" ? "Pindahkan ikan terinfeksi ke wadah terisolasi secepatnya untuk mencegah penyebaran wabah." : "Move infected fish to an isolated tank immediately to prevent outbreak."}</span>
              </div>
            )}
          </div>

          {/* DESKRIPSI PATOLOGI (BARU DITAMBAHKAN) */}
          {descriptionText && (
            <div className="space-y-2">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{lang === "id" ? "Deskripsi Patologi" : "Pathology Description"}</h4>
              <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                {descriptionText}
              </p>
            </div>
          )}

          {/* GEJALA */}
          {symptomsText && (
            <div className="space-y-2">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{lang === "id" ? "Karakteristik Klinis Lengkap" : "Full Clinical Symptoms"}</h4>
              <div className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 whitespace-pre-line">
                {symptomsText}
              </div>
            </div>
          )}

          {/* PENGOBATAN */}
          <div className="p-4 sm:p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/20 space-y-4 shadow-inner">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">{lang === "id" ? "Panduan Pengobatan Klinis" : "Clinical Treatment Protocol"}</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-sm">
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
              <div className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-3 border-t border-blue-200/60 dark:border-blue-900/50 mt-3">
                {treatmentText}
              </div>
            )}
          </div>

          {/* PENCEGAHAN & CATATAN PAKAR */}
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
                  <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mt-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {lang === "id" ? "Catatan Khusus Pakar Akuatik" : "Aquatic Expert Notes"}
                  </h4>
                  <div className="text-xs sm:text-sm italic text-slate-500 dark:text-slate-400 border-l-4 border-amber-500 pl-4 py-1">
                    {expertNotes}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}