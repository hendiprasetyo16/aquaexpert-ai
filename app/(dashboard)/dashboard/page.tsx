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

// Import Fungsi Analisis Kesehatan & Pengambil Data Parameter Asli
import { analyzeAquariumHealth } from "@/features/aquariums/utils/health-engine";
import { getParametersAction } from "@/features/aquariums/actions/parameter.actions";
import type { AquariumParameterLog } from "@/features/aquariums/types/parameter.types";

interface TankInfo {
  id: string;
  name: string;
  is_primary: boolean;
  health_score: number;
  alerts: number;
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
  const [loadingStats, setLoadingStats] = useState(true);
  const [ipAddress, setIpAddress] = useState<string>("Loading IP...");

  // 1. Mengambil IP Address Pengguna
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

  // 2. Tarik Data Akuarium & Kalkulasi Skor Menggunakan Health Engine Asli
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;
      const supabase = createClient();
      setLoadingStats(true);

      try {
        // Ambil data semua akuarium milik pengguna yang aktif
        const { data: aquariums } = await supabase
          .from("my_aquariums")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        let totalFauna = 0;
        let totalFlora = 0;
        let totalAlerts = 0;
        let processedTanks: TankInfo[] = [];

        if (aquariums && aquariums.length > 0) {
          const tankIds = aquariums.map(a => a.id);
          
          // Ambil data seluruh ikan di semua tangki pengguna
          const { data: fishes } = await supabase
            .from("aquarium_fishes")
            .select("*")
            .in("aquarium_id", tankIds);

          // Ambil data seluruh tanaman di semua tangki pengguna
          const { data: plants } = await supabase
            .from("aquarium_plants")
            .select("*")
            .in("aquarium_id", tankIds);

          // Looping dan kalkulasi kondisi kesehatan setiap tangki secara sinkron
          processedTanks = await Promise.all(
            aquariums.map(async (aq) => {
              const aqFishes = fishes?.filter(f => f.aquarium_id === aq.id) || [];
              const aqPlants = plants?.filter(p => p.aquarium_id === aq.id) || [];
              
              // Hitung jumlah peringatan (ikan sakit atau dikarantina)
              const aqAlerts = aqFishes.filter(
                f => f.health_status === "Sick" || f.health_status === "Quarantined"
              ).length;
              
              // Ambil parameter log teranyar untuk tangki ini
              const paramsResponse = await getParametersAction(aq.id);
              const rawLatestParams = paramsResponse.data && paramsResponse.data.length > 0 
                ? [paramsResponse.data[0]] 
                : [];

              // SANITASI TYPESCRIPT: Ubah undefined menjadi null secara spesifik tanpa menggunakan 'any'
              const sanitizedParams: AquariumParameterLog[] = rawLatestParams.map(param => {
                return {
                  ...param,
                  temperature: param.temperature ?? null,
                  ph: param.ph ?? null,
                  ammonia: param.ammonia ?? null,
                  nitrite: param.nitrite ?? null,
                  nitrate: param.nitrate ?? null,
                } as AquariumParameterLog; 
              });

              // HITUNG SKOR MENGGUNAKAN HEALTH ENGINE ASLI
              const healthAnalysis = analyzeAquariumHealth({
                aquarium: aq,
                parameters: sanitizedParams, // <-- Sudah 100% sesuai dengan interface types
                fishes: aqFishes,
                plants: aqPlants
              });

              return {
                id: aq.id,
                name: aq.name,
                is_primary: aq.is_primary || false,
                health_score: healthAnalysis.scores.overall,
                alerts: aqAlerts
              };
            })
          );

          // Akumulasi total kuantitas untuk Card Ringkasan Statistik
          if (fishes) {
            totalFauna = fishes.reduce((acc, f) => acc + (f.quantity || 0), 0);
            totalAlerts = fishes.filter(f => f.health_status === "Sick" || f.health_status === "Quarantined").length;
          }
          if (plants) {
            totalFlora = plants.reduce((acc, p) => acc + (p.quantity || 0), 0);
          }
        }

        // Urutkan susunan: Tank Utama ditaruh paling atas, sisanya diurutkan alfabetis
        processedTanks.sort((a, b) => {
          if (a.is_primary === b.is_primary) return a.name.localeCompare(b.name);
          return a.is_primary ? -1 : 1;
        });

        // Pengaman Visual: Jika user punya akuarium tapi tidak ada yang ditandai is_primary, jadikan index ke-0 sebagai utama sementara
        if (processedTanks.length > 0 && !processedTanks.some(t => t.is_primary)) {
          processedTanks[0].is_primary = true;
        }

        setTankList(processedTanks);
        setStats({ tanks: aquariums?.length || 0, alerts: totalAlerts, fauna: totalFauna, flora: totalFlora });

      } catch (error) {
        console.error("Gagal memproses data dashboard klinis:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (!isLoading) fetchDashboardData();
  }, [user?.id, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  const rootDict = (dict as Record<string, any>) || {};
  const dashDict = rootDict.dashboard || {};

  // Pemisahan Tank Utama & Tank Sekunder untuk Perbedaan Gaya Visual
  const primaryTank = tankList.find(t => t.is_primary);
  const secondaryTanks = tankList.filter(t => !t.is_primary);

  // Helper Pengolah Warna Dinamis untuk teks dan garis lingkaran gauge
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
          {/* Aksen Gradasi Visual Latar Belakang */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
            
            {/* Teks Salam Pengguna */}
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

            {/* SEKSI DISPLAY WIDGET TANK BERBEDA GAYA */}
            <div className="shrink-0 flex flex-col md:items-end gap-4 w-full sm:w-auto">
              {loadingStats ? (
                <div className="h-32 w-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : primaryTank ? (
                <>
                  {/* GAYA 1: TANK UTAMA (Menggunakan Lingkaran Radian / Gauge Bulat Luas) */}
                  <div 
                    onClick={() => router.push(`/dashboard/my-aquarium/${primaryTank.id}`)}
                    className="cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all flex items-center gap-6 group w-full sm:w-80"
                  >
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
                        {primaryTank.alerts > 0 ? (
                          <><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> {primaryTank.alerts} {lang === 'id' ? "Peringatan" : "Alerts"}</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {lang === 'id' ? "Ekosistem Stabil" : "Stable Ecosystem"}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* GAYA 2: TANK KE-2, KE-3, DST. (Gaya Minimalis/Pill Ringkas di Bawahnya) */}
                  {secondaryTanks.length > 0 && (
                    <div className="flex flex-wrap md:justify-end gap-2 w-full max-w-sm">
                      {secondaryTanks.map(tank => (
                        <div 
                          key={tank.id} 
                          onClick={() => router.push(`/dashboard/my-aquarium/${tank.id}`)} 
                          className="cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 transition-colors shadow-sm"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${tank.health_score >= 85 ? 'bg-emerald-500' : tank.health_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`}></div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{tank.name}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Score: <span className={getHealthColor(tank.health_score)}>{tank.health_score}</span></p>
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
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.tanks}
                </h4>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl"><Container className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Peringatan Kesehatan" : "Health Alerts"}</p>
                <h4 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.alerts}
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
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.fauna}
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
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.flora}
                </h4>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl"><Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
            </div>
          </div>
        </div>

        {/* =========================================================
            SEKSI MODUL AI EXPERT & ANALYTICS (SINKRONISASI LINK MENU)
        ========================================================= */}
        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            {lang === 'id' ? "Modul Kecerdasan Buatan" : "AI Intelligence Modules"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Disease Expert AI */}
            <div onClick={() => router.push("/dashboard/disease-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-red-400 dark:hover:border-red-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-red-600 dark:text-red-400"><HeartPulse className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Disease Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">Diagnosis cerdas penyakit biota air menggunakan pemindaian komputer AI Vision.</p>
                <div className="flex items-center text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">Buka Modul <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            {/* Fish Expert AI */}
            <div onClick={() => router.push("/dashboard/fish-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-blue-400 dark:hover:border-blue-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"><Fish className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Fish Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">Konsultasi ahli terkait perawatan, kompatibilitas, dan nutrisi spesies ikan.</p>
                <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">Buka Modul <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            {/* Plant Expert AI */}
            <div onClick={() => router.push("/dashboard/plant-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-green-400 dark:hover:border-green-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400"><Leaf className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Plant Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">Analisis defisiensi nutrisi dan panduan optimalisasi flora aquascape.</p>
                <div className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">Buka Modul <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            {/* Algae Expert AI */}
            <div onClick={() => router.push("/dashboard/algae-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-teal-400 dark:hover:border-teal-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-teal-100 dark:bg-teal-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-teal-600 dark:text-teal-400"><Bug className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Algae Expert AI</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">Identifikasi dan solusi pembasmian ledakan alga pada akuarium.</p>
                <div className="flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">Buka Modul <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

            {/* Clinical Analytics */}
            <div onClick={() => router.push("/dashboard/analytics")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-800 shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400"><BarChart className="w-6 h-6" /></div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">Clinical Analytics</h4>
                <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">Dasbor statistik dan pemantauan mendalam dari parameter biologis akuarium.</p>
                <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">Buka Analitik <ArrowRight className="w-3.5 h-3.5" /></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}