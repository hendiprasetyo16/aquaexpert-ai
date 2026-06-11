"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import SetupStorage from "@/components/SetupStorage";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- PANGGIL KAMUS

export default function AdminPanelPage() {
  const { role, isLoading } = useAuth();
  const router = useRouter();
  const { dict } = useLanguage(); // <-- INISIALISASI KAMUS

  useEffect(() => {
    if (!isLoading && role !== "super_admin") {
      router.replace("/dashboard"); 
    }
  }, [role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (role !== "super_admin") return null;

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-300">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {dict.adminPanelPage.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          {dict.adminPanelPage.subtitle}
        </p>
      </div>

      <SetupStorage />
    </div>
  );
}