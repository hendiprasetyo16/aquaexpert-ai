// features/aquariums/components/MaintenanceTab.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { Loader2, CalendarDays, CheckCircle2, AlertTriangle, Trash2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { 
  getMaintenanceDashboardAction, 
  addTaskAction, 
  logMaintenanceAction, 
  removeTaskAction, 
  removeLogAction 
} from "../actions/maintenance.actions";
import { MaintenanceDashboardStatus, AquariumMaintenanceLog, MaintenanceType } from "../types/maintenance.types";

interface MaintenanceTabProps {
  aquariumId: string;
}

export default function MaintenanceTab({ aquariumId }: MaintenanceTabProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasksStatus, setTasksStatus] = useState<MaintenanceDashboardStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<AquariumMaintenanceLog[]>([]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'task' | 'log', title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [taskForm, setTaskForm] = useState({ type: "water_change" as MaintenanceType, title: "", interval: 7 });
  const [logForm, setLogForm] = useState({ taskId: "", type: "water_change" as MaintenanceType, value: "", unit: "", notes: "" });

  const loadData = async () => {
    setLoading(true);
    const res = await getMaintenanceDashboardAction(aquariumId);
    if (res.success) {
      setTasksStatus(res.tasksStatus || []);
      setRecentLogs(res.recentLogs || []);
    } else {
      toast.error(res.error || "Gagal memuat data maintenance.");
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [aquariumId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const res = await addTaskAction({
      aquarium_id: aquariumId,
      task_type: taskForm.type,
      title: taskForm.title.trim(),
      interval_days: taskForm.interval,
      is_active: true
    });
    
    if (res.success) {
      toast.success(lang === 'id' ? "Tugas berhasil dibuat!" : "Task created!");
      setShowTaskModal(false);
      setTaskForm({ type: "water_change", title: "", interval: 7 }); 
      loadData();
      // 💡 Beritahu Induk untuk menghitung ulang!
      window.dispatchEvent(new Event("aquarium_data_changed"));
    } else {
      toast.error(res.error || "Gagal membuat tugas.");
    }
    setIsSubmitting(false);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let mType = logForm.type;
    if (logForm.taskId) {
      const selectedTask = tasksStatus.find(ts => ts.task.id === logForm.taskId);
      if (selectedTask) mType = selectedTask.task.task_type;
    }

    const res = await logMaintenanceAction({
      aquarium_id: aquariumId,
      task_id: logForm.taskId !== "" ? logForm.taskId : undefined,
      maintenance_type: mType,
      value: logForm.value !== "" ? Number(logForm.value) : undefined,
      unit: logForm.unit !== "" ? logForm.unit : undefined,
      notes: logForm.notes !== "" ? logForm.notes : undefined,
    });

    if (res.success) {
      toast.success(lang === 'id' ? "Pekerjaan berhasil dicatat!" : "Maintenance logged!");
      setShowLogModal(false);
      setLogForm({ taskId: "", type: "water_change", value: "", unit: "", notes: "" }); 
      loadData();
      // 💡 Beritahu Induk untuk menghitung ulang!
      window.dispatchEvent(new Event("aquarium_data_changed"));
    } else {
      toast.error(res.error || "Gagal mencatat log.");
    }
    setIsSubmitting(false);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    if (deleteTarget.type === 'task') {
      const res = await removeTaskAction(deleteTarget.id, aquariumId);
      if (res.success) {
        toast.success(lang === 'id' ? "Jadwal berhasil dihapus." : "Task deleted.");
        loadData();
        // 💡 Beritahu Induk untuk menghitung ulang!
        window.dispatchEvent(new Event("aquarium_data_changed"));
      } else toast.error(lang === 'id' ? "Gagal menghapus jadwal." : "Failed to delete task.");
    } 
    else if (deleteTarget.type === 'log') {
      const res = await removeLogAction(deleteTarget.id, aquariumId);
      if (res.success) {
        toast.success(lang === 'id' ? "Riwayat berhasil dihapus." : "Log deleted.");
        loadData();
        // 💡 Beritahu Induk untuk menghitung ulang!
        window.dispatchEvent(new Event("aquarium_data_changed"));
      } else toast.error(lang === 'id' ? "Gagal menghapus riwayat." : "Failed to delete log.");
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const formatUrgencyColor = (level: string) => {
    switch (level) {
      case "critical": return "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400";
      case "warning": return "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400";
      default: return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    if (lang === 'id') {
      const idLabels: Record<string, string> = {
        'water_change': 'Ganti Air',
        'filter_cleaning': 'Pembersihan Filter',
        'fertilizer': 'Pemupukan',
        'glass_cleaning': 'Pembersihan Kaca',
        'co2_refill': 'Isi Ulang CO2',
        'equipment_check': 'Cek Peralatan',
        'other': 'Lainnya'
      };
      return idLabels[type] || type;
    }
    
    const enLabels: Record<string, string> = {
      'water_change': 'Water Change',
      'filter_cleaning': 'Filter Cleaning',
      'fertilizer': 'Fertilizer Dosing',
      'glass_cleaning': 'Glass Cleaning',
      'co2_refill': 'CO2 Refill',
      'equipment_check': 'Equipment Check',
      'other': 'Other'
    };
    return enLabels[type] || type;
  };

  const getDynamicPlaceholder = (type: MaintenanceType) => {
    if (lang === 'id') {
      switch(type) {
        case 'water_change': return "Contoh: Ganti Air 30%";
        case 'filter_cleaning': return "Contoh: Cuci Busa Filter Putih";
        case 'fertilizer': return "Contoh: Pupuk Cair Lebat 2ml";
        case 'glass_cleaning': return "Contoh: Gosok Kaca Depan";
        case 'co2_refill': return "Contoh: Isi Ulang Tabung 5kg";
        case 'equipment_check': return "Contoh: Cek Kipas & Suhu";
        default: return "Contoh: Pangkas Tanaman Stem";
      }
    } else {
      switch(type) {
        case 'water_change': return "E.g., 30% Water Change";
        case 'filter_cleaning': return "E.g., Clean White Sponge";
        case 'fertilizer': return "E.g., Liquid Fertilizer 2ml";
        case 'glass_cleaning': return "E.g., Scrub Front Glass";
        case 'co2_refill': return "E.g., Refill 5kg Cylinder";
        case 'equipment_check': return "E.g., Check Fans & Temp";
        default: return "E.g., Trim Stem Plants";
      }
    }
  };

  const getLogHelperText = (taskId: string, currentType: MaintenanceType) => {
    let effectiveType = currentType;
    if (taskId) {
        const selectedTask = tasksStatus.find(ts => ts.task.id === taskId);
        if (selectedTask) effectiveType = selectedTask.task.task_type;
    }

    if (lang === 'id') {
        switch(effectiveType) {
            case 'water_change': return "Saran: Tugas ini biasanya Kuantitatif. Isi Nilai (Misal: 30) dan Satuan (Misal: %).";
            case 'fertilizer': return "Saran: Tugas ini biasanya Kuantitatif. Isi Nilai (Misal: 5) dan Satuan (Misal: ml atau tetes).";
            case 'co2_refill': return "Saran: Tugas ini opsional Kuantitatif. Anda bisa isi Nilai (Misal: 5) dan Satuan (Misal: kg), atau kosongkan.";
            default: return "Saran: Tugas ini biasanya Kualitatif (fisik). Biarkan Nilai & Satuan KOSONG. Cukup gunakan kolom Catatan jika perlu.";
        }
    } else {
        switch(effectiveType) {
            case 'water_change': return "Tip: This is usually a Quantitative task. Enter Value (e.g., 30) and Unit (e.g., %).";
            case 'fertilizer': return "Tip: This is usually a Quantitative task. Enter Value (e.g., 5) and Unit (e.g., ml or drops).";
            case 'co2_refill': return "Tip: This is an optional Quantitative task. Enter Value (e.g., 5) and Unit (e.g., kg), or leave blank.";
            default: return "Tip: This is usually a Qualitative (physical) task. Leave Value & Unit BLANK. Use Notes if necessary.";
        }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER TOMBOL */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <Button onClick={() => setShowTaskModal(true)} variant="outline" className="h-12 px-6 rounded-xl border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 font-bold w-full sm:w-auto">
          <CalendarDays className="w-4 h-4 mr-2" /> {lang === 'id' ? "Buat Jadwal Tugas" : "Add Maintenance Task"}
        </Button>
        <Button onClick={() => setShowLogModal(true)} className="h-12 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black shadow-lg shadow-teal-500/20 w-full sm:w-auto">
          <CheckCircle2 className="w-4 h-4 mr-2" /> {lang === 'id' ? "Catat Pekerjaan (Log)" : "Log Maintenance"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KOLOM KIRI: ACTIVE TASKS */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" /> {lang === 'id' ? "Tugas Aktif (Jadwal)" : "Active Tasks"}
          </h3>
          
          {tasksStatus.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-400 font-medium">
              <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-50" />
              {lang === 'id' ? "Belum ada jadwal tugas. Tambahkan sekarang!" : "No scheduled tasks yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {tasksStatus.map((status) => (
                <div key={status.task.id} className={`p-5 rounded-2xl border-l-4 shadow-sm flex items-center justify-between group bg-white dark:bg-slate-900 ${formatUrgencyColor(status.urgencyLevel)}`}>
                  <div>
                    <h4 className="font-black text-base">{status.task.title}</h4>
                    <p className="text-sm font-semibold opacity-80 mt-1">
                      {status.isOverdue 
                        ? <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400"><AlertTriangle className="w-4 h-4"/> {lang === 'id' ? "Terlambat" : "Overdue"} {Math.abs(status.daysRemaining)} {lang === 'id' ? "Hari" : "Days"}</span>
                        : status.daysRemaining === 0 
                          ? (lang === 'id' ? "Jatuh Tempo Hari ini!" : "Due Today!") 
                          : `${status.daysRemaining} ${lang === 'id' ? "Hari lagi" : "Days left"}`
                      }
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] uppercase font-bold opacity-60 bg-black/5 px-2 py-1 rounded-md">{getTypeLabel(status.task.task_type)}</span>
                    <button 
                      onClick={() => setDeleteTarget({ id: status.task.id, type: 'task', title: status.task.title })} 
                      className="p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-500/70 md:text-inherit hover:text-red-500 transition-opacity rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: RECENT ACTIVITY LOGS */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {lang === 'id' ? "Riwayat Pekerjaan" : "Recent Activity"}
          </h3>
          
          {recentLogs.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-400 font-medium">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
              {lang === 'id' ? "Belum ada riwayat tercatat." : "No logs recorded yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {getTypeLabel(log.maintenance_type)} 
                      {log.value !== null && <span className="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-0.5 rounded-md text-xs border border-teal-100 dark:border-teal-800">{log.value} {log.unit}</span>}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">{formatDate(log.performed_at)} {log.notes && <span className="italic"> — "{log.notes}"</span>}</p>
                  </div>
                    <button 
                      onClick={() => setDeleteTarget({ id: log.id, type: 'log', title: getTypeLabel(log.maintenance_type) })} 
                      className="p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD TASK */}
      {mounted && showTaskModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3"><CalendarDays className="w-6 h-6" /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{lang === 'id' ? "Buat Jadwal Baru" : "Create Schedule"}</h2>
              <p className="text-sm text-slate-500 mt-1">{lang === 'id' ? "Sistem akan mengingatkan saat tugas jatuh tempo." : "The system will remind you when it's due."}</p>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{lang === 'id' ? "Jenis Tugas" : "Task Type"}</label>
                <select value={taskForm.type} onChange={e => setTaskForm({...taskForm, type: e.target.value as MaintenanceType})} className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 font-medium cursor-pointer focus:border-indigo-500 outline-none transition-colors">
                  <option value="water_change">{lang === 'id' ? "Ganti Air" : "Water Change"}</option>
                  <option value="filter_cleaning">{lang === 'id' ? "Bersihkan Filter" : "Filter Cleaning"}</option>
                  <option value="fertilizer">{lang === 'id' ? "Beri Pupuk" : "Fertilizer Dosing"}</option>
                  <option value="glass_cleaning">{lang === 'id' ? "Bersihkan Kaca" : "Glass Cleaning"}</option>
                  <option value="co2_refill">{lang === 'id' ? "Isi Ulang CO2" : "CO2 Refill"}</option>
                  <option value="equipment_check">{lang === 'id' ? "Cek Peralatan" : "Equipment Check"}</option>
                  <option value="other">{lang === 'id' ? "Lainnya" : "Other"}</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{lang === 'id' ? "Nama Tugas" : "Task Name"}</label>
                <input 
                  required 
                  value={taskForm.title} 
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                  placeholder={getDynamicPlaceholder(taskForm.type)} 
                  className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 outline-none transition-colors" 
                />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{lang === 'id' ? "Ulangi Setiap (Hari)" : "Repeat Every (Days)"}</label>
                <input required type="number" min="1" value={taskForm.interval} onChange={e => setTaskForm({...taskForm, interval: Number(e.target.value)})} className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 outline-none transition-colors" />
                <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed bg-indigo-50 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <Info className="w-3.5 h-3.5 inline-block mr-1.5 text-indigo-500 mb-0.5 shrink-0" />
                  {lang === 'id' 
                    ? "Isi dalam hitungan hari. Jika jadwal Anda 1 bulan sekali, tulis '30'. Jika 2 bulan sekali, tulis '60'." 
                    : "Input in days. If your schedule is every 1 month, enter '30'. For 2 months, enter '60'."}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowTaskModal(false)} className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold">{lang === 'id' ? "Batal" : "Cancel"}</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/30">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "Simpan" : "Save")}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: LOG MAINTENANCE */}
      {mounted && showLogModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLogModal(false)}>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] w-full max-w-[500px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={e => e.stopPropagation()}>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-6 h-6" /></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{lang === 'id' ? "Catat Pekerjaan" : "Log Maintenance"}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed px-4">
                {lang === 'id' 
                  ? "Catat apa saja yang baru Anda lakukan agar AI bisa menganalisa ekosistem." 
                  : "Log what you just did so the AI can analyze your ecosystem."}
              </p>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-6">
              <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/30">
                <label className="text-[11px] font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider mb-2 block">
                  {lang === 'id' ? "Pilih Jadwal Yang Selesai" : "Select Completed Schedule"}
                </label>
                <select value={logForm.taskId} onChange={e => setLogForm({...logForm, taskId: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-teal-200 dark:border-teal-800 text-sm bg-white dark:bg-slate-950 focus:border-teal-500 outline-none cursor-pointer">
                  <option value="">{lang === 'id' ? "-- Ini Pekerjaan Mendadak --" : "-- Unscheduled Work --"}</option>
                  {tasksStatus.map(ts => (
                    <option key={ts.task.id} value={ts.task.id}>{ts.task.title}</option>
                  ))}
                </select>
              </div>
              
              {!logForm.taskId && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    {lang === 'id' ? "Kategori Pekerjaan Mendadak" : "Spontaneous Task Category"}
                  </label>
                  <select value={logForm.type} onChange={e => setLogForm({...logForm, type: e.target.value as MaintenanceType})} className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 font-medium focus:border-teal-500 outline-none cursor-pointer transition-colors">
                    <option value="water_change">{lang === 'id' ? "Ganti Air" : "Water Change"}</option>
                    <option value="filter_cleaning">{lang === 'id' ? "Bersihkan Filter" : "Filter Cleaning"}</option>
                    <option value="fertilizer">{lang === 'id' ? "Beri Pupuk" : "Fertilizer Dosing"}</option>
                    <option value="glass_cleaning">{lang === 'id' ? "Bersihkan Kaca" : "Glass Cleaning"}</option>
                    <option value="co2_refill">{lang === 'id' ? "Isi Ulang CO2" : "CO2 Refill"}</option>
                    <option value="equipment_check">{lang === 'id' ? "Cek Peralatan" : "Equipment Check"}</option>
                    <option value="other">{lang === 'id' ? "Lainnya" : "Other"}</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                {/* FIX: Layout Nilai & Satuan adaptif untuk HP */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{lang === 'id' ? "Nilai (Opsional)" : "Value"}</label>
                    <input type="number" value={logForm.value} onChange={e => setLogForm({...logForm, value: e.target.value})} placeholder={lang === 'id' ? "Misal: 30" : "E.g., 30"} className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none transition-colors" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{lang === 'id' ? "Satuan (Opsional)" : "Unit"}</label>
                    <input type="text" value={logForm.unit} onChange={e => setLogForm({...logForm, unit: e.target.value})} placeholder={lang === 'id' ? "Misal: %" : "E.g., %"} className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none transition-colors" />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                    <p>
                      {lang === 'id' 
                        ? <><strong className="text-blue-700 dark:text-blue-400">Tugas Kuantitatif:</strong> Cth: "Ganti Air" (Nilai: 30, Sat: %). AI butuh angka ini.</>
                        : <><strong className="text-blue-700 dark:text-blue-400">Quantitative:</strong> E.g., "Water Change" (Val: 30, Unit: %). AI needs this.</>
                      }
                    </p>
                    <p>
                      {lang === 'id'
                        ? <><strong className="text-blue-700 dark:text-blue-400">Tugas Fisik:</strong> Cth: "Bersihkan Kaca". Biarkan Nilai & Satuan kosong.</>
                        : <><strong className="text-blue-700 dark:text-blue-400">Physical:</strong> E.g., "Clean Glass". Leave Val & Unit blank.</>
                      }
                    </p>
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 font-bold italic">
                      {getLogHelperText(logForm.taskId, logForm.type)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">{lang === 'id' ? "Catatan Tambahan (Opsional)" : "Notes (Optional)"}</label>
                <input type="text" value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder={lang === 'id' ? "Catatan khusus..." : "Any observations?"} className="w-full h-12 px-4 rounded-xl border-2 mt-1.5 bg-slate-50 dark:bg-slate-950 focus:border-teal-500 outline-none transition-colors" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setShowLogModal(false)} className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold">{lang === 'id' ? "Batal" : "Cancel"}</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-500/30">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "Simpan Log" : "Save Log")}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL HAPUS MODERN */}
      {mounted && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2 text-slate-800 dark:text-slate-100">
              {lang === 'id' ? "Hapus Data?" : "Delete Data?"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {lang === 'id' 
                ? <>Anda yakin ingin menghapus <strong className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{deleteTarget.title}</strong>?</>
                : <>Are you sure you want to delete <strong className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">{deleteTarget.title}</strong>?</>
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={executeDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-colors">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, HAPUS" : "YES, DELETE")}
              </Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}