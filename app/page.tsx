"use client"; // <-- Ditambah agar bisa membaca context kamus

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

export default function Home() {
  const { dict } = useLanguage(); // <-- PANGGIL KAMUS

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 dark:from-teal-900/40 via-background to-background"></div>

      <div className="z-10 flex max-w-3xl flex-col items-center text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="text-teal-600 dark:text-teal-400">Aqua</span>Expert AI
        </h1>
        
        {/* GUNAKAN KAMUS */}
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl">
          {dict.landing.subtitle}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/dashboard">
            <Button className="bg-teal-600 px-8 py-6 text-lg hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-600/20">
              {dict.landing.enterDashboard}
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="border-teal-600 dark:border-teal-800 px-8 py-6 text-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-700 dark:hover:text-teal-300 bg-transparent"
          >
            {dict.landing.askAI}
          </Button>
        </div>
      </div>
    </main>
  );
}