// features/treatments/components/WaterQualityChart.tsx
"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Droplets, Loader2, AlertTriangle } from "lucide-react";
import { getWaterQualityLogsAction } from "../actions/waterqualitylogs.action"; // 💡 Import ke file baru

interface Props {
  sessionId: string;
  lang: "id" | "en";
}

export default function WaterQualityChart({ sessionId, lang }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const res = await getWaterQualityLogsAction(sessionId);
      if (res.success && res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    }
    if (sessionId) fetchData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {lang === 'id' ? 'Belum ada data parameter air.' : 'No water parameter data yet.'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {lang === 'id' ? 'Isi data Suhu, Amonia, atau Nitrit saat mencatat log harian untuk melihat grafik.' : 'Fill in Temp, Ammonia, or Nitrite during daily logs to see the chart.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
      <div className="mb-4">
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          {lang === 'id' ? 'Tren Parameter Air Kritis' : 'Critical Water Parameters Trend'}
        </h3>
      </div>
      
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '4px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
            
            {/* Grafik Suhu (°C) - Dihubungkan ke sumbu Y kiri */}
            <Line yAxisId="left" type="monotone" name={lang === 'id' ? "Suhu (°C)" : "Temp (°C)"} dataKey="temp" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
            
            {/* Grafik Amonia (ppm) - Dihubungkan ke sumbu Y kanan */}
            <Line yAxisId="right" type="monotone" name="Amonia (ppm)" dataKey="ammonia" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
            
            {/* Grafik Nitrit (ppm) - Dihubungkan ke sumbu Y kanan */}
            <Line yAxisId="right" type="monotone" name="Nitrit (ppm)" dataKey="nitrite" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}