"use client";

import { X, AlertTriangle, ShieldAlert, Clock, Heart, ShieldCheck, Zap } from "lucide-react";
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
  const description = lang === "id" ? disease.description_id : disease.description_en;
  const symptomsText = lang === "id" ? disease.symptoms_id : disease.symptoms_en;
  const treatmentText = lang === "id" ? disease.treatments_id : disease.treatments_en;
  const preventionText = lang === "id" ? disease.prevention_id : disease.prevention_en;
  const expertNotes = lang === "id" ? disease.expert_notes_id : disease.expert_notes_en;

  const urgency = disease.urgency_level?.toLowerCase() ?? "low";
  const isEmergency = urgency === "critical" || urgency === "emergency" || urgency === "high";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop Luar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Kontainer Utama Modal dengan Pengaman Kebocoran Event */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up"
      >
  
        {/* HEADER: Triage & Urgency Level */}
        <div className={`p-6 border-b flex items-start justify-between gap-4 ${
          isEmergency 
            ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30" 
            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
        }`}>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {diseaseName}
              </h2>
              {disease.scientific_name && (
                <span className="text-sm italic text-slate-500 font-mono mt-0.5">
                  ({disease.scientific_name})
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                isEmergency 
                  ? "bg-rose-500 text-white shadow-xs" 
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}>
                {lang === "id" ? "Urgensi:" : "Urgency:"} {disease.urgency_level || "Medium"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                {disease.disease_category}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            aria-label={lang === "id" ? "Tutup panel detail" : "Close details panel"}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY PANEL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* TRIAGE IMMEDIATE ACTIONS */}
          {isEmergency && disease.emergency_actions && disease.emergency_actions.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 mb-3">
                <Zap className="w-5 h-5 fill-rose-500 animate-pulse" />
                <h4 className="text-sm font-black uppercase tracking-wider">
                  {lang === "id" ? "Tindakan Darurat (Triage)" : "Immediate Emergency Actions"}
                </h4>
              </div>
              <ul className="space-y-2">
                {disease.emergency_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-300 leading-relaxed font-medium">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PATHOLOGY OVERVIEW & QUARANTINE REQUIREMENT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === "id" ? "Deskripsi Patologi" : "Pathology Description"}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description || (lang === "id" ? "Tidak ada deskripsi tersedia." : "No description available.")}
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {lang === "id" ? "Karakter Penularan" : "Transmission Traits"}
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{lang === "id" ? "Menular:" : "Contagious:"}</span>
                    <span className={`font-bold ${disease.contagious ? "text-rose-600" : "text-emerald-600"}`}>
                      {disease.contagious ? (lang === "id" ? "Ya" : "Yes") : (lang === "id" ? "Tidak" : "No")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{lang === "id" ? "Karantina Wajib:" : "Quarantine:"}</span>
                    {/* FIX SINTAKS: Memperbaiki ketiadaan operator ':' pada ternary bersarang */}
                    <span className={`font-bold ${disease.quarantine_required ? "text-rose-600" : "text-emerald-600"}`}>
                      {disease.quarantine_required ? (lang === "id" ? "Wajib" : "Required") : (lang === "id" ? "Opsional" : "Optional")}
                    </span>
                  </div>
                </div>
              </div>
              
              {disease.quarantine_required && (
                <div className="flex items-center gap-1.5 p-2 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/10 text-[11px] font-medium leading-normal">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Pindahkan ikan terinfeksi ke wadah terisolasi secepatnya.</span>
                </div>
              )}
            </div>
          </div>

          {/* SYMPTOMS & CLINICAL SIGNS */}
          {symptomsText && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === "id" ? "Karakteristik Klinis Lengkap" : "Full Clinical Symptoms"}
              </h4>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 whitespace-pre-line">
                {symptomsText}
              </div>
            </div>
          )}

          {/* MEDICATION & CLINICAL TREATMENT CORE */}
          <div className="p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/5 space-y-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-sm font-black uppercase tracking-wider">
                {lang === "id" ? "Panduan Pengobatan Klinis" : "Clinical Treatment Protocol"}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{lang === "id" ? "Durasi Standar" : "Standard Duration"}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {disease.treatment_duration_days != null ? `${disease.treatment_duration_days} ${lang === 'id' ? 'Hari' : 'Days'}` : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{lang === "id" ? "Peluang Hidup" : "Survival Rate"}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {disease.recovery_probability != null ? `${disease.recovery_probability}%` : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {disease.medication_tags && disease.medication_tags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "id" ? "Rekomendasi Zat Aktif / Obat" : "Recommended Active Ingredients"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {disease.medication_tags.map((med, idx) => (
                    <span key={idx} className="text-xs font-bold px-2.5 py-1 rounded bg-blue-600 text-white dark:bg-blue-900/40 dark:text-blue-300 shadow-xs">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {treatmentText && (
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-2 border-t border-slate-200/60 dark:border-slate-800">
                {treatmentText}
              </div>
            )}
          </div>

          {/* PREVENTION & EXPERT NOTES */}
          {preventionText && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === "id" ? "Langkah Pencegahan" : "Prevention Protocol"}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {preventionText}
              </p>
            </div>
          )}

          {expertNotes && (
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {lang === "id" ? "Catatan Khusus Pakar Akuatik" : "Aquatic Expert Notes"}
              </h4>
              <div className="text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                {expertNotes}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}