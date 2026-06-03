"use client";

import { useEffect, useState } from "react";
import { getArchivedPlants, removePlantImage } from "../repositories/plant.repository";
import { restorePlantAction, hardDeletePlantAction } from "../actions/plant.actions";
import { Plant } from "../types/plant.types";
import { useAuth } from "@/hooks/useAuth";

import { Loader2, RefreshCcw, Trash2, Leaf, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function PlantArchiveList() {
  const { role } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  async function handleRestore(plant: Plant) {
    const confirmed = window.confirm(`Kembalikan tanaman ${plant.name} ke daftar aktif?`);
    if (!confirmed) return;

    try {
      setProcessingId(plant.id);
      const result = await restorePlantAction(plant.id);
      
      if (!result.success) throw new Error(result.error);
      
      toast.success(`${plant.name} berhasil dipulihkan.`);
      // Refresh list lokal
      setPlants((prev) => prev.filter((p) => p.id !== plant.id));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memulihkan tanaman.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleHardDelete(plant: Plant) {
    const confirmed = window.confirm(
      `PERINGATAN KRITIS: Anda akan menghapus permanen ${plant.name} beserta gambarnya. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`
    );
    if (!confirmed) return;

    try {
      setProcessingId(plant.id);
      const result = await hardDeletePlantAction(plant.id);

      if (!result.success) throw new Error(result.error);

      // Bersihkan gambar dari Storage Supabase agar tidak jadi sampah
      if (plant.image_url) {
        await removePlantImage(plant.image_url);
      }

      toast.success(`${plant.name} berhasil dihapus permanen.`);
      setPlants((prev) => prev.filter((p) => p.id !== plant.id));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menghapus permanen.");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-200">Arsip Kosong</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Tidak ada tanaman yang diarsipkan saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plants.map((plant) => (
        <Card key={plant.id} className="border-slate-800 bg-slate-900/40 opacity-80 transition-opacity hover:opacity-100">
          <div className="flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-800 grayscale">
              {plant.image_url ? (
                <img src={plant.image_url} alt={plant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center"><Leaf className="h-6 w-6 text-slate-600" /></div>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <h4 className="truncate font-semibold text-slate-200">{plant.name}</h4>
              <p className="truncate text-xs italic text-slate-500">{plant.scientific_name || "Tanpa nama ilmiah"}</p>
            </div>
          </div>

          <CardContent className="border-t border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRestore(plant)}
                disabled={processingId === plant.id}
                className="border-teal-900 bg-teal-950/30 text-teal-400 hover:bg-teal-900 hover:text-white transition-colors w-full sm:w-auto"
              >
                {processingId === plant.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Pulihkan
              </Button>

              {role === "super_admin" && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleHardDelete(plant)}
                  disabled={processingId === plant.id}
                  className="bg-red-950/80 text-red-300 hover:bg-red-900 hover:text-white border border-red-900 w-full sm:w-auto transition-colors"
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
  );
}