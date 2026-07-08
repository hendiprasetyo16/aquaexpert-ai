// components/NotificationBell.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, ShieldAlert, Database, Info } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

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
  const bellRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { dict, language } = useLanguage();
  const lang = language as "id" | "en";

  useEffect(() => {
    if (!role) return;

    const fetchInitialNotifications = async () => {
      let query = supabase.from("system_activities").select("*").order("created_at", { ascending: false }).limit(20);
      
      if (role === "admin") query = query.eq("category", "user_activity");
      if (role === "user") return; 

      const { data } = await query;
      if (data) setActivities(data);
    };

    fetchInitialNotifications();

    const channel = supabase
      .channel("realtime-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_activities" },
        (payload: unknown) => {
          const realtimePayload = payload as { new: Activity };
          const newActivity = realtimePayload.new;
          
          if (role === "super_admin" || (role === "admin" && newActivity.category === "user_activity")) {
            setActivities((prev) => [newActivity, ...prev.slice(0, 19)]); 
            setUnread(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (role === "user") return null;

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); setUnread(false); }} 
        className={`relative p-2.5 rounded-full transition-all duration-300 focus:outline-none z-50
          ${unread 
            ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
      >
        <Bell className={`h-5 w-5 ${unread ? 'animate-bounce' : ''}`} />
        {unread && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[360px] sm:w-[440px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[85vh] overflow-hidden">
          
          {/* HEADER KOTAK NOTIFIKASI */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
            <div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest block mb-1">
                {role === 'super_admin' ? (dict.notification?.titleSuperAdmin || 'Aktivitas Sistem') : (dict.notification?.titleAdmin || 'Log Pengguna')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {role === 'super_admin' ? (lang === 'id' ? 'Menampilkan 20 log sistem terakhir' : 'Showing last 20 system logs') : (lang === 'id' ? 'Menampilkan 20 log pengguna terakhir' : 'Showing last 20 user logs')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">LIVE</span>
            </div>
          </div>
          
          {/* AREA SCROLL ISI NOTIFIKASI */}
          <div className="overflow-y-auto custom-scrollbar flex-1 pb-2">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {dict.notification?.empty || (lang === 'id' ? "Belum ada aktivitas" : "No recent activity")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 font-medium leading-relaxed">
                  {lang === 'id' ? "Sistem pengawas akan mencatat aktivitas di sini saat operasi dilakukan." : "The monitoring system will log activities here when operations are performed."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-3">
                {activities.map((act) => (
                  <div key={act.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-default group">
                    <div className="flex items-start gap-4">
                      
                      {/* IKON BERDASARKAN KATEGORI */}
                      <div className="mt-1 p-3 rounded-full shrink-0 border transition-colors bg-white dark:bg-slate-900 group-hover:bg-slate-100 group-hover:dark:bg-slate-800 border-slate-100 dark:border-slate-800 group-hover:border-slate-200 group-hover:dark:border-slate-700">
                        {act.category === "data_crud" ? (
                          <Database className="h-5 w-5 text-teal-500 dark:text-teal-400" />
                        ) : act.category === "alert" ? (
                          <ShieldAlert className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                        ) : (
                          <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                        )}
                      </div>

                      {/* ISI TEKS NOTIFIKASI */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex justify-between items-start gap-3 mb-1.5">
                          <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                            {act.title}
                          </span>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 mt-0.5">
                            {/* 💡 FIX: Menggunakan toLocaleString untuk memunculkan Tanggal dan Jam sekaligus */}
                            {new Date(act.created_at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-3">
                          {act.message}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${act.category === 'data_crud' ? 'bg-teal-400' : act.category === 'alert' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>
                          <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
                            {act.created_by}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* FOOTER KOTAK NOTIFIKASI */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center shrink-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-500 font-semibold leading-relaxed">
              {lang === 'id' ? "Pembersihan Otomatis aktif. Log yang lebih lama dari 30 hari akan dihapus otomatis dari server." : "Auto-clean active. Logs older than 30 days are automatically deleted."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}