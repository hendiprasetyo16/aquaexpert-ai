// components/layout/TodoListPanel.tsx
import { CalendarClock, Loader2, Trash2, Plus, CheckCircle, Circle, Calendar, Container, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  reminders: any[]; lang: "id" | "en"; isClearing: boolean; showConfirmClear: boolean;
  onToggle: (id: string, status: boolean) => void;
  onOpenClear: () => void; onExecuteClear: () => void;
  onCancelClear: () => void; onOpenAdd: () => void;
}

export default function TodoListPanel({ reminders, lang, isClearing, showConfirmClear, onToggle, onOpenClear, onExecuteClear, onCancelClear, onOpenAdd }: Props) {
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-5 px-1">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-indigo-500" />
          {lang === 'id' ? "Tugas & Pengingat" : "Tasks & Reminders"}
        </h3>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onOpenClear} disabled={isClearing} className="flex items-center gap-1.5 px-3 h-10 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer">
            {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{lang === 'id' ? "Bersihkan Tugas" : "Clear Completed"}</span>
          </button>
          <Button onClick={onOpenAdd} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-10 px-4 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_5px_15px_rgba(79,70,229,0.3)] cursor-pointer border border-transparent">
            <Plus className="w-4 h-4 mr-2" /> {lang === 'id' ? "Tambah Tugas" : "Add Task"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.length === 0 ? (
          <div className="col-span-full bg-slate-50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-colors">
            <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">{lang === 'id' ? "Belum ada jadwal tugas." : "No tasks scheduled."}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">{lang === 'id' ? "Jadwal ganti air atau beri pakan akan muncul di sini." : "Water changes or feeding routines will appear here."}</p>
          </div>
        ) : (
          reminders.slice(0, 6).map(rem => (
            <div key={rem.id} className={`flex items-start gap-4 p-5 rounded-3xl border transition-all duration-300 ${rem.is_completed ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
              <button onClick={() => onToggle(rem.id, rem.is_completed)} className="mt-0.5 shrink-0 transform hover:scale-110 transition-transform">
                {rem.is_completed ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold truncate transition-colors ${rem.is_completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{rem.title}</h4>
                {rem.description && <p className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">{rem.description}</p>}
                <div className="flex items-center flex-wrap gap-2 mt-3">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${rem.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : rem.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                    {lang === 'id' && rem.priority === 'high' ? 'Tinggi' : lang === 'id' && rem.priority === 'low' ? 'Rendah' : rem.priority}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    <Calendar className="w-3 h-3"/> {new Date(rem.due_date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                  </span>
                  {rem.aquarium && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md truncate max-w-[120px]">
                      <Container className="w-3 h-3 shrink-0"/> <span className="truncate">{rem.aquarium.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-5 mx-auto border border-rose-200 dark:border-rose-800/50">
              <Trash2 className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 text-center">{lang === 'id' ? 'Bersihkan Tugas Selesai?' : 'Clear Completed Tasks?'}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center">{lang === 'id' ? 'Semua tugas yang sudah dicentang akan dihapus permanen dari database. Tindakan ini tidak dapat dibatalkan.' : 'All checked tasks will be permanently deleted from the database. This action cannot be undone.'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onCancelClear} className="rounded-xl font-bold h-11 px-6 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">{lang === 'id' ? 'Batal' : 'Cancel'}</Button>
              <Button onClick={onExecuteClear} disabled={isClearing} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-rose-500/20">{isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : (lang === 'id' ? 'Ya, Bersihkan' : 'Yes, Clear')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}