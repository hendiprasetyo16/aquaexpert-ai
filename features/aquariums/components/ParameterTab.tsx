// features/aquariums/components/ParameterTab.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { useLanguage } from "@/providers/LanguageProvider";
import { getParametersAction, addParameterAction, deleteParameterAction, AquariumParameterLog } from "../actions/parameter.actions";
import { Plus, Trash2, Loader2, FlaskConical, Thermometer, Skull, Activity, Droplets, AlertTriangle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import ParameterCharts from "./ParameterCharts";
import DoseCalculatorWidget from "./DoseCalculatorWidget"; // <-- IMPORT WIDGET KALKULATOR
import { getAquariumByIdAction } from "../actions/aquarium.actions";

interface ParameterTabProps {
  aquariumId: string;
}

const getLocalDatetime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function ParameterTab({ aquariumId }: ParameterTabProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [mounted, setMounted] = useState(false);
  const [parameters, setParameters] = useState<AquariumParameterLog[]>([]);
  const [tankVolume, setTankVolume] = useState<number>(0); // State untuk menyimpan Volume Akuarium
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    record_date: getLocalDatetime(),
    temperature: "", ph: "", ammonia: "", nitrite: "", nitrate: "", 
    tds: "", gh: "", kh: "", test_method: "", notes: "" 
  });

  const loadData = async () => {
    setLoading(true);
    // 💡 Ambil parameter & informasi akuarium secara pararel
    const [resParams, resTank] = await Promise.all([
      getParametersAction(aquariumId),
      getAquariumByIdAction(aquariumId)
    ]);
    
    if (resParams.success && resParams.data) setParameters(resParams.data);
    if (resTank.success && resTank.data) setTankVolume(resTank.data.volume_liters);
    
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true); 
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aquariumId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      aquarium_id: aquariumId,
      record_date: new Date(formData.record_date).toISOString(),
      parameter_source: "Manual", 
      temperature: formData.temperature ? Number(formData.temperature) : null,
      ph: formData.ph ? Number(formData.ph) : null,
      ammonia: formData.ammonia ? Number(formData.ammonia) : null,
      nitrite: formData.nitrite ? Number(formData.nitrite) : null,
      nitrate: formData.nitrate ? Number(formData.nitrate) : null,
      tds: formData.tds ? Number(formData.tds) : null,
      gh: formData.gh ? Number(formData.gh) : null,
      kh: formData.kh ? Number(formData.kh) : null,
      test_method: formData.test_method || null, 
      notes: formData.notes || null,
    };

    const res = await addParameterAction(payload);
    if (res.success) {
      toast.success(lang === 'id' ? "Parameter dicatat!" : "Parameters logged!");
      setShowForm(false);
      setFormData({ record_date: getLocalDatetime(), temperature: "", ph: "", ammonia: "", nitrite: "", nitrate: "", tds: "", gh: "", kh: "", test_method: "", notes: "" });
      loadData();
      // 💡 Beritahu Induk untuk menghitung ulang!
      window.dispatchEvent(new Event("aquarium_data_changed"));
    } else {
      toast.error(res.error || "Gagal menyimpan.");
    }
    setSubmitting(false);
  };

  const triggerDelete = (id: string) => { setDeleteLogId(id); };

  const executeDelete = async () => {
    if (!deleteLogId) return;
    setSubmitting(true);
    const res = await deleteParameterAction(deleteLogId, aquariumId); 
    if (res.success) {
      toast.success(lang === 'id' ? "Catatan berhasil dihapus." : "Log deleted successfully.");
      setDeleteLogId(null);
      loadData();
      // 💡 Beritahu Induk untuk menghitung ulang!
      window.dispatchEvent(new Event("aquarium_data_changed"));
    } else { toast.error(lang === 'id' ? "Gagal menghapus." : "Failed to delete."); }
    setSubmitting(false);
  };

  const getStatusColor = (val: number | null | undefined, type: "ammonia" | "nitrite" | "nitrate" | "ph") => {
    if (val === null || val === undefined) return "text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200";
    if (type === "ammonia" || type === "nitrite") {
      if (val === 0) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200";
      if (val > 0 && val <= 0.25) return "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200";
      return "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200"; 
    }
    if (type === "nitrate") {
      if (val <= 20) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200";
      if (val <= 40) return "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200";
      return "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200"; 
    }
    if (type === "ph") {
      if (val >= 6.0 && val <= 7.5) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200";
      if ((val >= 5.5 && val <= 5.9) || (val >= 7.6 && val <= 8.0)) return "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200";
      return "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200"; 
    }
    return "text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200"; 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-teal-500" /> {lang === 'id' ? "Riwayat Parameter Air" : "Water Parameters Log"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'id' ? "Penting untuk mendeteksi ancaman dini dan referensi Diagnosis Pakar." : "Crucial for early threat detection and Expert Diagnosis."}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-500 text-white w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> {lang === 'id' ? "Catat Baru" : "Log New"}
        </Button>
      </div>

      {/* Container utama untuk Form dan Kalkulator */}
      {showForm && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch animate-in slide-in-from-top-4 duration-300">
          
          {/* Kolom Form Pencatatan (h-full agar tingginya maksimal) */}
          <div className="xl:col-span-8 h-full bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50 p-6 rounded-3xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Waktu Pencatatan" : "Record Time"} *</label>
                  <input required type="datetime-local" value={formData.record_date} onChange={(e) => setFormData({...formData, record_date: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Alat Uji (Opsional)" : "Test Method (Optional)"}</label>
                  <input type="text" placeholder={lang === 'id' ? "Contoh: API Master Kit / Salifert" : "e.g., API Master Kit"} value={formData.test_method} onChange={(e) => setFormData({...formData, test_method: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1"><Thermometer className="w-3 h-3"/> {lang === 'id' ? "Suhu" : "Temp"} (°C)</label>
                  <input type="number" step="0.1" placeholder="Ex: 26.5" value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">pH</label>
                  <input type="number" step="0.1" placeholder="Ex: 6.8" value={formData.ph} onChange={(e) => setFormData({...formData, ph: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Droplets className="w-3 h-3"/> TDS (ppm)</label>
                  <input type="number" placeholder="Ex: 120" value={formData.tds} onChange={(e) => setFormData({...formData, tds: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1"><Skull className="w-3 h-3"/> Amonia (NH3)</label>
                  <input type="number" step="0.01" placeholder="Ex: 0" value={formData.ammonia} onChange={(e) => setFormData({...formData, ammonia: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Nitrit (NO2)</label>
                  <input type="number" step="0.01" placeholder="Ex: 0" value={formData.nitrite} onChange={(e) => setFormData({...formData, nitrite: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Nitrat (NO3)</label>
                  <input type="number" step="0.1" placeholder="Ex: 10" value={formData.nitrate} onChange={(e) => setFormData({...formData, nitrate: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 col-span-2 sm:col-span-1">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GH</label>
                    <input type="number" step="0.1" placeholder="Ex: 4" value={formData.gh} onChange={(e) => setFormData({...formData, gh: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KH</label>
                    <input type="number" step="0.1" placeholder="Ex: 2" value={formData.kh} onChange={(e) => setFormData({...formData, kh: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold outline-none focus:border-teal-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'id' ? "Catatan Tambahan" : "Notes"}</label>
                <input type="text" placeholder={lang === 'id' ? "Misal: Setelah ganti air 50%" : "E.g., After 50% water change"} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium outline-none focus:border-teal-500 transition-colors" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-teal-100 dark:border-teal-900/30">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl w-full sm:w-auto">{lang === 'id' ? "Batal" : "Cancel"}</Button>
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl w-full sm:w-auto font-bold shadow-lg shadow-teal-600/20">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FlaskConical className="w-4 h-4 mr-2" />}
                  {lang === 'id' ? "Simpan Parameter" : "Save Log"}
                </Button>
              </div>
            </form>
          </div>

          {/* Kolom Kalkulator Dosis (h-full agar sejajar) */}
          <div className="xl:col-span-4 h-full">
            <DoseCalculatorWidget aquariumVolumeLiters={tankVolume} />
          </div>

        </div>
      )}

      {!loading && parameters.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <ParameterCharts data={parameters} />
        </div>
      )}

      {loading ? (
         <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      ) : parameters.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <Activity className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
          <h4 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-1">{lang === 'id' ? "Belum Ada Catatan" : "No Logs Found"}</h4>
          <p className="text-slate-500 font-medium text-sm">{lang === 'id' ? "Mulai catat parameter air untuk memantau kesehatan tangki Anda." : "Start logging parameters to track your tank's health."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parameters.map((log, idx) => (
            <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col xl:flex-row gap-5 justify-between hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-900 transition-all relative overflow-hidden group">
              
              {idx === 0 && <div className="absolute top-0 right-0 bg-teal-500 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-md">{lang === 'id' ? "Log Terbaru" : "Latest Log"}</div>}

              <div className="flex items-center gap-4 min-w-[180px]">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full text-slate-400 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 transition-colors border border-slate-100 dark:border-slate-700">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-800 dark:text-slate-200">
                    {new Date(log.record_date).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{log.notes || (lang === 'id' ? "Pengecekan rutin" : "Routine check")}</p>
                  
                  {log.test_method && (
                    <div className="flex items-center gap-1 mt-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md w-fit">
                      <Tag className="w-3 h-3" /> {log.test_method}
                    </div>
                  )}
                </div>
              </div>

              {/* GRID HASIL PARAMETER */}
              <div className="flex flex-wrap gap-2 flex-1 xl:justify-end items-center mt-2 xl:mt-0">
                {log.temperature !== null && log.temperature !== undefined && (
                  <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:border-orange-900/50 min-w-[65px]">
                    <span className="text-[9px] font-black uppercase opacity-70 flex items-center gap-0.5"><Thermometer className="w-2.5 h-2.5"/> °C</span>
                    <span className="text-base font-black">{log.temperature}</span>
                  </div>
                )}
                {log.ph !== null && log.ph !== undefined && (
                  <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border min-w-[65px] ${getStatusColor(log.ph, "ph")}`}>
                    <span className="text-[9px] font-black uppercase opacity-70">pH</span>
                    <span className="text-base font-black">{log.ph}</span>
                  </div>
                )}
                {log.tds !== null && log.tds !== undefined && (
                  <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:border-slate-800 min-w-[65px]">
                    <span className="text-[9px] font-black uppercase opacity-70">TDS</span>
                    <span className="text-base font-black">{log.tds}</span>
                  </div>
                )}
                {log.ammonia !== null && log.ammonia !== undefined && (
                  <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border min-w-[65px] ${getStatusColor(log.ammonia, "ammonia")}`}>
                    <span className="text-[9px] font-black uppercase opacity-70 flex items-center gap-0.5"><Skull className="w-2.5 h-2.5"/> NH3</span>
                    <span className="text-base font-black">{log.ammonia}</span>
                  </div>
                )}
                {log.nitrite !== null && log.nitrite !== undefined && (
                  <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border min-w-[65px] ${getStatusColor(log.nitrite, "nitrite")}`}>
                    <span className="text-[9px] font-black uppercase opacity-70">NO2</span>
                    <span className="text-base font-black">{log.nitrite}</span>
                  </div>
                )}
                {log.nitrate !== null && log.nitrate !== undefined && (
                  <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border min-w-[65px] ${getStatusColor(log.nitrate, "nitrate")}`}>
                    <span className="text-[9px] font-black uppercase opacity-70">NO3</span>
                    <span className="text-base font-black">{log.nitrate}</span>
                  </div>
                )}
                {(log.gh != null || log.kh != null) && (
                  <div className="flex gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:border-slate-800 items-center justify-center">
                    {log.gh != null && (
                       <div className="flex flex-col items-center">
                         <span className="text-[9px] font-black uppercase opacity-70">GH</span>
                         <span className="text-base font-black">{log.gh}</span>
                       </div>
                    )}
                    {log.gh != null && log.kh != null && <div className="w-[2px] h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>}
                    {log.kh != null && (
                       <div className="flex flex-col items-center">
                         <span className="text-[9px] font-black uppercase opacity-70">KH</span>
                         <span className="text-base font-black">{log.kh}</span>
                       </div>
                    )}
                  </div>
                )}
                
                <button onClick={() => triggerDelete(log.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all ml-2 border border-transparent hover:border-red-200 dark:hover:border-red-900/50">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mounted && deleteLogId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-500">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'id' ? "Hapus Catatan?" : "Delete Log?"}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {lang === 'id' 
                ? "Catatan parameter ini akan dihapus dari riwayat sistem. Anda yakin ingin melanjutkan?" 
                : "This parameter log will be removed from system history. Are you sure you want to proceed?"}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={executeDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "Ya, Hapus Catatan" : "Yes, Delete Log")}
              </Button>
              <Button variant="ghost" onClick={() => setDeleteLogId(null)} disabled={submitting} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
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