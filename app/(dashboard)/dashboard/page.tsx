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
  Brain, Zap, HeartPulse, Globe, AlertCircle, XCircle 
} from "lucide-react";

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
  const [loadingStats, setLoadingStats] = useState(true);
  const [ipAddress, setIpAddress] = useState<string>("Loading IP...");

  // 1. Ambil IP Address User yang sedang login
  useEffect(() => {
    async function getIpAddress() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        if (data.ip) {
          setIpAddress(data.ip);
        }
      } catch (err) {
        setIpAddress("127.0.0.1 (Local/Proxy)");
      }
    }
    getIpAddress();
  }, []);

  // 2. Tarik data statistik asli dari tabel database
  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;
      
      const supabase = createClient();
      setLoadingStats(true);

      try {
        // Ambil data akuarium aktif
        const { data: aquariums } = await supabase
          .from("my_aquariums")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true);

        const tankIds = aquariums?.map(a => a.id) || [];
        let totalFauna = 0;
        let totalFlora = 0;
        let totalAlerts = 0;

        if (tankIds.length > 0) {
          // Ambil data Ikan & deteksi yang sakit/karantina
          const { data: fishes } = await supabase
            .from("aquarium_fishes")
            .select("quantity, health_status")
            .in("aquarium_id", tankIds);

          if (fishes) {
            totalFauna = fishes.reduce((acc, f) => acc + (f.quantity || 0), 0);
            totalAlerts += fishes.filter(f => f.health_status === "Sick" || f.health_status === "Quarantined").length;
          }

          // Ambil data Tanaman
          const { data: plants } = await supabase
            .from("aquarium_plants")
            .select("quantity")
            .in("aquarium_id", tankIds);

          if (plants) {
            totalFlora = plants.reduce((acc, p) => acc + (p.quantity || 0), 0);
          }
        }

        setStats({
          tanks: tankIds.length,
          alerts: totalAlerts,
          fauna: totalFauna,
          flora: totalFlora
        });

      } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (!isLoading) {
      fetchStats();
    }
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

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* =========================================
            HEADER & WELCOME BANNER (DENGAN TAMPILAN IP)
        ========================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 transition-colors">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:items-center">
            
            <div className="space-y-2 md:flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {dashDict.welcome || (lang === 'id' ? "Selamat datang," : "Welcome back,")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">{profile?.full_name || "User"}</span>!
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'id' ? "Pantau kondisi klinis akuarium dan jalankan analisis kecerdasan AI." : "Monitor aquarium clinical conditions and run smart AI analysis."}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 
                  {role === "super_admin" ? "SUPER ADMIN" : role === "admin" ? "ADMIN" : "AQUARIST"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                  {user?.email}
                </span>
                {/* LOG DATA IP ADDRESS */}
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors">
                  <Globe className="w-3.5 h-3.5 animate-pulse text-blue-500" />
                  IP: {ipAddress}
                </span>
              </div>
            </div>

            {/* PANEL PERINGATAN SISTEM DI KANAN */}
            <div className="shrink-0 w-full md:w-80 lg:w-96 cursor-pointer" onClick={() => router.push("/dashboard/my-aquarium")}>
              <div className="bg-rose-50/50 dark:bg-rose-950/10 p-5 rounded-[2rem] border-2 border-rose-200 dark:border-rose-900/50 shadow-sm relative overflow-hidden group transition-all hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800">
                <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-rose-500/5 transform group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                
                <h4 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400 tracking-widest mb-4 flex items-center gap-2 relative z-10">
                  <AlertCircle className="w-5 h-5" /> 
                  {lang === 'id' ? "Peringatan Sistem" : "System Alerts"}
                </h4>
                
                <ul className="space-y-3 relative z-10">
                  {loadingStats ? (
                    <div className="flex items-center gap-2 text-rose-600/70 dark:text-rose-400/70">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-bold">{lang === 'id' ? "Memeriksa ekosistem..." : "Checking ecosystem..."}</span>
                    </div>
                  ) : stats.alerts === 0 ? (
                    <p className="text-sm font-bold text-rose-600/70 dark:text-rose-400/70 italic">
                      {lang === 'id' ? "Ekosistem stabil, tidak ada anomali." : "Ecosystem stable, no anomalies."}
                    </p>
                  ) : (
                    <li className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-start gap-2.5 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {lang === 'id' 
                          ? `Kritis: ${stats.alerts} biota terdeteksi membutuhkan penanganan medis!` 
                          : `Critical: ${stats.alerts} biota detected requiring medical attention!`}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            QUICK STATS CARDS (LIVE DATA)
        ========================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{lang === 'id' ? "Akuarium Aktif" : "Active Tanks"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.tanks}
                </h4>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <Container className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{lang === 'id' ? "Peringatan Ikan" : "Health Alerts"}</p>
                <h4 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.alerts}
                </h4>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{lang === 'id' ? "Populasi Fauna" : "Fauna Population"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.fauna}
                </h4>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                <Fish className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{lang === 'id' ? "Koleksi Flora" : "Flora Collection"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : stats.flora}
                </h4>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            MAIN CONTENT AREA
        ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
          
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {lang === 'id' ? "Kecerdasan Buatan Utama" : "Core AI Systems"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div 
                onClick={() => router.push("/dashboard/diseases-expert")} 
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-teal-400 dark:hover:border-teal-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="bg-teal-100 dark:bg-teal-900/40 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <HeartPulse className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">
                    {lang === 'id' ? "Diseases Expert AI" : "Diseases Expert AI"}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                    {lang === 'id' 
                      ? "Diagnosis cerdas penyakit biota air menggunakan pemindaian komputer AI Vision secara real-time." 
                      : "Smart aquatic disease diagnosis utilizing AI Vision computer scans in real-time."}
                  </p>
                  <div className="flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">
                    {lang === 'id' ? "Mulai Diagnosis" : "Start Diagnosis"} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => router.push("/dashboard/clinical-intelligence")} 
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-blue-400 dark:hover:border-blue-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="bg-blue-100 dark:bg-blue-900/40 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-1">
                    {lang === 'id' ? "Clinical Intelligence" : "Clinical Intelligence"}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                    {lang === 'id' 
                      ? "Analisis mendalam kualitas air dan paramater klinis dengan rekomendasi pintar berbasis AI." 
                      : "In-depth analysis of water quality and clinical parameters with smart AI recommendations."}
                  </p>
                  <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">
                    {lang === 'id' ? "Analisis Data" : "Analyze Data"} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              {lang === 'id' ? "Riwayat Aktivitas Terkini" : "Recent Activities"}
            </h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center min-h-[250px] text-center transition-colors">
              <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">
                {lang === 'id' ? "Belum tersinkronisasi." : "Not synchronized yet."}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium px-4">
                {lang === 'id' ? "Log pekerjaan harian, notifikasi pengingat, dan riwayat ganti air akan muncul di sini (Segera Hadir)." : "Daily task logs, reminder notifications, and water change history will appear here (Coming Soon)."}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}