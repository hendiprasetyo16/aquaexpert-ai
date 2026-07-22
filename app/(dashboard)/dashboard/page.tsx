// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; 
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import WelcomeBanner from "@/components/layout/WelcomeBanner";
import DashboardStats from "@/components/layout/DashboardStats";
import TodoListPanel from "@/components/layout/TodoListPanel";
import ExpertModules from "@/components/layout/ExpertModules";
import ActivityTimeline from "@/components/layout/ActivityTimeline";
import AddReminderModal from "@/features/reminders/components/AddReminderModal";

import { analyzeAquariumHealth, ActiveTreatmentEngine } from "@/features/aquariums/utils/health-engine";
import type { AquariumParameterLog } from "@/features/aquariums/types/parameter.types";
import type { Aquarium } from "@/features/aquariums/types/aquarium.types";
import type { TankFish, TankPlant } from "@/features/aquariums/types/inventory.types";
import type { MaintenanceTask, MaintenanceDashboardStatus } from "@/features/aquariums/types/maintenance.types";
import { getUserRemindersAction, toggleReminderStatusAction, clearCompletedRemindersAction, type ReminderDto } from "@/features/reminders/actions/reminder.actions";

// --- TYPES & HELPERS ---
interface TankInfo { id: string; name: string; is_primary: boolean; health_score: number; alerts: string[]; faunaCount: number; floraCount: number; }
interface DashboardStatsData { tanks: number; alerts: number; fauna: number; flora: number; }
interface ActivityLog { id: string; type: "parameter" | "maintenance" | "treatment" | "system" | "flora_fauna"; title_id: string; title_en: string; desc_id: string; desc_en: string; date: Date; }
interface DbRow { aquarium_id: string; [key: string]: unknown; }
interface InventoryRow extends DbRow { quantity?: number; }

const groupByAquarium = <T extends DbRow>(data: T[] | null) => (data || []).reduce<Record<string, T[]>>((acc, curr) => { acc[curr.aquarium_id] = acc[curr.aquarium_id] || []; acc[curr.aquarium_id].push(curr); return acc; }, {});

// 💡 FUNGSI TRANSLATE LOG & TITLE DIKEMBALIKAN 
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
    "Akuarium Baru Dibuat": "New Aquarium Created", "Akuarium Diperbarui": "Aquarium Updated", "Akuarium Dihapus": "Aquarium Deleted",
    "Status Utama Diubah": "Primary Status Changed", "Penghapusan Paksa (Admin)": "Forced Deletion (Admin)", "Akuarium Dinonaktifkan": "Aquarium Disabled",
    "Akuarium Diaktifkan": "Aquarium Enabled", "Tanaman Ditambahkan": "Flora Added", "Fauna Ditambahkan": "Fauna Added",
    "Status Fauna Diubah": "Fauna Status Updated", "Fauna Dihapus": "Fauna Removed", "Flora Dihapus": "Flora Removed",
    "Jadwal Perawatan Dibuat": "Maintenance Scheduled", "Jadwal Perawatan Diperbarui": "Maintenance Updated", "Jadwal Perawatan Dihapus": "Maintenance Removed",
    "Pekerjaan Diselesaikan": "Task Completed", "Riwayat Perawatan Dihapus": "Maintenance History Removed",
    "Parameter Air Dicatat": "Water Parameter Logged", "Catatan Air Dihapus": "Water Log Removed"
  };
  return map[title] || title;
};

export default function DashboardPage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";

  const [stats, setStats] = useState<DashboardStatsData>({ tanks: 0, alerts: 0, fauna: 0, flora: 0 });
  const [tankList, setTankList] = useState<TankInfo[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

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
      } catch { setIpAddress("127.0.0.1"); }
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
          { data: rawParams }, { data: rawFishes }, { data: rawPlants }, { data: rawMaint }, { data: rawTreatments }, 
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
          aqParams.sort((a, b) => new Date(b.record_date as string).getTime() - new Date(a.record_date as string).getTime());
          
          const sanitizedParams = aqParams.map(param => ({ 
            ...param, 
            temperature: typeof param.temperature === 'number' ? param.temperature : null, 
            ph: typeof param.ph === 'number' ? param.ph : null, 
            ammonia: typeof param.ammonia === 'number' ? param.ammonia : null, 
            nitrite: typeof param.nitrite === 'number' ? param.nitrite : null, 
            nitrate: typeof param.nitrate === 'number' ? param.nitrate : null 
          } as AquariumParameterLog));

          const mappedMaintenance: MaintenanceDashboardStatus[] = (groupedMaint[aq.id] || []).map((taskRaw) => {
            const task = taskRaw as unknown as MaintenanceTask;
            let isOverdue = false, daysRemaining = 0, urgencyLevel: "safe" | "warning" | "critical" = "safe";
            if (task.next_due_at) {
              const dueDate = new Date(task.next_due_at as string);
              const normalizedDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
              const diffTime = normalizedDue.getTime() - today.getTime();
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (daysRemaining < 0) { isOverdue = true; urgencyLevel = daysRemaining <= -3 ? "critical" : "warning"; }
              else if (daysRemaining <= 2) { urgencyLevel = "warning"; }
            }
            return { task, isOverdue, daysRemaining, urgencyLevel, lastMaintenanceDaysAgo: null };
          });

          const healthAnalysis = analyzeAquariumHealth({ 
            aquarium: aq as Aquarium, parameters: sanitizedParams, 
            fishes: (groupedFishes[aq.id] || []) as unknown as TankFish[], plants: (groupedPlants[aq.id] || []) as unknown as TankPlant[], 
            maintenanceStatus: mappedMaintenance, activeTreatments: (groupedTreatments[aq.id] || []) as unknown as ActiveTreatmentEngine[], 
            lang 
          });

          const faunaCount = (groupedFishes[aq.id] || []).reduce((acc, f) => acc + (f.quantity || 0), 0);
          const floraCount = (groupedPlants[aq.id] || []).reduce((acc, p) => acc + (p.quantity || 0), 0);
          totalAlerts += (healthAnalysis.alerts || []).length; totalFauna += faunaCount; totalFlora += floraCount;

          return { id: aq.id, name: aq.name, is_primary: aq.is_primary || false, health_score: healthAnalysis.scores.overall, alerts: healthAnalysis.alerts || [], faunaCount, floraCount };
        });

        setTankList(processedTanks);
        setStats({ tanks: aquariums.length, alerts: totalAlerts, fauna: totalFauna, flora: totalFlora });

        // Add Logs
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
      
      // 💡 FETCH LOGS ADMIN DIKEMBALIKAN KE SINI!
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

    } catch (error) { console.error(error); setLoadingPage(false); }
  };

  useEffect(() => { if (!isLoading) fetchDashboardData(); }, [user?.id, isLoading, role]); 

  // --- HANDLERS ---
  const handleToggleReminder = async (id: string, currentStatus: boolean) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: !currentStatus } : r));
    const res = await toggleReminderStatusAction(id, !currentStatus);
    if (res.success) toast.success(lang === 'id' ? "Sip! Tugas ditandai." : "Task marked done.", { icon: !currentStatus ? '✅' : '🔄', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
    else { setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: currentStatus } : r)); toast.error(lang === 'id' ? "Gagal." : "Failed."); }
  };

  const handleOpenClearConfirm = () => {
    if (reminders.filter(r => r.is_completed).length === 0) return toast.error(lang === 'id' ? "Tidak ada tugas selesai!" : "No completed tasks!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
    setShowConfirmClear(true);
  };

  const executeClearCompleted = async () => {
    setIsClearing(true);
    const res = await clearCompletedRemindersAction();
    if (res.success) { toast.success(lang === 'id' ? "Dihapus dari DB!" : "Cleared from DB!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } }); fetchRemindersOnly(); setShowConfirmClear(false); }
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

  const rootDict = (dict as any) || {};
  const dashDict = rootDict.dashboard || {};

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        <WelcomeBanner 
          profile={profile} role={role} userEmail={user?.email} ipAddress={ipAddress} lang={lang} dashDict={dashDict}
          primaryTank={tankList.find(t => t.is_primary)} secondaryTanks={tankList.filter(t => !t.is_primary)}
        />

        <DashboardStats stats={stats} tankList={tankList} lang={lang} />

        <TodoListPanel 
          reminders={reminders} lang={lang} isClearing={isClearing} showConfirmClear={showConfirmClear}
          onToggle={handleToggleReminder} onOpenClear={handleOpenClearConfirm} 
          onExecuteClear={executeClearCompleted} onCancelClear={() => setShowConfirmClear(false)}
          onOpenAdd={() => setIsReminderModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
          <ExpertModules lang={lang} />
          <ActivityTimeline recentActivities={recentActivities} lang={lang} />
        </div>

      </div>

      <AddReminderModal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} onSuccess={fetchRemindersOnly} lang={lang} />
    </div>
  );
}