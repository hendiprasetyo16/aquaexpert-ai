"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, profile, role, isLoading } = useAuth();
  const { dict } = useLanguage(); // <-- PANGGIL KAMUS

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 text-foreground space-y-6 transition-colors duration-300">
      <h1 className="text-3xl font-bold">
        {dict.dashboard.title}
      </h1>

      {profile && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6 shadow-sm transition-colors duration-300">
          <h2 className="mb-4 text-xl font-semibold text-teal-600 dark:text-teal-400">
            {dict.dashboard.sessionInfo}
          </h2>
          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <p><span className="font-medium text-slate-500 dark:text-slate-400">{dict.dashboard.name}</span> {profile.full_name}</p>
            <p><span className="font-medium text-slate-500 dark:text-slate-400">{dict.dashboard.email}</span> {user?.email}</p>
            <p className="flex items-center gap-2 mt-2">
              <span className="font-medium text-slate-500 dark:text-slate-400">{dict.dashboard.role}</span>
              <span className="rounded-md bg-teal-100 dark:bg-teal-900/50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                {role}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}