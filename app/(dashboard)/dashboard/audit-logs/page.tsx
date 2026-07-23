// app/(dashboard)/dashboard/audit-logs/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAuditLogsAction, clearAuditLogsAction } from "@/features/users/actions/audit.actions";
import { ShieldAlert, Trash2, Search, Clock, Activity, ShieldCheck, UserX, UserCog, UserPlus, FileSignature, DatabaseBackup } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

// Tipe data sesuai dengan tabel di database
interface AuditLog {
  id: string;
  actor_name: string;
  actor_email: string;
  action_type: string;
  target_user_email: string;
  details: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const { role: currentUserRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCleaning, setIsCleaning] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanOption, setCleanOption] = useState<number>(30); // Default hapus > 30 hari

  const fetchLogs = async () => {
    setLoading(true);
    const result = await getAuditLogsAction();
    if (result.success && result.data) {
      setLogs(result.data as AuditLog[]);
    } else {
      toast.error(result.error || "Gagal memuat log");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      fetchLogs();
    }
  }, [currentUserRole]);

  const handleCleanLogs = async () => {
    setIsCleaning(true);
    const result = await clearAuditLogsAction(cleanOption);
    if (result.success) {
      toast.success(result.message || "Log dibersihkan");
      setShowCleanModal(false);
      fetchLogs(); // Reload data
    } else {
      toast.error(result.error || "Gagal membersihkan log");
    }
    setIsCleaning(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const search = searchQuery.toLowerCase();
      return (
        log.actor_name.toLowerCase().includes(search) ||
        log.actor_email.toLowerCase().includes(search) ||
        log.target_user_email.toLowerCase().includes(search) ||
        log.action_type.toLowerCase().includes(search)
      );
    });
  }, [logs, searchQuery]);

  const getBadgeConfig = (actionType: string) => {
    switch (actionType) {
      case "DELETE": return { color: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900/50", icon: Trash2 };
      case "BLOCK": return { color: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900/50", icon: UserX };
      case "UNBLOCK": return { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50", icon: ShieldCheck };
      case "CHANGE_ROLE": return { color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/50", icon: UserCog };
      case "CREATE_USER": return { color: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200 dark:border-teal-900/50", icon: UserPlus };
      case "RESET_PASSWORD": return { color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/50", icon: FileSignature };
      default: return { color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: Activity };
    }
  };

  if (currentUserRole !== "super_admin" && currentUserRole !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Log Aktivitas Keamanan</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Jejak rekam tindakan administratif (Audit Trail)</p>
        </div>
        
        {currentUserRole === "super_admin" && (
          <button 
            onClick={() => setShowCleanModal(true)}
            className="flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)] dark:shadow-[0_0_20px_rgba(225,29,72,0.6)]"
          >
            <DatabaseBackup className="h-4 w-4" /> Bersihkan Log
          </button>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input 
          type="text" 
          placeholder="Cari berdasarkan email, aksi, atau admin..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors shadow-sm" 
        />
      </div>

      {/* TABLE DATA */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Waktu Kejadian</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Aktor (Pelaku)</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Tindakan</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Target & Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center"><Activity className="mx-auto h-6 w-6 animate-spin text-teal-500 mb-2" /> Memuat data...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500"><Search className="mx-auto h-6 w-6 opacity-40 mb-2" /> Tidak ada log yang ditemukan.</td></tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getBadgeConfig(log.action_type);
                  const Icon = badge.icon;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{log.actor_name}</span>
                          <span className="text-xs text-slate-500">{log.actor_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider border ${badge.color}`}>
                          <Icon className="h-3.5 w-3.5 shrink-0" /> {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">{log.target_user_email}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{log.details}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL BERSIHKAN LOG */}
      {showCleanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 p-2 rounded-full">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">Pembersihan Log</h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Pilih rentang waktu log yang ingin Anda bersihkan secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="space-y-3 mb-8">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${cleanOption === 30 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <input type="radio" checked={cleanOption === 30} onChange={() => setCleanOption(30)} className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Hapus Log Usang ({'>'} 30 Hari)</p>
                  <p className="text-xs text-slate-500">Menjaga log 1 bulan terakhir untuk keamanan.</p>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${cleanOption === 0 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <input type="radio" checked={cleanOption === 0} onChange={() => setCleanOption(0)} className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">Kosongkan Seluruh Log</p>
                  <p className="text-xs text-slate-500">Menghapus 100% data audit trail saat ini.</p>
                </div>
              </label>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" disabled={isCleaning} onClick={() => setShowCleanModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
              <button type="button" disabled={isCleaning} onClick={handleCleanLogs} className="rounded-md px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 shadow-md shadow-rose-600/20">
                {isCleaning ? "Membersihkan..." : "Ya, Bersihkan Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}