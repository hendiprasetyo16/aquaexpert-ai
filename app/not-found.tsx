"use client"; // <-- Ditambah agar bisa membaca context kamus

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

export default function NotFound() {
  const { dict } = useLanguage();

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <AlertCircle className="h-10 w-10 text-teal-600 dark:text-teal-500" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {dict.notFound.title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {dict.notFound.description}
        </p>
      </div>

      <Link href="/dashboard">
        <Button className="bg-teal-600 text-white hover:bg-teal-500 shadow-md shadow-teal-600/10 dark:shadow-teal-900/20">
          {dict.notFound.backButton}
        </Button>
      </Link>
    </div>
  );
}