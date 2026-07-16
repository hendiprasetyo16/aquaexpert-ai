// features/aquariums/components/TreatmentTab.tsx
"use client";

import { useState, useEffect } from "react";
import { HeartPulse, Plus, ShieldAlert, Activity, AlertCircle, Syringe, Loader2, CheckCircle2, XCircle, History, CalendarDays, Clock, Trash2, AlertTriangle, Fish } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider";
import StartTreatmentModal from "./StartTreatmentModal";
import DailyLogModal from "@/features/treatments/components/DailyLogModal";
import DoseCalculatorWidget from "./DoseCalculatorWidget"; 
import { getActiveTreatmentsAction, ActiveTreatmentDto } from "@/features/treatments/actions/start-treatment.actions";
import { deleteTreatmentSessionAction } from "@/features/treatments/actions/log-treatment.actions";
import { getAquariumByIdAction } from "../actions/aquarium.actions";
import toast from "react-hot-toast";

interface Props { aquariumId: string; }

export default function TreatmentTab({ aquariumId }: Props) {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const rootDict = (dict as Record<string, unknown>) || {};
  const tDictData = (rootDict.treatment as Record<string, string>) || {};
  const txt = {
    title: tDictData.title || (lang === 'id' ? "Rekam Medis & Karantina" : "Medical Records & Quarantine"),
    subtitle: tDictData.subtitle || (lang === 'id' ? "Pantau proses penyembuhan fauna dan catat pengobatan harian." : "Monitor fauna healing progress and log daily treatment."),
    emptyTitle: tDictData.emptyTitle || (lang === 'id' ? "Tidak Ada Fauna yang Sakit" : "No Sick Fauna"),
    emptyDesc: tDictData.emptyDesc || (lang === 'id' ? "Akuarium Anda bersih dari infeksi aktif." : "Your aquarium is clean of active infections."),
    btnAdd: tDictData.btnAdd || (lang === 'id' ? "Catat Pengobatan Baru" : "Log New Treatment")
  };

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveTreatmentDto | null>(null);
  
  const [activePatients, setActivePatients] = useState<ActiveTreatmentDto[]>([]);
  const [historyPatients, setHistoryPatients] = useState<ActiveTreatmentDto[]>([]);
  const [tankVolume, setTankVolume] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState(true);

  // 💡 FIX 1: Tipe data deleteTarget tidak membutuhkan aquariumId
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'active' | 'history' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 💡 FIX 2: Pemisahan Fetching agar halaman langsung muncul secara Instan (Tidak Lola)
  const fetchTreatments = async () => {
    setIsLoading(true);
    const resTreatments = await getActiveTreatmentsAction(aquariumId);
    if (resTreatments.success) {
      setActivePatients((resTreatments.data || []).filter(d => d.status === "Active"));
      setHistoryPatients((resTreatments.data || []).filter(d => d.status !== "Active"));
    }
    setIsLoading(false);
  };

  const fetchTankVolume = async () => {
    const resTank = await getAquariumByIdAction(aquariumId);
    if (resTank.success && resTank.data) {
      setTankVolume(resTank.data.volume_liters);
    }
  };

  useEffect(() => { 
    fetchTreatments(); 
    fetchTankVolume(); // Berjalan paralel di background
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aquariumId]);

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
    // Kita gunakan aquariumId dari Props komponen, bukan dari deleteTarget
    const res = await deleteTreatmentSessionAction(deleteTarget.id, aquariumId);
    if (res.success) {
      toast.success(lang === 'id' ? "Data berhasil dihapus." : "Data successfully deleted.");
      fetchTreatments();
      // 💡 Beritahu Induk untuk menghitung ulang!
      window.dispatchEvent(new Event("aquarium_data_changed"));
    } else {
      toast.error(lang === 'id' ? "Gagal menghapus data." : "Failed to delete data.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  // 💡 FIX 3: Fungsi Memecah Teks Tanpa Dibalik (Karena Backend Sudah Mengurutkan)
  const parseNotes = (rawNotes: string | null) => {
    if (!rawNotes) return null;
    const lines = rawNotes.split(/\\n|\r?\n|<br\s*\/?>/i)
                          .map(line => line.trim())
                          .filter(line => line !== '');
    
    return lines.map((line, idx) => (
        <span key={idx} className="block text-[11px] font-medium leading-relaxed border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5 mb-1.5 last:border-0 last:pb-0 last:mb-0">
            {line}
        </span>
    ));
  };

  return (
    <div className="animate-in fade-in duration-500">
      
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
              <Button onClick={executeDelete} disabled={isDeleting} className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, HAPUS PERMANEN" : "YES, DELETE PERMANENTLY")}
              </Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="w-full h-12 font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700">{lang === 'id' ? "Batal" : "Cancel"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-rose-500" /> {txt.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-lg">
                {txt.subtitle}
              </p>
            </div>
            <Button onClick={() => setIsStartModalOpen(true)} className="h-12 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-rose-500/20 shrink-0 w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" /> {txt.btnAdd}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
          ) : activePatients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm">
              <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h4 className="text-lg font-black text-slate-800 dark:text-slate-200">{txt.emptyTitle}</h4>
              <p className="text-xs text-slate-500 mt-2">{txt.emptyDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePatients.map((session) => {
                const dayNum = calculateDayNumber(session.started_at);
                const hasLoggedToday = session.latest_log?.day_number === dayNum;

                return (
                  <div key={session.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col relative group hover:border-rose-300 transition-colors">
                    
                    {/* 💡 FIX: Tombol hapus sekarang aman dari Error TypeScript */}
                    <button 
                      onClick={() => setDeleteTarget({id: session.id, type: 'active'})} 
                      className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm md:shadow-none hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                    
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <div className="inline-flex px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded text-[10px] font-black uppercase mb-3"><AlertCircle className="w-3 h-3 mr-1" /> {lang === 'id' ? "Hari Ke-" : "Day"} {dayNum}</div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight pr-8">{lang === 'id' ? session.disease?.name_id : session.disease?.name_en}</h3>
                    </div>
                    
                    <div className="p-5 flex-1 space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">{lang === 'id' ? "PENGOBATAN" : "MEDICATION"}</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"><Syringe className="w-4 h-4" /> {lang === 'id' ? session.medication?.name_id : session.medication?.name_en}</p>
                      </div>

                      {hasLoggedToday && session.latest_log && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3"/> {lang === 'id' ? "SUDAH DIUPDATE HARI INI" : "UPDATED TODAY"}</p>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {session.latest_log.action_taken === "Observed" ? (lang === 'id' ? "Hanya Observasi" : "Observed") 
                            : session.latest_log.action_taken === "Redosed" ? (lang === 'id' ? "Dosis Ulang" : "Redosed") 
                            : session.latest_log.action_taken === "Water Change" ? (lang === 'id' ? "Ganti Air" : "Water Change") : session.latest_log.action_taken}
                            
                            {/* 🚀 HASIL RENDER TANPA REVERSE (Otomatis Terbaru di Atas) */}
                            <div className="font-normal italic text-slate-500 mt-2 max-h-24 overflow-y-auto custom-scrollbar flex flex-col">
                              {parseNotes(session.latest_log.notes)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between mb-1"><span className="text-xs font-bold text-slate-500">Recovery</span><span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{session.current_recovery_rate}%</span></div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${session.current_recovery_rate}%` }} /></div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Button onClick={() => setSelectedSession(session)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-black text-xs uppercase shadow-md transition-colors">
                        <Activity className="w-4 h-4 mr-2" /> {hasLoggedToday ? (lang === 'id' ? "Edit Data Hari Ini" : "Edit Today's Data") : (lang === 'id' ? "Catat Medis Hari Ini" : "Log Today's Medical")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {historyPatients.length > 0 && (
            <div className="pt-8 mt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
                <History className="w-4 h-4" /> {lang === 'id' ? "Riwayat Pengobatan Terdahulu" : "Past Treatment History"}
              </h4>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {historyPatients.map((hist) => {
                    const isSuccess = hist.status === "Completed";
                    const isFailed = hist.status === "Failed";
                    const statusColors = isSuccess ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : isFailed ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";

                    return (
                      <div key={hist.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex flex-col relative overflow-hidden transition-colors group ${isSuccess ? 'border-emerald-200 dark:border-emerald-900/50' : isFailed ? 'border-red-200 dark:border-red-900/50' : 'border-amber-200 dark:border-amber-900/50'}`}>
                          
                          {/* 💡 FIX: Tombol hapus aman tanpa aquariumId */}
                          <button onClick={() => setDeleteTarget({id: hist.id, type: 'history'})} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-900/80 rounded-full shadow-sm z-10"><Trash2 className="w-4 h-4"/></button>
                          
                          <div>
                            <div className="flex justify-between items-start mb-3 pr-8">
                              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{lang === 'id' ? (hist.disease?.name_id || hist.disease?.name_en) : hist.disease?.name_en}</h5>
                              {isSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> : isFailed ? <XCircle className="w-5 h-5 text-red-500 shrink-0"/> : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0"/>}
                            </div>
                            <div className="space-y-1.5 mb-4">
                              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2"><Syringe className="w-3.5 h-3.5 text-blue-500"/> {lang === 'id' ? (hist.medication?.name_id || hist.medication?.name_en) : hist.medication?.name_en}</p>
                              <p className="text-[10px] font-medium text-slate-500 flex items-center gap-2"><Fish className="w-3 h-3 text-slate-400"/> {hist.aquarium?.name}</p>
                              <p className="text-[10px] font-medium text-slate-500 flex items-center gap-2"><CalendarDays className="w-3 h-3 text-slate-400"/> {formatDate(hist.started_at)} - {hist.completed_at ? formatDate(hist.completed_at) : '?'}</p>
                              <p className="text-[10px] font-medium text-slate-500 flex items-center gap-2"><Clock className="w-3 h-3 text-slate-400"/> {lang === 'id' ? "Durasi:" : "Duration:"} {calculateDuration(hist.started_at, hist.completed_at)} {lang === 'id' ? "Hari" : "Days"}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${statusColors}`}>{isSuccess ? (lang === 'id' ? "BERHASIL SEMBUH" : "SUCCESSFULLY CURED") : isFailed ? (lang === 'id' ? "GAGAL (MATI)" : "FATAL (DIED)") : (lang === 'id' ? "DIBATALKAN" : "ABORTED")}</span>
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500">{hist.current_recovery_rate}% Recovery</span>
                          </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="lg:col-span-1 sticky top-6">
           <DoseCalculatorWidget aquariumVolumeLiters={tankVolume} />
        </div>

      </div>

      <StartTreatmentModal aquariumId={aquariumId} isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} onSuccess={fetchTreatments} dict={tDictData} lang={lang} />
      
      {selectedSession && (
        <DailyLogModal session={selectedSession} isOpen={selectedSession !== null} onClose={() => setSelectedSession(null)} onSuccess={fetchTreatments} tDict={tDictData} lang={lang} hasLoggedToday={selectedSession.latest_log?.day_number === calculateDayNumber(selectedSession.started_at)} />
      )}
    </div>
  );
}