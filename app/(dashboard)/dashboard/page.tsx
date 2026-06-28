// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, Fish, Leaf, 
  ShieldAlert, CheckCircle2, Container, Globe 
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
  alerts: number;
  isLoadingData: boolean; // Tambahan status untuk Progressive Loading
}

interface DashboardStats {
  tanks: number;
  alerts: number;
  fauna: number;
  flora: number;
}

export default function DashboardPage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({ tanks: 0, alerts: 0, fauna: 0, flora: 0 });
  const [tankList, setTankList] = useState<TankInfo[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [ipAddress, setIpAddress] = useState<string>("Loading IP...");

  // 1. Dapatkan IP Address
  useEffect(() => {
    async function getIpAddress() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        if (data.ip) setIpAddress(data.ip);
      } catch (err) {
        setIpAddress("127.0.0.1");
      }
    }
    getIpAddress();
  }, []);

  // 2. Tarik Data Utama secara Instan, Proses AI di Latar Belakang
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;
      const supabase = createClient();
      setLoadingPage(true);

      try {
        // Tarik data dasar tangki (Ini sangat cepat)
        const { data: aquariums } = await supabase
          .from("my_aquariums")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (aquariums && aquariums.length > 0) {
          // Urutkan dan tentukan tangki utama
          aquariums.sort((a, b) => {
            if (a.is_primary === b.is_primary) return a.name.localeCompare(b.name);
            return a.is_primary ? -1 : 1;
          });
          if (!aquariums.some(t => t.is_primary)) aquariums[0].is_primary = true;

          // Siapkan UI Tangki secara Instan dengan status Loading
          const initialTanks: TankInfo[] = aquariums.map(aq => ({
            id: aq.id,
            name: aq.name,
            is_primary: aq.is_primary || false,
            health_score: 0,
            alerts: 0,
            isLoadingData: true
          }));
          
          setTankList(initialTanks);
          setStats(prev => ({ ...prev, tanks: aquariums.length }));
          setLoadingPage(false); // Dashboard Langsung Muncul di Sini!

          // Jalankan Pengambilan Data Berat & Analisis AI di Latar Belakang secara Paralel
          aquariums.forEach(async (aq) => {
            try {
              const [paramsResponse, invRes, maintenanceRes] = await Promise.all([
                getParametersAction(aq.id),
                getTankInventoryAction(aq.id),
                getMaintenanceDashboardAction(aq.id)
              ]);

              // KUNCI SINKRONISASI 1: Jangan potong data parameter, kirimkan semua agar Health Engine bisa baca "Trend"
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
              
              // KUNCI SINKRONISASI 2: Action yang sama persis
              const healthAnalysis = analyzeAquariumHealth({
                aquarium: aq,
                parameters: sanitizedParams,
                fishes: aqFishes,
                plants: aqPlants,
                maintenanceStatus: maintenanceStatus
              });

              const aqAlertsCount = healthAnalysis.alerts.length;
              const aqFaunaCount = aqFishes.reduce((acc: number, f: any) => acc + (f.quantity || 0), 0);
              const aqFloraCount = aqPlants.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0);

              // Update data spesifik untuk tank ini
              setTankList(prev => prev.map(t => 
                t.id === aq.id 
                  ? { ...t, health_score: healthAnalysis.scores.overall, alerts: aqAlertsCount, isLoadingData: false } 
                  : t
              ));

              // Tambahkan total agregat ke Summary Cards secara progresif
              setStats(prev => ({
                ...prev,
                alerts: prev.alerts + aqAlertsCount,
                fauna: prev.fauna + aqFaunaCount,
                flora: prev.flora + aqFloraCount
              }));

            } catch (err) {
              console.error(`Gagal memproses data AI untuk tank ${aq.name}`, err);
              setTankList(prev => prev.map(t => t.id === aq.id ? { ...t, isLoadingData: false } : t));
            }
          });

        } else {
          setLoadingPage(false);
        }

      } catch (error) {
        console.error("Gagal memuat struktur dashboard:", error);
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
  const getHealthStroke = (score: number) => {
    if (score >= 85) return "stroke-emerald-500";
    if (score >= 60) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* =========================================================
            SEKSI BANNER SELAMAT DATANG & GAUGES KONDISI KESEHATAN TANK
        ========================================================= */}
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
                  <div 
                    onClick={() => router.push(`/dashboard/my-aquarium/${primaryTank.id}`)}
                    className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all flex items-center gap-6 group w-full sm:w-80"
                  >
                    {/* Tampilan Radial Loading Progresif untuk Tank Utama */}
                    {primaryTank.isLoadingData ? (
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500/50" />
                      </div>
                    ) : (
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                          <circle 
                            cx="50" cy="50" r="45" fill="none" strokeWidth="8" 
                            strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * primaryTank.health_score) / 100} 
                            className={`${getHealthStroke(primaryTank.health_score)} transition-all duration-1000 ease-out`} strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center mt-1">
                          <span className={`text-xl font-black ${getHealthColor(primaryTank.health_score)}`}>{primaryTank.health_score}</span>
                        </div>
                      </div>
                    )}
                    
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
                        {primaryTank.isLoadingData ? (
                          <span className="animate-pulse">{lang === 'id' ? "Menganalisis..." : "Analyzing..."}</span>
                        ) : primaryTank.alerts > 0 ? (
                          <><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> {primaryTank.alerts} {lang === 'id' ? "Peringatan" : "Alerts"}</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {lang === 'id' ? "Ekosistem Stabil" : "Stable Ecosystem"}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {secondaryTanks.length > 0 && (
                    <div className="flex flex-wrap md:justify-end gap-2 w-full max-w-sm">
                      {secondaryTanks.map(tank => (
                        <div 
                          key={tank.id} 
                          onClick={() => router.push(`/dashboard/my-aquarium/${tank.id}`)} 
                          className="cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 transition-colors shadow-sm"
                        >
                          {tank.isLoadingData ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          ) : (
                            <div className={`w-2.5 h-2.5 rounded-full ${tank.health_score >= 85 ? 'bg-emerald-500' : tank.health_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`}></div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{tank.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              {tank.isLoadingData ? "..." : (
                                <>Score: <span className={getHealthColor(tank.health_score)}>{tank.health_score}</span></>
                              )}
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

        {/* =========================================================
            SEKSI RINGKASAN STATISTIK UTAMA (LIVE AGGREGATION DATA)
        ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Akuarium Aktif" : "Active Tanks"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {stats.tanks}
                </h4>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl"><Container className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Peringatan Sistem" : "System Alerts"}</p>
                <h4 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {stats.alerts}
                </h4>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl"><ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Populasi Fauna" : "Fauna Population"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {stats.fauna}
                </h4>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl"><Fish className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Koleksi Flora" : "Flora Collection"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {stats.flora}
                </h4>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl"><Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}