// features/fishes/components/EmptyFishState.tsx
"use client";

import { Fish } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; 

// 1. Definisikan tipe struktur yang kita harapkan dari Dictionary
interface EmptyFishDict {
  emptyFish?: {
    title: string;
    description: string;
  };
}

export default function EmptyFishState() {
  const { dict } = useLanguage(); 

  // 2. Type-Safe Casting: Gunakan unknown lalu ke tipe spesifik (Tanpa Any)
  const dictionary = dict as unknown as EmptyFishDict;
  
  const title = dictionary.emptyFish?.title || "Belum Ada Data Ikan";
  const desc = dictionary.emptyFish?.description || "Klik tombol tambah untuk mendaftarkan spesies ikan baru ke dalam ensiklopedia.";

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-16 text-center transition-colors duration-300">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800/50 p-4 transition-colors duration-300">
        <Fish className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-slate-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {desc}
      </p>
    </div>
  );
}