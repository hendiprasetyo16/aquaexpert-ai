// app/(dashboard)/dashboard/diseases/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  Stethoscope, Search, Plus, Loader2, Edit, Trash2, Archive, 
  CheckCircle2, AlertTriangle, Eye, ShieldAlert, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // <-- Pastikan komponen Input sudah di-import
import toast from "react-hot-toast";

import type { Disease } from "@/features/diseases/types/disease.types";
import { 
  getAdminDiseasesAction, 
  toggleDiseaseArchiveAction, 
  hardDeleteDiseaseAction as deleteDiseasePermanentAction
} from "@/features/diseases/actions/disease.actions"; 

import { DiseaseDetailModal } from "@/features/diseases/components/DiseaseDetailModal";

const ITEMS_PER_PAGE = 10;

export default function DiseaseDatabasePage() {
  const router = useRouter();
  const { role } = useAuth();
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";

  const rootDict = (dict as Record<string, unknown>) || {};
  const listDict = (rootDict?.diseaseList as Record<string, string>) || {};
  const arcDict = (rootDict?.diseaseArchiveList as Record<string, string>) || {};

  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [viewDetailTarget, setViewDetailTarget] = useState<Disease | null>(null); 
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await getAdminDiseasesAction();
    if (res.success && res.data) {
      setDiseases(res.data);
    } else {
      toast.error(lang === 'id' ? "Gagal memuat database patogen." : "Failed to load pathogen database.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleToggleArchive = async () => {
    if (!archiveTarget) return;
    setIsSubmitting(true);
    
    const res = await toggleDiseaseArchiveAction(archiveTarget.id, archiveTarget.isActive);
    if (res.success) {
      toast.success(archiveTarget.isActive 
        ? (lang === 'id' ? "Penyakit diarsipkan." : "Disease archived.") 
        : (lang === 'id' ? "Penyakit dipulihkan." : "Disease restored.")
      );
      fetchData();
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal mengubah status." : "Failed to toggle status."));
    }
    setIsSubmitting(false);
    setArchiveTarget(null);
  };

  const handleDeletePermanent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    if (deleteConfirmText !== deleteTarget.name) {
      toast.error(lang === 'id' ? "Nama tidak cocok!" : "Name mismatch!");
      return;
    }

    setIsSubmitting(true);
    const res = await deleteDiseasePermanentAction(deleteTarget.id);
    if (res.success) {
      toast.success(lang === 'id' ? "Data dihapus permanen!" : "Data permanently deleted!");
      fetchData();
    } else {
      toast.error(res.error || (lang === 'id' ? "Gagal menghapus." : "Failed to delete."));
    }
    setIsSubmitting(false);
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  const filteredDiseases = useMemo(() => {
    return diseases.filter(d => 
      d.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.name_en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [diseases, searchQuery]);

  // =========================================================================
  // LOGIKA PAGINATION BERBENTUK ANGKA (Diadopsi dari Modul Plants)
  // =========================================================================
  const totalPages = Math.max(1, Math.ceil(filteredDiseases.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredDiseases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
  // =========================================================================

  const translateCategory = (cat: string | null | undefined) => {
    if (!cat) return "General";
    if (lang === 'en') return cat;
    const map: Record<string, string> = {
      "Parasitic": "Parasit",
      "Bacterial": "Bakteri",
      "Fungal": "Jamur",
      "Viral": "Virus",
      "Environmental": "Lingkungan",
      "Nutritional": "Nutrisi",
      "Protozoan": "Protozoa",
      "Genetic": "Genetik"
    };
    return map[cat] || cat;
  };

  if (role === "user") {
    if (typeof window !== "undefined") router.replace("/dashboard");
    return null;
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-3">
              <Stethoscope className="w-8 h-8" /> 
              {listDict.title || (lang === 'id' ? "Database Patogen" : "Pathogen Database")}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
              {listDict.subtitle || (lang === 'id' ? "Manajemen master data penyakit, gejala, dan pengobatan." : "Master data management for diseases, symptoms, and treatments.")}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            {role === "super_admin" && (
              <Button 
                onClick={() => router.push("/dashboard/diseases/create")} 
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5 mr-2" /> {listDict.btnAdd || (lang === 'id' ? "Tambah Data" : "Add Record")}
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={listDict.searchPlaceholder || (lang === 'id' ? "Cari nama penyakit..." : "Search disease name...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-blue-500 outline-none font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          />
        </div>

        {/* TABLE DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <p className="font-bold animate-pulse">{listDict.loading || (lang === 'id' ? "Memuat data..." : "Loading data...")}</p>
            </div>
          ) : filteredDiseases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 m-6 rounded-2xl">
              <Stethoscope className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">{listDict.empty || (lang === 'id' ? "Tidak ada penyakit yang ditemukan." : "No diseases found.")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase font-black text-[11px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-5 w-16 text-center">No</th>
                      <th className="px-6 py-5">{listDict.colName || (lang === 'id' ? "Nama Penyakit" : "Disease Name")}</th>
                      <th className="px-6 py-5">{listDict.colCategory || (lang === 'id' ? "Kategori" : "Category")}</th>
                      <th className="px-6 py-5 text-center">{listDict.colSeverity || (lang === 'id' ? "Tingkat Bahaya" : "Severity")}</th>
                      <th className="px-6 py-5 text-center">{listDict.colStatus || (lang === 'id' ? "Status" : "Status")}</th>
                      <th className="px-6 py-5 text-right">{listDict.colAction || (lang === 'id' ? "Aksi" : "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 font-medium">
                    {currentData.map((disease, idx) => (
                      <tr key={disease.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!disease.is_active ? 'opacity-60 grayscale-[50%]' : ''}`}>
                        
                        <td className="px-6 py-4 text-center font-bold text-slate-400">
                          {startIndex + idx + 1}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-base text-slate-900 dark:text-slate-100">{lang === 'id' ? disease.name_id : disease.name_en}</p>
                          <p className="text-xs text-slate-500 italic mt-0.5">{disease.scientific_name || "Unknown pathogen"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {translateCategory(disease.disease_category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                            disease.severity === 5 ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' 
                            : disease.severity === 4 ? 'bg-orange-500 text-white border-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)]' /* FIX: Oranye solid agar terbaca di mode gelap */
                            : disease.severity === 3 ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' 
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                          }`}>
                            {disease.severity === 5 ? `${listDict.badgeDanger || (lang === 'id' ? "KRITIS" : "CRITICAL")} (5/5)` : 
                             disease.severity === 4 ? `${listDict.badgeHigh || (lang === 'id' ? "SANGAT TINGGI" : "VERY HIGH")} (4/5)` : 
                             disease.severity === 3 ? `${listDict.badgeMedium || (lang === 'id' ? "SEDANG" : "MEDIUM")} (3/5)` : 
                             `${listDict.badgeLow || (lang === 'id' ? "RENDAH" : "LOW")} (${disease.severity || 1}/5)`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {disease.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30"><CheckCircle2 className="w-3.5 h-3.5" /> {listDict.statusActive || (lang === 'id' ? "AKTIF" : "ACTIVE")}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30"><Archive className="w-3.5 h-3.5" /> {listDict.statusArchived || (lang === 'id' ? "ARSIP" : "ARCHIVED")}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" title={listDict.btnDetail || (lang === 'id' ? "Lihat Detail" : "View Details")} onClick={() => setViewDetailTarget(disease)} className="w-9 h-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400">
                              <Eye className="w-4 h-4" />
                            </Button>

                            {role === "super_admin" && (
                              <>
                                <Button variant="ghost" size="icon" title={listDict.btnEdit || (lang === 'id' ? "Edit Data" : "Edit")} onClick={() => router.push(`/dashboard/diseases/${disease.id}/edit`)} className="w-9 h-9 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 dark:hover:text-teal-400">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setArchiveTarget({ id: disease.id, name: lang === 'id' ? disease.name_id : disease.name_en, isActive: disease.is_active || false })} title={disease.is_active ? (listDict.btnArchive || (lang === 'id' ? "Arsipkan" : "Archive")) : (listDict.btnRestore || (lang === 'id' ? "Aktifkan" : "Restore"))} className="w-9 h-9 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 dark:hover:text-amber-400">
                                  <Archive className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget({ id: disease.id, name: lang === 'id' ? disease.name_id : disease.name_en }); setDeleteConfirmText(""); }} title={listDict.btnHardDelete || (lang === 'id' ? "Hapus Permanen" : "Hard Delete")} className="w-9 h-9 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ========================================================================= */}
              {/* UI PAGINATION BERBENTUK ANGKA (Diadopsi dari Modul Plants)               */}
              {/* ========================================================================= */}
              {totalPages > 1 && (
                <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 gap-4 transition-colors">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
                    {listDict.paginationShowing || (lang === 'id' ? "Menampilkan" : "Showing")} <span className="font-medium text-gray-900 dark:text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {listDict.paginationTo || (lang === 'id' ? "hingga" : "to")} <span className="font-medium text-gray-900 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDiseases.length)}</span> {listDict.paginationOf || (lang === 'id' ? "dari" : "of")} <span className="font-medium text-gray-900 dark:text-slate-200">{filteredDiseases.length}</span> {listDict.paginationData || (lang === 'id' ? "data" : "records")}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {pageNumbers.map(num => (
                      <Button
                        key={num}
                        variant={currentPage === num ? "default" : "outline"}
                        onClick={() => setCurrentPage(num)}
                        className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium transition-all ${
                          currentPage === num 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md shadow-blue-600/20 scale-105' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}

                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-2 sm:ml-4 border-l border-slate-300 dark:border-slate-700 pl-2 sm:pl-4 transition-colors">
                      <span className="hidden sm:inline">Hal</span>
                      <Input 
                        type="number" min={1} max={totalPages} value={currentPage}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 1 && val <= totalPages) setCurrentPage(val);
                        }}
                        className="w-14 h-8 text-center bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 transition-colors"
                      />
                      <span className="hidden sm:inline">/ {totalPages}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* VIEW DETAIL MODAL */}
      {viewDetailTarget && (
        <DiseaseDetailModal 
          disease={viewDetailTarget}
          isOpen={viewDetailTarget !== null}
          onClose={() => setViewDetailTarget(null)}
          lang={lang}
        />
      )}

      {/* MODAL ARSIP / AKTIFKAN */}
      {archiveTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 ${archiveTarget.isActive ? 'border-amber-500' : 'border-emerald-500'}`}>
            <h3 className="text-2xl font-black mb-2 dark:text-slate-100">{archiveTarget.isActive ? (arcDict.modalArchiveTitle || (lang === 'id' ? "Arsipkan Data?" : "Archive Data?")) : (arcDict.modalRestoreTitle || (lang === 'id' ? "Aktifkan Data?" : "Restore Data?"))}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
              {lang === 'id' ? `Ubah status "${archiveTarget.name}"?` : `Change status for "${archiveTarget.name}"?`}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleToggleArchive} disabled={isSubmitting} className={`w-full h-12 rounded-xl font-black uppercase tracking-widest text-white shadow-lg ${archiveTarget.isActive ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"}`}>
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (arcDict.btnConfirmRestore || "KONFIRMASI")}
              </Button>
              <Button variant="ghost" onClick={() => setArchiveTarget(null)} disabled={isSubmitting} className="w-full h-12 rounded-xl text-slate-500 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">{arcDict.cancel || "Batal"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS PERMANEN */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center rounded-full mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-center text-red-600 mb-2">{arcDict.modalDeleteTitle || (lang === 'id' ? "Hapus Permanen" : "Hard Delete")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 font-medium">
              {arcDict.modalDeleteDesc1 || (lang === 'id' ? "Data patogen akan dihapus." : "Pathogen data will be deleted.")} <strong className="text-slate-900 dark:text-slate-200">{deleteTarget.name}</strong>. {arcDict.modalDeleteDesc2 || (lang === 'id' ? "Tidak dapat dibatalkan." : "Cannot be undone.")}
            </p>
            <form onSubmit={handleDeletePermanent}>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                <label className="text-[10px] font-black uppercase text-red-500 tracking-widest block mb-2 text-center">{arcDict.typeDiseaseName || (lang === 'id' ? "Ketik nama untuk konfirmasi" : "Type name to confirm")}:</label>
                <div className="text-center font-bold text-slate-800 dark:text-slate-200 mb-2 select-all bg-white dark:bg-slate-900 py-1 border border-slate-200 dark:border-slate-700 rounded shadow-sm">{deleteTarget.name}</div>
                <input 
                  type="text" required value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border-2 border-red-200 dark:border-red-900/50 focus:border-red-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none text-sm text-center font-bold transition-colors"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting || deleteConfirmText !== deleteTarget.name} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/20 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (arcDict.btnConfirmDelete || "HAPUS SEKARANG")}
                </Button>
                <Button type="button" variant="ghost" onClick={() => {setDeleteTarget(null); setDeleteConfirmText("");}} className="w-full h-12 rounded-xl text-slate-500 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">{arcDict.cancel || "Batal"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}