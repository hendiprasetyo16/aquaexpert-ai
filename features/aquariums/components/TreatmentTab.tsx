// features/aquariums/components/TreatmentTab.tsx
"use client";

import { useState } from "react";
import { HeartPulse, Plus, ShieldAlert, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider";
import StartTreatmentModal from "./StartTreatmentModal";

interface Props {
  aquariumId: string;
}

export default function TreatmentTab({ aquariumId }: Props) {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parsing kamus pengobatan yang aman
  const rootDict = (dict as unknown as Record<string, Record<string, string>>) || {};
  const txt = rootDict.treatment || {
    title: lang === 'id' ? "Rekam Medis & Karantina" : "Medical Records & Quarantine",
    subtitle: lang === 'id' ? "Pantau proses penyembuhan fauna, efikasi obat, dan cegah penularan patogen." : "Monitor fauna healing progress, medication efficacy, and prevent pathogen spread.",
    emptyTitle: lang === 'id' ? "Tidak Ada Fauna yang Sakit" : "No Sick Fauna",
    emptyDesc: lang === 'id' ? "Akuarium Anda bersih dari infeksi aktif. Seluruh rekam medis masa lalu akan tersimpan aman." : "Your aquarium is clean of active infections. All historical medical records will be stored safely.",
    btnAdd: lang === 'id' ? "Catat Pengobatan" : "Log Treatment"
  };

  const handleTreatmentStarted = () => {
    // Di sini kita bisa memicu fetch ulang data jika ada sesi aktif
    // (Akan kita tambahkan list pasien aktif di langkah berikutnya)
    window.location.reload(); 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER INTERNAL TAB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
            {txt.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {txt.subtitle}
          </p>
        </div>
        <Button 
          type="button" 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5 font-black" /> {txt.btnAdd}
        </Button>
      </div>

      {/* LAYAR STATUS KOSONG (Sementara sebelum kita list data aktifnya) */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 sm:p-16 flex flex-col items-center justify-center text-center transition-colors">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
          <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">
          {txt.emptyTitle}
        </h4>
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {txt.emptyDesc}
        </p>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-6 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/30">
          Mulai Sesi Pengobatan Baru
        </Button>
      </div>

      {/* MODAL */}
      <StartTreatmentModal 
        aquariumId={aquariumId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleTreatmentStarted}
        dict={txt}
        lang={lang}
      />

    </div>
  );
}