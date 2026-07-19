// features/treatments/components/WaterQualityChart.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

    if (sessionId) fetchData();

    // Listener agar grafik otomatis refresh saat Bapak klik Simpan di modal
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
      <div className="w-full h-[180px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Cek apakah ada angka air yang diisi
  const hasValidData = data.some(d => d.temp !== null || d.ammonia !== null || d.nitrite !== null);
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
          <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} dy={5} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '8px' }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            />
            
            {/* 💡 FIX: Menggunakan Grafik Batang (Bar) agar 1 titik data tetap muncul! */}
            <Bar yAxisId="left" name={lang === 'id' ? "Suhu (°C)" : "Temp (°C)"} dataKey="temp" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={15} />
            <Bar yAxisId="right" name="Amonia (ppm)" dataKey="ammonia" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={15} />
            <Bar yAxisId="right" name="Nitrit (ppm)" dataKey="nitrite" fill="#f43f5e" radius={[2, 2, 0, 0]} maxBarSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}