import { getMedicationLeaderboardAction } from "@/features/analytics/actions/get-medication-leaderboard";
import { MedicationLeaderboard } from "@/features/analytics/components/MedicationLeaderboard";

export const dynamic = "force-dynamic"; // Memastikan data selalu segar

export default async function AnalyticsDashboardPage() {
  // Action yang baru saja kita buat untuk menarik peringkat obat
  const result = await getMedicationLeaderboardAction({ limit: 15 });

  return (
    <main className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clinical Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">
          Analitik performa obat berdasarkan rekam medis dunia nyata (Evidence-Based).
        </p>
      </div>
      
      {/* Memanggil komponen visualisasi tabel */}
      <MedicationLeaderboard initialData={result.data || []} />
    </main>
  );
}