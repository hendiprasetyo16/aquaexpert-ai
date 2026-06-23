import type { MedicationEfficacyStat } from "../types/analytics.types";
// Anda bisa menambahkan impor icon/lucide-react atau komponen Modal di sini nanti

interface Props {
  initialData: MedicationEfficacyStat[];
  diseaseId?: string; 
  title?: string;
}

export function MedicationLeaderboard({ initialData, diseaseId, title = "Medication Leaderboard" }: Props) {
  if (!initialData || initialData.length === 0) {
    return (
      <div className="p-6 bg-slate-50 text-slate-500 rounded-xl text-sm text-center border border-slate-200">
        Belum ada data rekam medis yang mencukupi untuk analitik ini.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 shadow-sm">
          Clinical Score Ranked
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-100 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Obat</th>
              {!diseaseId && <th className="px-6 py-3 font-medium">Penyakit</th>}
              <th className="px-6 py-3 font-medium text-right">Success Rate</th>
              <th className="px-6 py-3 font-medium text-right">Median Recovery</th>
              <th className="px-6 py-3 font-medium text-right">Relapse / Mortality</th>
              <th className="px-6 py-3 font-medium text-right">Clinical Score</th>
              <th className="px-6 py-3 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {initialData.map((stat, idx) => (
              <tr 
                key={`${stat.medicationId}-${stat.diseaseId}`} 
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                // onClick={() => openModal(stat)} <-- Persiapan untuk Modal Detail
              >
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                  <span className="text-slate-400 text-xs w-4">{idx + 1}.</span>
                  {stat.medicationName}
                </td>
                
                {!diseaseId && <td className="px-6 py-4">{stat.diseaseNameId}</td>}
                
                <td className="px-6 py-4 text-right">
                  <span className={`font-semibold ${stat.successRatePct > 80 ? 'text-emerald-600' : stat.successRatePct > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {stat.successRatePct.toFixed(1)}%
                  </span>
                </td>
                
                <td className="px-6 py-4 text-right">{stat.medianRecoveryDays} Hari</td>
                
                <td className="px-6 py-4 text-right text-xs">
                  <div className="text-amber-600">Rel: {stat.relapseRatePct > 0 ? `${stat.relapseRatePct.toFixed(1)}%` : '-'}</div>
                  <div className="text-rose-600">Mor: {stat.mortalityRatePct > 0 ? `${stat.mortalityRatePct.toFixed(1)}%` : '-'}</div>
                </td>
                
                <td className="px-6 py-4 text-right font-bold text-slate-800">
                  {stat.clinicalScore.toFixed(2)}
                </td>

                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${stat.evidenceGrade === 'High' ? 'bg-emerald-100 text-emerald-700' : 
                      stat.evidenceGrade === 'Medium' ? 'bg-blue-100 text-blue-700' : 
                      stat.evidenceGrade === 'Low' ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-100 text-slate-600'}`}>
                    {stat.evidenceGrade}
                    <span className="ml-1 opacity-60">({stat.totalCases})</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}