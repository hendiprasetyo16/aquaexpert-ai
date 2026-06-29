// app/(dashboard)/dashboard/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { getMedicationLeaderboardAction, LeaderboardRow } from "@/features/analytics/actions/analytics.actions";
import MedicationLeaderboard from "@/features/analytics/components/MedicationLeaderboard";
import { Activity, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// MENGHILANGKAN 'any' PADA DICTIONARY
type DictRecord = Record<string, string>;
interface RootDict {
  disease?: { clinicalAnalytics?: DictRecord };
  clinicalAnalytics?: DictRecord;
  [key: string]: unknown;
}

export default function AnalyticsDashboardPage() {
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";
  
  const rootDict = (dict as RootDict) || {};
  const analyticsDict: DictRecord = rootDict.disease?.clinicalAnalytics || rootDict.clinicalAnalytics || {};

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await getMedicationLeaderboardAction(20);
        if (res.success && res.data) {
          setLeaderboardData(res.data);
        } else {
          toast.error(res.error || "Failed to load analytics.");
        }
      } catch (error: unknown) { // Bebas Any
        console.error(error);
        toast.error("Internal system error.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center flex-col gap-4 bg-slate-50 dark:bg-slate-950 transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="font-bold text-slate-500 animate-pulse">{lang === 'id' ? "Memuat data klinis..." : "Loading clinical data..."}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
        
        {/* HEADER DENGAN NEON GLOW */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
              <Activity className="h-8 w-8 md:h-10 md:w-10" /> 
              {analyticsDict.title || "Clinical Intelligence"}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed font-medium transition-colors">
              {analyticsDict.subtitle || (lang === 'id' 
                ? "Dashboard analitik berbasis bukti nyata (Evidence-Based). Menampilkan tingkat kemanjuran obat, laju pemulihan, dan risiko kambuh berdasarkan ribuan rekam medis di AquaExpert."
                : "Evidence-Based analytics dashboard. Displays medication efficacy rates, recovery speeds, and relapse risks based on thousands of medical records.")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 px-1 transition-colors">
            {analyticsDict.leaderboardTitle || (lang === 'id' ? "Peringkat Efikasi Obat (Top 20)" : "Medication Efficacy Leaderboard (Top 20)")}
          </h2>
          <MedicationLeaderboard 
            data={leaderboardData} 
            dict={analyticsDict} 
            lang={lang} 
          />
        </div>

      </div>
    </div>
  );
}