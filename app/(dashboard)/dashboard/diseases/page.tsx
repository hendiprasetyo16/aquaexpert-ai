import { createClient } from "@/lib/supabase/server";

export default async function DiseasesPage() {
  const supabase = await createClient();
  
  // Menarik data master penyakit dari database
  const { data: diseases, error } = await supabase
    .from("diseases")
    .select("id, name_id, name_en, relapse_window_days")
    .order("name_id", { ascending: true });

  if (error) {
    return <div className="p-6 text-red-500">Gagal memuat data penyakit.</div>;
  }

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Database Penyakit</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          + Tambah Penyakit
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-3 font-medium">Nama Penyakit (ID)</th>
              <th className="px-6 py-3 font-medium">Nama Penyakit (EN)</th>
              <th className="px-6 py-3 font-medium text-right">Relapse Window</th>
              <th className="px-6 py-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {diseases?.map((disease) => (
              <tr key={disease.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{disease.name_id}</td>
                <td className="px-6 py-4 text-slate-600">{disease.name_en}</td>
                <td className="px-6 py-4 text-right text-slate-600">{disease.relapse_window_days || 30} Hari</td>
                <td className="px-6 py-4 text-center">
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Detail</button>
                </td>
              </tr>
            ))}
            {(!diseases || diseases.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Belum ada data penyakit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}