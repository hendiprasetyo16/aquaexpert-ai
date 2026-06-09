"use client";

import { useState, useEffect } from "react";
import { getPlants } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import PlantCard from "@/features/plants/components/PlantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, Sparkles } from "lucide-react";

// MENGAMBIL OTAK AI DARI FOLDER SERVICES
import { generateRecommendations, UserAnswers, RecommendedPlant } from "@/features/plants/services/expert.service";

const SESSION_KEY = "aquaexpert_plant_inference_v3";

export default function PlantExpertEngineV3() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RecommendedPlant[] | null>(null);

  // USER INPUT STATES (V3: Ditambah Shrimp & Carpet)
  const [experience, setExperience] = useState<"Pemula" | "Menengah" | "Mahir">("Pemula");
  const [tankSize, setTankSize] = useState("Medium");
  const [co2, setCo2] = useState("Tanpa CO2");
  const [light, setLight] = useState<"Low" | "Medium" | "High">("Low");
  const [maintenance, setMaintenance] = useState<"Low" | "Medium" | "High">("Low");
  const [style, setStyle] = useState("Bebas");
  const [shrimpTank, setShrimpTank] = useState(false);
  const [wantCarpet, setWantCarpet] = useState(false);

  // 1. MEMUAT KNOWLEDGE BASE
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

  // 2. MEMUAT SESSION STATE (Agar hasil tidak hilang saat user kembali dari detail)
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.answers) {
          setExperience(parsed.answers.experience);
          setTankSize(parsed.answers.tankSize);
          setCo2(parsed.answers.hasCO2 ? "Tinggi (Injeksi)" : "Tanpa CO2");
          setLight(parsed.answers.light);
          setMaintenance(parsed.answers.maintenance);
          setStyle(parsed.answers.style);
          setShrimpTank(parsed.answers.shrimpTank);
          setWantCarpet(parsed.answers.wantCarpet);
        }
        if (parsed.results) {
          setResults(parsed.results);
        }
      } catch (e) {
        console.error("Gagal membaca session data", e);
      }
    }
  }, []);

  // 3. EKSEKUSI MESIN INFERENSI
  const runInferenceEngine = () => {
    setLoading(true);
    
    const answers: UserAnswers = {
      experience,
      tankSize,
      hasCO2: co2 === "Tinggi (Injeksi)",
      light,
      maintenance,
      style,
      shrimpTank,
      wantCarpet
    };

    const aiResults = generateRecommendations(plants, answers);

    // Simpan ke Session Storage
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      answers,
      results: aiResults
    }));

    setTimeout(() => {
      setResults(aiResults);
      setLoading(false);
    }, 800); 
  };

  // Helper untuk warna lencana Confidence
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "Excellent Match": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Very Good Match": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800";
      case "Good Match": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
          <Cpu className="h-8 w-8" /> Plant Expert Engine V3
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
          Jawab kuis ini dan AI akan menghitung probabilitas biologi berdasarkan 10+ parameter untuk mencarikan tanaman yang paling sempurna untuk Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* KOLOM KIRI: FORM KONSULTASI (DITAMBAH SHRIMP & CARPET) */}
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

              {/* PERTANYAAN KHUSUS (HARD & SOFT FILTER) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={wantCarpet} onChange={(e) => setWantCarpet(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">Target: Membuat Tanaman Karpet</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={shrimpTank} onChange={(e) => setShrimpTank(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">Habitat: Udang Hias (Aman Tembaga)</span>
                </label>
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
              <p className="text-slate-500 dark:text-slate-400 max-w-md">Jawab kuis di samping dan saya akan menghitung kecocokan biologis dari 120 tanaman untuk Anda.</p>
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
                {results.slice(0, 10).map((plant, index) => {
                  const isTopMatch = index === 0;

                  return (
                    <div 
                      key={plant.id} 
                      className={`relative group rounded-xl overflow-hidden ${isTopMatch ? 'sm:col-span-2 ring-2 ring-teal-500 shadow-teal-500/20 shadow-xl' : ''}`}
                    >
                      {/* Lencana Ranking (Piala untuk #1) */}
                      <div className={`absolute -top-1 -left-1 z-20 w-10 h-10 rounded-br-2xl flex items-center justify-center font-bold shadow-md ${isTopMatch ? 'bg-amber-400 text-amber-950' : 'bg-teal-600 text-white'}`}>
                        {isTopMatch ? <Trophy className="h-5 w-5" /> : index + 1}
                      </div>

                      {/* Header Khusus untuk #1 AI Best Match */}
                      {isTopMatch && (
                        <div className="bg-teal-600 px-12 py-2 text-white font-bold flex items-center gap-2 text-sm tracking-wide">
                          <Sparkles className="h-4 w-4" /> AI BEST MATCH
                        </div>
                      )}
                      
                      <div className={isTopMatch ? "sm:grid sm:grid-cols-2 bg-white dark:bg-slate-900" : ""}>
                        <div className={isTopMatch ? "p-4" : ""}>
                          <PlantCard plant={plant} />
                        </div>
                        
                        {/* Explainable AI (Alasan AI Memilih Ini) */}
                        <div className={`p-4 ${isTopMatch ? "bg-teal-50/50 dark:bg-teal-950/10 flex flex-col justify-center" : "pt-0 border-t border-slate-100 dark:border-slate-800"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Confidence</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getConfidenceColor(plant.matchConfidence)}`}>
                              {plant.matchScore} Poin • {plant.matchConfidence}
                            </span>
                          </div>
                          {plant.matchReasons.length > 0 ? (
                            <ul className="space-y-2 border-l-2 border-teal-500/30 pl-3 py-1">
                              {plant.matchReasons.map((reason, i) => (
                                <li key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                                  <span className="text-teal-500 mr-1">✓</span> {reason}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-500 italic pl-3 border-l-2 border-slate-200 dark:border-slate-800 py-1">Memenuhi kriteria dasar parameter akuarium Anda.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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