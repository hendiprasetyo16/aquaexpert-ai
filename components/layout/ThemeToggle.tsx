// components/layout/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

export function ThemeToggle() { 
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { dict } = useLanguage(); // <-- PANGGIL KAMUS

  // Mencegah hydration mismatch error
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
      title={dict.themeToggle.tooltip} // <-- GUNAKAN KAMUS DI SINI
    >
      {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}