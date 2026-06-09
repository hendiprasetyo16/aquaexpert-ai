"use client";

import { useState, useEffect } from "react";
import { getPlants } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import PlantCard from "@/features/plants/components/PlantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Cpu, Filter, Info, CheckCircle2 } from "lucide-react";

import { generateRecommendations, UserAnswers, RecommendedPlant } from "@/features/plants/services/expert.service";

export default function PlantExpertEngineV2() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedPlant[] | null>(null);

  // USER INPUT STATES
  const [experience, setExperience] = useState<"Pemula" | "Menengah" | "Mahir">("Pemula");
  const [tankSize, setTankSize] = useState("Medium");
  const [co2, setCo2] = useState("Tanpa CO2");
  const [light, setLight] = useState<"Low" | "Medium" | "High">("Low");
  const [maintenance, setMaintenance] = useState<"Low" | "Medium" | "High">("Low");
  const [style, setStyle] = useState("Bebas");

  useEffect(() => {
    async function loadKnowledgeBase() {
      try {
        const data = await getPlants();
        setPlants(data);

        // =============================================================
        // SMART UX: CEK MEMORI BROWSER UNTUK MENGEMBALIKAN HASIL AI
        // =============================================================
        const savedQuiz = sessionStorage.getItem("aquaexpert_saved_quiz");
        
        if (savedQuiz) {
          const parsed = JSON.parse(savedQuiz);
          
          // Kembalikan pilihan dropdown user sebelumnya
          setExperience(parsed.experience);
          setTankSize(parsed.tankSize);
          setCo2(parsed.co2);
          setLight(parsed.light);
          setMaintenance(parsed.maintenance);
          setStyle(parsed.style);

          // Auto-run AI tanpa animasi loading agar hasil instan muncul saat back
          const answers: UserAnswers = {
            experience: parsed.experience,
            tankSize: parsed.tankSize,
            hasCO2: parsed.co2 === "Tinggi (Injeksi)",
            light: parsed.light,
            maintenance: parsed.maintenance,
            style: parsed.style
          };
          
          const autoResults = generateRecommendations(data, answers);
          setResults(autoResults);
        }
        // =============================================================

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
    
    const answers: UserAnswers = {
      experience,
      tankSize,
      hasCO2: co2 === "Tinggi (Injeksi)",
      light,
      maintenance,
      style
    };

    // SIMPAN JAWABAN KUIS KE DALAM SESSION STORAGE
    sessionStorage.setItem("aquaexpert_saved_quiz", JSON.stringify({
      experience, tankSize, co2, light, maintenance, style
    }));

    const aiResults = generateRecommendations(plants, answers);

    setTimeout(() => {
      setResults(aiResults);
      setLoading(false);
    }, 800); 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
          <Cpu className="h-8 w-8" /> Plant Expert Engine V2
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
          Jawab kuis singkat ini dan Mesin Inferensi AI AquaExpert akan menghitung ribuan probabilitas biologi untuk mencarikan tanaman yang 100% cocok untuk akuarium Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
        
        {/* KOLOM KIRI: FORM KONSULTASI */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 lg:col-span-4 h-fit shadow-xl transition-colors duration-300">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <Filter className="h-4 w-4 text-teal-600 dark:text-teal-500" /> Kuesioner Tank
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">1. Pengalaman Anda</Label>
                <select value={experience} onChange={(e) => setExperience(e.target.value as any)} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none">
                  <option value="Pemula">Baru Mulai (Pemula)</option>
                  <option value="Menengah">Pernah Punya (Menengah)</option>
                  <option value="Mahir">Sangat Paham (Mahir)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">2. Ukuran Akuarium</Label>
                <select value={tankSize} onChange={(e) => setTankSize(e.target.value)} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none">
                  <option value="Nano">Nano (≤ 40cm)</option>
                  <option value="Small">Small (45-60cm)</option>
                  <option value="Medium">Medium (60-90cm)</option>
                  <option value="Large">Large (90-120cm)</option>
                  <option value="Extra Large">Extra Large (&gt;120cm)</option>
                  <option value="Pond">Kolam / Pond</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">3. Injeksi CO2 Tabung</Label>
                <select value={co2} onChange={(e) => setCo2(e.target.value)} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none">
                  <option value="Tanpa CO2">Tidak Pakai CO2</option>
                  <option value="Tinggi (Injeksi)">Ya, Pakai Tabung CO2</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">4. Intensitas Lampu</Label>
                <select value={light} onChange={(e) => setLight(e.target.value as any)} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none">
                  <option value="Low">Redup (Low)</option>
                  <option value="Medium">Sedang (Medium)</option>
                  <option value="High">Terang Banderang (High)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">5. Waktu Luang Merawat</Label>
                <select value={maintenance} onChange={(e) => setMaintenance(e.target.value as any)} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none">
                  <option value="Low">Sedikit (Mau yg dibiarkan hidup)</option>
                  <option value="Medium">Cukup (Bisa potong sebulan sekali)</option>
                  <option value="High">Banyak (Siap rawat tiap minggu)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-bold">6. Tema Aquascape (Opsional)</Label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none">
                  <option value="Bebas">Bebas (Belum Tahu)</option>
                  <option value="Nature">Nature Style</option>
                  <option value="Dutch">Dutch Style (Warna-warni)</option>
                  <option value="Iwagumi">Iwagumi (Padang Rumput)</option>
                  <option value="Jungle">Jungle / Biotope</option>
                </select>
              </div>
            </div>

            <Button onClick={runInferenceEngine} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-12 mt-2 shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Mulai Analisis Pakar"}
            </Button>
          </CardContent>
        </Card>

        {/* KOLOM KANAN: HASIL REKOMENDASI AI */}
        <div className="lg:col-span-8 space-y-6">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/30 transition-colors p-8 text-center">
              <Cpu className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Otak AI Siap Dijalankan</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">Jawab 6 pertanyaan di samping dan saya akan menghitung kecocokan biologis dari ratusan tanaman untuk Anda.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-red-200 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-950/10 p-8 text-center transition-colors">
              <Info className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">Gagal Menemukan Tanaman</h3>
              <p className="text-sm text-slate-600 dark:text-red-400/80 max-w-md">
                Kondisi akuarium Anda terlalu ekstrem. Sangat sulit menemukan tanaman yang cocok dengan tuntutan gaya tersebut jika faslitas CO2/Lampu Anda tidak mendukung. Cobalah mengubah parameter Anda.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">Rekomendasi Terbaik</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Diurutkan dari probabilitas hidup dan kecocokan tertinggi.</p>
                </div>
                <span className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 text-sm px-4 py-1.5 rounded-full border border-teal-200 dark:border-teal-900 font-bold whitespace-nowrap">
                  <CheckCircle2 className="h-4 w-4" /> Lolos Filter ({results.length})
                </span>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                {results.slice(0, 10).map((plant, index) => (
                  <div key={plant.id} className="relative group">
                    <div className="absolute -top-3 -left-3 z-10 bg-teal-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-slate-50 dark:border-slate-950 shadow-md">
                      {index + 1}
                    </div>
                    
                    <PlantCard plant={plant} />
                    
                    <div className="mt-3 px-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Match Score</span>
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{plant.matchScore} Poin</span>
                      </div>
                      {plant.matchReasons.length > 0 ? (
                        <ul className="space-y-1 border-l-2 border-teal-500/30 pl-3 py-1">
                          {plant.matchReasons.map((reason, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-200 dark:border-slate-800 py-1">Sesuai dengan parameter dasar tank Anda.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {results.length > 10 && (
                <p className="text-center text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  Menampilkan Top 10 dari {results.length} tanaman yang relevan dengan parameter Anda.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}