"use client";

import { useState, useEffect } from "react";
import { getPlants } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import PlantCard from "@/features/plants/components/PlantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Cpu, Filter, Info } from "lucide-react";

export default function PlantExpertEngineV1() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Plant[] | null>(null);

  // USER INPUT STATES (Variabel Mesin Inferensi)
  const [experience, setExperience] = useState("Pemula");
  const [co2, setCo2] = useState("Tanpa CO2");
  const [light, setLight] = useState("Low");
  const [wantsCarpet, setWantsCarpet] = useState(false);
  const [shrimpTank, setShrimpTank] = useState(true);

  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getPlants();
        setPlants(data);
      } catch (error) {
        console.error("Gagal memuat Knowledge Base:", error);
      } finally {
        setLoading(false);
      }
    }
    loadKnowledgeBase();
  }, []);

  const runInferenceEngine = () => {
    setLoading(true);
    
    // LOGIKA INFERENSI (SISTEM PAKAR V1)
    const filtered = plants.filter((plant) => {
      // 1. Filter Pengalaman
      if (experience === "Pemula") {
        if (plant.difficulty?.toLowerCase() === "hard") return false;
        // Boleh tambah: if (plant.beginner_score && plant.beginner_score < 7) return false;
      }
      
      // 2. Filter CO2
      if (co2 === "Tanpa CO2" && plant.co2_requirement?.toLowerCase() !== "low") return false;
      if (co2 === "Rendah" && plant.co2_requirement?.toLowerCase() === "high") return false;

      // 3. Filter Cahaya
      if (light === "Low" && plant.light_requirement?.toLowerCase() === "high") return false;

      // 4. Syarat Karpet (Jika user spesifik minta karpet, abaikan yang bukan karpet)
      if (wantsCarpet && plant.carpet_potential !== true) return false;

      // 5. Syarat Udang Hias (Hard Constraint)
      if (shrimpTank && plant.shrimp_safe === false) return false;

      return true; // Jika lolos semua filter, berarti direkomendasikan!
    });

    // Simulasi delay komputasi AI agar terasa profesional
    setTimeout(() => {
      setResults(filtered);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-6xl space-y-8 pb-10 text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-teal-400 flex items-center gap-3">
          <Cpu className="h-8 w-8" /> Plant Expert Engine V1
        </h1>
        <p className="mt-2 text-slate-400">
          Sistem pakar akan merekomendasikan tanaman aquascape berdasarkan parameter tank dan tingkat pengalaman Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* KOLOM KIRI: FORM KONDISI TANK */}
        <Card className="border-slate-800 bg-slate-900/60 lg:col-span-4 h-fit shadow-xl">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-500" /> Parameter Input
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Tingkat Pengalaman</Label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm focus:border-teal-500 outline-none">
                  <option>Pemula</option><option>Menengah</option><option>Ahli</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Ketersediaan CO2</Label>
                <select value={co2} onChange={(e) => setCo2(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm focus:border-teal-500 outline-none">
                  <option>Tanpa CO2</option><option>Rendah</option><option>Tinggi (Injeksi)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Pencahayaan Tank (Lampu)</Label>
                <select value={light} onChange={(e) => setLight(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm focus:border-teal-500 outline-none">
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={wantsCarpet} onChange={(e) => setWantsCarpet(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" />
                  <span className="text-sm font-medium text-slate-300">Saya butuh tanaman Karpet</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={shrimpTank} onChange={(e) => setShrimpTank(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" />
                  <span className="text-sm font-medium text-slate-300">Tank berisi Udang Hias (Shrimp Safe)</span>
                </label>
              </div>
            </div>

            <Button onClick={runInferenceEngine} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 mt-4 shadow-lg shadow-teal-900/20">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Analisis & Cari Tanaman"}
            </Button>
          </CardContent>
        </Card>

        {/* KOLOM KANAN: HASIL REKOMENDASI */}
        <div className="lg:col-span-8 space-y-6">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <Cpu className="h-16 w-16 text-slate-700 mb-4 animate-pulse" />
              <p className="text-slate-400 font-medium">Sistem Pakar siap menganalisis.</p>
              <p className="text-xs text-slate-500 mt-1">Masukkan parameter di samping dan jalankan mesin inferensi.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] border border-red-900/30 rounded-xl bg-red-950/10 p-8 text-center">
              <Info className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-200">Tidak Ada Tanaman yang Cocok</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-md">
                Kombinasi parameter Anda terlalu ketat. Sangat sulit menemukan tanaman karpet yang bisa hidup tanpa CO2 dan cahaya rendah. Cobalah melonggarkan parameter Anda.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-teal-400">Hasil Rekomendasi Pakar</h3>
                <span className="bg-teal-950/50 text-teal-400 text-xs px-3 py-1 rounded-full border border-teal-900">
                  Ditemukan {results.length} kecocokan
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}