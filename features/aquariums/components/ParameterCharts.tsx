// features/aquariums/components/ParameterCharts.tsx
"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { AquariumParameterLog } from "../actions/parameter.actions";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Activity, Droplets, Skull } from "lucide-react";

interface ParameterChartsProps {
  data: AquariumParameterLog[];
}

export default function ParameterCharts({ data }: ParameterChartsProps) {
  const { language } = useLanguage();
  const lang = language as "id" | "en";

  // Recharts butuh data dari yang terlama ke terbaru (kiri ke kanan)
  // Jadi kita harus membalik array-nya tanpa merusak data asli
  const chartData = [...data].reverse().map(log => ({
    ...log,
    // Format tanggal singkat (Misal: 14 Jun) untuk sumbu X
    shortDate: new Date(log.record_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })
  }));

  if (chartData.length < 2) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
        <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
        <p className="text-slate-500 text-sm font-medium">
          {lang === 'id' ? "Catat minimal 2 data parameter untuk melihat grafik tren." : "Log at least 2 parameters to generate trend charts."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* CHART 1: Toxins (Amonia, Nitrit, Nitrat) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
          <Skull className="w-3.5 h-3.5" /> {lang === 'id' ? "Grafik Racun (Siklus Nitrogen)" : "Toxin Levels (Nitrogen Cycle)"}
        </h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
              
              <Line type="monotone" dataKey="ammonia" name="NH3 (Amonia)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
              <Line type="monotone" dataKey="nitrite" name="NO2 (Nitrit)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
              <Line type="monotone" dataKey="nitrate" name="NO3 (Nitrat)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: pH & TDS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest flex items-center gap-1.5 mb-4">
          <Droplets className="w-3.5 h-3.5" /> {lang === 'id' ? "Keseimbangan Air (pH & TDS)" : "Water Balance (pH & TDS)"}
        </h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* Kita pakai 2 Y-Axis karena nilai pH (0-14) dan TDS (0-500+) sangat berbeda skalanya */}
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#10b981" domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#64748b" domain={['auto', 'auto']} />
              
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
              
              <Line yAxisId="left" type="monotone" dataKey="ph" name="pH Level" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="tds" name="TDS (ppm)" stroke="#64748b" strokeWidth={3} dot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}