// features/analytics/components/MedicationLeaderboard.tsx
"use client";

import { useState } from "react";
import { LeaderboardRow } from "../actions/analytics.actions";
import { Trophy, Activity, ArrowUpRight } from "lucide-react";
import MedicationDetailModal from "./MedicationDetailModal";

interface Props {
  data: LeaderboardRow[];
  dict: Record<string, string>; // MENGHILANGKAN 'any'
  lang: "id" | "en";
}

export default function MedicationLeaderboard({ data, dict, lang }: Props) {
  const [selectedMedication, setSelectedMedication] = useState<LeaderboardRow | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-center shadow-sm transition-colors">
        <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">
          {lang === 'id' ? "Belum Ada Data Rekam Medis" : "No Medical Records Yet"}
        </h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {lang === 'id' 
            ? "Statistik kemanjuran obat di sini akan otomatis terisi saat pengguna menyelesaikan proses pengobatan ikan di menu 'My Aquarium'." 
            : "Medication efficacy statistics here will automatically populate when users complete fish treatments in the 'My Aquarium' menu."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 text-center w-20">{dict.colRank || (lang === 'id' ? "Peringkat" : "Rank")}</th>
                <th className="px-6 py-5">{dict.colMedication || (lang === 'id' ? "Medikasi & Penyakit" : "Medication & Disease")}</th>
                <th className="px-6 py-5 text-center">{dict.colScore || (lang === 'id' ? "Skor Klinis" : "Clinical Score")}</th>
                <th className="px-6 py-5 text-center">{dict.colSuccess || (lang === 'id' ? "Tingkat Sembuh" : "Success Rate")}</th>
                <th className="px-6 py-5 text-center">{dict.colRecovery || (lang === 'id' ? "Rata-rata Sembuh" : "Avg Recovery")}</th>
                <th className="px-6 py-5 text-center">{dict.colCases || (lang === 'id' ? "Bukti Kasus" : "Evidence")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.map((row, index) => {
                const diseaseName = lang === 'id' ? row.disease?.name_id : row.disease?.name_en;
                
                return (
                  <tr 
                    key={`${row.medication_id}-${row.disease_id}`}
                    onClick={() => setSelectedMedication(row)}
                    className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-sm ${
                        index === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                        index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                        index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-slate-50 text-slate-400 dark:bg-slate-950 dark:text-slate-500"
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            {row.medication?.name} 
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dict.forDisease || (lang === 'id' ? "Untuk:" : "For:")} <span className="font-semibold">{diseaseName}</span></p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black text-base border border-indigo-100 dark:border-indigo-800/50">
                        <Activity className="w-4 h-4" />
                        {row.clinical_score}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-black ${row.success_rate_pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : row.success_rate_pct >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {row.success_rate_pct}%
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-300">
                      {row.median_recovery_days} <span className="text-xs font-medium text-slate-400">{dict.days || (lang === 'id' ? "Hari" : "Days")}</span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <p className="font-black text-slate-800 dark:text-slate-200 text-base">{row.total_cases.toLocaleString()}</p>
                      <p className={`text-[9px] uppercase tracking-widest font-black mt-1 ${row.evidence_grade === 'High' ? 'text-emerald-500' : row.evidence_grade === 'Medium' ? 'text-blue-500' : 'text-amber-500'}`}>
                        {row.evidence_grade}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MedicationDetailModal 
        data={selectedMedication} 
        isOpen={selectedMedication !== null} 
        onClose={() => setSelectedMedication(null)}
        dict={dict}
        lang={lang}
      />
    </>
  );
}