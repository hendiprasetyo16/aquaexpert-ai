// app/(dashboard)/dashboard/medications/page.tsx
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Pill, FlaskConical, Beaker, Leaf, Bug, AlertTriangle, ShieldCheck, Clock, Activity, Loader2, Search, Database, Edit, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Archive } from "lucide-react";
import { getMedicationsDatabaseAction, getUserRoleAction, deleteMedicationAction, MedicationDto } from "@/features/diseases/actions/medication.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Link from "next/link";

const ITEMS_PER_PAGE = 6;

export default function MedicationDatabasePage() {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [medications, setMedications] = useState<MedicationDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // ROLE-BASED ACCESS CONTROL (RBAC) STATE
  const [userRole, setUserRole] = useState<string>("user");
  const [medToDelete, setMedToDelete] = useState<MedicationDto | null>(null);
  const [medToArchive, setMedToArchive] = useState<MedicationDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDatabase = async () => {
    setIsLoading(true);
    const [roleRes, medsRes] = await Promise.all([
      getUserRoleAction(),
      getMedicationsDatabaseAction()
    ]);
    
    setUserRole(roleRes);
    if (medsRes.success) setMedications(medsRes.data);
    else toast.error(medsRes.error || (lang === 'id' ? "Gagal memuat database obat." : "Failed to load medication database."));
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDatabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FUNGSI HAPUS PERMANEN (KHUSUS SUPER ADMIN)
  const handleDeleteConfirm = async () => {
    if (!medToDelete) return;
    setIsProcessing(true);
    const res = await deleteMedicationAction(medToDelete.id);
    if (res.success) {
      toast.success(lang === 'id' ? "Obat berhasil dihapus permanen!" : "Medication deleted permanently!");
      fetchDatabase(); 
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal menghapus obat." : "Failed to delete medication."));
    }
    setIsProcessing(false);
    setMedToDelete(null);
  };

  // FUNGSI ARSIP (ADMIN & SUPER ADMIN)
  const handleArchiveConfirm = async () => {
    if (!medToArchive) return;
    setIsProcessing(true);
    // TODO: Ganti dengan Action Arsip sesungguhnya saat backend sudah siap
    setTimeout(() => {
      toast.success(lang === 'id' ? "Obat berhasil diarsipkan!" : "Medication archived successfully!");
      setIsProcessing(false);
      setMedToArchive(null);
    }, 1000);
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
      
      {/* MODAL HAPUS PERMANEN BILINGUAL (HANYA SUPER ADMIN) */}
      {medToDelete && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8"/></div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase tracking-tight">
              {lang === 'id' ? "Hapus Permanen?" : "Delete Permanently?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              {lang === 'id' 
                ? <>Anda yakin ingin menghapus <strong>{medToDelete.name_id}</strong> dari database? Tindakan ini tidak dapat dibatalkan.</>
                : <>Are you sure you want to delete <strong>{medToDelete.name_en}</strong> from the database? This action cannot be undone.</>
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleDeleteConfirm} disabled={isProcessing} className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black uppercase rounded-xl shadow-lg shadow-red-500/20">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (lang === 'id' ? "YA, HAPUS PERMANEN" : "YES, DELETE PERMANENTLY")}
              </Button>
              <Button variant="outline" onClick={() => setMedToDelete(null)} disabled={isProcessing} className="w-full h-12 font-bold uppercase rounded-xl border-slate-200 dark:border-slate-700">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ARSIP BILINGUAL (ADMIN & SUPER ADMIN) */}
      {medToArchive && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Archive className="w-8 h-8"/></div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase tracking-tight">
              {lang === 'id' ? "Arsipkan Obat?" : "Archive Medication?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              {lang === 'id' 
                ? <>Obat <strong>{medToArchive.name_id}</strong> akan disembunyikan dari daftar publik dan dipindahkan ke Data Arsip.</>
                : <>Medication <strong>{medToArchive.name_en}</strong> will be hidden from public lists and moved to the Archive Data.</>
              }
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

      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* HEADER DENGAN KONTROL ADMIN INLINE */}
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
              {lang === 'id' 
                ? "Ensiklopedia medis komprehensif. Pelajari dosis, keamanan bagi flora/fauna, dan standar tingkat kesembuhan baku obat-obatan aquascape."
                : "Comprehensive medical encyclopedia. Learn dosages, flora/fauna safety, and baseline recovery rates of aquascape medications."}
            </p>
            
            {/* TOMBOL TAMBAH & KELOLA KHUSUS ADMIN */}
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Button 
                  onClick={(e) => { e.preventDefault(); toast(lang === 'id' ? "Siap disambungkan ke Form Tambah!" : "Ready to connect to Add Form!", { icon: "➕"}); }} 
                  className="h-11 bg-slate-800 hover:bg-slate-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold px-5 rounded-xl shadow-md uppercase tracking-wider text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 font-black" /> {lang === 'id' ? "Tambah Obat" : "Add Medication"}
                </Button>
                <Link href="/dashboard/admin-panel" className="inline-flex items-center gap-2 h-11 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors">
                  <Database className="w-4 h-4" /> {lang === 'id' ? "Kelola Arsip" : "Manage Archive"}
                </Link>
              </div>
            )}
          </div>

          <div className="relative z-10 w-full lg:w-96 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              type="text"
              placeholder={lang === 'id' ? "Cari nama obat atau kandungan..." : "Search medication or active ingredient..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-sky-500 focus:ring-sky-500/20 font-medium w-full text-base"
            />
          </div>
        </div>

        {/* LOADING & DATA GRID */}
        {isLoading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-sky-500 drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" /></div>
        ) : currentData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-16 rounded-3xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
             <FlaskConical className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
             <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">
               {lang === 'id' ? "Obat Tidak Ditemukan" : "Medication Not Found"}
             </h3>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentData.map((med, index) => (
                <div key={med.id} className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all duration-300 hover:border-sky-300 dark:hover:border-sky-700 flex flex-col group">
                  
                  {/* WATERMARK OBAT (POINTER-EVENTS-NONE = TIDAK BISA DIKLIK/MENGHALANGI) */}
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700 z-0">
                    <FlaskConical className="w-48 h-48 text-sky-500" />
                  </div>

                  {/* KONTROL ADMIN INLINE (SELALU TAMPIL BAGI ADMIN, Z-INDEX TERTINGGI 50) */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 opacity-100 transition-opacity duration-300">
                      
                      {/* TOMBOL EDIT (Admin & Super Admin) */}
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast(lang === 'id' ? "Siap disambungkan ke Form Edit!" : "Ready for Edit Form!", { icon: "📝"}); }} 
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer" 
                        title={lang === 'id' ? "Edit Data" : "Edit Data"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* TOMBOL ARSIP (Admin & Super Admin) */}
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMedToArchive(med); }} 
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-500 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer" 
                        title={lang === 'id' ? "Arsipkan Obat" : "Archive Meds"}
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      {/* TOMBOL HAPUS PERMANEN (HANYA Super Admin) */}
                      {isSuperAdmin && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMedToDelete(med); }} 
                          className="p-2 bg-white dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer" 
                          title={lang === 'id' ? "Hapus Permanen" : "Permanent Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* HEADER KARTU OBAT */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden flex items-start gap-4 z-10">
                    <div className="absolute top-4 right-4 opacity-10 dark:opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500">
                      <FlaskConical className="w-20 h-20 md:w-24 md:h-24 text-sky-500 drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]" />
                    </div>

                    {/* NOMOR URUT */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-sm shadow-[0_0_10px_rgba(14,165,233,0.3)] group-hover:scale-110 transition-transform relative z-10 mt-1">
                      {startIndex + index + 1}
                    </div>
                    
                    {/* TEKS JUDUL (pr-32 agar teks tidak tertimpa 3 tombol admin di kanan atas) */}
                    <div className={`flex-1 relative z-10 min-w-0 ${isAdmin ? "pr-32" : "pr-4"}`}> 
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight break-words whitespace-normal">
                        {lang === 'id' ? med.name_id : med.name_en}
                      </h3>
                      <div className="inline-flex items-start gap-1.5 px-3 py-1.5 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-sky-200 dark:border-sky-800/50 w-fit max-w-full">
                        <Beaker className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
                        <span className="whitespace-normal break-words text-left leading-relaxed">
                          {med.active_ingredient}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DESKRIPSI & DOSIS */}
                  <div className="p-6 flex-1 space-y-5 relative z-10">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed min-h-[40px] break-words whitespace-normal">
                      {lang === 'id' ? med.description_id : med.description_en}
                    </p>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{lang === 'id' ? 'Dosis Standar' : 'Standard Dosage'}</p>
                        <p className="text-lg font-black text-sky-600 dark:text-sky-400 drop-shadow-[0_0_5px_rgba(14,165,233,0.2)]">
                          {med.base_dosage_per_100l} <span className="text-xs font-bold text-sky-700 dark:text-sky-500">{med.dosage_unit} / 100L</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{lang === 'id' ? 'Durasi' : 'Duration'}</p>
                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                          {med.treatment_duration_days} <span className="text-xs font-bold text-slate-500">{lang === 'id' ? 'Hari' : 'Days'}</span>
                        </p>
                      </div>
                    </div>

                    {/* INDIKATOR KEAMANAN FLORA & FAUNA */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                        med.safe_for_plants 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)] dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)] dark:shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                      }`}>
                        {med.safe_for_plants ? <Leaf className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'id' ? 'Tanaman' : 'Plants'}</span>
                      </div>
                      
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                        med.safe_for_inverts 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)] dark:shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.05)] dark:shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                      }`}>
                        {med.safe_for_inverts ? <Bug className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'id' ? 'Udang/Siput' : 'Inverts'}</span>
                      </div>
                    </div>
                  </div>

                  {/* STANDAR MEDIS (BASELINE AI) */}
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

            {/* PAGINATION UI */}
            {totalPages > 1 && (
              <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm gap-4 transition-colors">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
                  {lang === 'id' ? "Menampilkan" : "Showing"} <span className="font-bold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> {lang === 'id' ? "hingga" : "to"} <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMeds.length)}</span> {lang === 'id' ? "dari" : "of"} <span className="font-bold text-slate-900 dark:text-slate-100">{filteredMeds.length}</span> {lang === 'id' ? "obat" : "medications"}
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {pageNumbers.map(num => (
                    <Button
                      key={num}
                      variant={currentPage === num ? "default" : "outline"}
                      onClick={() => setCurrentPage(num)}
                      className={`h-9 w-9 p-0 text-sm font-bold transition-all ${
                        currentPage === num 
                          ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-600 shadow-[0_0_10px_rgba(14,165,233,0.3)] scale-105' 
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {num}
                    </Button>
                  ))}

                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-9 w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-2 sm:ml-4 border-l border-slate-300 dark:border-slate-700 pl-2 sm:pl-4">
                    <span className="hidden sm:inline">{lang === 'id' ? "Hal" : "Page"}</span>
                    <Input 
                      type="number" min={1} max={totalPages} value={currentPage}
                      onChange={handlePageInputChange}
                      className="w-14 h-9 text-center bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-bold focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}