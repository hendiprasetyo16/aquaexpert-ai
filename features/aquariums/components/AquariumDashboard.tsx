// features/aquariums/components/AquariumDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { getUserAquariumsAction } from "../actions/aquarium.actions";
import { Aquarium } from "../types/aquarium.types";
import AquariumCard from "./AquariumCard";
import { Plus, Loader2, Container } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AquariumDashboard() {
  const { dict, language } = useLanguage();
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // BYPASS TYPESCRIPT ERROR DENGAN (dict as any)
  const aqDict = (dict as any).aquarium;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getUserAquariumsAction();
        if (res.success && res.data) {
          setAquariums(res.data);
        } else {
          setError(res.error || "Failed to load aquariums");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (!aqDict) return null;

  return (
    <div className="w-full h-full min-h-[80vh] p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
              <Container className="h-8 w-8 md:h-10 md:w-10" /> 
              {aqDict.dashboard?.title || "My Aquariums"}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              {aqDict.dashboard?.subtitle || "Manage your tank profiles for AI integration."}
            </p>
          </div>

          <Link href="/dashboard/my-aquarium/new" className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 px-6 shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30 transition-all active:scale-95 flex items-center gap-2">
              <Plus className="w-5 h-5" /> 
              {aqDict.dashboard?.btnAdd || "Add Aquarium"}
            </Button>
          </Link>
        </div>

        {/* KONTEN UTAMA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400 mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">Loading ecosystem...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center">
            <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>
          </div>
        ) : aquariums.length === 0 ? (
          /* STATE KOSONG (EMPTY STATE) */
          <div className="flex flex-col items-center justify-center min-h-[50vh] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 p-8 text-center transition-colors">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
              <Container className="h-16 w-16 text-teal-500/50" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-3">
              {aqDict.dashboard?.emptyTitle || "No Aquariums Yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-base leading-relaxed mb-8">
              {aqDict.dashboard?.emptyDesc || "Add your first aquarium profile to unlock advanced AI features."}
            </p>
            <Link href="/dashboard/my-aquarium/new">
              <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold px-8 h-12 rounded-full transition-all">
                <Plus className="w-5 h-5 mr-2" /> 
                {aqDict.dashboard?.btnAdd || "Add Aquarium"}
              </Button>
            </Link>
          </div>
        ) : (
          /* BENTO GRID KARTU AKUARIUM */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aquariums.map((aq) => (
              <div key={aq.id} className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
                <AquariumCard 
                  aquarium={aq} 
                  dict={aqDict} 
                  lang={language as "id" | "en"} 
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}