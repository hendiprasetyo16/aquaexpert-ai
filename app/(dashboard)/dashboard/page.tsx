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
  Cpu, BarChart, HeartPulse, Globe, Bug, Database,
  CalendarClock, Plus, Circle, CheckCircle, Calendar, Trash2
} from "lucide-react";

import { analyzeAquariumHealth, ActiveTreatmentEngine } from "@/features/aquariums/utils/health-engine";
import type { AquariumParameterLog } from "@/features/aquariums/types/parameter.types";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";
import type { TankFish, TankPlant } from "@/features/aquariums/types/inventory.types";
import type { MaintenanceTask, MaintenanceDashboardStatus } from "@/features/aquariums/types/maintenance.types";

import { getUserRemindersAction, toggleReminderStatusAction, clearCompletedRemindersAction, type ReminderDto } from "@/features/reminders/actions/reminder.actions";
import AddReminderModal from "@/features/reminders/components/AddReminderModal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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

interface ActivityLog {
  id: string;
  type: "parameter" | "maintenance" | "treatment" | "system" | "flora_fauna";
  title_id: string;
  title_en: string;
  desc_id: string;
  desc_en: string;
  date: Date;
}

interface DbRow { 
  aquarium_id: string; 
  [key: string]: unknown; 
}

interface InventoryRow extends DbRow {
  quantity?: number;
}

const groupByAquarium = <T extends DbRow>(data: T[] | null) => {
  return (data || []).reduce<Record<string, T[]>>((acc, curr) => {
    acc[curr.aquarium_id] = acc[curr.aquarium_id] || [];
    acc[curr.aquarium_id].push(curr);
    return acc;
  }, {});
};

const translateSystemLog = (text: string) => {
  if (!text) return text;
  let en = text;
  if (en.includes("membuat akuarium baru bernama")) return en.replace(/(.*?) telah membuat akuarium baru bernama "(.*?)"\.?/i, "$1 created a new aquarium named \"$2\".");
  if (en.includes("memperbarui pengaturan akuarium")) return en.replace(/(.*?) memperbarui pengaturan akuarium "(.*?)"\.?/i, "$1 updated the settings for aquarium \"$2\".");
  if (en.includes("telah menghapus akuarium")) return en.replace(/(.*?) telah menghapus akuarium "(.*?)" miliknya\.?/i, "$1 deleted their aquarium \"$2\".");
  if (en.includes("menetapkan")) return en.replace(/(.*?) menetapkan "(.*?)" sebagai akuarium utama\.?/i, "$1 set \"$2\" as the primary aquarium.");
  if (en.includes("mengubah status akuarium")) return en.replace(/(.*?) mengubah status akuarium "(.*?)"\.?/i, "$1 toggled the active status for aquarium \"$2\".");
  if (en.includes("menambahkan") && en.includes("ekor")) return en.replace(/(.*?) menambahkan (.*?) ekor "(.*?)" ke akuarium "(.*?)"\.?/i, "$1 added $2 qty of \"$3\" to tank \"$4\".");
  if (en.includes("menambahkan") && en.includes("bibit")) return en.replace(/(.*?) menambahkan (.*?) bibit "(.*?)" ke akuarium "(.*?)"\.?/i, "$1 added $2 portions of \"$3\" to tank \"$4\".");
  if (en.includes("memperbarui status")) return en.replace(/(.*?) memperbarui status "(.*?)" \((.*?)\) di "(.*?)"\.?/i, "$1 updated the status of \"$2\" ($3) in tank \"$4\".");
  if (en.includes("menghapus")) return en.replace(/(.*?) menghapus "(.*?)" dari akuarium "(.*?)"\.?/i, "$1 removed \"$2\" from tank \"$3\".");
  if (en.includes("menjadwalkan tugas")) return en.replace(/(.*?) menjadwalkan tugas "(.*?)" di akuarium "(.*?)"\.?/i, "$1 scheduled task \"$2\" in tank \"$3\".");
  if (en.includes("mengubah jadwal tugas")) return en.replace(/(.*?) mengubah jadwal tugas "(.*?)" di akuarium "(.*?)"\.?/i, "$1 updated the schedule for task \"$2\" in tank \"$3\".");
  if (en.includes("menghapus jadwal tugas")) return en.replace(/(.*?) menghapus jadwal tugas "(.*?)" dari akuarium "(.*?)"\.?/i, "$1 removed task schedule \"$2\" from tank \"$3\".");
  if (en.includes("mencatat aktivitas")) return en.replace(/(.*?) mencatat aktivitas "(.*?)" di akuarium "(.*?)"\.?/i, "$1 logged a \"$2\" activity in tank \"$3\".");
  if (en.includes("menghapus salah satu riwayat pekerjaan")) return en.replace(/(.*?) menghapus salah satu riwayat pekerjaan dari akuarium "(.*?)"\.?/i, "$1 deleted a maintenance log from tank \"$2\".");
  if (en.includes("mencatat kualitas air baru")) return en.replace(/(.*?) mencatat kualitas air baru di akuarium "(.*?)"\.?/i, "$1 logged new water parameters in tank \"$2\".");
  if (en.includes("menghapus riwayat parameter air")) return en.replace(/(.*?) menghapus riwayat parameter air \((.*?)\) dari akuarium "(.*?)"\.?/i, "$1 deleted water log ($2) from tank \"$3\".");
  return en;
};

const translateSystemTitle = (title: string) => {
  const map: Record<string, string> = {
    "Akuarium Baru Dibuat": "New Aquarium Created",
    "Akuarium Diperbarui": "Aquarium Updated",
    "Akuarium Dihapus": "Aquarium Deleted",
    "Status Utama Diubah": "Primary Status Changed",
    "Penghapusan Paksa (Admin)": "Forced Deletion (Admin)",
    "Akuarium Dinonaktifkan": "Aquarium Disabled",
    "Akuarium Diaktifkan": "Aquarium Enabled",
    "Tanaman Ditambahkan": "Flora Added",
    "Fauna Ditambahkan": "Fauna Added",
    "Status Fauna Diubah": "Fauna Status Updated",
    "Fauna Dihapus": "Fauna Removed",
    "Flora Dihapus": "Flora Removed",
    "Jadwal Perawatan Dibuat": "Maintenance Scheduled",
    "Jadwal Perawatan Diperbarui": "Maintenance Updated",
    "Jadwal Perawatan Dihapus": "Maintenance Removed",
    "Pekerjaan Diselesaikan": "Task Completed",
    "Riwayat Perawatan Dihapus": "Maintenance History Removed",
    "Parameter Air Dicatat": "Water Parameter Logged",
    "Catatan Air Dihapus": "Water Log Removed"
  };
  return map[title] || title;
};

export default function DashboardPage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({ tanks: 0, alerts: 0, fauna: 0, flora: 0 });
  const [tankList, setTankList] = useState<TankInfo[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false); // 💡 State untuk Modal Konfirmasi Baru

  const [loadingPage, setLoadingPage] = useState(true);
  const [ipAddress, setIpAddress] = useState<string>("Loading IP...");

  useEffect(() => {
    async function getIpAddress() {
      if (!user?.id) return; 
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        if (data.ip) {
          setIpAddress(data.ip);
          const supabase = createClient();
          await supabase.from("profiles").update({ ip_address: data.ip, last_login_at: new Date().toISOString() }).eq("id", user.id);
        }
      } catch {
        setIpAddress("127.0.0.1");
      }
    }
    if (!isLoading && user?.id) getIpAddress();
  }, [user?.id, isLoading]);

  const fetchRemindersOnly = async () => {
    const { data } = await getUserRemindersAction();
    if (data) setReminders(data);
  };

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    const supabase = createClient();

    try {
      const logs: ActivityLog[] = [];
      const { data: aquariums } = await supabase.from("my_aquariums").select("*").eq("user_id", user.id).eq("is_active", true);

      if (aquariums && aquariums.length > 0) {
        const tankIds = aquariums.map(a => a.id);
        aquariums.sort((a, b) => (a.is_primary === b.is_primary ? a.name.localeCompare(b.name) : a.is_primary ? -1 : 1));
        if (!aquariums.some(t => t.is_primary)) aquariums[0].is_primary = true;

        const [
          { data: rawParams }, { data: rawFishes }, { data: rawPlants }, { data: rawMaint }, 
          { data: rawTreatments }, 
          { data: paramLogsRes }, { data: maintLogsRes }, { data: taskLogsRes }, { data: fishLogsRes },
          { data: plantLogsRes }, { data: treatmentSessionsRes }, { data: treatmentDailyLogsRes }
        ] = await Promise.all([
          supabase.from("aquarium_parameters").select("*").in("aquarium_id", tankIds),
          supabase.from("aquarium_fishes").select("aquarium_id, quantity, fish_id, health_status, size_category, fish:fishes(*)").in("aquarium_id", tankIds),
          supabase.from("aquarium_plants").select("aquarium_id, quantity, plant_id, status, plant:plants(*)").in("aquarium_id", tankIds),
          supabase.from("maintenance_tasks").select("*").in("aquarium_id", tankIds),
          supabase.from("treatment_sessions").select("id, aquarium_id, disease_id, medication_id, status, disease:diseases(name_id, name_en)").in("aquarium_id", tankIds).eq("status", "Active"),
          
          supabase.from("aquarium_parameters").select("id, record_date, parameter_source").in("aquarium_id", tankIds).order('record_date', { ascending: false }).limit(5),
          supabase.from("aquarium_maintenance_logs").select("id, performed_at, maintenance_type, notes").in("aquarium_id", tankIds).order('performed_at', { ascending: false }).limit(5),
          supabase.from("maintenance_tasks").select("id, created_at, title, interval_days").in("aquarium_id", tankIds).order('created_at', { ascending: false }).limit(5),
          supabase.from("aquarium_fishes").select("id, added_at, quantity, fishes(name_id, name_en)").in("aquarium_id", tankIds).order('added_at', { ascending: false }).limit(5),
          supabase.from("aquarium_plants").select("id, added_at, quantity, plants(name_id, name_en)").in("aquarium_id", tankIds).order('added_at', { ascending: false }).limit(5),
          supabase.from("treatment_sessions").select("id, started_at, status, outcome_reason, diseases(name_id, name_en)").in("aquarium_id", tankIds).order('started_at', { ascending: false }).limit(5),
          supabase.from("treatment_logs").select("id, log_date, day_number, action_taken, treatment_sessions!inner(aquarium_id, diseases(name_id, name_en))").in("treatment_sessions.aquarium_id", tankIds).order('log_date', { ascending: false }).limit(5)
        ]);

        const groupedParams = groupByAquarium(rawParams as DbRow[]);
        const groupedFishes = groupByAquarium(rawFishes as InventoryRow[]);
        const groupedPlants = groupByAquarium(rawPlants as InventoryRow[]);
        const groupedMaint = groupByAquarium(rawMaint as DbRow[]);
        const groupedTreatments = groupByAquarium(rawTreatments as DbRow[]); 

        let totalAlerts = 0, totalFauna = 0, totalFlora = 0;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const processedTanks = aquariums.map((aq) => {
          const aqParams = groupedParams[aq.id] || [];
          const aqFishes = groupedFishes[aq.id] || [];
          const aqPlants = groupedPlants[aq.id] || [];
          const aqMaintenanceRaw = groupedMaint[aq.id] || [];
          const aqTreatments = groupedTreatments[aq.id] || []; 

          aqParams.sort((a, b) => new Date(b.record_date as string).getTime() - new Date(a.record_date as string).getTime());
          
          const sanitizedParams = aqParams.map(param => ({ 
            ...param, 
            temperature: typeof param.temperature === 'number' ? param.temperature : null, 
            ph: typeof param.ph === 'number' ? param.ph : null, 
            ammonia: typeof param.ammonia === 'number' ? param.ammonia : null, 
            nitrite: typeof param.nitrite === 'number' ? param.nitrite : null, 
            nitrate: typeof param.nitrate === 'number' ? param.nitrate : null 
          } as AquariumParameterLog));

          const mappedMaintenance: MaintenanceDashboardStatus[] = aqMaintenanceRaw.map((taskRaw) => {
            const task = taskRaw as unknown as MaintenanceTask;
            let isOverdue = false;
            let daysRemaining = 0;
            let urgencyLevel: "safe" | "warning" | "critical" = "safe";

            if (task.next_due_at) {
              const dueDate = new Date(task.next_due_at as string);
              const normalizedDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
              const diffTime = normalizedDue.getTime() - today.getTime();
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (daysRemaining < 0) {
                isOverdue = true;
                urgencyLevel = daysRemaining <= -3 ? "critical" : "warning";
              } else if (daysRemaining <= 2) {
                urgencyLevel = "warning";
              }
            }
            return { task, isOverdue, daysRemaining, urgencyLevel, lastMaintenanceDaysAgo: null };
          });

          const healthAnalysis = analyzeAquariumHealth({ 
            aquarium: aq as Aquarium, parameters: sanitizedParams, 
            fishes: aqFishes as unknown as TankFish[], plants: aqPlants as unknown as TankPlant[], 
            maintenanceStatus: mappedMaintenance, activeTreatments: aqTreatments as unknown as ActiveTreatmentEngine[], 
            lang 
          });

          const faunaCount = aqFishes.reduce((acc, f) => acc + (f.quantity || 0), 0);
          const floraCount = aqPlants.reduce((acc, p) => acc + (p.quantity || 0), 0);

          totalAlerts += (healthAnalysis.alerts || []).length; totalFauna += faunaCount; totalFlora += floraCount;

          return { 
            id: aq.id, name: aq.name, is_primary: aq.is_primary || false, 
            health_score: healthAnalysis.scores.overall, alerts: healthAnalysis.alerts || [], 
            faunaCount, floraCount 
          };
        });

        setTankList(processedTanks);
        setStats({ tanks: aquariums.length, alerts: totalAlerts, fauna: totalFauna, flora: totalFlora });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paramLogsRes?.forEach((log: any) => logs.push({ id: `p-${log.id}`, type: "parameter", title_id: "Parameter Air Dicatat", title_en: "Water Parameter Logged", desc_id: `Melalui ${log.parameter_source || 'Sistem'}.`, desc_en: `Via ${log.parameter_source || 'System'}.`, date: new Date(log.record_date as string) }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        maintLogsRes?.forEach((log: any) => logs.push({ id: `ml-${log.id}`, type: "maintenance", title_id: "Perawatan Selesai", title_en: "Maintenance Completed", desc_id: `Tugas: ${String(log.maintenance_type).replace('_', ' ')}.`, desc_en: `Task: ${String(log.maintenance_type).replace('_', ' ')}.`, date: new Date(log.performed_at as string) }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        taskLogsRes?.forEach((task: any) => logs.push({ id: `mt-${task.id}`, type: "maintenance", title_id: "Jadwal Tugas Dibuat", title_en: "Task Scheduled", desc_id: `Tugas "${task.title}" dijadwalkan setiap ${task.interval_days} hari.`, desc_en: `Task "${task.title}" scheduled every ${task.interval_days} days.`, date: new Date(task.created_at as string) }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fishLogsRes?.forEach((f: any) => logs.push({ id: `f-${f.id}`, type: "flora_fauna", title_id: "Fauna Ditambahkan", title_en: "Fauna Added", desc_id: `${f.quantity} ekor ${f.fishes?.name_id || 'Ikan'} masuk ke akuarium.`, desc_en: `${f.quantity} qty ${f.fishes?.name_en || 'Fish'} added to tank.`, date: new Date(f.added_at as string) }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plantLogsRes?.forEach((p: any) => logs.push({ id: `pl-${p.id}`, type: "flora_fauna", title_id: "Flora Ditambahkan", title_en: "Flora Added", desc_id: `${p.quantity} porsi ${p.plants?.name_id || 'Tanaman'} masuk ke akuarium.`, desc_en: `${p.quantity} qty ${p.plants?.name_en || 'Plant'} added to tank.`, date: new Date(p.added_at as string) }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        treatmentSessionsRes?.forEach((session: any) => {
          const diseaseName = session.diseases?.name_id || 'Penyakit';
          let tId = "Sesi Pengobatan Dimulai", tEn = "Treatment Started", dId = `Karantina untuk ${diseaseName}.`, dEn = `Quarantine for ${session.diseases?.name_en || 'Disease'}.`;
          if (session.status === 'Completed') { tId = "Pengobatan Selesai"; tEn = "Treatment Completed"; dId = `Pengobatan ${diseaseName} dinyatakan selesai.`; }
          else if (session.status === 'Aborted') { tId = "Pengobatan Dibatalkan"; tEn = "Treatment Aborted"; dId = `Alasan: ${session.outcome_reason || '-'}`; }
          logs.push({ id: `ts-${session.id}`, type: "treatment", title_id: tId, title_en: tEn, desc_id: dId, desc_en: dEn, date: new Date(session.started_at as string) });
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        treatmentDailyLogsRes?.forEach((tlog: any) => {
          const diseaseName = tlog.treatment_sessions?.diseases?.name_id || 'Penyakit';
          logs.push({ id: `tl-${tlog.id}`, type: "treatment", title_id: `Catat Medis (Hari ${tlog.day_number})`, title_en: `Medical Log (Day ${tlog.day_number})`, desc_id: `Aksi: ${tlog.action_taken || 'Observasi'} untuk ${diseaseName}.`, desc_en: `Action: ${tlog.action_taken || 'Observe'} for ${diseaseName}.`, date: new Date(tlog.log_date as string) });
        });
      }

      if (role === "super_admin" || role === "admin") {
        const { data: sysLogs } = await supabase.from("system_activities").select("*").order("created_at", { ascending: false }).limit(10);
        sysLogs?.forEach(sys => {
          if (role === "admin" && sys.category === "data_crud") return;
          logs.push({ 
            id: `sys-${sys.id}`, type: "system", title_id: `[Admin] ${sys.title}`, title_en: `[Admin] ${translateSystemTitle(sys.title)}`, 
            desc_id: sys.message, desc_en: translateSystemLog(sys.message), date: new Date(sys.created_at as string) 
          });
        });
      }

      logs.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivities(logs.slice(0, 8));
      await fetchRemindersOnly();
      setLoadingPage(false);

    } catch (error) {
      console.error("Dashboard error:", error);
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (!isLoading) fetchDashboardData();
  }, [user?.id, isLoading, role]); 

  // 💡 TRIGGER TOAST SAAT CENTANG TUGAS
  const handleToggleReminder = async (id: string, currentStatus: boolean) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: !currentStatus } : r));
    const res = await toggleReminderStatusAction(id, !currentStatus);
    
    if (res.success) {
      toast.success(lang === 'id' ? "Sip! Tugas berhasil ditandai." : "Great! Task marked as done.", {
        icon: !currentStatus ? '✅' : '🔄',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } else {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: currentStatus } : r));
      toast.error(lang === 'id' ? "Gagal mengubah status." : "Failed to change status.");
    }
  };

  // 💡 TOMBOL KLIK BUKA MODAL KONFIRMASI
  const handleOpenClearConfirm = () => {
    const completedCount = reminders.filter(r => r.is_completed).length;
    if (completedCount === 0) {
      toast.error(lang === 'id' ? "Tidak ada tugas selesai untuk dibersihkan!" : "No completed tasks to clear!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
      return;
    }
    setShowConfirmClear(true);
  };

  // 💡 EKSEKUSI PENGHAPUSAN SETELAH KONFIRMASI
  const executeClearCompleted = async () => {
    setIsClearing(true);
    const res = await clearCompletedRemindersAction();
    if (res.success) {
      toast.success(lang === 'id' ? "Tugas selesai telah dihapus dari DB!" : "Completed tasks swept from DB!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
      fetchRemindersOnly();
      setShowConfirmClear(false);
    } else {
      toast.error(lang === 'id' ? "Gagal membersihkan database." : "Failed to clear database.");
    }
    setIsClearing(false);
  };

  if (isLoading || loadingPage) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col gap-4 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">{lang === 'id' ? "Memuat Data Ekosistem..." : "Loading Ecosystem Data..."}</p>
      </div>
    );
  }

  const rootDict = (dict as unknown as Record<string, Record<string, string>>) || {};
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
        
        {/* =========================================
            SEKSI 1: BANNER SELAMAT DATANG
        ========================================= */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 transition-colors">
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

        {/* =========================================
            SEKSI 2: KARTU STATISTIK (💡 NEON MERAH & KELAS DIPERBAIKI)
        ========================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Akuarium Aktif" : "Active Tanks"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.tanks}</h4>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                <Container className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
              {tankList.map(t => (
                <div key={t.id} className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="truncate pr-2 font-semibold flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.is_primary ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                    {t.name}
                  </span>
                  <span className="shrink-0">{t.is_primary ? "Utama" : "Secondary"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-[0_0_25px_rgba(244,63,94,0.15)] dark:hover:shadow-[0_0_50px_rgba(225,29,72,0.6)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Peringatan Sistem" : "System Alerts"}</p>
                <h4 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{stats.alerts}</h4>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50">
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {tankList.map(t => (
                <div key={t.id} className="flex flex-col text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{t.name}:</span>
                  {t.alerts.length > 0 ? (
                    <span className="text-rose-500 dark:text-rose-400 line-clamp-1 leading-tight mt-0.5">
                      • {t.alerts[0]} {t.alerts.length > 1 && `(+${t.alerts.length - 1} lainnya)`}
                    </span>
                  ) : (
                    <span className="text-emerald-500 dark:text-emerald-400 font-medium mt-0.5">✔️ {lang === 'id' ? 'Ekosistem Aman' : 'Safe Ecosystem'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Populasi Fauna" : "Fauna Population"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.fauna}</h4>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50">
                <Fish className="w-6 h-6 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
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

          <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Koleksi Flora" : "Flora Collection"}</p>
                <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.flora}</h4>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50">
                <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
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

        {/* =========================================
            SEKSI 3: TO-DO LIST (💡 KINI DENGAN MODAL KONFIRMASI MODERN)
        ========================================= */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-indigo-500" />
              {lang === 'id' ? "Tugas & Pengingat" : "Tasks & Reminders"}
            </h3>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={handleOpenClearConfirm} 
                disabled={isClearing}
                className="flex items-center gap-1.5 px-3 h-10 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{lang === 'id' ? "Bersihkan Tugas" : "Clear Completed"}</span>
              </button>

              <Button onClick={() => setIsReminderModalOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-10 px-4 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_5px_15px_rgba(79,70,229,0.3)] cursor-pointer border border-transparent">
                <Plus className="w-4 h-4 mr-2" /> {lang === 'id' ? "Tambah Tugas" : "Add Task"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.length === 0 ? (
              <div className="col-span-full bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-colors">
                <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 font-bold">{lang === 'id' ? "Belum ada jadwal tugas." : "No tasks scheduled."}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{lang === 'id' ? "Jadwal ganti air atau beri pakan akan muncul di sini." : "Water changes or feeding routines will appear here."}</p>
              </div>
            ) : (
              reminders.slice(0, 6).map(rem => (
                <div key={rem.id} className={`flex items-start gap-4 p-5 rounded-3xl border transition-all duration-300 ${rem.is_completed ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                  <button onClick={() => handleToggleReminder(rem.id, rem.is_completed)} className="mt-0.5 shrink-0 transform hover:scale-110 transition-transform">
                    {rem.is_completed 
                      ? <CheckCircle className="w-6 h-6 text-emerald-500" /> 
                      : <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate transition-colors ${rem.is_completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{rem.title}</h4>
                    {rem.description && <p className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">{rem.description}</p>}
                    
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        rem.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 
                        rem.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      }`}>
                        {lang === 'id' && rem.priority === 'high' ? 'Tinggi' : lang === 'id' && rem.priority === 'low' ? 'Rendah' : rem.priority}
                      </span>
                      
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        <Calendar className="w-3 h-3"/> {new Date(rem.due_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                      </span>
                      
                      {rem.aquarium && (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md truncate max-w-[120px]">
                          <Container className="w-3 h-3 shrink-0"/> <span className="truncate">{rem.aquarium.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =========================================
            SEKSI 4 & 5 GABUNGAN: ENSIKLOPEDIA + DIAGNOSTIC TOOLS
        ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
          
          <div className="lg:col-span-2 space-y-8">
            
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" />
                {lang === 'id' ? "Ensiklopedia Spesies" : "Species Encyclopedia"}
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div onClick={() => router.push("/dashboard/fishes")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_35px_rgba(59,130,246,0.35)] shadow-sm">
                  <Fish className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-blue-500 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">{lang === 'id' ? "Data Ikan" : "Fishes"}</span>
                </div>
  
                <div onClick={() => router.push("/dashboard/plants")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_35px_rgba(16,185,129,0.35)] shadow-sm">
                  <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-center">{lang === 'id' ? "Tanaman Air" : "Plants"}</span>
                </div>
  
                <div onClick={() => router.push("/dashboard/algae")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] shadow-sm">
                  <Bug className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-center">{lang === 'id' ? "Jenis Alga" : "Algae"}</span>
                </div>
  
                <div onClick={() => router.push("/dashboard/diseases")} className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] dark:hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] shadow-sm">
                  <Database className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-red-500 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors text-center">{lang === 'id' ? "Penyakit" : "Diseases"}</span>
                </div>
              </div>
            </div>

            {/* 💡 SISTEM PAKAR DENGAN EFEK NEON MODERN */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                {lang === 'id' ? "Sistem Pakar Diagnostik" : "Expert Diagnostic Systems"}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                
                <div onClick={() => router.push("/dashboard/disease-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] dark:hover:shadow-[0_0_40px_rgba(225,29,72,0.5)]">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/20 blur-3xl rounded-full group-hover:bg-rose-500/20 dark:group-hover:bg-rose-500/30 transition-colors duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
                      <HeartPulse className="w-6 h-6 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Disease Expert</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Pemindaian klinis dan identifikasi patogen menggunakan pemindai visual terotomasi." : "Clinical scanning and pathogen identification using automated visual scanners."}</p>
                    <div className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Mulai Pemindaian" : "Start Scan"} <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </div>

                <div onClick={() => router.push("/dashboard/fish-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      <Fish className="w-6 h-6 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Fish Expert</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Sistem pakar terkait nutrisi harian, perhitungan bioload, dan sengketa teritorial ikan." : "Expert system for daily nutrition, bioload calculations, and territorial disputes."}</p>
                    <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Konsultasi Ahli" : "Expert Consult"} <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </div>

                <div onClick={() => router.push("/dashboard/plant-expert/engine")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                      <Leaf className="w-6 h-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Plant Expert</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Analisis defisiensi nutrisi dan panduan optimalisasi flora aquascape." : "Nutrient deficiency analysis and aquascape flora optimization guide."}</p>
                    <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Modul" : "Open Module"} <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </div>

                <div onClick={() => router.push("/dashboard/algae-expert")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/20 blur-3xl rounded-full group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30 transition-colors duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                      <Bug className="w-6 h-6 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Algae Expert</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Sistem pendeteksi parameter penyebab ledakan alga dan protokol pembasmiannya." : "Parameter detection system for algae blooms and eradication protocols."}</p>
                    <div className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Analisis Alga" : "Analyze Algae"} <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </div>

                <div onClick={() => router.push("/dashboard/analytics")} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-all duration-300 ease-out relative overflow-hidden hover:-translate-y-1 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] sm:col-span-2 xl:col-span-1">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                      <BarChart className="w-6 h-6 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lang === 'id' ? "Analisis Klinis" : "Clinical Analytics"}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{lang === 'id' ? "Dasbor statistik dan pemantauan mendalam dari parameter biologis akuarium." : "Statistical dashboard and in-depth monitoring of aquarium biological parameters."}</p>
                    <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:gap-2 transition-all gap-1">{lang === 'id' ? "Buka Analitik" : "Open Analytics"} <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* KOLOM KANAN (Aktivitas Terkini) */}
          <div className="space-y-4 flex flex-col h-full mt-8 lg:mt-0">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 px-1">
              <Clock className="w-5 h-5 text-slate-400" />
              {lang === 'id' ? "Aktivitas Terkini" : "Recent Activities"}
            </h3>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col flex-1 h-full min-h-[400px] overflow-hidden relative">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                  <Activity className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{lang === 'id' ? "Belum ada aktivitas terekam." : "No recorded activities yet."}</p>
                </div>
              ) : (
                <div className="overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2">
                  <div className="space-y-6 relative">
                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
                    {recentActivities.map((log) => (
                      <div key={log.id} className="flex gap-4 relative z-10 group">
                        <div className="flex flex-col items-center pt-0.5 shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-125 ${
                            log.type === 'parameter' ? 'bg-blue-500' :
                            log.type === 'maintenance' ? 'bg-emerald-500' : 
                            log.type === 'flora_fauna' ? 'bg-amber-500' :
                            log.type === 'system' ? 'bg-violet-500' : 
                            'bg-rose-500' 
                          }`} />
                        </div>
                        <div className="pb-1 w-full bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {log.date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className={`text-sm font-bold leading-tight ${log.type === 'system' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {lang === 'id' ? log.title_id : log.title_en}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {lang === 'id' ? log.desc_id : log.desc_en}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <AddReminderModal 
        isOpen={isReminderModalOpen} 
        onClose={() => setIsReminderModalOpen(false)} 
        onSuccess={fetchRemindersOnly} 
        lang={lang} 
      />

      {/* 💡 MODAL KONFIRMASI PENGHAPUSAN TUGAS (MENGGANTIKAN window.confirm) */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 mx-auto border border-rose-200 dark:border-rose-800/50">
              <Trash2 className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 text-center">
              {lang === 'id' ? 'Bersihkan Tugas Selesai?' : 'Clear Completed Tasks?'}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center">
              {lang === 'id' 
                ? 'Semua tugas yang sudah dicentang akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan.' 
                : 'All checked tasks will be permanently deleted from the database. This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowConfirmClear(false)} className="rounded-xl font-bold h-11 px-6 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button onClick={executeClearCompleted} disabled={isClearing} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-rose-500/20">
                {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'id' ? 'Ya, Bersihkan' : 'Yes, Clear')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}