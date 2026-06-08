"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, ShieldAlert, Database } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  message: string;
  category: string;
  created_by: string;
  created_at: string;
}

export default function NotificationBell({ role }: { role: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unread, setUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!role) return;

    // 1. Ambil data notifikasi awal dari database
    const fetchInitialNotifications = async () => {
      let query = supabase.from("system_activities").select("*").order("created_at", { ascending: false }).limit(10);
      
      // Aturan Filter Hak Akses Role:
      // Jika admin, HANYA ambil data aktivitas user (login/aktif)
      if (role === "admin") {
        query = query.eq("category", "user_activity");
      }
      // Jika user biasa, mungkin tidak mendapat notifikasi sistem sama sekali
      if (role === "user") {
        return; 
      }

      const { data } = await query;
      if (data) setActivities(data);
    };

    fetchInitialNotifications();

    // 2. Langganan Real-time channel Supabase
    const channel = supabase
      .channel("realtime-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_activities" },
        (payload: any) => {
          const newActivity = payload.new as Activity;

          // Validasi Role secara Real-time saat ada data masuk:
          if (role === "super_admin") {
            // Super Admin menerima semua jenis kategori
            setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
            setUnread(true);
          } else if (role === "admin" && newActivity.category === "user_activity") {
            // Admin hanya menerima notifikasi login/user aktif
            setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
            setUnread(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  if (role === "user") return null; // Sembunyikan bell dari pengguna biasa jika diinginkan

  return (
    <div className="relative">
      {/* Tombol Bell */}
      <button 
        onClick={() => { setIsOpen(!isOpen); setUnread(false); }} 
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu List Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Aktivitas Sistem ({role === 'super_admin' ? 'Semua Log' : 'Log User'})
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Belum ada aktivitas masuk.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activities.map((act) => (
                <div key={act.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {act.category === "data_crud" ? (
                      <Database className="h-3.5 w-3.5 text-teal-500" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{act.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1.5">{act.created_by} • {new Date(act.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}