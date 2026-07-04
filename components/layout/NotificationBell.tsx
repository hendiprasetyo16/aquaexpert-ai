// components/NotificationBell.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, ShieldAlert, Database } from "lucide-react";
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
  const { dict } = useLanguage();

  useEffect(() => {
    if (!role) return;

    const fetchInitialNotifications = async () => {
      let query = supabase.from("system_activities").select("*").order("created_at", { ascending: false }).limit(10);
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
            setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
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
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-50 focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unread && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* 💡 FIX: Menggunakan 'absolute', menempel di elemen induk. */}
      {/* 💡 FIX: Menggunakan z-[100] karena Header sekarang punya z-50. */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl overflow-y-auto max-h-[80vh] sm:max-h-96 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 rounded-t-xl">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              {role === 'super_admin' ? dict.notification?.titleSuperAdmin || 'Super Admin Alerts' : dict.notification?.titleAdmin || 'Admin Alerts'}
            </span>
          </div>
          
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {dict.notification?.empty || "Belum ada aktivitas sistem terbaru."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
              {activities.map((act) => (
                <div key={act.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-default group">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                      {act.category === "data_crud" ? (
                        <Database className="h-4 w-4 text-teal-500" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{act.title}</span>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1 mb-2">
                        {act.message}
                      </p>
                      <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                        {act.created_by} • {new Date(act.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}