// features/aquariums/components/TreatmentTab.tsx
"use client";

import { useState, useEffect } from "react";
import { HeartPulse, Plus, ShieldAlert, Activity, Fish, AlertCircle, Syringe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider";
import StartTreatmentModal from "./StartTreatmentModal";
import DailyLogModal from "@/features/diseases/components/DailyLogModal";
import toast from "react-hot-toast";

// FIX JALUR IMPORT: Ambil dari file yang baru saja digabungkan
import { getActiveTreatmentsAction, ActiveTreatmentDto } from "@/features/diseases/actions/start-treatment.actions";

interface Props {
  aquariumId: string;
}

export default function TreatmentTab({ aquariumId }: Props) {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveTreatmentDto | null>(null);
  const [treatments, setTreatments] = useState<ActiveTreatmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const rootDict = (dict as Record<string, unknown>) || {};
  const tDictData = (rootDict.treatment as Record<string, string>) || {};
  
  const txt = {
    title: tDictData.title || (lang === 'id' ? "Rekam Medis & Karantina" : "Medical Records & Quarantine"),
    subtitle: tDictData.subtitle || (lang === 'id' ? "Pantau proses penyembuhan fauna dan catat pengobatan harian." : "Monitor fauna healing progress and log daily treatment."),
    emptyTitle: tDictData.emptyTitle || (lang === 'id' ? "Tidak Ada Fauna yang Sakit" : "No Sick Fauna"),
    emptyDesc: tDictData.emptyDesc || (lang === 'id' ? "Akuarium Anda bersih dari infeksi aktif." : "Your aquarium is clean of active infections."),
    btnAdd: tDictData.btnAdd || (lang === 'id' ? "Catat Pengobatan Baru" : "Log New Treatment")
  };

  const fetchTreatments = async () => {
    setIsLoading(true);
    const res = await getActiveTreatmentsAction(aquariumId);
    if (res.success) {
      setTreatments(res.data);
    } else {
      toast.error(res.error || "Gagal memuat data pasien.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTreatments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aquariumId]);

  const handleTreatmentStarted = () => {
    fetchTreatments(); 
  };

  const calculateDayNumber = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
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
          onClick={() => setIsStartModalOpen(true)}
          className="w-full sm:w-auto h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5 font-black" /> {txt.btnAdd}
        </Button>
      </div>

      {isLoading ? (
        <div className="w-full h-64 flex flex-col items-center justify-center text-rose-500">
           <Loader2 className="w-8 h-8 animate-spin mb-3" />
           <p className="text-sm font-bold animate-pulse">{lang === 'id' ? "Memuat pasien..." : "Loading patients..."}</p>
        </div>
      ) : treatments.length === 0 ? (
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
          <Button onClick={() => setIsStartModalOpen(true)} variant="outline" className="mt-6 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/30">
            {lang === 'id' ? "Mulai Sesi Pengobatan Baru" : "Start New Treatment Session"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {treatments.map((session) => {
            const dayNum = calculateDayNumber(session.started_at);
            const diseaseName = lang === 'id' ? session.disease?.name_id : session.disease?.name_en;

            return (
              <div key={session.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-start">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800/50 mb-3">
                      <AlertCircle className="w-3.5 h-3.5" /> {lang === 'id' ? "HARI KE-" : "DAY"} {dayNum}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{diseaseName}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <Fish className="w-3.5 h-3.5" /> {session.aquarium?.name}
                    </p>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{lang === 'id' ? 'Pengobatan' : 'Medication'}</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Syringe className="w-4 h-4" /> {session.medication?.name}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-500">Recovery</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{session.current_recovery_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${session.current_recovery_rate}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Button 
                    onClick={() => setSelectedSession(session)}
                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs transition-colors"
                  >
                    <Activity className="w-4 h-4 mr-2" /> {lang === 'id' ? "Catat Medis Hari Ini" : "Log Today's Medical"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StartTreatmentModal 
        aquariumId={aquariumId} 
        isOpen={isStartModalOpen} 
        onClose={() => setIsStartModalOpen(false)} 
        onSuccess={handleTreatmentStarted}
        dict={tDictData}
        lang={lang}
      />

      {selectedSession && (
        <DailyLogModal 
          session={selectedSession} 
          isOpen={selectedSession !== null} 
          onClose={() => setSelectedSession(null)} 
          onSuccess={handleTreatmentStarted}
          tDict={tDictData}
          lang={lang}
        />
      )}

    </div>
  );
}