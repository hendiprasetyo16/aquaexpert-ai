// app/(dashboard)/dashboard/treatments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Activity, Fish, AlertCircle, HeartPulse, Loader2, Syringe, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveTreatmentsAction, ActiveTreatmentDto } from "@/features/diseases/actions/start-treatment.actions"; 
import toast from "react-hot-toast";

import DailyLogModal from "@/features/diseases/components/DailyLogModal"; 

export default function TreatmentWardPage() {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const rootDict = (dict as Record<string, unknown>) || {};
  const tDict = (rootDict.disease as Record<string, any>)?.treatmentDashboard || rootDict.treatmentDashboard || {};

  const [treatments, setTreatments] = useState<ActiveTreatmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ActiveTreatmentDto | null>(null);

  const fetchTreatments = async () => {
    setIsLoading(true);
    const res = await getActiveTreatmentsAction();
    if (res.success) {
      setTreatments(res.data || []);
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal memuat data pasien." : "Failed to load patient data."));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTreatments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateDayNumber = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* HEADER DENGAN DUKUNGAN BILINGUAL PENUH */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-rose-600 dark:text-rose-500 flex items-center gap-3">
                <HeartPulse className="h-8 w-8 md:h-10 md:w-10" /> 
                {lang === 'id' ? "Ruang Rawat Inap Global" : "Global Treatment Ward"}
              </h1>
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base font-medium">
                {lang === 'id' 
                  ? "Pantau dan catat progres harian seluruh pasien fauna Anda di semua akuarium secara terpusat." 
                  : "Centrally monitor and log the daily progress of all your fauna patients across all aquariums."}
              </p>
            </div>
          </div>
        </div>

        {/* LOADING & EMPTY STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
            <p className="font-bold animate-pulse">{lang === 'id' ? "Memuat data pasien..." : "Loading patient data..."}</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <Fish className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-2">{lang === 'id' ? "Tidak Ada Pasien" : "No Patients"}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'id' ? "Saat ini tidak ada fauna yang sedang dalam masa pengobatan." : "There are currently no fauna undergoing treatment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {treatments.map((session) => {
              const dayNum = calculateDayNumber(session.started_at);
              const diseaseName = lang === 'id' ? session.disease?.name_id : session.disease?.name_en;
              const hasLoggedToday = session.latest_log?.day_number === dayNum;
              
              // 💡 CEK STATUS: Matikan form jika sudah Selesai atau Gagal
              const isCompleted = session.status === "Completed";
              const isFailed = session.status === "Failed";
              const isDone = isCompleted || isFailed;

              return (
                <div key={session.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${isDone ? 'opacity-70 grayscale-[30%]' : ''}`}>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-start">
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border mb-3 ${
                        isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : isFailed ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isFailed ? <XCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {isDone ? session.status : (lang === 'id' ? `Hari Ke- ${dayNum}` : `Day ${dayNum}`)}
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{diseaseName}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <Fish className="w-3.5 h-3.5" /> {session.aquarium?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{lang === 'id' ? "PENGOBATAN" : "MEDICATION"}</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Syringe className="w-4 h-4" /> {lang === 'id' ? session.medication?.name_id : session.medication?.name_en}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-500">Recovery</span>
                        <span className={`text-lg font-black ${isFailed ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{session.current_recovery_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-2.5 rounded-full ${isFailed ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${session.current_recovery_rate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {/* 💡 TOMBOL DISABLED JIKA SUDAH SELESAI/GAGAL */}
                    {isDone ? (
                      <Button disabled className="w-full h-12 rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-black uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                        {isCompleted ? <><CheckCircle2 className="w-4 h-4 mr-2" /> {lang === 'id' ? "Selesai" : "Completed"}</> : <><XCircle className="w-4 h-4 mr-2" /> {lang === 'id' ? "Gagal" : "Failed"}</>}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setSelectedSession(session)}
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs transition-colors shadow-md"
                      >
                        <Activity className="w-4 h-4 mr-2" /> 
                        {hasLoggedToday ? (lang === 'id' ? "Edit Data Hari Ini" : "Edit Today's Data") : (lang === 'id' ? "Catat Medis Hari Ini" : "Log Today's Medical")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {selectedSession && (
        <DailyLogModal 
          session={selectedSession} 
          isOpen={selectedSession !== null} 
          onClose={() => setSelectedSession(null)} 
          onSuccess={fetchTreatments}
          tDict={tDict}
          lang={lang}
          hasLoggedToday={selectedSession.latest_log?.day_number === calculateDayNumber(selectedSession.started_at)}
        />
      )}
    </div>
  );
}