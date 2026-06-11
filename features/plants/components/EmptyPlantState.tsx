"use client";

import { Leaf } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- PANGGIL KAMUS

export default function EmptyPlantState() {
  const { dict } = useLanguage(); // <-- INISIALISASI

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-16 text-center transition-colors duration-300">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800/50 p-4 transition-colors duration-300">
        <Leaf className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-slate-200">{dict.emptyPlant.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {dict.emptyPlant.description}
      </p>
    </div>
  );
}