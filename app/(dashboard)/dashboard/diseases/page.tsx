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
import toast from "react-hot-toast";

import type { Disease } from "@/features/diseases/types/disease.types";
import { 
  getAdminDiseasesAction, 
  toggleDiseaseArchiveAction, 
  hardDeleteDiseaseAction as deleteDiseasePermanentAction
} from "@/features/diseases/actions/disease.actions"; // <-- GANTI JADI INI
const ITEMS_PER_PAGE = 10;

export default function DiseaseDatabasePage() {
  const router = useRouter();
  const { role } = useAuth();
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE UNTUK PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  // STATE UNTUK MODAL KONFIRMASI
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

  // Reset ke halaman 1 jika user melakukan pencarian baru
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // FUNGSI EKSEKUSI SUPER ADMIN
  const handleToggleArchive = async () => {
    if (!archiveTarget) return;
    setIsSubmitting(true);
    
    const res = await toggleDiseaseArchiveAction(archiveTarget.id, archiveTarget.isActive);
    if (res.success) {
      toast.success(archiveTarget.isActive ? "Penyakit berhasil diarsipkan." : "Penyakit diaktifkan kembali.");
      fetchData();
    } else {
      toast.error(res.error || "Gagal mengubah status.");
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
      toast.error(res.error || "Gagal menghapus.");
    }
    
    setIsSubmitting(false);
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  // FILTERING & PAGINATION LOGIC
  const filteredDiseases = useMemo(() => {
    return diseases.filter(d => 
      d.name_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.name_en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [diseases, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDiseases.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredDiseases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Jika bukan Admin/Super Admin, tolak akses (kembalikan ke dashboard umum)
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
              {lang === 'id' ? "Database Patogen" : "Pathogen Database"}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
              {lang === 'id' ? "Manajemen master data penyakit, gejala, dan pengobatan." : "Master data management for diseases, symptoms, and treatments."}
            </p>
          </div>

          {role === "super_admin" && (
            <Button 
              onClick={() => router.push("/dashboard/diseases/create")} 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5 mr-2" /> {lang === 'id' ? "Tambah Data" : "Add Record"}
            </Button>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={lang === 'id' ? "Cari nama penyakit..." : "Search disease name..."}
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
              <p className="font-bold animate-pulse">Memuat database patogen...</p>
            </div>
          ) : filteredDiseases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500 border-2 border-dashed border-slate-200 m-6 rounded-2xl">
              <Stethoscope className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">Data penyakit tidak ditemukan.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase font-black text-[11px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-5 w-16 text-center">No</th>
                      <th className="px-6 py-5">Nama Penyakit</th>
                      <th className="px-6 py-5">Kategori</th>
                      <th className="px-6 py-5 text-center">Tingkat Bahaya</th>
                      <th className="px-6 py-5 text-center">Status</th>
                      <th className="px-6 py-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 font-medium">
                    {currentData.map((disease, idx) => (
                      <tr key={disease.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!disease.is_active ? 'opacity-60 grayscale-[50%]' : ''}`}>
                        
                        {/* PENOMORAN DINAMIS */}
                        <td className="px-6 py-4 text-center font-bold text-slate-400">
                          {startIndex + idx + 1}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-base text-slate-900 dark:text-slate-100">{lang === 'id' ? disease.name_id : disease.name_en}</p>
                          <p className="text-xs text-slate-500 italic mt-0.5">{disease.scientific_name || "Unknown pathogen"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {disease.disease_category || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                            disease.severity === 5 ? 'bg-red-100 text-red-700 border-red-200' 
                            : disease.severity === 4 ? 'bg-orange-100 text-orange-700 border-orange-200' 
                            : disease.severity === 3 ? 'bg-amber-100 text-amber-700 border-amber-200' 
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {disease.severity === 5 ? "KRITIS (5/5)" : disease.severity === 4 ? "SANGAT TINGGI (4/5)" : disease.severity === 3 ? "SEDANG (3/5)" : `RENDAH (${disease.severity || 1}/5)`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {disease.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5" /> AKTIF</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-100"><Archive className="w-3.5 h-3.5" /> ARSIP</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" title="View Detail" className="w-9 h-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                              <Eye className="w-4 h-4" />
                            </Button>

                            {role === "super_admin" && (
                              <>
                                <Button variant="ghost" size="icon" title="Edit Data" onClick={() => router.push(`/dashboard/diseases/${disease.id}/edit`)} className="w-9 h-9 text-slate-400 hover:text-teal-600 hover:bg-teal-50">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setArchiveTarget({ id: disease.id, name: disease.name_id, isActive: disease.is_active || false })} title={disease.is_active ? "Arsipkan" : "Aktifkan"} className="w-9 h-9 text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                  <Archive className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget({ id: disease.id, name: disease.name_id }); setDeleteConfirmText(""); }} title="Hapus Permanen" className="w-9 h-9 text-slate-400 hover:text-red-600 hover:bg-red-50">
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

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-slate-500 font-medium">
                    {lang === 'id' ? "Menampilkan" : "Showing"} <span className="text-slate-800 dark:text-slate-200 font-bold">{startIndex + 1}</span> {lang === 'id' ? "hingga" : "to"} <span className="text-slate-800 dark:text-slate-200 font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredDiseases.length)}</span> {lang === 'id' ? "dari" : "of"} <span className="text-slate-800 dark:text-slate-200 font-bold">{filteredDiseases.length}</span> data
                  </p>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentPage(1)} 
                      disabled={currentPage === 1} 
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                      disabled={currentPage === 1} 
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm border border-blue-100 dark:border-blue-800">
                      {currentPage} / {totalPages}
                    </div>

                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                      disabled={currentPage === totalPages} 
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setCurrentPage(totalPages)} 
                      disabled={currentPage === totalPages} 
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* =========================================================
          MODAL 1: KONFIRMASI ARSIP/AKTIFKAN
      ========================================================= */}
      {archiveTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 ${archiveTarget.isActive ? 'border-amber-500' : 'border-emerald-500'}`}>
            <h3 className="text-2xl font-black mb-2">{archiveTarget.isActive ? "Arsipkan Data?" : "Aktifkan Data?"}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
              {archiveTarget.isActive 
                ? `Penyakit "${archiveTarget.name}" akan disembunyikan dari mesin pakar AI dan tidak bisa didiagnosa oleh pengguna.` 
                : `Penyakit "${archiveTarget.name}" akan diaktifkan kembali dan bisa dideteksi oleh mesin pakar AI.`}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleToggleArchive} disabled={isSubmitting} className={`w-full h-12 rounded-xl font-black uppercase tracking-widest text-white shadow-lg ${archiveTarget.isActive ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"}`}>
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "KONFIRMASI"}
              </Button>
              <Button variant="ghost" onClick={() => setArchiveTarget(null)} disabled={isSubmitting} className="w-full h-12 rounded-xl text-slate-500 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Batal</Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: KONFIRMASI HAPUS PERMANEN (SUPER ADMIN)
      ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center rounded-full mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-center text-red-600 mb-2">Hapus Permanen</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 font-medium">
              Data patogen <strong className="text-slate-900 dark:text-slate-200">{deleteTarget.name}</strong> beserta seluruh relasi obat dan gejalanya akan dihapus. Ini tidak bisa dibatalkan.
            </p>
            <form onSubmit={handleDeletePermanent}>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                <label className="text-[10px] font-black uppercase text-red-500 tracking-widest block mb-2 text-center">Ketik nama penyakit untuk konfirmasi:</label>
                <div className="text-center font-bold text-slate-800 dark:text-slate-200 mb-2 select-all bg-white dark:bg-slate-900 py-1 border border-slate-200 dark:border-slate-700 rounded shadow-sm">{deleteTarget.name}</div>
                <input 
                  type="text" required value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border-2 border-red-200 dark:border-red-900/50 focus:border-red-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none text-sm text-center font-bold transition-colors"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isSubmitting || deleteConfirmText !== deleteTarget.name} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/20 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "HAPUS SEKARANG"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => {setDeleteTarget(null); setDeleteConfirmText("");}} className="w-full h-12 rounded-xl text-slate-500 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Batal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}