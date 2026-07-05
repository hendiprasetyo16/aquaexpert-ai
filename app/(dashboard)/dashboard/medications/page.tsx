// app/(dashboard)/dashboard/medications/page.tsx
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Pill, FlaskConical, Beaker, Leaf, Bug, AlertTriangle, ShieldCheck, Clock, Activity, Loader2, Search, Database, Edit, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Archive } from "lucide-react";
import { getMedicationsDatabaseAction, getUserRoleAction, deleteMedicationAction, createMedicationAction, updateMedicationAction, toggleMedicationArchiveAction, MedicationDto } from "@/features/diseases/actions/medication.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { MedicationForm } from "@/features/diseases/components/MedicationForm";
import MedicationArchiveList from "@/features/diseases/components/MedicationArchiveList";

const ITEMS_PER_PAGE = 6;

export default function MedicationDatabasePage() {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [medications, setMedications] = useState<MedicationDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [userRole, setUserRole] = useState<string>("user");
  const [medToDelete, setMedToDelete] = useState<MedicationDto | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState(""); 
  const [medToArchive, setMedToArchive] = useState<MedicationDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingMedication, setEditingMedication] = useState<MedicationDto | null>(null);

  // 💡 STATE KUNCI UNTUK MENGGANTI TAMPILAN (FULL PAGE ROUTING)
  const [activeView, setActiveView] = useState<"grid" | "archive" | "form">("grid"); 

  const fetchDatabase = async () => {
    setIsLoading(true);
    const [roleRes, medsRes] = await Promise.all([
      getUserRoleAction(),
      getMedicationsDatabaseAction()
    ]);
    
    setUserRole(roleRes);
    if (medsRes.success) {
      setMedications(medsRes.data.filter(m => m.is_active !== false));
    } else {
      toast.error(medsRes.error || (lang === 'id' ? "Gagal memuat database obat." : "Failed to load medication database."));
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDatabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArchiveConfirm = async () => {
    if (!medToArchive) return;
    setIsProcessing(true);
    try {
      const res = await toggleMedicationArchiveAction(medToArchive.id, true);
      if (res.success) {
        toast.success(lang === "id" ? "Obat berhasil diarsipkan!" : "Medication archived successfully!");
        fetchDatabase(); 
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setIsProcessing(false);
      setMedToArchive(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!medToDelete) return;
    setIsProcessing(true);
    const res = await deleteMedicationAction(medToDelete.id);
    if (res.success) {
      toast.success(lang === 'id' ? "Obat berhasil dihapus permanen!" : "Medication deleted permanently!");
      setDeleteConfirmText("");
      fetchDatabase(); 
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal menghapus obat." : "Failed to delete medication."));
    }
    setIsProcessing(false);
    setMedToDelete(null);
  };

  const filteredMeds = medications.filter(med => 
    (med.name_id?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    (med.name_en?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
    med.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMeds.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredMeds.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const handlePageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val >= 1 && val <= totalPages) setCurrentPage(val);
  };

  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isSuperAdmin = userRole === "super_admin";

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      
      {/* 💡 MODAL HAPUS PERMANEN (TETAP SEBAGAI POP-UP DI HALAMAN GRID) */}
      {medToDelete && activeView === "grid" && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 border-t-8 border-red-600 relative overflow-hidden">
            <Trash2 className="absolute -right-4 -bottom-4 w-32 h-32 text-red-500/5 -rotate-12 pointer-events-none" />
            <div className="w-16 h-16 bg-red-100 dark:bg-slate-800 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"><AlertTriangle className="w-8 h-8"/></div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase tracking-tight relative z-10">
              {lang === 'id' ? "Hapus Permanen?" : "Delete Permanently?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed relative z-10">
              {lang === 'id' ? "Tindakan ini tidak bisa dibatalkan. Seluruh data dan relasi obat ini akan dihapus dari sistem." : "This action is irreversible. The medication and its data will be removed from the system."}
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 text-center relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {lang === "id" ? "Ketik nama obat untuk konfirmasi:" : "Type medication name to confirm:"}
              </span>
              <div className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 select-all bg-white dark:bg-slate-900 py-1 rounded border border-slate-200 dark:border-slate-700">
                {lang === "en" && medToDelete.name_en ? medToDelete.name_en : medToDelete.name_id}
              </div>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={lang === "id" ? "Ketik di sini..." : "Type here..."} className="h-10 w-full text-center text-xs font-bold bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 focus:border-red-500 outline-none rounded-lg transition-colors text-slate-800 dark:text-slate-200" />
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <Button onClick={handleDeleteConfirm} disabled={isProcessing || deleteConfirmText !== (lang === "en" && medToDelete.name_en ? medToDelete.name_en : medToDelete.name_id)} className="w-full h-12 bg-red-600 hover:bg-red-500 disabled:bg-red-400 dark:disabled:bg-red-900 text-white font-black uppercase rounded-xl shadow-lg shadow-red-500/20">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, HAPUS PERMANEN" : "YES, DELETE PERMANENTLY")}
              </Button>
              <Button variant="outline" onClick={() => { setMedToDelete(null); setDeleteConfirmText(""); }} disabled={isProcessing} className="w-full h-12 font-bold uppercase rounded-xl border-slate-200 dark:border-slate-700">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 MODAL PINDAH KE ARSIP (TETAP SEBAGAI POP-UP DI HALAMAN GRID) */}
      {medToArchive && activeView === "grid" && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Archive className="w-8 h-8"/></div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase tracking-tight">
              {lang === 'id' ? "Arsipkan Obat?" : "Archive Medication?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              {lang === 'id' ? <>Obat <strong>{medToArchive.name_id}</strong> akan disembunyikan dari daftar publik dan dipindahkan ke Data Arsip.</> : <>Medication <strong>{medToArchive.name_en}</strong> will be hidden from public lists and moved to the Archive Data.</>}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleArchiveConfirm} disabled={isProcessing} className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase rounded-xl shadow-lg shadow-amber-500/20">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, ARSIPKAN" : "YES, ARCHIVE")}
              </Button>
              <Button variant="outline" onClick={() => setMedToArchive(null)} disabled={isProcessing} className="w-full h-12 font-bold uppercase rounded-xl border-slate-200 dark:border-slate-700">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto pb-10">
        
        {/* ========================================================= */}
        {/* CONDITIONAL RENDERING: TAMPILAN FULL PAGE BERDASARKAN STATE */}
        {/* ========================================================= */}
        
        {activeView === "archive" ? (
          
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-amber-600 dark:text-amber-500 flex items-center gap-3">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
                    <Archive className="h-6 w-6 md:h-8 md:w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  {lang === 'id' ? "Arsip Database Obat" : "Medication Archive"}
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base font-medium">
                  {lang === 'id' ? "Daftar referensi obat yang telah disembunyikan atau dinonaktifkan dari sistem utama." : "List of medication references hidden or deactivated from the main system."}
                </p>
              </div>
              
              <Button onClick={() => setActiveView("grid")} className="relative z-10 h-12 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-6 rounded-xl shadow-md uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-[0.98]">
                <ChevronLeft className="w-4 h-4" /> {lang === 'id' ? "Kembali ke Database" : "Back to Database"}
              </Button>
            </div>
            
            <MedicationArchiveList onActionSuccess={fetchDatabase} />
          </div>

        ) : activeView === "form" ? (

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-sky-500/10 dark:bg-sky-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-sky-600 dark:text-sky-500 flex items-center gap-3">
                  <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-2xl">
                    <Pill className="h-6 w-6 md:h-8 md:w-8 text-sky-600 dark:text-sky-400" />
                  </div>
                  {formMode === "create" ? (lang === 'id' ? "Tambah Obat Baru" : "Add New Medication") : (lang === 'id' ? `Edit Obat: ${editingMedication?.name_id}` : `Edit Medication: ${editingMedication?.name_en}`)}
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base font-medium">
                  {lang === 'id' ? "Lengkapi spesifikasi medis, takaran dosis, dan profil keamanan dari obat." : "Complete medical specifications, dosage measurements, and safety profiles."}
                </p>
              </div>
              <Button onClick={() => setActiveView("grid")} className="relative z-10 h-12 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-6 rounded-xl shadow-md uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-[0.98]">
                <ChevronLeft className="w-4 h-4" /> {lang === 'id' ? "Kembali ke Database" : "Back to Database"}
              </Button>
            </div>

            {/* FORM COMPONENT */}
            <MedicationForm
              initialData={editingMedication}
              mode={formMode}
              onSaveAction={createMedicationAction}
              onUpdateAction={updateMedicationAction}
              onSuccess={() => { setActiveView("grid"); fetchDatabase(); }}
              onCancel={() => setActiveView("grid")}
            />
          </div>

        ) : (

          <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER TAMPILAN UTAMA (GRID) */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-sky-500/10 dark:bg-sky-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 w-full lg:w-auto">
                <h1 className="text-3xl md:text-4xl font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]">
                  <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-2xl">
                    <Pill className="h-6 w-6 md:h-8 md:w-8 text-sky-600 dark:text-sky-400" /> 
                  </div>
                  {lang === 'id' ? "Medication Database" : "Medication Database"}
                </h1>
                <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
                  {lang === 'id' ? "Ensiklopedia medis komprehensif. Pelajari dosis, keamanan bagi flora/fauna, dan standar tingkat kesembuhan baku obat-obatan aquascape." : "Comprehensive medical encyclopedia. Learn dosages, flora/fauna safety, and baseline recovery rates of aquascape medications."}
                </p>
                
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <Button onClick={(e) => { e.preventDefault(); setFormMode("create"); setEditingMedication(null); setActiveView("form"); }} className="h-11 bg-slate-800 hover:bg-slate-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold px-5 rounded-xl shadow-md uppercase tracking-wider text-xs flex items-center gap-2 transition-all active:scale-[0.98]">
                      <Plus className="w-4 h-4 font-black" /> {lang === 'id' ? "Tambah Obat" : "Add Medication"}
                    </Button>
                    
                    <Button variant="outline" onClick={() => setActiveView("archive")} className="h-11 px-5 rounded-xl border-amber-200 dark:border-amber-900/30 bg-amber-50/40 dark:bg-slate-950 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 flex items-center gap-2 transition-colors uppercase tracking-widest text-xs">
                      <Archive className="w-4 h-4" /> <span>{lang === 'id' ? "Arsip Obat" : "Med Archive"}</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="relative z-10 w-full lg:w-96 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input type="text" placeholder={lang === 'id' ? "Cari nama obat atau kandungan..." : "Search medication or active ingredient..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:ring-sky-500/20 font-medium w-full text-base" />
              </div>
            </div>

            {/* DATA GRID UTAMA */}
            {isLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-sky-500 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" /></div>
            ) : currentData.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                <FlaskConical className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">{lang === 'id' ? "Obat Tidak Ditemukan" : "Medication Not Found"}</h3>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentData.map((med, index) => (
                    <div key={med.id} className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all duration-300 hover:border-sky-300 dark:hover:border-sky-700 flex flex-col group">

                      <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start gap-4">
                          <div className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-sm shadow-[0_0_10px_rgba(14,165,233,0.3)] group-hover:scale-110 transition-transform">
                            {startIndex + index + 1}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormMode("edit"); setEditingMedication(med); setActiveView("form"); }} className="h-8 w-8 bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/40 rounded-lg shadow-sm transition-colors" title={lang === 'id' ? "Edit Data" : "Edit Data"}><Edit className="w-3.5 h-3.5" /></Button>
                              <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMedToArchive(med); }} className="h-8 w-8 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-500 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-lg shadow-sm transition-colors" title={lang === 'id' ? "Arsipkan Obat" : "Archive Meds"}><Archive className="w-3.5 h-3.5" /></Button>
                              {isSuperAdmin && (
                                <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMedToDelete(med); }} className="h-8 w-8 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg shadow-sm transition-colors" title={lang === 'id' ? "Hapus Permanen" : "Permanent Delete"}><Trash2 className="w-3.5 h-3.5" /></Button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-full"> 
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight break-words">{lang === 'id' ? med.name_id : med.name_en}</h3>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 rounded-lg text-xs font-black uppercase tracking-widest border border-sky-200 dark:border-sky-800/50 w-fit max-w-full">
                            <Beaker className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{med.active_ingredient}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex-1 space-y-5 relative z-10">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed min-h-[40px] break-words whitespace-normal">{lang === 'id' ? med.description_id : med.description_en}</p>
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{lang === 'id' ? 'Dosis Standar' : 'Standard Dosage'}</p>
                            <p className="text-lg font-black text-sky-600 dark:text-sky-400 drop-shadow-[0_0_5px_rgba(14,165,233,0.2)]">{med.base_dosage_per_100l} <span className="text-xs font-bold text-sky-700 dark:text-sky-500">{med.dosage_unit} / 100L</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{lang === 'id' ? 'Durasi' : 'Duration'}</p>
                            <p className="text-lg font-black text-slate-700 dark:text-slate-200">{med.treatment_duration_days} <span className="text-xs font-bold text-slate-500">{lang === 'id' ? 'Hari' : 'Days'}</span></p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${med.safe_for_plants ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400'}`}>
                            {med.safe_for_plants ? <Leaf className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'id' ? 'Tanaman' : 'Plants'}</span>
                          </div>
                          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${med.safe_for_inverts ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400'}`}>
                            {med.safe_for_inverts ? <Bug className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'id' ? 'Udang/Siput' : 'Inverts'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-100 dark:bg-slate-950/80 flex justify-between items-center rounded-b-3xl border-t border-slate-200 dark:border-slate-800 transition-colors relative z-10">
                        <div className="text-center flex-1 border-r border-slate-300 dark:border-slate-800">
                          <Activity className="w-5 h-5 mx-auto text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)] mb-1.5" />
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{lang === 'id' ? 'Skor Medis' : 'Med Score'}</p>
                          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{med.clinical_score_baseline}</p>
                        </div>
                        <div className="text-center flex-1 border-r border-slate-300 dark:border-slate-800">
                          <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] mb-1.5" />
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{lang === 'id' ? 'Standar Sembuh' : 'Success Base'}</p>
                          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{med.success_rate_baseline_pct}%</p>
                        </div>
                        <div className="text-center flex-1">
                          <Clock className="w-5 h-5 mx-auto text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] mb-1.5" />
                          <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">{lang === 'id' ? 'Rata-rata' : 'Avg Time'}</p>
                          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{med.avg_recovery_days_baseline} <span className="text-[10px]">{lang === 'id' ? 'Hari' : 'Days'}</span></p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm gap-4 transition-colors">
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
                      {lang === 'id' ? "Menampilkan" : "Showing"} <span className="font-bold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> {lang === 'id' ? "hingga" : "to"} <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMeds.length)}</span> {lang === 'id' ? "dari" : "of"} <span className="font-bold text-slate-900 dark:text-slate-100">{filteredMeds.length}</span> {lang === 'id' ? "obat" : "medications"}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronsLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="h-4 w-4" /></Button>
                      {pageNumbers.map(num => (
                        <Button key={num} variant={currentPage === num ? "default" : "outline"} onClick={() => setCurrentPage(num)} className={`h-9 w-9 p-0 text-sm font-bold transition-all ${currentPage === num ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-600 shadow-[0_0_10px_rgba(14,165,233,0.3)] scale-105' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                          {num}
                        </Button>
                      ))}
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronsRight className="h-4 w-4" /></Button>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-2 sm:ml-4 border-l border-slate-300 dark:border-slate-700 pl-2 sm:pl-4">
                        <span className="hidden sm:inline">{lang === 'id' ? "Hal" : "Page"}</span>
                        <Input type="number" min={1} max={totalPages} value={currentPage} onChange={handlePageInputChange} className="w-14 h-9 text-center bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-bold focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}