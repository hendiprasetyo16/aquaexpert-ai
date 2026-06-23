"use client";

import { useEffect, useState } from "react";
import { getMedicationLeaderboardAction } from "../actions/get-medication-leaderboard";
import type { MedicationEfficacyStat } from "../types/analytics.types";

interface Props {
  diseaseId?: string; // Jika dilempar, leaderboard akan fokus ke satu penyakit
  title?: string;
}

export function MedicationLeaderboard({ diseaseId, title = "Medication Leaderboard" }: Props) {
  const [stats, setStats] = useState<MedicationEfficacyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const result = await getMedicationLeaderboardAction({ diseaseId, limit: 10 });
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || "Gagal memuat data.");
      }
      setIsLoading(false);
    }
    fetchData();
  }, [diseaseId]);

  if (isLoading) return <div className="animate-pulse h-48 bg-slate-100 rounded-lg w-full flex items-center justify-center text-slate-400">Memuat data klinis...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>;
  if (stats.length === 0) return <div className="p-4 bg-slate-50 text-slate-500 rounded-lg text-sm text-center">Belum ada data rekam medis yang mencukupi.</div>;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
          Evidence-Based
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-100 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Obat</th>
              {!diseaseId && <th className="px-6 py-3 font-medium">Penyakit</th>}
              <th className="px-6 py-3 font-medium text-right">Success Rate</th>
              <th className="px-6 py-3 font-medium text-right">Median Recovery</th>
              <th className="px-6 py-3 font-medium text-right">Relapse</th>
              <th className="px-6 py-3 font-medium text-right">Mortality</th>
              <th className="px-6 py-3 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {stats.map((stat, idx) => (
              <tr key={`${stat.medicationId}-${stat.diseaseId}`} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                  <span className="text-slate-400 text-xs w-4">{idx + 1}.</span>
                  {stat.medicationName}
                </td>
                {!diseaseId && <td className="px-6 py-4">{stat.diseaseNameId}</td>}
                <td className="px-6 py-4 text-right">
                  <span className={`font-semibold ${stat.successRatePct > 80 ? 'text-emerald-600' : stat.successRatePct > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {stat.successRatePct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">{stat.medianRecoveryDays} Hari</td>
                <td className="px-6 py-4 text-right text-rose-600">{stat.relapseRatePct > 0 ? `${stat.relapseRatePct.toFixed(1)}%` : '-'}</td>
                <td className="px-6 py-4 text-right text-rose-600">{stat.mortalityRatePct > 0 ? `${stat.mortalityRatePct.toFixed(1)}%` : '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${stat.evidenceGrade === 'High' ? 'bg-emerald-100 text-emerald-700' : 
                      stat.evidenceGrade === 'Medium' ? 'bg-blue-100 text-blue-700' : 
                      stat.evidenceGrade === 'Low' ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-100 text-slate-600'}`}>
                    {stat.evidenceGrade}
                    <span className="ml-1 opacity-60">({stat.totalCases})</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}