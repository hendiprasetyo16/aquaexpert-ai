// features/analytics/components/GlobalRecoveryChart.tsx
"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { LeaderboardRow } from "../actions/analytics.actions";
import { Activity, ShieldCheck, AlertTriangle } from "lucide-react";

interface Props {
  data: LeaderboardRow[];
  lang: "id" | "en";
}

export default function GlobalRecoveryChart({ data, lang }: Props) {
  // Mengkalkulasi total data dari seluruh obat yang ada di leaderboard
  const chartData = useMemo(() => {
    let totalCases = 0;
    let totalSuccess = 0;
    let totalDeath = 0;

    data.forEach(row => {
      totalCases += row.total_cases;
      // Menghitung kembali jumlah kasus dari persentase
      totalSuccess += Math.round(row.total_cases * (row.success_rate_pct / 100));
      totalDeath += Math.round(row.total_cases * (row.mortality_rate_pct / 100));
    });

    const totalAborted = Math.max(0, totalCases - totalSuccess - totalDeath);

    return [
      { 
        name: lang === 'id' ? 'Berhasil Sembuh' : 'Successfully Cured', 
        value: totalSuccess, 
        color: '#10b981' // Emerald 500
      },
      { 
        name: lang === 'id' ? 'Gagal (Kematian)' : 'Fatalities', 
        value: totalDeath, 
        color: '#f43f5e' // Rose 500
      },
      { 
        name: lang === 'id' ? 'Dibatalkan / Ganti Obat' : 'Aborted', 
        value: totalAborted, 
        color: '#f59e0b' // Amber 500
      }
    ];
  }, [data, lang]);

  const totalCasesAll = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (totalCasesAll === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-8 transition-colors">
      
      {/* AREA GRAFIK */}
      <div className="w-full md:w-1/2 h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              // 💡 FIX: Mengganti (value: number) menjadi (value: any) agar TypeScript tenang
              formatter={(value: any) => [`${value} Kasus`, lang === 'id' ? 'Total' : 'Total']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        {/* Teks di tengah Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{totalCasesAll}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'id' ? 'Total Kasus' : 'Total Cases'}</span>
        </div>
      </div>

      {/* AREA KETERANGAN (SUMMARY) */}
      <div className="w-full md:w-1/2 space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-indigo-500" />
            {lang === 'id' ? 'Rasio Keberhasilan Global' : 'Global Success Ratio'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'id' ? 'Persentase total dari seluruh rekam medis yang dicatat oleh sistem Pakar.' : 'Total percentage of all medical records logged by the Expert system.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> {lang === 'id' ? 'Tingkat Kesembuhan' : 'Cure Rate'}</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {Math.round((chartData[0].value / totalCasesAll) * 100)}%
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-800/50">
            <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {lang === 'id' ? 'Tingkat Kematian' : 'Mortality Rate'}</p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {Math.round((chartData[1].value / totalCasesAll) * 100)}%
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}