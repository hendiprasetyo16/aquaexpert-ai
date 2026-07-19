// features/analytics/components/TopDiseasesChart.tsx
"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LeaderboardRow } from "../actions/analytics.actions";
import { Bug } from "lucide-react";

interface Props {
  data: LeaderboardRow[];
  lang: "id" | "en";
}

// 💡 Warna gradasi untuk batang grafik (dari Biru/Indigo ke Ungu)
const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']; 

export default function TopDiseasesChart({ data, lang }: Props) {
  // 💡 Logika untuk mengelompokkan data berdasarkan Penyakit, lalu dijumlahkan kasusnya
  const chartData = useMemo(() => {
    const diseaseMap: Record<string, { name: string, cases: number }> = {};
    
    data.forEach(row => {
      if (!row.disease) return;
      const name = lang === 'id' ? row.disease.name_id : row.disease.name_en;
      
      if (!diseaseMap[row.disease_id]) {
        diseaseMap[row.disease_id] = { name, cases: 0 };
      }
      diseaseMap[row.disease_id].cases += row.total_cases;
    });

    // Urutkan dari kasus terbanyak, lalu potong jadi 5 teratas
    return Object.values(diseaseMap)
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 5); 
  }, [data, lang]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors h-full min-h-[350px]">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
          <Bug className="w-5 h-5 text-purple-500" />
          {lang === 'id' ? 'Top 5 Penyakit Terbanyak' : 'Top 5 Most Frequent Diseases'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {lang === 'id' ? 'Distribusi penyakit berdasarkan frekuensi kasus di seluruh akuarium.' : 'Disease distribution based on case frequency across all aquariums.'}
        </p>
      </div>
      
      <div className="flex-1 w-full h-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              formatter={(value: any) => [`${value} Kasus`, lang === 'id' ? 'Total Kasus' : 'Total Cases']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="cases" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}