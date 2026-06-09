"use client";

import { useState, useEffect } from "react";
import { getPlants } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import PlantCard from "@/features/plants/components/PlantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Cpu, Filter, Info, CheckCircle2, Trophy, Sparkles } from "lucide-react";

import { generateRecommendations, UserAnswers, RecommendedPlant } from "@/features/plants/services/expert.service";

const SESSION_KEY = "aquaexpert_plant_inference_v4";

export default function PlantExpertEngineV4() {
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
  const [shrimpTank, setShrimpTank] = useState(false);
  const [wantCarpet, setWantCarpet] = useState(false);
  const [wantRedPlant, setWantRedPlant] = useState(false); // PARAMETER BARU

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
          setWantRedPlant(parsed.answers.wantRedPlant || false);
        }
        if (parsed.results) {
          setResults(parsed.results);
        }
      } catch (e) {
        console.error("Gagal membaca session data", e);
      }
    }
  }, []);

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
      wantCarpet,
      wantRedPlant
    };

    const aiResults = generateRecommendations(plants, answers);

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      answers,
      results: aiResults
    }));

    setTimeout(() => {
      setResults(aiResults);
      setLoading(false);
    }, 800); 
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "Excellent Match": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Very Good Match": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800";
      case "Good Match": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    // PERBAIKAN UI: Memberikan PADDING LEGA agar tidak memepet sidebar (p-6 md:p-8 lg:p-10)
    <div className="w-full h-full min-h-screen p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-3">
            <Cpu className="h-8 w-8 md:h-10 md:w-10" /> Plant Expert AI
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed">
            Jawab kuis ini dan AI AquaExpert akan mengevaluasi ratusan parameter biologi untuk memberikan rekomendasi tanaman yang paling sempurna (Excellent Match) untuk ekosistem akuarium Anda.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          
          {/* KOLOM KIRI: FORM KONSULTASI */}
          <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 xl:col-span-4 h-fit shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <CardContent className="p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Filter className="h-5 w-5 text-teal-600 dark:text-teal-500" /> Kuesioner Tank
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">1. Pengalaman Anda</Label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value as any)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all">
                    <option value="Pemula">Baru Mulai (Pemula)</option>
                    <option value="Menengah">Pernah Punya (Menengah)</option>
                    <option value="Mahir">Sangat Paham (Mahir)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">2. Ukuran Akuarium</Label>
                  <select value={tankSize} onChange={(e) => setTankSize(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all">
                    <option value="Nano">Nano (≤ 40cm)</option>
                    <option value="Small">Small (45-60cm)</option>
                    <option value="Medium">Medium (60-90cm)</option>
                    <option value="Large">Large (90-120cm)</option>
                    <option value="Extra Large">Extra Large (&gt;120cm)</option>
                    <option value="Pond">Kolam / Pond</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">3. Injeksi CO2 Tabung</Label>
                  <select value={co2} onChange={(e) => setCo2(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all">
                    <option value="Tanpa CO2">Tidak Pakai CO2</option>
                    <option value="Tinggi (Injeksi)">Ya, Pakai Tabung CO2</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">4. Intensitas Lampu</Label>
                  <select value={light} onChange={(e) => setLight(e.target.value as any)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all">
                    <option value="Low">Redup (Low)</option>
                    <option value="Medium">Sedang (Medium)</option>
                    <option value="High">Terang Banderang (High)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">5. Waktu Luang Merawat</Label>
                  <select value={maintenance} onChange={(e) => setMaintenance(e.target.value as any)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all">
                    <option value="Low">Sedikit (Mau yg dibiarkan hidup)</option>
                    <option value="Medium">Cukup (Bisa potong sebulan sekali)</option>
                    <option value="High">Banyak (Siap rawat tiap minggu)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 text-xs md:text-sm uppercase font-bold tracking-wider">6. Tema Aquascape</Label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all">
                    <option value="Bebas">Bebas (Belum Tahu)</option>
                    <option value="Nature">Nature Style</option>
                    <option value="Dutch">Dutch Style (Warna-warni)</option>
                    <option value="Iwagumi">Iwagumi (Padang Rumput)</option>
                    <option value="Jungle">Jungle / Biotope</option>
                  </select>
                </div>

                {/* FITUR TAMBAHAN (KONDISI SPESIFIK) */}
                <div className="pt-5 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={wantCarpet} onChange={(e) => setWantCarpet(e.target.checked)} className="h-5 w-5 accent-teal-600 rounded cursor-pointer" />
                    <span className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">Saya butuh Tanaman Karpet</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={wantRedPlant} onChange={(e) => setWantRedPlant(e.target.checked)} className="h-5 w-5 accent-rose-600 rounded cursor-pointer" />
                    <span className="text-sm md:text-base font-bold text-rose-700 dark:text-rose-400 group-hover:text-rose-600 transition-colors">Ingin Nuansa Merah/Warna-Warni</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={shrimpTank} onChange={(e) => setShrimpTank(e.target.checked)} className="h-5 w-5 accent-teal-600 rounded cursor-pointer" />
                    <span className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">Habitat Udang Hias (Shrimp Safe)</span>
                  </label>
                </div>
              </div>

              <Button onClick={runInferenceEngine} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-14 mt-4 text-base shadow-lg shadow-teal-600/20 dark:shadow-teal-900/30 transition-all active:scale-[0.98]">
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Mulai Analisis Pakar"}
              </Button>
            </CardContent>
          </Card>

          {/* KOLOM KANAN: HASIL REKOMENDASI AI */}
          <div className="xl:col-span-8 space-y-6">
            {!results ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 transition-colors p-8 text-center">
                <Cpu className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-6 animate-pulse" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">Otak AI Siap Beraksi</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">
                  Kirimkan parameter akuarium Anda di sebelah kiri. Saya akan menyeleksi dan memberikan peringkat pada 120 tanaman terbaik untuk Anda.
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-red-200 dark:border-red-900/30 rounded-2xl bg-red-50 dark:bg-red-950/10 p-8 text-center transition-colors">
                <Info className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-3">Gagal Menemukan Kecocokan</h3>
                <p className="text-base text-slate-600 dark:text-red-400/80 max-w-lg leading-relaxed">
                  Secara biologis, kondisi akuarium Anda tidak memungkinkan untuk tuntutan tersebut. Misalnya, tanaman karpet atau tanaman merah butuh cahaya & CO2 memadai. Mohon sesuaikan kembali ekspektasi atau fasilitas tank Anda.
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">Hasil Analisis</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2">Daftar tanaman yang lolos filter seleksi biologis AI.</p>
                  </div>
                  <span className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 text-sm md:text-base px-5 py-2 rounded-full border border-teal-200 dark:border-teal-900 font-bold whitespace-nowrap shadow-sm">
                    <CheckCircle2 className="h-5 w-5" /> {results.length} Tanaman Lolos
                  </span>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {results.slice(0, 10).map((plant, index) => {
                    const isTopMatch = index === 0;

                    return (
                      <div 
                        key={plant.id} 
                        className={`relative group rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isTopMatch ? 'md:col-span-2 ring-2 ring-teal-500 shadow-teal-500/20 shadow-2xl scale-[1.01] transition-transform' : 'shadow-md hover:shadow-lg transition-shadow'}`}
                      >
                        {/* Lencana Ranking */}
                        <div className={`absolute -top-1 -left-1 z-20 w-12 h-12 rounded-br-2xl flex items-center justify-center font-black shadow-md text-lg ${isTopMatch ? 'bg-amber-400 text-amber-950' : 'bg-slate-800 text-white dark:bg-slate-800 dark:text-white'}`}>
                          {isTopMatch ? <Trophy className="h-6 w-6" /> : index + 1}
                        </div>

                        {/* Header Khusus untuk #1 AI Best Match */}
                        {isTopMatch && (
                          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-14 py-2.5 text-white font-bold flex items-center gap-2 text-sm tracking-widest uppercase shadow-sm">
                            <Sparkles className="h-4 w-4" /> The Best Match
                          </div>
                        )}
                        
                        <div className={isTopMatch ? "md:grid md:grid-cols-2" : ""}>
                          <div className={isTopMatch ? "p-5" : "p-2"}>
                            {/* Membungkus PlantCard agar desainnya tetap rapi */}
                            <div className="transform scale-95 origin-top">
                               <PlantCard plant={plant} />
                            </div>
                          </div>
                          
                          {/* Explainable AI */}
                          <div className={`p-5 ${isTopMatch ? "bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center border-l border-slate-100 dark:border-slate-800" : "pt-0 border-t border-slate-100 dark:border-slate-800"}`}>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Confidence</span>
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getConfidenceColor(plant.matchConfidence)} shadow-sm`}>
                                {plant.matchScore} Poin • {plant.matchConfidence}
                              </span>
                            </div>
                            {plant.matchReasons.length > 0 ? (
                              <ul className="space-y-2 border-l-2 border-teal-500/40 pl-4 py-1">
                                {plant.matchReasons.map((reason, i) => (
                                  <li key={i} className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-snug">
                                    <span className="text-teal-500 dark:text-teal-400 mr-2 font-bold">✓</span> {reason}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500 italic pl-4 border-l-2 border-slate-200 dark:border-slate-800 py-2">Sesuai dengan parameter biologi dasar Anda.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {results.length > 10 && (
                  <div className="text-center mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Menampilkan Top 10 dari <span className="font-bold text-slate-700 dark:text-slate-300">{results.length}</span> tanaman yang cocok.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}