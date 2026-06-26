// features/analytics/components/MedicationLeaderboard.tsx
"use client";

import { useState } from "react";
import { LeaderboardRow } from "../actions/analytics.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Info } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import MedicationDetailModal from "./MedicationDetailModal"; // <-- IMPORT MODAL BARU KITA

interface Props {
  initialData: LeaderboardRow[];
}

export default function MedicationLeaderboard({ initialData }: Props) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";
  const [data] = useState<LeaderboardRow[]>(initialData);

  // STATE UNTUK MODAL
  const [selectedMedication, setSelectedMedication] = useState<LeaderboardRow | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-10 text-center text-slate-500 font-medium">
          {lang === 'id' ? "Belum ada rekam medis yang cukup untuk menyusun statistik." : "Not enough medical records to generate statistics yet."}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Trophy className="w-5 h-5 text-amber-500" /> 
            {lang === 'id' ? "Peringkat Efikasi Obat (Top 20)" : "Medication Efficacy Leaderboard (Top 20)"}
          </CardTitle>
        </CardHeader>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Rank</th>
                <th className="px-6 py-4 font-bold">{lang === 'id' ? "Medikasi & Penyakit" : "Medication & Disease"}</th>
                <th className="px-6 py-4 font-bold text-center">Clinical Score</th>
                <th className="px-6 py-4 font-bold text-center">Success Rate</th>
                <th className="px-6 py-4 font-bold text-center">Median Recovery</th>
                <th className="px-6 py-4 font-bold text-center">Relapse / Kambuh</th>
                <th className="px-6 py-4 font-bold text-center">Cases (Evidence)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.map((row, index) => (
                <tr 
                  key={`${row.disease_id}-${row.medication?.id}`} 
                  onClick={() => setSelectedMedication(row)} // <-- BUKA MODAL SAAT BARIS DI-KLIK
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                >
                  
                  <td className="px-6 py-4">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-black ${index === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : index === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      #{index + 1}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-base transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      {row.medication?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {lang === 'id' ? 'Untuk:' : 'For:'} {lang === 'id' ? row.disease?.name_id : row.disease?.name_en}
                    </p>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-black border border-teal-200 dark:border-teal-800">
                      {row.clinical_score} Pts
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${row.success_rate_pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : row.success_rate_pct >= 50 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                      {row.success_rate_pct}%
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-300">
                    {row.median_recovery_days} {lang === 'id' ? 'Hari' : 'Days'}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${row.relapse_rate_pct > 15 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {row.relapse_rate_pct}%
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{row.total_cases.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{row.evidence_grade}</p>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RENDER MODAL DI BAWAH TABLE */}
      <MedicationDetailModal 
        data={selectedMedication} 
        isOpen={selectedMedication !== null} 
        onClose={() => setSelectedMedication(null)} 
      />
    </>
  );
}