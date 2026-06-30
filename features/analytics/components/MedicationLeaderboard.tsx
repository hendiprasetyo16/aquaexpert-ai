// features/analytics/components/MedicationLeaderboard.tsx
"use client";

import { useState, ChangeEvent } from "react";
import { LeaderboardRow } from "../actions/analytics.actions";
import { 
  Trophy, Activity, ArrowUpRight, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ShieldCheck, Clock, Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MedicationDetailModal from "./MedicationDetailModal";

interface Props {
  data: LeaderboardRow[];
  dict: Record<string, string>;
  lang: "id" | "en";
}

const ITEMS_PER_PAGE = 10;

export default function MedicationLeaderboard({ data, dict, lang }: Props) {
  const [selectedMedication, setSelectedMedication] = useState<LeaderboardRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  // =========================================================================
  // LOGIKA PAGINATION BERBENTUK ANGKA
  // =========================================================================
  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors flex flex-col">
        
        {/* DESKTOP VIEW: TABEL (Tersembunyi di Mobile) */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1">
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
              {currentData.map((row, index) => {
                const globalIndex = startIndex + index + 1;
                const diseaseName = lang === 'id' ? row.disease?.name_id : row.disease?.name_en;
                
                return (
                  <tr 
                    key={`${row.medication_id}-${row.disease_id}`}
                    onClick={() => setSelectedMedication(row)}
                    className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg font-black text-sm border ${
                        globalIndex === 1 ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50" :
                        globalIndex === 2 ? "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
                        globalIndex === 3 ? "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50" :
                        "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-950 dark:text-slate-500 dark:border-slate-800"
                      }`}>
                        {globalIndex}
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

        {/* MOBILE VIEW: KARTU MINIMALIS (Khusus HP) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 md:hidden">
          {currentData.map((row, idx) => {
            const globalIndex = startIndex + idx + 1;
            const diseaseName = lang === 'id' ? row.disease?.name_id : row.disease?.name_en;
            
            return (
              <div 
                key={`${row.medication_id}-${row.disease_id}`}
                onClick={() => setSelectedMedication(row)}
                className="cursor-pointer flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all active:scale-[0.98]"
              >
                 <div className="flex items-start gap-3 mb-4">
                   <span className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs shrink-0 border ${
                      globalIndex === 1 ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50" :
                      globalIndex === 2 ? "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
                      globalIndex === 3 ? "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50" :
                      "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}>
                      {globalIndex}
                   </span>
                   <div>
                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                       {row.medication?.name}
                     </h3>
                     <p className="text-xs text-slate-500 mt-0.5">{dict.forDisease || (lang === 'id' ? "Untuk:" : "For:")} <span className="font-semibold">{diseaseName}</span></p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col justify-center">
                       <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">{dict.colScore || (lang === 'id' ? "Skor Klinis" : "Clinical Score")}</span>
                       <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5"><Activity className="w-4 h-4" />{row.clinical_score}</span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col justify-center">
                       <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">{dict.colSuccess || (lang === 'id' ? "Tingkat Sembuh" : "Success Rate")}</span>
                       <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" />{row.success_rate_pct}%</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-auto">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {row.median_recovery_days} {dict.days || (lang === 'id' ? "Hari" : "Days")}</div>
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {row.total_cases.toLocaleString()} {dict.colCases || (lang === 'id' ? "Kasus" : "Cases")}</div>
                 </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 gap-4 transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
              {lang === 'id' ? "Menampilkan" : "Showing"} <span className="font-medium text-gray-900 dark:text-slate-200">{startIndex + 1}</span> {lang === 'id' ? "hingga" : "to"} <span className="font-medium text-gray-900 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, data.length)}</span> {lang === 'id' ? "dari" : "of"} <span className="font-medium text-gray-900 dark:text-slate-200">{data.length}</span> {lang === 'id' ? "data" : "records"}
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
                <span className="hidden sm:inline">{lang === 'id' ? "Hal" : "Page"}</span>
                <Input 
                  type="number" min={1} max={totalPages} value={currentPage}
                  onChange={handlePageInputChange}
                  className="w-14 h-8 text-center bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 transition-colors"
                />
                <span className="hidden sm:inline">/ {totalPages}</span>
              </div>
            </div>
          </div>
        )}
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