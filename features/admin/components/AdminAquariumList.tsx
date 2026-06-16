// features/admin/components/AdminAquariumList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPortal } from "react-dom"; 
import { useLanguage } from "@/providers/LanguageProvider";
import { 
  getAdminAllAquariumsAction, 
  adminDeleteAquariumAction, 
  adminToggleArchiveAquariumAction 
} from "@/features/aquariums/actions/aquarium.actions";
import { Aquarium } from "@/features/aquariums/types/aquarium.types";
import { 
  ArrowLeft, Search, Loader2, Container, Archive, CheckCircle2, 
  Eye, Droplets, CalendarDays, ShieldAlert, Clock, User, Trash2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AdminAquariumList() {
  const router = useRouter();
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [mounted, setMounted] = useState(false);
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // STATE UNTUK CUSTOM MODALS
  const [archiveTarget, setArchiveTarget] = useState<{ id: string, name: string, is_active: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await getAdminAllAquariumsAction();
    if (res.success && res.data) {
      setAquariums(res.data as Aquarium[]);
    } else {
      setError(res.error || "Gagal memuat data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeToggleArchive = async () => {
    if (!archiveTarget) return;
    
    setActionLoading(archiveTarget.id);
    const res = await adminToggleArchiveAquariumAction(archiveTarget.id, archiveTarget.is_active);
    
    if (res.success) {
      toast.success(archiveTarget.is_active 
        ? (lang === 'id' ? "Akuarium diarsipkan" : "Aquarium archived") 
        : (lang === 'id' ? "Akuarium diaktifkan kembali" : "Aquarium reactivated")
      );
      fetchData();
    } else {
      toast.error(res.error || "Gagal merubah status");
    }
    
    setActionLoading(null);
    setArchiveTarget(null);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    
    setActionLoading(deleteTarget.id);
    const res = await adminDeleteAquariumAction(deleteTarget.id);
    
    if (res.success) {
      toast.success(lang === 'id' ? "Akuarium dihapus permanen" : "Aquarium permanently deleted");
      fetchData();
    } else {
      toast.error(res.error || "Gagal menghapus");
    }
    
    setActionLoading(null);
    setDeleteTarget(null);
    setDeleteConfirmation("");
  };

  const filteredAquariums = aquariums.filter(aq => {
    const safeName = aq.name || "";
    const safeType = aq.tank_type || "";
    const safeEmail = aq.owner?.email || "";
    
    const matchSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        safeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        safeEmail.toLowerCase().includes(searchQuery.toLowerCase());
                        
    const matchFilter = filter === "all" ? true : filter === "active" ? aq.is_active : !aq.is_active;
    
    return matchSearch && matchFilter;
  });

  const totalActive = aquariums.filter(a => a.is_active).length;
  const totalArchived = aquariums.filter(a => !a.is_active).length;

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Button 
            onClick={() => router.push("/dashboard/admin-panel")}
            variant="ghost" 
            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 pl-0 mb-2 font-bold -ml-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> {lang === 'id' ? "Kembali ke Admin Panel" : "Back to Admin Panel"}
          </Button>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-500" />
            {lang === 'id' ? "Semua Akuarium" : "All Aquariums"}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {lang === 'id' ? "Akses Superadmin: Pantau, arsipkan, atau hapus ekosistem pengguna." : "Superadmin Access: Monitor, archive, or delete user ecosystems."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">{lang === 'id' ? "Memuat database..." : "Loading database..."}</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl border border-red-200 text-center font-bold">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* STATS & FILTER BAR */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
              <button onClick={() => setFilter("all")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filter === 'all' ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                {lang === 'id' ? `Semua (${aquariums.length})` : `All (${aquariums.length})`}
              </button>
              <button onClick={() => setFilter("active")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'active' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                <CheckCircle2 className="w-4 h-4" /> {lang === 'id' ? `Aktif (${totalActive})` : `Active (${totalActive})`}
              </button>
              <button onClick={() => setFilter("archived")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'archived' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                <Archive className="w-4 h-4" /> {lang === 'id' ? `Diarsipkan (${totalArchived})` : `Archived (${totalArchived})`}
              </button>
            </div>

            <div className="relative w-full lg:w-96 shrink-0">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={lang === 'id' ? "Cari nama tank atau email user..." : "Search tank name or user email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-indigo-500 outline-none font-semibold transition-colors"
              />
            </div>
          </div>

          {/* GRID KARTU AKUARIUM */}
          {filteredAquariums.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 font-medium">
              {lang === 'id' ? "Tidak ada akuarium yang cocok dengan pencarian." : "No aquariums match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAquariums.map(aq => (
                <div key={aq.id} className={`group flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${!aq.is_active ? 'border-amber-200 dark:border-amber-900/50 opacity-80' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                  
                  {/* Gambar Cover */}
                  <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {aq.image_url ? (
                      <Image src={aq.image_url} alt={aq.name || "Aquarium"} fill className={`object-cover transition-transform duration-700 group-hover:scale-105 ${!aq.is_active && 'grayscale'}`} unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-400">
                        <Container className="w-12 h-12 opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {!aq.is_active ? (
                        <span className="px-2.5 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase rounded-lg shadow-sm flex items-center gap-1.5"><Archive className="w-3 h-3"/> ARCHIVED</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-teal-500/90 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase rounded-lg shadow-sm flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> ACTIVE</span>
                      )}
                    </div>

                    {/* FUNGSI ADMIN: TOMBOL HAPUS & ARSIP ELEGANT (GLASSMORPHISM) */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0">
                      <Button 
                        size="icon" 
                        className="h-8 w-8 bg-white/90 backdrop-blur-md border border-white/30 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 rounded-lg shadow-lg transition-colors"
                        onClick={() => setArchiveTarget({ id: aq.id, name: aq.name || "Unnamed", is_active: aq.is_active })}
                        disabled={actionLoading === aq.id}
                        title={lang === 'id' ? "Ubah Status Arsip" : "Toggle Archive"}
                      >
                        {actionLoading === aq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                      </Button>
                      <Button 
                        size="icon" 
                        className="h-8 w-8 bg-white/90 backdrop-blur-md border border-white/30 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg shadow-lg transition-colors"
                        onClick={() => setDeleteTarget({ id: aq.id, name: aq.name || "Unnamed" })}
                        disabled={actionLoading === aq.id}
                        title={lang === 'id' ? "Hapus Permanen" : "Delete Permanently"}
                      >
                        {actionLoading === aq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Info Meta */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate mb-1">
                      {aq.name || (lang === "id" ? "Akuarium Tanpa Nama" : "Unnamed Aquarium")}
                    </h3>
                    
                    {/* INFO PEMILIK (USER) - DESAIN PREMIUM GRADIENT */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mb-4 relative overflow-hidden group/owner shadow-inner">
                      {/* Ikon Background Transparan */}
                      <div className="absolute -right-3 -top-3 text-indigo-500/5 dark:text-indigo-400/5 transition-transform duration-500 group-hover/owner:scale-110">
                        <User className="w-20 h-20" />
                      </div>
                      
                      <div className="relative z-10 flex items-center gap-2.5 text-sm font-black text-indigo-900 dark:text-indigo-100 mb-1.5 truncate">
                        <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-500/30">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        {aq.owner?.full_name || aq.owner?.email || "Unknown User"}
                      </div>
                      <div className="relative z-10 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600/80 dark:text-indigo-300/80 pl-[34px]">
                        {lang === 'id' ? "Login Terakhir:" : "Last Login:"} <span className="text-indigo-700 dark:text-indigo-300">{formatDateTime(aq.owner?.last_login_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mb-4">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm"><Container className="w-3.5 h-3.5 text-indigo-500" /> {aq.tank_type || "Custom"}</span>
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm"><Droplets className="w-3.5 h-3.5 text-blue-500" /> {aq.volume_liters || 0} L</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] font-semibold text-slate-400 flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" /> Setup: {aq.setup_date || "-"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {lang === 'id' ? "Dibuat:" : "Created:"} {formatDateTime(aq.created_at)}
                          </span>
                        </div>
                        <Button 
                          onClick={() => router.push(`/dashboard/my-aquarium/${aq.id}`)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl h-10 px-4 text-xs font-bold transition-colors shadow-sm shrink-0"
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> {lang === 'id' ? "Lihat Detail" : "View"}
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL 1: KONFIRMASI ARSIP/AKTIFKAN
      ========================================================= */}
      {mounted && archiveTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 ${archiveTarget.is_active ? 'border-amber-500' : 'border-teal-500'}`}>
            <div className={`flex items-center gap-3 mb-5 ${archiveTarget.is_active ? 'text-amber-500' : 'text-teal-500'}`}>
              <Archive className="w-8 h-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">
                {archiveTarget.is_active ? (lang === 'id' ? "Arsipkan?" : "Archive?") : (lang === 'id' ? "Aktifkan?" : "Reactivate?")}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              {archiveTarget.is_active 
                ? (lang === 'id' ? `Anda akan menyembunyikan akuarium "${archiveTarget.name}" dari pengguna.` : `You are about to hide "${archiveTarget.name}" from the user.`)
                : (lang === 'id' ? `Anda akan mengembalikan akuarium "${archiveTarget.name}" ke dashboard utama pengguna.` : `You are about to restore "${archiveTarget.name}" to the user's dashboard.`)
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={executeToggleArchive} disabled={actionLoading === archiveTarget.id} className={`w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg text-white transition-colors ${archiveTarget.is_active ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"}`}>
                {actionLoading === archiveTarget.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "KONFIRMASI" : "CONFIRM")}
              </Button>
              <Button variant="ghost" onClick={() => setArchiveTarget(null)} disabled={actionLoading === archiveTarget.id} className="w-full h-12 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase tracking-wider">
                {lang === 'id' ? "Batal" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================
          MODAL 2: KONFIRMASI HAPUS PERMANEN DENGAN PENGAMAN EKSTRA
      ========================================================= */}
      {mounted && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border-t-8 border-red-600 relative overflow-hidden">
            
            {/* Background Icon Detail */}
            <Trash2 className="absolute -right-4 -bottom-4 w-32 h-32 text-red-500/5 -rotate-12" />

            <button onClick={() => {setDeleteTarget(null); setDeleteConfirmation("");}} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5 text-red-600 relative z-10">
              <ShieldAlert className="h-8 w-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight">{lang === 'id' ? "Hapus Total" : "Purge Data"}</h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed font-medium relative z-10">
              {lang === 'id' ? "Peringatan! Akuarium ini dan seluruh datanya (ikan, tanaman, parameter) akan " : "Warning! This aquarium and all its data will be "}
              <strong className="text-red-500">{lang === 'id' ? "TERHAPUS PERMANEN" : "PERMANENTLY DELETED"}</strong>.
            </p>

            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/50 mb-6 relative z-10 shadow-inner">
              <label className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 block">
                {lang === 'id' ? "Ketik nama akuarium di bawah untuk konfirmasi:" : "Type the aquarium name below to confirm:"}
              </label>
              <div className="text-sm font-black text-slate-800 dark:text-slate-200 mb-3 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center select-all shadow-sm">
                {deleteTarget.name}
              </div>
              <input 
                type="text" 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={deleteTarget.name}
                className="w-full h-11 px-3 rounded-lg border-2 border-red-200 focus:border-red-500 bg-white dark:bg-slate-900 outline-none text-sm text-center font-bold transition-colors placeholder:font-medium placeholder:text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <Button 
                onClick={executeDelete} 
                disabled={actionLoading === deleteTarget.id || deleteConfirmation !== deleteTarget.name} 
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/50 w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 text-white transition-all"
              >
                {actionLoading === deleteTarget.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (lang === 'id' ? "HAPUS SEKARANG" : "DELETE NOW")}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}