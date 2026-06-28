// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, Activity, Fish, Leaf, Droplets, ArrowRight, 
  ShieldAlert, CheckCircle2, Clock, Plus, Container, Database, Zap // 👈 Tambahkan Zap di sini
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Tarik data statistik asli dari tabel yang sudah kita buat
  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;
      
      const supabase = createClient();
      setLoadingStats(true);

      try {
        // 1. Ambil data akuarium aktif
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
          // 2. Ambil data Ikan & deteksi yang sakit/karantina
          const { data: fishes } = await supabase
            .from("aquarium_fishes")
            .select("quantity, health_status")
            .in("aquarium_id", tankIds);

          if (fishes) {
            totalFauna = fishes.reduce((acc, f) => acc + (f.quantity || 0), 0);
            totalAlerts += fishes.filter(f => f.health_status === "Sick" || f.health_status === "Quarantined").length;
          }

          // 3. Ambil data Tanaman
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
            HEADER & WELCOME BANNER
        ========================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 transition-colors">
          {/* Efek Glow Animasi */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {dashDict.welcome || (lang === 'id' ? "Selamat datang," : "Welcome back,")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">{profile?.full_name || "User"}</span>!
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                {dashDict.subtitle || (lang === 'id' ? "Pantau kondisi akuarium dan jalankan analisis cerdas dengan AquaExpert AI." : "Monitor your aquarium conditions and run smart analysis with AquaExpert AI.")}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 
                  {role === "super_admin" ? "SUPER ADMIN" : role === "admin" ? "ADMIN" : "AQUARIST"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Button onClick={() => router.push("/dashboard/my-aquarium/new")} className="h-12 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black shadow-lg shadow-teal-500/20 px-6 transition-all active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                {lang === 'id' ? "Akuarium Baru" : "New Aquarium"}
              </Button>
            </div>
          </div>
        </div>

        {/* =========================================
            QUICK STATS CARDS (LIVE DATA)
        ========================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Akuarium Aktif */}
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

          {/* Card 2: Peringatan Klinis */}
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

          {/* Card 3: Populasi Ikan */}
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

          {/* Card 4: Populasi Tanaman */}
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
          
          {/* KOLOM KIRI (Akses Cepat Modul Utama) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {lang === 'id' ? "Modul Terintegrasi" : "Integrated Modules"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Menu 1: My Aquarium (Tempat Parameter & Inventory) */}
              <div onClick={() => router.push("/dashboard/my-aquarium")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-teal-300 dark:hover:border-teal-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="bg-teal-100 dark:bg-teal-900/40 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Droplets className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{lang === 'id' ? "My Aquarium" : "My Aquarium"}</h4>
                  <p className="text-xs font-medium text-slate-500 mb-4">{lang === 'id' ? "Pantau inventaris fauna/flora, jadwal perawatan, dan log grafik parameter air." : "Monitor flora/fauna inventory, maintenance schedules, and water parameter logs."}</p>
                  <div className="flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">
                    {lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Menu 2: Database Penyakit (Yang baru saja diselesaikan) */}
              <div onClick={() => router.push("/dashboard/diseases")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-rose-300 dark:hover:border-rose-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="bg-rose-100 dark:bg-rose-900/40 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{lang === 'id' ? "Database Penyakit" : "Disease Database"}</h4>
                  <p className="text-xs font-medium text-slate-500 mb-4">{lang === 'id' ? "Ensiklopedia patogen, gejala klinis, dan instruksi pengobatan." : "Encyclopedia of pathogens, clinical symptoms, and treatment instructions."}</p>
                  <div className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">
                    {lang === 'id' ? "Lihat Database" : "View Database"} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* KOLOM KANAN (Riwayat Aktivitas Placeholder) */}
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