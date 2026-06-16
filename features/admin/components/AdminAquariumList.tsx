// features/admin/components/AdminAquariumList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";
import { getAdminAllAquariumsAction } from "@/features/aquariums/actions/aquarium.actions";
import { Aquarium } from "@/features/aquariums/types/aquarium.types";
import { 
  ArrowLeft, Search, Loader2, Container, Archive, CheckCircle2, 
  Eye, Droplets, CalendarDays, ShieldAlert, Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAquariumList() {
  const router = useRouter();
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");

  useEffect(() => {
    async function fetchData() {
      const res = await getAdminAllAquariumsAction();
      if (res.success && res.data) {
        setAquariums(res.data as Aquarium[]);
      } else {
        setError(res.error || "Gagal memuat data.");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredAquariums = aquariums.filter(aq => {
    const safeName = aq.name || "";
    const safeType = aq.tank_type || "";
    
    const matchSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        safeType.toLowerCase().includes(searchQuery.toLowerCase());
                        
    const matchFilter = filter === "all" ? true : filter === "active" ? aq.is_active : !aq.is_active;
    
    return matchSearch && matchFilter;
  });

  const totalActive = aquariums.filter(a => a.is_active).length;
  const totalArchived = aquariums.filter(a => !a.is_active).length;

  // HELPER: Format tanggal dan jam pembuatan (created_at)
  const formatDateTime = (isoString?: string) => {
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
            {lang === 'id' ? "Akses Superadmin: Pantau seluruh ekosistem pengguna." : "Superadmin Access: Monitor all user ecosystems."}
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
                placeholder={lang === 'id' ? "Cari nama atau jenis tank..." : "Search name or tank type..."}
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
                  </div>

                  {/* Info Meta */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate mb-1">
                      {aq.name || (lang === "id" ? "Akuarium Tanpa Nama" : "Unnamed Aquarium")}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mb-4">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"><Container className="w-3.5 h-3.5 text-indigo-500" /> {aq.tank_type || "Custom"}</span>
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"><Droplets className="w-3.5 h-3.5 text-blue-500" /> {aq.volume_liters || 0} L</span>
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
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl h-10 px-4 text-xs font-bold transition-colors shrink-0"
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
    </div>
  );
}