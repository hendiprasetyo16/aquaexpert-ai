"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AlgaeForm from "@/features/algae/components/AlgaeForm";
import { createClient } from "@/lib/supabase/client";
import { Algae } from "@/features/algae/types/algae.types";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export default function EditAlgaePage() {
  const params = useParams();
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  
  const [algae, setAlgae] = useState<Algae | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role === "user") {
      router.replace("/dashboard/algae");
      return;
    }
    
    async function fetchAlgae() {
      const supabase = createClient();
      const { data } = await supabase.from("algae").select("*").eq("id", params.id).single();
      setAlgae(data);
      setLoading(false);
    }
    
    if (params.id) fetchAlgae();
  }, [params.id, role, authLoading, router]);

  if (authLoading || loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" /></div>;
  }

  if (role === "user" || !algae) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {language === 'id' ? "Edit Data Alga" : "Edit Algae Data"}
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {language === 'id' ? "Perbarui informasi dan tag AI dari alga ini." : "Update information and AI tags for this algae."}
        </p>
      </div>

      <AlgaeForm mode="edit" algae={algae} />
    </div>
  );
}