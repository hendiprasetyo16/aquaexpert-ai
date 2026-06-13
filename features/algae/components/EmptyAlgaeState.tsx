// features/algae/components/EmptyAlgaeState.tsx
"use client";

import { Bug } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function EmptyAlgaeState() {
  const { dict } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-16 text-center transition-colors duration-300">
      <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-4 transition-colors duration-300">
        <Bug className="h-10 w-10 text-red-400 dark:text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-slate-200">{dict.algaeExpert?.emptyTitle || "Belum ada data"}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {dict.algaeExpert?.emptyDesc || "Database kosong."}
      </p>
    </div>
  );
}