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
  const bellRef = useRef<HTMLButtonElement>(null);
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

  // Tutup popup jika diklik di luar kotak notifikasi
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
    <div className="relative">
      <button 
        ref={bellRef}
        onClick={() => { setIsOpen(!isOpen); setUnread(false); }} 
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-50"
      >
        <Bell className="h-5 w-5" />
        {unread && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* POPUP NOTIFIKASI MEMAKAI 'FIXED' AGAR TIDAK TERTUTUP FRAME LAYOUT/DASHBOARD */}
      {isOpen && (
        <div 
          className="fixed mt-3 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl overflow-y-auto max-h-96"
          style={{ 
            zIndex: 999999, 
            top: bellRef.current ? bellRef.current.getBoundingClientRect().bottom : '60px',
            right: '1rem' // Menempel di kanan layar
          }}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 z-10">
            {role === 'super_admin' ? dict.notification.titleSuperAdmin : dict.notification.titleAdmin}
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">{dict.notification.empty}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activities.map((act) => (
                <div key={act.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors cursor-default">
                  <div className="flex items-center gap-2 mb-1">
                    {act.category === "data_crud" ? (
                      <Database className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{act.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{act.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">{act.created_by} • {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}