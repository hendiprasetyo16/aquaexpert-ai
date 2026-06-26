// app/(dashboard)/dashboard/analytics/page.tsx
import { getMedicationLeaderboardAction } from "@/features/analytics/actions/analytics.actions";
import MedicationLeaderboard from "@/features/analytics/components/MedicationLeaderboard";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic"; // Memastikan data selalu segar

// SERVER COMPONENT: Fetching data terjadi di server secara instan
export default async function AnalyticsDashboardPage() {
  // Panggil action langsung tanpa useEffect
  const leaderboardRes = await getMedicationLeaderboardAction(20);
  
  const initialData = leaderboardRes.success && leaderboardRes.data ? leaderboardRes.data : [];

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 transition-colors bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3 transition-colors">
            <Activity className="h-8 w-8 md:h-10 md:w-10" /> Clinical Intelligence
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed transition-colors">
            Dashboard analitik berbasis bukti nyata (Evidence-Based). Menampilkan tingkat kemanjuran obat, laju pemulihan, dan risiko kambuh berdasarkan ribuan rekam medis di AquaExpert.
          </p>
        </div>

        {/* KOMPONEN LEADERBOARD CLIENT (Menerima Data Awal) */}
        <MedicationLeaderboard initialData={initialData} />

      </div>
    </div>
  );
}