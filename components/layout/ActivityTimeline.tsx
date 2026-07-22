// components/layout/ActivityTimeline.tsx
import { Clock, Activity } from "lucide-react";

interface Props {
  recentActivities: any[];
  lang: "id" | "en";
}

export default function ActivityTimeline({ recentActivities, lang }: Props) {
  return (
    <>
      {/* KOLOM KANAN (Aktivitas Terkini) */}
      <div className="space-y-4 flex flex-col h-full mt-8 lg:mt-0">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 px-1">
              <Clock className="w-5 h-5 text-slate-400" />
              {lang === 'id' ? "Aktivitas Terkini" : "Recent Activities"}
            </h3>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col flex-1 h-full min-h-[400px] overflow-hidden relative">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                  <Activity className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{lang === 'id' ? "Belum ada aktivitas terekam." : "No recorded activities yet."}</p>
                </div>
              ) : (
                <div className="overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2">
                  <div className="space-y-6 relative">
                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
                    {recentActivities.map((log) => (
                      <div key={log.id} className="flex gap-4 relative z-10 group">
                        <div className="flex flex-col items-center pt-0.5 shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-125 ${
                            log.type === 'parameter' ? 'bg-blue-500' :
                            log.type === 'maintenance' ? 'bg-emerald-500' : 
                            log.type === 'flora_fauna' ? 'bg-amber-500' :
                            log.type === 'system' ? 'bg-violet-500' : 
                            'bg-rose-500' 
                          }`} />
                        </div>
                        <div className="pb-1 w-full bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {log.date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className={`text-sm font-bold leading-tight ${log.type === 'system' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {lang === 'id' ? log.title_id : log.title_en}
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {lang === 'id' ? log.desc_id : log.desc_en}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}  
            </div>
      </div>
    </>
  );
}