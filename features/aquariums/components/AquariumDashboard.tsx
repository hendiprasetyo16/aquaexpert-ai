// features/aquariums/components/AquariumDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { getUserAquariumsAction } from "../actions/aquarium.actions";
import { Aquarium } from "../types/aquarium.types";
import AquariumCard from "./AquariumCard";
import { AquariumDictionary } from "./aquarium-helpers";
import { Plus, Loader2, Container, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AquariumDashboard() {
  const { dict, language } = useLanguage();
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const dictRoot = dict as { aquarium?: AquariumDictionary };
  const aqDict: AquariumDictionary = dictRoot?.aquarium || {
    dashboard: {
      title: language === 'id' ? "Akuarium Saya" : "My Aquariums",
      subtitle: language === 'id' ? "Kelola profil tangki Anda untuk integrasi AI." : "Manage your tank profiles for AI integration.",
      btnAdd: language === 'id' ? "Tambah Akuarium" : "Add Aquarium",
      emptyTitle: language === 'id' ? "Belum Ada Akuarium" : "No Aquariums Yet",
      emptyDesc: language === 'id' ? "Tambahkan profil akuarium pertama Anda untuk mulai menggunakan fitur AI tingkat lanjut." : "Add your first aquarium profile to unlock advanced AI features."
    },
    card: {
      volume: "Volume",
      age: language === 'id' ? "Umur" : "Age",
      plants: language === 'id' ? "Tanaman" : "Plants",
      fishes: language === 'id' ? "Ikan" : "Fishes",
      primaryBadge: "PRIMARY TANK",
      days: language === 'id' ? "hari" : "days",
      months: language === 'id' ? "bulan" : "months",
      years: language === 'id' ? "tahun" : "years"
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getUserAquariumsAction();
        if (res.success && res.data) {
          setAquariums(res.data);
        } else {
          setError(res.error || "Failed to load aquariums");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredAquariums = aquariums.filter(aq => 
    activeTab === "active" ? aq.is_active !== false : aq.is_active === false
  );

  const activeCount = aquariums.filter(aq => aq.is_active !== false).length;
  const archivedCount = aquariums.filter(aq => aq.is_active === false).length;

  return (
    <div className="w-full h-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300 relative">
      <div className="max-w-[1400px] mx-auto space-y-8 flex flex-col min-h-full">
        
        {/* HEADER DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-slate-200 dark:border-slate-800 pb-6 shrink-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
              <Container className="h-8 w-8 md:h-10 md:w-10" /> 
              {aqDict.dashboard?.title}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              {aqDict.dashboard?.subtitle}
            </p>
          </div>

          <Link href="/dashboard/my-aquarium/new" className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 px-6 shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30 transition-all active:scale-95 flex items-center gap-2">
              <Plus className="w-5 h-5" /> 
              {aqDict.dashboard?.btnAdd}
            </Button>
          </Link>
        </div>

        {/* TAB FILTER MODERN (PILL SHAPE) */}
        {!loading && !error && aquariums.length > 0 && (
          <div className="flex justify-center sm:justify-start mb-8 shrink-0">
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === "active" 
                    ? "bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Container className="w-4 h-4" /> Aktif ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === "archived" 
                    ? "bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Archive className="w-4 h-4" /> Arsip ({archivedCount})
              </button>
            </div>
          </div>
        )}

        {/* KONTEN UTAMA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] flex-1">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400 mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">Loading ecosystem...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center flex-1">
            <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>
          </div>
        ) : filteredAquariums.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 p-8 text-center transition-colors flex-1">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
              {activeTab === "archived" ? <Archive className="h-16 w-16 text-amber-500/50" /> : <Container className="h-16 w-16 text-teal-500/50" />}
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-3">
              {activeTab === "archived" ? (language === 'id' ? "Tidak Ada Arsip" : "No Archives") : aqDict.dashboard?.emptyTitle}
            </h3>
            {activeTab === "active" && (
              <>
                <p className="text-slate-500 dark:text-slate-400 max-w-md text-base leading-relaxed mb-8">
                  {aqDict.dashboard?.emptyDesc}
                </p>
                <Link href="/dashboard/my-aquarium/new">
                  <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold px-8 h-12 rounded-full transition-all">
                    <Plus className="w-5 h-5 mr-2" /> 
                    {aqDict.dashboard?.btnAdd}
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          /* PERBAIKAN: Mengubah class grid agar sama ukurannya dengan Admin (grid-cols-1 md:grid-cols-2 xl:grid-cols-3) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 content-start">
            {filteredAquariums.map((aq) => (
              <div key={aq.id} className={`animate-in fade-in zoom-in-95 duration-500 fill-mode-both ${activeTab === 'archived' ? 'grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all' : ''}`} style={{ animationDelay: '100ms' }}>
                <AquariumCard 
                  aquarium={aq} 
                  dict={aqDict} 
                  lang={language as "id" | "en"} 
                />
              </div>
            ))}
          </div>
        )}
        
        {/* SPACER BAWAH: Memberikan jarak agar tidak mepet layar */}
        <div className="h-24 md:h-32 shrink-0 w-full pointer-events-none"></div>

      </div>
    </div>
  );
}