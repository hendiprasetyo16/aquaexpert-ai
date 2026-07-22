// components/layout/DashboardStats.tsx
import { Container, ShieldAlert, Fish, Leaf } from "lucide-react";

interface Props {
  stats: { tanks: number; alerts: number; fauna: number; flora: number; };
  tankList: any[];
  lang: "id" | "en";
}

export default function DashboardStats({ stats, tankList, lang }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      
      {/* Tanks */}
      <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Akuarium Aktif" : "Active Tanks"}</p>
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.tanks}</h4>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
            <Container className="w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          {tankList.map(t => (
            <div key={t.id} className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate pr-2 font-semibold flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${t.is_primary ? 'bg-teal-500' : 'bg-slate-300'}`}></div>{t.name}
              </span>
              <span className="shrink-0">{t.is_primary ? "Utama" : "Secondary"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-[0_0_25px_rgba(244,63,94,0.15)] dark:hover:shadow-[0_0_50px_rgba(225,29,72,0.6)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Peringatan Sistem" : "System Alerts"}</p>
            <h4 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{stats.alerts}</h4>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50">
            <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          {tankList.map(t => (
            <div key={t.id} className="flex flex-col text-[10px]">
              <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{t.name}:</span>
              {t.alerts.length > 0 ? (
                <span className="text-rose-500 dark:text-rose-400 line-clamp-1 leading-tight mt-0.5">• {t.alerts[0]} {t.alerts.length > 1 && `(+${t.alerts.length - 1} lainnya)`}</span>
              ) : (
                <span className="text-emerald-500 dark:text-emerald-400 font-medium mt-0.5">✔️ {lang === 'id' ? 'Ekosistem Aman' : 'Safe Ecosystem'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fauna */}
      <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Populasi Fauna" : "Fauna Population"}</p>
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.fauna}</h4>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50">
            <Fish className="w-6 h-6 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          {tankList.map(t => (
            <div key={t.id} className="flex justify-between items-center text-[10px]">
              <span className="truncate pr-2 font-medium text-slate-500 dark:text-slate-400">{t.name}</span>
              <span className="font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">{t.faunaCount} {lang === 'id' ? "ekor" : "qty"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flora */}
      <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-full cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'id' ? "Koleksi Flora" : "Flora Collection"}</p>
            <h4 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.flora}</h4>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl transition-colors duration-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50">
            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          {tankList.map(t => (
            <div key={t.id} className="flex justify-between items-center text-[10px]">
              <span className="truncate pr-2 font-medium text-slate-500 dark:text-slate-400">{t.name}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{t.floraCount} {lang === 'id' ? "bibit" : "qty"}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}