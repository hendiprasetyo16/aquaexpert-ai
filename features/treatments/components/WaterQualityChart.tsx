// features/treatments/components/WaterQualityChart.tsx
"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Droplets, Loader2 } from "lucide-react";
import { getWaterQualityLogsAction } from "../actions/waterqualitylogs.action"; 

interface Props {
  sessionId: string;
  lang: "id" | "en";
}

export default function WaterQualityChart({ sessionId, lang }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      setIsLoading(true);
      const res = await getWaterQualityLogsAction(sessionId);
      if (isMounted) {
        if (res.success && res.data) {
          setData(res.data);
        }
        setIsLoading(false);
      }
    }

    // Tarik data saat pertama kali komponen dimunculkan
    if (sessionId) fetchData();

    // 💡 FIX: Pasang "telinga" agar grafik refresh otomatis saat ada update data harian
    const handleDataChange = () => {
      if (sessionId) fetchData();
    };
    window.addEventListener("aquarium_data_changed", handleDataChange);

    return () => {
      isMounted = false;
      window.removeEventListener("aquarium_data_changed", handleDataChange);
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Cek apakah minimal ada 1 angka parameter air yang diisi
  const hasValidData = data.some(d => d.temp !== null || d.ammonia !== null || d.nitrite !== null);
  
  // Jika log kosong ATAU tidak ada angka air yang diisi, sembunyikan kotak grafiknya
  if (data.length === 0 || !hasValidData) return null; 

  return (
    <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-500">
      <div className="flex items-center gap-1.5 mb-3">
        <Droplets className="w-4 h-4 text-blue-500" />
        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {lang === 'id' ? 'Tren Parameter Air' : 'Water Quality Trend'}
        </h4>
      </div>
      
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} dy={5} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '8px' }}
              labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '2px' }}
            />
            
            <Line yAxisId="left" type="monotone" name={lang === 'id' ? "Suhu" : "Temp"} dataKey="temp" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls />
            <Line yAxisId="right" type="monotone" name="NH3" dataKey="ammonia" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls />
            <Line yAxisId="right" type="monotone" name="NO2" dataKey="nitrite" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}