"use client";

import { useEffect, useState } from "react";
import { getArchivedPlants } from "../repositories/plant.repository";
import { restorePlantAction, hardDeletePlantAction } from "../actions/plant.actions";
import { Plant } from "../types/plant.types";
import { useAuth } from "@/hooks/useAuth";

import { Loader2, RefreshCcw, Trash2, Leaf, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function PlantArchiveList() {
  const { role } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // =====================================================================
  // FIX MOBILE BUG: STATES UNTUK MODAL KONFIRMASI KUSTOM
  // =====================================================================
  const [plantToRestore, setPlantToRestore] = useState<Plant | null>(null);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  // =====================================================================

  async function loadArchivedData() {
    try {
      setLoading(true);
      const data = await getArchivedPlants();
      setPlants(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data arsip.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArchivedData();
  }, []);

  // FUNGSI EKSEKUSI PULIHKAN (RESTORE) DARI MODAL
  async function executeRestore() {
    if (!plantToRestore) return;

    try {
      setProcessingId(plantToRestore.id);
      const result = await restorePlantAction(plantToRestore.id);
      
      if (!result.success) throw new Error(result.error);
      
      toast.success(`${plantToRestore.name} berhasil dipulihkan.`);
      setPlants((prev) => prev.filter((p) => p.id !== plantToRestore.id));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memulihkan tanaman.");
    } finally {
      setProcessingId(null);
      setPlantToRestore(null); // Tutup modal
    }
  }

  // FUNGSI EKSEKUSI HAPUS PERMANEN DARI MODAL
  async function executeHardDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!plantToDelete) return;
    
    if (deleteConfirmText !== plantToDelete.name) {
      toast.error("Nama konfirmasi tidak sesuai.");
      return;
    }

    try {
      setProcessingId(plantToDelete.id);
      
      const result = await hardDeletePlantAction(plantToDelete.id);
      if (!result.success) throw new Error(result.error);

      toast.success(`${plantToDelete.name} berhasil dihapus permanen.`);
      setPlants((prev) => prev.filter((p) => p.id !== plantToDelete.id));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menghapus permanen.");
    } finally {
      setProcessingId(null);
      setPlantToDelete(null); // Tutup modal
      setDeleteConfirmText("");
    }
  }

  return (
    // WRAPPER UTAMA AGAR TIDAK MEPET SIDEBAR
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Arsip Tanaman</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Daftar tanaman yang disembunyikan dari katalog utama.</p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" />
        </div>
      ) : plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-20 text-center transition-colors duration-300">
          <AlertCircle className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Arsip Kosong</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Tidak ada tanaman yang diarsipkan saat ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <Card key={plant.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 opacity-80 transition-all hover:opacity-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-4 p-4">
                {/* Tempat foto */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 grayscale transition-colors">
                  {plant.image_url ? (
                    <img src={plant.image_url} alt={plant.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Leaf className="h-6 w-6 text-slate-400 dark:text-slate-600" /></div>
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate font-semibold text-gray-900 dark:text-slate-200">{plant.name}</h4>
                  <p className="truncate text-xs italic text-slate-500 dark:text-slate-400">{plant.scientific_name || "Tanpa nama ilmiah"}</p>
                </div>
              </div>

              <CardContent className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 transition-colors">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPlantToRestore(plant)} // BUKA MODAL PULIHKAN
                    disabled={processingId === plant.id}
                    className="border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-800 dark:hover:text-white transition-colors w-full sm:w-auto"
                  >
                    {processingId === plant.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    Pulihkan
                  </Button>

                  {role === "super_admin" && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => { setPlantToDelete(plant); setDeleteConfirmText(""); }} // BUKA MODAL HAPUS
                      disabled={processingId === plant.id}
                      className="bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-800 dark:hover:text-white border border-red-200 dark:border-red-900 w-full sm:w-auto transition-colors"
                    >
                      {processingId === plant.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Hapus Permanen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ====================================================================== */}
      {/* 🛑 MODAL-MODAL KUSTOM (DIJAMIN 100% BEKERJA DI MOBILE/PWA/WEBVIEW) 🛑 */}
      {/* ====================================================================== */}

      {/* 1. MODAL KONFIRMASI PULIHKAN TANAMAN */}
      {plantToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400">
                <RefreshCcw className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Pulihkan Tanaman</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Anda yakin ingin memulihkan tanaman <strong className="text-gray-900 dark:text-slate-200">{plantToRestore.name}</strong> ke daftar katalog aktif?
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button disabled={processingId === plantToRestore.id} onClick={() => setPlantToRestore(null)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
              <button disabled={processingId === plantToRestore.id} onClick={executeRestore} className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 bg-teal-600 hover:bg-teal-500">
                {processingId === plantToRestore.id ? "Memproses..." : "Ya, Pulihkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL KONFIRMASI HAPUS PERMANEN TANAMAN */}
      {plantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Hapus Permanen</h3>
            </div>
            
            <form onSubmit={executeHardDelete}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Tindakan ini <strong>tidak dapat dibatalkan</strong> dan akan menghapus semua gambar terkait di server. Ketik nama tanaman <strong className="text-gray-900 dark:text-slate-200 select-all">{plantToDelete.name}</strong> untuk mengkonfirmasi:
              </p>
              <input 
                required 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                placeholder="Ketik nama tanaman..."
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-red-500 transition-colors mb-6" 
              />
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button type="button" disabled={processingId === plantToDelete.id} onClick={() => {setPlantToDelete(null); setDeleteConfirmText("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={processingId === plantToDelete.id || deleteConfirmText !== plantToDelete.name} className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {processingId === plantToDelete.id ? "Menghapus..." : "Hapus Permanen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}