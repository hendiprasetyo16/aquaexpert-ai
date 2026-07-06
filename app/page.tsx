// app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";
import { Sparkles } from "lucide-react";

export default function Home() {
  const { dict } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground transition-colors duration-300 relative">
      
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 dark:from-teal-900/40 via-background to-background"></div>
      </div>

      <div className="z-10 flex max-w-3xl flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-7xl drop-shadow-sm">
          <span className="text-teal-600 dark:text-teal-400">Aqua</span>Expert AI
        </h1>
        
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
          {dict.landing?.subtitle || "Platform Cerdas Manajemen Aquascape Anda"}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto px-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full bg-teal-600 px-8 py-6 text-lg hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-600/20 rounded-xl transition-all active:scale-95">
              {dict.landing?.enterDashboard || "Masuk Dashboard"}
            </Button>
          </Link>
          
          {/* 💡 TOMBOL TANYA AI DENGAN EFEK NEON GLOW SUPER CANTIK */}
          <Link href="/ask-ai" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-2 border-teal-500/50 hover:border-teal-400 px-8 py-6 text-lg text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 bg-teal-50/30 hover:bg-teal-50/50 dark:bg-slate-950/50 dark:hover:bg-teal-950/50 backdrop-blur-sm rounded-xl font-bold transition-all duration-500 hover:shadow-[0_0_25px_rgba(45,212,191,0.6)] active:scale-95 group flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-teal-500 group-hover:animate-pulse group-hover:text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)] transition-colors" />
              {dict.landing?.askAI || "Tanya AI"}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}