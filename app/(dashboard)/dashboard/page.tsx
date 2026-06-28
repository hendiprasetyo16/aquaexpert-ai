// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, Activity, Fish, Leaf, ArrowRight, 
  ShieldAlert, CheckCircle2, Clock, Container, 
  Cpu, BarChart, HeartPulse, Globe, Bug 
} from "lucide-react";

// Import Fungsi Analisis Kesehatan & Pengambil Data Asli
import { analyzeAquariumHealth } from "@/features/aquariums/utils/health-engine";
import { getParametersAction } from "@/features/aquariums/actions/parameter.actions";
import { getMaintenanceDashboardAction } from "@/features/aquariums/actions/maintenance.actions";
import { getTankInventoryAction } from "@/features/aquariums/actions/inventory.actions"; 
import type { AquariumParameterLog } from "@/features/aquariums/types/parameter.types";

interface TankInfo {
  id: string;
  name: string;
  is_primary: boolean;
  health_score: number;
  alerts: string[]; 
  faunaCount: number; 
  floraCount: number; 
}

interface DashboardStats {
  tanks: number;
  alerts: number;
  fauna: number;
  flora: number;
}

// Tipe Data untuk Riwayat Aktivitas
interface ActivityLog {
  id: string;
  type: "parameter" | "maintenance" | "treatment";
  title_id: string;
  title_en: string;
  desc_id: string;
  desc_en: string;
  date: Date;
}

export default function DashboardPage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({ tanks: 0, alerts: 0, fauna: 0, flora: 0 });
  const [tankList, setTankList] = useState<TankInfo[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [ipAddress, setIpAddress] = useState<string>("Loading IP...");

  // Dapatkan IP Address & Simpan ke Database
  useEffect(() => {
    async function getIpAddress() {
      if (!user?.id) return; 

      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        
        if (data.ip) {
          setIpAddress(data.ip);
          
          // === UPDATE IP KE DATABASE ===
          const supabase = createClient();
          await supabase
            .from("profiles")
            .update({ 
              ip_address: data.ip,
              last_login_at: new Date().toISOString() 
            })
            .eq("id", user.id);
        }
      } catch (err) {
        setIpAddress("127.0.0.1");
      }
    }
    
    if (!isLoading && user?.id) {
      getIpAddress();
    }
  }, [user?.id, isLoading]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;
      const supabase = createClient();
      setLoadingPage(true);

      try {
        const { data: aquariums } = await supabase
          .from("my_aquariums")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        let tankIds: string[] = [];

        if (aquariums && aquariums.length > 0) {
          tankIds = aquariums.map(a => a.id);
          aquariums.sort((a, b) => {
            if (a.is_primary === b.is_primary) return a.name.localeCompare(b.name);
            return a.is_primary ? -1 : 1;
          });
          if (!aquariums.some(t => t.is_primary)) aquariums[0].is_primary = true;

          let totalAlerts = 0;
          let totalFauna = 0;
          let totalFlora = 0;

          const processedTanks = await Promise.all(aquariums.map(async (aq) => {
            try {
              const [paramsResponse, invRes, maintenanceRes] = await Promise.all([
                getParametersAction(aq.id),
                getTankInventoryAction(aq.id),
                getMaintenanceDashboardAction(aq.id)
              ]);

              const rawParams = paramsResponse.data || [];
              const sanitizedParams: AquariumParameterLog[] = rawParams.map(param => ({
                  ...param,
                  temperature: param.temperature ?? null,
                  ph: param.ph ?? null,
                  ammonia: param.ammonia ?? null,
                  nitrite: param.nitrite ?? null,
                  nitrate: param.nitrate ?? null,
              } as AquariumParameterLog));

              const aqFishes = invRes.fishes || [];
              const aqPlants = invRes.plants || [];
              const maintenanceStatus = maintenanceRes.tasksStatus || [];
              
              const healthAnalysis = analyzeAquariumHealth({
                aquarium: aq,
                parameters: sanitizedParams,
                fishes: aqFishes,
                plants: aqPlants,
                maintenanceStatus: maintenanceStatus
              });

              const faunaCount = aqFishes.reduce((acc: number, f: any) => acc + (f.quantity || 0), 0);
              const floraCount = aqPlants.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0);
              const alerts = healthAnalysis.alerts || [];

              totalAlerts += alerts.length;
              totalFauna += faunaCount;
              totalFlora += floraCount;

              return {
                id: aq.id,
                name: aq.name,
                is_primary: aq.is_primary || false,
                health_score: healthAnalysis.scores.overall,
                alerts: alerts,
                faunaCount: faunaCount,
                floraCount: floraCount
              };
            } catch (err) {
              return { id: aq.id, name: aq.name, is_primary: aq.is_primary || false, health_score: 0, alerts: [], faunaCount: 0, floraCount: 0 };
            }
          }));

          setTankList(processedTanks);
          setStats({ tanks: aquariums.length, alerts: totalAlerts, fauna: totalFauna, flora: totalFlora });
        }

        // === TARIK LOG AKTIVITAS (RECENT ACTIVITIES) ===
        if (tankIds.length > 0) {
          const logs: ActivityLog[] = [];

          // 1. Log Parameter Air
          const { data: paramLogs } = await supabase
            .from("aquarium_parameters")
            .select("id, record_date, parameter_source")
            .in("aquarium_id", tankIds)
            .order('record_date', { ascending: false })
            .limit(3);
          
          paramLogs?.forEach(log => {
            logs.push({
              id: log.id,
              type: "parameter",
              title_id: "Pencatatan Parameter Air",
              title_en: "Water Parameter Log",
              desc_id: `Data kualitas air diunggah melalui ${log.parameter_source || 'Sistem'}.`,
              desc_en: `Water quality data uploaded via ${log.parameter_source || 'System'}.`,
              date: new Date(log.record_date)
            });
          });

          // 2. Log Maintenance
          const { data: maintLogs } = await supabase
            .from("aquarium_maintenance_logs")
            .select("id, performed_at, maintenance_type")
            .in("aquarium_id", tankIds)
            .order('performed_at', { ascending: false })
            .limit(3);
            
          maintLogs?.forEach(log => {
            logs.push({
              id: log.id,
              type: "maintenance",
              title_id: "Tugas Perawatan Selesai",
              title_en: "Maintenance Task Completed",
              desc_id: `Melakukan aktivitas: ${log.maintenance_type.replace('_', ' ')}.`,
              desc_en: `Performed activity: ${log.maintenance_type.replace('_', ' ')}.`,
              date: new Date(log.performed_at)
            });
          });

          // 3. Log Pengobatan (Treatment)
          const { data: treatmentLogs } = await supabase
            .from("aquarium_treatments")
            .select("id, started_at, status")
            .in("aquarium_id", tankIds)
            .order('started_at', { ascending: false })
            .limit(3);

          treatmentLogs?.forEach(log => {
            logs.push({
              id: log.id,
              type: "treatment",
              title_id: "Sesi Pengobatan Medis",
              title_en: "Medical Treatment Session",
              desc_id: `Status pengobatan: ${log.status}.`,
              desc_en: `Treatment status: ${log.status}.`,
              date: new Date(log.started_at || new Date().toISOString())
            });
          });

          // Urutkan dan ambil 4 terbaru
          logs.sort((a, b) => b.date.getTime() - a.date.getTime());
          setRecentActivities(logs.slice(0, 4));
        }

        setLoadingPage(false);

      } catch (error) {
        console.error("Dashboard error:", error);
        setLoadingPage(false);
      }
    }

    if (!isLoading) fetchDashboardData();
  }, [user?.id, isLoading]);

  if (isLoading || loadingPage) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  const rootDict = (dict as Record<string, any>) || {};
  const dashDict = rootDict.dashboard || {};
  const primaryTank = tankList.find(t => t.is_primary);
  const secondaryTanks = tankList.filter(t => !t.is_primary);

  const getHealthColor = (score: number) => {
    if (score >= 85) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* SEKSI 1: BANNER SELAMAT DATANG & GAUGES TANGKI */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 transition-colors">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
            <div className="space-y-2 md:flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {dashDict.welcome || (lang === 'id' ? "Selamat datang," : "Welcome back,")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">{profile?.full_name || "User"}</span>!
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-lg">
                {lang === 'id' ? "Pantau kondisi klinis akuarium Anda dan jalankan analisis AI untuk ekosistem yang sehat." : "Monitor your aquarium's clinical conditions and run AI analysis for a healthy ecosystem."}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 
                  {role === "super_admin" ? "SUPER ADMIN" : role === "admin" ? "ADMIN" : "AQUARIST"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                  {user?.email}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Globe className="w-3.5 h-3.5" /> {ipAddress}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col md:items-end gap-4 w-full sm:w-auto">
              {primaryTank ? (
                <>
                  {/* TANGKI UTAMA */}
                  <div 
                    onClick={() => router.push(`/dashboard/my-aquarium/${primaryTank.id}`)}
                    className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all flex items-center gap-6 group w-full sm:w-80"
                  >
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                          strokeDasharray="283" 
                          strokeDashoffset={283 - (283 * primaryTank.health_score) / 100} 
                          className={`${getHealthColor(primaryTank.health_score)} transition-all duration-1000 ease-out`} strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center mt-1">
                        <span className={`text-xl font-black ${getHealthColor(primaryTank.health_score)}`}>{primaryTank.health_score}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                          {lang === 'id' ? "Tank Utama" : "Primary"}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {primaryTank.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                        {primaryTank.alerts.length > 0 ? (
                          <><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> {primaryTank.alerts.length} {lang === 'id' ? "Peringatan" : "Alerts"}</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {lang === 'id' ? "Ekosistem Stabil" : "Stable Ecosystem"}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* TANGKI SEKUNDER */}
                  {secondaryTanks.length > 0 && (
                    <div className="flex flex-wrap md:justify-end gap-2 w-full max-w-sm">
                      {secondaryTanks.map(tank => (
                        <div 
                          key={tank.id} 
                          onClick={() => router.push(`/dashboard/my-aquarium/${tank.id}`)} 
                          className="cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 transition-colors shadow-sm"
                        >
                          <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="15" className="text-slate-200 dark:text-slate-700" />
                              <circle 
                                cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="15" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * tank.health_score) / 100} 
                                className={`${getHealthColor(tank.health_score)} transition-all duration-1000 ease-out`} strokeLinecap="round" 
                              />
                            </svg>
                          </div>
                          
                          <div className="flex flex-col justify-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{tank.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none">
                              Score: <span className={getHealthColor(tank.health_score)}>{tank.health_score}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center w-full">
                  <Container className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-500">{lang === 'id' ? "Belum ada akuarium" : "No aquarium yet"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEKSI 2: KARTU STATISTIK & RECENT ACTIVITIES */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* BAGIAN KIRI: 4 Kotak Statisitk */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Akuarium Aktif" : "Active Tanks"}</p>
                  <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.tanks}</h4>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl"><Container className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                {tankList.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="truncate pr-2 font-semibold flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.is_primary ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                      {t.name}
                    </span>
                    <span className="shrink-0">{t.is_primary ? (lang === 'id' ? "Utama" : "Primary") : (lang === 'id' ? "Sekunder" : "Secondary")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Peringatan Sistem" : "System Alerts"}</p>
                  <h4 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{stats.alerts}</h4>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl"><ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" /></div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {tankList.map(t => (
                  <div key={t.id} className="flex flex-col text-[10px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{t.name}:</span>
                    {t.alerts.length > 0 ? (
                      <span className="text-rose-500 dark:text-rose-400 line-clamp-1 leading-tight mt-0.5">
                        • {t.alerts[0]} {t.alerts.length > 1 && `(+${t.alerts.length - 1} ${lang === 'id' ? 'lainnya' : 'more'})`}
                      </span>
                    ) : (
                      <span className="text-emerald-500 dark:text-emerald-400 font-medium mt-0.5">✔️ {lang === 'id' ? 'Ekosistem Aman' : 'Safe Ecosystem'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Populasi Fauna" : "Fauna Population"}</p>
                  <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.fauna}</h4>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl"><Fish className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                {tankList.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-[10px]">
                    <span className="truncate pr-2 font-medium text-slate-500 dark:text-slate-400">{t.name}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                      {t.faunaCount} {lang === 'id' ? "ekor" : "qty"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Koleksi Flora" : "Flora Collection"}</p>
                  <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.flora}</h4>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl"><Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                {tankList.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-[10px]">
                    <span className="truncate pr-2 font-medium text-slate-500 dark:text-slate-400">{t.name}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                      {t.floraCount} {lang === 'id' ? "bibit" : "qty"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BAGIAN KANAN: Riwayat Aktivitas Asli */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 px-1">
              <Clock className="w-5 h-5 text-slate-400" />
              {lang === 'id' ? "Aktivitas Terkini" : "Recent Activities"}
            </h3>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm h-full max-h-[300px] overflow-y-auto custom-scrollbar">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                  <Activity className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-500">{lang === 'id' ? "Belum ada aktivitas" : "No recent activity"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((log) => (
                    <div key={log.id} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          log.type === 'parameter' ? 'bg-blue-500' :
                          log.type === 'maintenance' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <div className="w-px h-full bg-slate-200 dark:bg-slate-700 my-1"></div>
                      </div>
                      <div className="pb-3 w-full">
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">
                          {log.date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {lang === 'id' ? log.title_id : log.title_en}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {lang === 'id' ? log.desc_id : log.desc_en}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* SEKSI 3: MODUL KECERDASAN BUATAN (Disesuaikan Bahasa) */}
        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            {lang === 'id' ? "Modul Kecerdasan Buatan" : "AI Intelligence Modules"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div onClick={() => router.push("/dashboard/disease-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-red-400 dark:hover:border-red-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-red-600 dark:text-red-400"><HeartPulse className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">{lang === 'id' ? "Sistem Pakar Penyakit" : "Disease Expert AI"}</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{lang === 'id' ? "Diagnosis cerdas penyakit biota air menggunakan pemindaian komputer AI Vision." : "Smart diagnosis of aquatic diseases using AI Vision computer scanning."}</p>
                <div className="flex items-center text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            <div onClick={() => router.push("/dashboard/fish-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-blue-400 dark:hover:border-blue-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"><Fish className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Fish Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{lang === 'id' ? "Konsultasi ahli terkait perawatan, kompatibilitas, dan nutrisi spesies ikan." : "Expert consultation regarding care, compatibility, and fish species nutrition."}</p>
                <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            <div onClick={() => router.push("/dashboard/plant-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-green-400 dark:hover:border-green-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400"><Leaf className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Plant Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{lang === 'id' ? "Analisis defisiensi nutrisi dan panduan optimalisasi flora aquascape." : "Nutrient deficiency analysis and aquascape flora optimization guide."}</p>
                <div className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            <div onClick={() => router.push("/dashboard/algae-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-teal-400 dark:hover:border-teal-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-teal-100 dark:bg-teal-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-teal-600 dark:text-teal-400"><Bug className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Algae Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{lang === 'id' ? "Identifikasi dan solusi pembasmian ledakan alga pada akuarium." : "Identification and eradication solutions for algae blooms in aquariums."}</p>
                <div className="flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            <div onClick={() => router.push("/dashboard/analytics")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400"><BarChart className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">{lang === 'id' ? "Analisis Klinis" : "Clinical Analytics"}</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{lang === 'id' ? "Dasbor statistik dan pemantauan mendalam dari parameter biologis akuarium." : "Statistical dashboard and in-depth monitoring of aquarium biological parameters."}</p>
                <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Analitik" : "Open Analytics"} <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}