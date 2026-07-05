// app/(dashboard)/dashboard/treatments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Activity, Fish, AlertCircle, HeartPulse, Loader2, Syringe, CheckCircle2, XCircle, History, CalendarDays, Clock, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveTreatmentsAction, ActiveTreatmentDto } from "@/features/diseases/actions/start-treatment.actions"; 
import { deleteTreatmentSessionAction } from "@/features/diseases/actions/log-treatment.actions";
import toast from "react-hot-toast";

import DailyLogModal from "@/features/diseases/components/DailyLogModal"; 

export default function TreatmentWardPage() {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const rootDict = (dict as Record<string, unknown>) || {};
  const tDict = (rootDict.disease as Record<string, any>)?.treatmentDashboard || rootDict.treatmentDashboard || {};

  const [activePatients, setActivePatients] = useState<ActiveTreatmentDto[]>([]);
  const [historyPatients, setHistoryPatients] = useState<ActiveTreatmentDto[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ActiveTreatmentDto | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'active' | 'history', aquariumId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTreatments = async () => {
    setIsLoading(true);
    const res = await getActiveTreatmentsAction();
    if (res.success) {
      const allData = res.data || [];
      setActivePatients(allData.filter(d => d.status === "Active"));
      setHistoryPatients(allData.filter(d => d.status !== "Active"));
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal memuat data pasien." : "Failed to load patient data."));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTreatments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 💡 FIX 1: PENYAMAAAN LOGIKA WAKTU (00:00) SEPERTI DI BACKEND
  const calculateDayNumber = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = Math.abs(todayMidnight.getTime() - startMidnight.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateDuration = (startStr: string, endStr: string | null) => {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 1 : diff; 
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await deleteTreatmentSessionAction(deleteTarget.id, deleteTarget.aquariumId);
    if (res.success) {
      toast.success(lang === 'id' ? "Data berhasil dihapus." : "Data successfully deleted.");
      fetchTreatments();
    } else {
      toast.error(lang === 'id' ? "Gagal menghapus data." : "Failed to delete data.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* CUSTOM DELETE MODAL */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8"/></div>
              <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase">{deleteTarget.type === 'history' ? "Hapus Riwayat?" : "Batalkan Sesi?"}</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                {deleteTarget.type === 'history' 
                  ? (lang === 'id' ? "Menghapus riwayat masa lalu ini akan MENGURANGI persentase keberhasilan obat di Papan Analisis AI semua pengguna secara permanen." : "Deleting this will permanently REDUCE the drug success rate in the AI Analytics Board.")
                  : (lang === 'id' ? "Gunakan ini hanya jika Anda SALAH INPUT pasien. Semua rekam medis hari ini akan ikut terhapus." : "Use this only if you made a MISTAKE. All logs today will be deleted.")}
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl" 
                  disabled={isDeleting} 
                  onClick={executeDelete}
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : (lang === 'id' ? "YA, HAPUS PERMANEN" : "YES, DELETE PERMANENTLY")}
                </Button>
                <Button 
                  onClick={() => setDeleteTarget(null)} 
                  variant="ghost" 
                  disabled={isDeleting} 
                  className="w-full h-12 font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  {lang === 'id' ? "Batal" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-rose-600 dark:text-rose-500 flex items-center gap-3">
                <HeartPulse className="h-8 w-8 md:h-10 md:w-10"/> 
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

        {/* 💡 BAGIAN 1: PASIEN AKTIF */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4"/>
            <p className="font-bold animate-pulse">{lang === 'id' ? "Memuat data pasien..." : "Loading patient data..."}</p>
          </div>
        ) : activePatients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <Fish className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4"/>
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-2">{lang === 'id' ? "Tidak Ada Pasien" : "No Patients"}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'id' ? "Saat ini tidak ada fauna yang sedang dalam masa pengobatan." : "There are currently no fauna undergoing treatment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activePatients.map((session) => {
              const dayNum = calculateDayNumber(session.started_at);
              const diseaseName = lang === 'id' ? session.disease?.name_id : session.disease?.name_en;
              const hasLoggedToday = session.latest_log?.day_number === dayNum;

              return (
                <div key={session.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                  
                  <button 
                    onClick={() => setDeleteTarget({id: session.id, type: 'active', aquariumId: session.aquarium_id})} 
                    className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm md:shadow-none"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>

                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-start">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border mb-3 bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5"/>
                        {lang === 'id' ? `Hari Ke- ${dayNum}` : `Day ${dayNum}`}
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight pr-8">{diseaseName}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <Fish className="w-3.5 h-3.5"/> {session.aquarium?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{lang === 'id' ? "PENGOBATAN" : "MEDICATION"}</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Syringe className="w-4 h-4"/> {lang === 'id' ? session.medication?.name_id : session.medication?.name_en}
                      </p>
                    </div>

                    {hasLoggedToday && session.latest_log && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3"/> {lang === 'id' ? "SUDAH DIUPDATE HARI INI" : "UPDATED TODAY"}</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {session.latest_log.action_taken === "Observed" ? (lang === 'id' ? "Hanya Observasi" : "Observed") 
                           : session.latest_log.action_taken === "Redosed" ? (lang === 'id' ? "Dosis Ulang" : "Redosed") 
                           : session.latest_log.action_taken === "Water Change" ? (lang === 'id' ? "Ganti Air" : "Water Change") : session.latest_log.action_taken}
                          
                          {/* 🔥 LOGIC REVERSE TERBARU ADA DI SINI 🔥 */}
                          <span className="font-normal italic text-slate-500 block mt-1 max-h-20 overflow-y-auto custom-scrollbar whitespace-pre-wrap space-y-1">
                            {session.latest_log.notes 
                              ? session.latest_log.notes
                                  .split('\n')
                                  .filter(line => line.trim() !== '')
                                  .reverse()
                                  .join('\n')
                              : ''}
                          </span>
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-500">Recovery</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{session.current_recovery_rate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${session.current_recovery_rate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Button 
                      onClick={() => setSelectedSession(session)}
                      className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs transition-colors shadow-md"
                    >
                      <Activity className="w-4 h-4 mr-2"/> 
                      {hasLoggedToday ? (lang === 'id' ? "Edit Data Hari Ini" : "Edit Today's Data") : (lang === 'id' ? "Catat Medis Hari Ini" : "Log Today's Medical")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 💡 BAGIAN 2: RIWAYAT PENGOBATAN (HISTORY) */}
        {!isLoading && historyPatients.length > 0 && (
          <div className="pt-10 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-6">
              <History className="w-5 h-5"/> {lang === 'id' ? "Riwayat Pengobatan Terdahulu" : "Past Treatment History"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {historyPatients.map((hist) => {
                 const isSuccess = hist.status === "Completed";
                 const isFailed = hist.status === "Failed";
                 
                 const statusColors = isSuccess 
                   ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" 
                   : isFailed 
                     ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" 
                     : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";

                 return (
                   <div key={hist.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex flex-col relative overflow-hidden transition-colors group ${
                     isSuccess ? 'border-emerald-200 dark:border-emerald-900/50' : isFailed ? 'border-red-200 dark:border-red-900/50' : 'border-amber-200 dark:border-amber-900/50'
                   }`}>
                      
                      <button 
                        onClick={() => setDeleteTarget({id: hist.id, type: 'history', aquariumId: hist.aquarium_id})} 
                        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-900/80 rounded-full shadow-sm z-10"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>

                      <div>
                        <div className="flex justify-between items-start mb-3 pr-8">
                          <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                            {lang === 'id' ? (hist.disease?.name_id || hist.disease?.name_en) : hist.disease?.name_en}
                          </h5>
                          {isSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> : isFailed ? <XCircle className="w-5 h-5 text-red-500 shrink-0"/> : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0"/>}
                        </div>
                        <div className="space-y-1.5 mb-4">
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <Syringe className="w-3.5 h-3.5 text-blue-500"/> 
                            {lang === 'id' ? (hist.medication?.name_id || hist.medication?.name_en) : hist.medication?.name_en}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-2">
                            <Fish className="w-3 h-3 text-slate-400"/> {hist.aquarium?.name}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-2">
                            <CalendarDays className="w-3 h-3 text-slate-400"/> {formatDate(hist.started_at)} - {hist.completed_at ? formatDate(hist.completed_at) : '?'}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-400"/> {lang === 'id' ? "Durasi:" : "Duration:"} {calculateDuration(hist.started_at, hist.completed_at)} {lang === 'id' ? "Hari" : "Days"}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${statusColors}`}>
                          {isSuccess 
                            ? (lang === 'id' ? "BERHASIL SEMBUH" : "SUCCESSFULLY CURED") 
                            : isFailed 
                              ? (lang === 'id' ? "GAGAL (MATI)" : "FATAL (DIED)") 
                              : (lang === 'id' ? "DIBATALKAN" : "ABORTED")}
                        </span>
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500">{hist.current_recovery_rate}% Recovery</span>
                      </div>
                   </div>
                 )
               })}
            </div>
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