"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlantById, getPlants } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

import { 
  Loader2, ArrowLeft, ArrowRight, Leaf, Edit, Droplets, Wind, Sun, 
  Thermometer, FlaskConical, MapPin, Ruler, CheckCircle2, Maximize2, X, Info, ImageIcon,
  ChevronLeft, ChevronRight, Brain, ShieldCheck, Scissors, Activity, Target, Box, BookOpen,
  Zap, Sprout
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- NAVIGATION STATE FOR NEXT/PREV PLANT ---
  const [prevPlantId, setPrevPlantId] = useState<string | null>(null);
  const [nextPlantId, setNextPlantId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalPlants, setTotalPlants] = useState<number>(0);

  // --- STATE MODAL LIGHTBOX & NAVIGATION ---
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allImages = [plant?.image_url, ...(plant?.gallery_urls || [])].filter(Boolean) as string[];
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); 
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickStartPos, setClickStartPos] = useState({ x: 0, y: 0 });

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (params.id) {
          const [plantData, allPlants] = await Promise.all([
            getPlantById(params.id as string),
            getPlants() // Tarik semua tanaman untuk navigasi
          ]);
          setPlant(plantData);

          // Logika untuk menemukan id Next dan Prev
          if (allPlants && allPlants.length > 0) {
            setTotalPlants(allPlants.length);
            const index = allPlants.findIndex(p => p.id === params.id);
            if (index !== -1) {
              setCurrentIndex(index + 1);
              setPrevPlantId(index > 0 ? allPlants[index - 1].id : null);
              setNextPlantId(index < allPlants.length - 1 ? allPlants[index + 1].id : null);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  // NAVIGATION HANDLERS
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };
  const openLightbox = (url: string) => {
    const idx = allImages.indexOf(url);
    if (idx !== -1) setLightboxIndex(idx);
  };
  const closeLightbox = () => { setLightboxIndex(null); resetZoom(); };
  const nextImage = () => {
    if (lightboxIndex !== null && allImages.length > 1) {
      setLightboxIndex((prev) => (prev! + 1) % allImages.length);
      resetZoom();
    }
  };
  const prevImage = () => {
    if (lightboxIndex !== null && allImages.length > 1) {
      setLightboxIndex((prev) => (prev! - 1 + allImages.length) % allImages.length);
      resetZoom();
    }
  };

  // MOBILE TOUCH HANDLERS
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); setInitialPinchDistance(null);
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      setInitialPinchDistance(distance);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale === 1) setTouchEnd(e.targetTouches[0].clientX);
    else if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      const pinchRatio = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(1, scale * pinchRatio), 5);
      setScale(newScale); setInitialPinchDistance(currentDistance);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) setInitialPinchDistance(null);
    if (scale === 1 && touchStart !== null && touchEnd !== null) {
      const distance = touchStart - touchEnd;
      if (distance > 50) nextImage();
      if (distance < -50) prevImage();
      setTouchStart(null); setTouchEnd(null);
    }
  };

  // KEYBOARD
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  // ==========================================
  // HELPER TRANSLASI UNTUK EDUKASI
  // ==========================================
  const renderStars = (score: number | null) => {
    if (!score) return "N/A";
    const filled = "★".repeat(score);
    const empty = "☆".repeat(10 - score);
    
    let colorClass = "text-red-500"; 
    if (score >= 9) colorClass = "text-green-400"; 
    else if (score >= 7) colorClass = "text-blue-400"; 
    else if (score >= 5) colorClass = "text-yellow-400"; 

    return (
      <div className="flex flex-col items-center">
        <span className={`text-[11px] tracking-widest mb-0.5 ${colorClass}`}>
          {filled}<span className="text-slate-600">{empty}</span>
        </span>
        <span className={`text-xl font-black ${colorClass}`}>{score}/10</span>
      </div>
    );
  };

  const getIndoLevelCore = (level: string | null | undefined) => {
    if (!level) return "";
    const l = level.toLowerCase();
    if (l === "low" || l === "easy") return "Rendah";
    if (l === "medium" || l === "moderate") return "Sedang";
    if (l === "high" || l === "hard" || l === "aggressive" || l === "fast") return "Tinggi";
    if (l === "slow") return "Lambat";
    return level;
  };

  const getIndoLevelDetail = (level: string | null | undefined, type: "light" | "co2" | "fert" | "growth" | "general" = "general") => {
    if (!level) return "Data tidak tersedia.";
    const l = level.toLowerCase();
    
    if (type === "light") {
      if (l === "low") return "Lampu menyala 6-7 Jam";
      if (l === "medium") return "Lampu menyala 7-8 Jam";
      if (l === "high") return "Lampu menyala 8-10 Jam";
    }
    
    if (type === "co2") {
      if (l === "low") return "Dapat hidup tanpa injeksi tabung CO2 tambahan.";
      if (l === "medium") return "Pertumbuhan optimal jika menggunakan injeksi CO2.";
      if (l === "high") return "Sangat direkomendasikan injeksi CO2 tinggi.";
    }

    if (type === "fert") {
      if (l === "low") return "Sesekali saja";
      if (l === "medium") return "Rutin (Standar)";
      if (l === "high") return "Wajib pupuk tancap & cair";
    }

    if (type === "growth") {
      if (l === "slow") return "Jarang butuh dipangkas";
      if (l === "medium" || l === "moderate") return "Perawatan standar";
      if (l === "fast" || l === "aggressive") return "Wajib sering dipangkas";
    }

    return getIndoLevelCore(level);
  };

  const getPlacementBadgeStyle = (placement: string | null | undefined) => {
    if (!placement) return "bg-slate-800/50 border-slate-700 text-slate-200";
    const p = placement.toLowerCase();
    if (p === "foreground") return "bg-green-950/30 border-green-900/50 text-green-300"; 
    if (p === "midground") return "bg-blue-950/30 border-blue-900/50 text-blue-300"; 
    if (p === "background") return "bg-purple-950/30 border-purple-900/50 text-purple-300"; 
    if (p === "epiphyte") return "bg-orange-950/30 border-orange-900/50 text-orange-300"; 
    if (p === "floating") return "bg-cyan-950/30 border-cyan-900/50 text-cyan-300"; 
    return "bg-slate-800/50 border-slate-700 text-slate-200";
  };

  const getPlacementDesc = (placement: string | null | undefined) => {
    if (!placement) return "";
    const p = placement.toLowerCase();
    if (p === "foreground") return "(Posisi Depan)";
    if (p === "midground") return "(Posisi Tengah)";
    if (p === "background") return "(Posisi Belakang)";
    if (p === "epiphyte") return "(Tempel Kayu/Batu)";
    if (p === "floating") return "(Apung di Atas)";
    return "";
  };

  const getTankSizeDesc = (size: string) => {
    const s = size.toLowerCase();
    if (s === "nano") return "Aquarium ≤ 40 cm\n(~10-30 Liter)";
    if (s === "small") return "Aquarium 40–60 cm\n(~30-60 Liter)";
    if (s === "medium") return "Aquarium 60–90 cm\n(~60-150 Liter)";
    if (s === "large") return "Aquarium 90–120 cm\n(~150-300 Liter)";
    if (s === "xl") return "Aquarium > 120 cm\n(>300 Liter)";
    return "";
  };

  const getStyleDesc = (style: string) => {
    const s = style.toLowerCase();
    if (s.includes("nature")) return "Alami spt hutan/tebing";
    if (s.includes("dutch")) return "Fokus warna & padat";
    if (s.includes("iwagumi")) return "Formasi padang batu";
    if (s.includes("jungle")) return "Tumbuh liar & lebat";
    return "Gaya Aquascape Universal";
  };

  const getPlantTypeDesc = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "stem") return "Tanaman Batang. Tumbuh menjulang ke atas, perlu dipotong dan ditancap ulang.";
    if (t === "rhizome") return "Tanaman Rimpang. Jangan dikubur di pasir, harus diikat pada batu atau kayu.";
    if (t === "rosette") return "Tumbuh berpusat dari satu pangkal akar bawah. Sangat butuh pupuk tancap.";
    if (t === "carpet") return "Tanaman Karpet. Menjalar menutupi dasar aquarium layaknya padang rumput.";
    if (t === "moss") return "Lumut Air. Diikat pada batu/kayu. Surganya udang hias untuk bersembunyi.";
    if (t === "floating") return "Tanaman Apung. Berada di permukaan. Penyerap racun nitrat paling ampuh.";
    if (t === "bulb") return "Tumbuh dari umbi. Umbinya jangan dikubur total ke dalam pasir agar tidak busuk.";
    if (t === "runner") return "Tanaman Menjalar. Berkembang menyebar cepat lewat tunas di bawah pasir.";
    return "Tipe tanaman akuatik standar.";
  };

  const getRecommendedDesc = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes("low tech")) return "Tanpa Injeksi CO2";
    if (t.includes("mid tech")) return "Cahaya & CO2 Sedang";
    if (t.includes("high tech")) return "Wajib CO2 & Cahaya Terang";
    if (t.includes("beginner")) return "Aman Untuk Pemula";
    if (t.includes("breeding tank")) return "Sembunyi Burayak";
    if (t.includes("nano tank")) return "Aquarium Mini (≤ 40cm)";
    if (t.includes("top cover")) return "Peneduh Kolom Air";
    if (t.includes("pond")) return "Bisa Hidup di Kolam";
    if (t.includes("foreground")) return "Posisi Depan";
    if (t.includes("midground")) return "Posisi Tengah";
    if (t.includes("background")) return "Posisi Belakang";
    return "Cocok untuk setup umum";
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  if (!plant) return <div className="text-center mt-20 text-slate-400">Data tanaman tidak ditemukan atau telah dinonaktifkan.</div>;

  return (
    <>
      <div className="max-w-6xl space-y-6 pb-10">
        
        {/* HEADER TOOLBAR DENGAN FITUR NEXT & PREVIOUS & INFO INDEX */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.push("/dashboard/plants")} className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95 transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Button>
              
              {/* Tombol Navigasi Plant */}
              <div className="flex bg-slate-900 border border-slate-700 rounded-md overflow-hidden">
                <Button 
                  variant="ghost" 
                  disabled={!prevPlantId}
                  onClick={() => prevPlantId && router.push(`/dashboard/plants/${prevPlantId}`)}
                  className="rounded-none border-r border-slate-700 hover:bg-teal-900/40 hover:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Tanaman Sebelumnya"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  disabled={!nextPlantId}
                  onClick={() => nextPlantId && router.push(`/dashboard/plants/${nextPlantId}`)}
                  className="rounded-none hover:bg-teal-900/40 hover:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Tanaman Berikutnya"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Indikator Urutan Tanaman */}
            {totalPlants > 0 && (
              <span className="text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50 w-full sm:w-auto text-center">
                Tanaman <strong className="text-slate-200">{currentIndex}</strong> dari <strong className="text-slate-200">{totalPlants}</strong>
              </span>
            )}
          </div>
          
          {role !== "user" && (
            <Link href={`/dashboard/plants/${plant.id}/edit`} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white shadow-lg active:scale-95 transition-all">
                <Edit className="mr-2 h-4 w-4" /> Edit Tanaman
              </Button>
            </Link>
          )}
        </div>

        {/* QUICK TAGS HEADER (New Feature) */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-2">
          {plant.difficulty?.toLowerCase() === 'easy' && (
            <span className="flex items-center gap-1.5 rounded-full bg-green-950/40 px-3 py-1 text-xs font-bold text-green-400 border border-green-900/50">
              <Sprout className="h-3.5 w-3.5" /> BEGINNER FRIENDLY
            </span>
          )}
          {plant.shrimp_safe && (
            <span className="flex items-center gap-1.5 rounded-full bg-orange-950/40 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-900/50">
              <ShieldCheck className="h-3.5 w-3.5" /> SHRIMP SAFE
            </span>
          )}
          {plant.co2_requirement?.toLowerCase() === 'low' && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-950/40 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-900/50">
              <Wind className="h-3.5 w-3.5" /> LOW TECH
            </span>
          )}
          {plant.co2_mandatory === true && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-950/40 px-3 py-1 text-xs font-bold text-red-400 border border-red-900/50">
              <Zap className="h-3.5 w-3.5" /> HIGH TECH
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* KOLOM KIRI */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              
              <div 
                className={`h-72 w-full bg-slate-800 flex items-center justify-center relative group ${plant.image_url ? 'cursor-pointer' : ''}`}
                onClick={() => plant.image_url && openLightbox(plant.image_url)}
              >
                {plant.image_url ? (
                  <>
                    <Image src={plant.image_url} alt={`Cover ${plant.name}`} fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                      <Maximize2 className="h-10 w-10 text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-slate-300 uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" /> Cover
                    </div>
                  </>
                ) : (
                  <Leaf className="h-20 w-20 text-slate-600" />
                )}
              </div>

              {plant.gallery_urls && plant.gallery_urls.length > 0 && (
                <div className={`grid gap-1 p-1 bg-slate-950 ${plant.gallery_urls.length > 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {plant.gallery_urls.map((url, idx) => (
                    <div key={idx} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm bg-slate-800" onClick={() => openLightbox(url)}>
                      <Image src={url} alt={`Gallery ${idx + 1}`} fill sizes="(max-width: 768px) 25vw, 15vw" className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/20 transition-colors duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}

              <CardContent className="p-6 text-center border-t border-slate-800">
                <h1 className="text-3xl font-extrabold text-teal-400 tracking-tight">{plant.name}</h1>
                <p className="italic text-slate-400 mt-1 font-serif">{plant.scientific_name || "Scientific name unknown"}</p>
                
                <div className="mt-6 flex flex-col items-center justify-center gap-3">
                  
                  {/* TIPE */}
                  <span className="px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest bg-teal-950/40 text-teal-400 border border-teal-900/50 w-full sm:w-auto">
                    Tipe: {plant.plant_type || "N/A"}
                  </span>

                  <div className="flex flex-row gap-3 w-full sm:w-auto justify-center">
                    {/* KESULITAN */}
                    <div className={`flex flex-col items-center justify-center w-[120px] px-2 py-2 rounded-lg border shadow-sm ${
                      plant.difficulty?.toLowerCase() === 'easy' ? 'bg-green-950/20 border-green-900/50' :
                      plant.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-950/20 border-yellow-900/50' :
                      plant.difficulty?.toLowerCase() === 'hard' ? 'bg-red-950/20 border-red-900/50' :
                      'bg-slate-800 border-slate-700'
                    }`}>
                      <span className={`text-base font-black uppercase tracking-widest ${
                        plant.difficulty?.toLowerCase() === 'easy' ? 'text-green-400' :
                        plant.difficulty?.toLowerCase() === 'medium' ? 'text-yellow-400' :
                        plant.difficulty?.toLowerCase() === 'hard' ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {plant.difficulty || "Unknown"}
                      </span>
                      <span className="text-[12px] text-slate-400 mt-0.5 font-medium">{getIndoLevelCore(plant.difficulty)}</span>
                    </div>
                    
                    {/* PENEMPATAN DENGAN WARNA PSIKOLOGIS */}
                    <div className={`flex flex-col items-center justify-center w-[120px] px-2 py-2 rounded-lg border shadow-sm ${getPlacementBadgeStyle(plant.placement)}`}>
                      <span className="text-base font-black uppercase tracking-widest">
                        {plant.placement || "Unknown"}
                      </span>
                      <span className="text-[11px] opacity-80 mt-0.5 font-medium">{getPlacementDesc(plant.placement)}</span>
                    </div>
                  </div>

                </div>
                
                {/* TAGS KECOCOKAN DENGAN KETERANGAN DI BAWAHNYA */}
                {plant.recommended_for && plant.recommended_for.length > 0 && (
                  <div className="mt-8 border-t border-slate-800 pt-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Kecocokan Ekosistem</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {plant.recommended_for.map(tag => (
                        <div key={tag} className="flex flex-col items-center bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 shadow-sm min-w-[120px]">
                          <span className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-slate-200 uppercase tracking-widest">
                            <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" /> {tag}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1.5 font-medium">{getRecommendedDesc(tag)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* KOLOM KANAN: PARAMETER PAKAR & DESKRIPSI */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 🧠 EXPERT RECOMMENDATION SECTION */}
            <Card className="border-teal-900/50 bg-teal-950/10 shadow-xl overflow-hidden">
              <div className="bg-teal-900/30 px-6 py-4 border-b border-teal-900/50 flex items-center gap-3">
                <Brain className="h-6 w-6 text-teal-400" />
                <h3 className="text-lg font-extrabold text-teal-400">Expert Recommendation</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                
                {/* PENJELASAN TIPE TANAMAN */}
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex items-start gap-4 shadow-sm">
                   <div className="bg-teal-950/40 p-2.5 rounded-md border border-teal-900/50 shrink-0 mt-0.5">
                      <Leaf className="h-6 w-6 text-teal-400" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-1.5">
                         Karakteristik Tanam: <span className="text-teal-400 uppercase tracking-widest">{plant.plant_type || "N/A"}</span>
                      </h4>
                      <p className="text-[14px] text-slate-400 leading-relaxed">
                         {getPlantTypeDesc(plant.plant_type || "")}
                      </p>
                   </div>
                </div>

                {/* 4 EXPERT BADGES */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-center shadow-sm">
                    <p className="text-[11px] uppercase text-slate-500 font-bold mb-2 text-center">Beginner Score</p>
                    {renderStars(plant.beginner_score || null)}
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center shadow-sm">
                    <p className="text-[11px] uppercase text-slate-500 font-bold mb-2">Tingkat Repot</p>
                    <div className="flex flex-col items-center justify-center mt-1">
                      <span className="text-lg font-black text-slate-200 uppercase tracking-widest flex items-center gap-1.5"><Scissors className="h-4 w-4 text-yellow-500" />{plant.maintenance_level || "Medium"}</span>
                      <span className="text-[12px] text-slate-400 font-medium mt-1">{getIndoLevelCore(plant.maintenance_level)}</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center shadow-sm ${plant.shrimp_safe ? "bg-orange-950/10 border-orange-900/30" : "bg-slate-900/80 border-slate-800"}`}>
                    <p className="text-[11px] uppercase text-slate-500 font-bold mb-2">Aman Untuk Udang</p>
                    <div className="flex flex-col items-center justify-center mt-1">
                      <span className="text-lg font-black text-slate-200 uppercase tracking-widest flex items-center gap-1.5">{plant.shrimp_safe ? <ShieldCheck className="h-5 w-5 text-orange-400" /> : <X className="h-5 w-5 text-red-500" />}{plant.shrimp_safe ? "Aman" : "Berisiko"}</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center shadow-sm ${plant.carpet_potential ? "bg-green-950/10 border-green-900/30" : "bg-slate-900/80 border-slate-800"}`}>
                    <p className="text-[11px] uppercase text-slate-500 font-bold mb-2">Bisa Jadi Karpet?</p>
                    <div className="flex flex-col items-center justify-center mt-1">
                      <span className="text-lg font-black text-slate-200 uppercase tracking-widest flex items-center gap-1.5">{plant.carpet_potential ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <X className="h-5 w-5 text-slate-500" />}{plant.carpet_potential ? "Bisa" : "Tidak"}</span>
                    </div>
                  </div>
                </div>

                {/* SIFAT, STYLE, TANK (Dipisah per baris) */}
                <div className="grid sm:grid-cols-3 gap-4 border-t border-slate-800 pt-6 mt-6">
                  
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-teal-500"/>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Sifat Rambat</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col flex-1 justify-center shadow-inner text-center">
                      <span className="text-base font-black text-slate-100 uppercase tracking-wider mb-1.5">{plant.growth_control || "N/A"}</span>
                      <span className="text-[12px] text-slate-400 leading-snug">{getIndoLevelDetail(plant.growth_control, "growth")}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-blue-500"/>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Gaya Aquascape</p>
                    </div>
                    <div className="flex flex-col gap-3 flex-1 justify-start text-center">
                      {plant.aquascape_style && plant.aquascape_style.length > 0 ? (
                        plant.aquascape_style.map(style => (
                          <div key={style} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col shadow-inner">
                            <span className="text-[15px] font-black text-slate-200 uppercase tracking-wider mb-1.5">{style}</span>
                            <span className="text-[12px] text-slate-400 leading-snug">{getStyleDesc(style)}</span>
                          </div>
                        ))
                      ) : <span className="text-sm text-slate-500 italic p-3">Cocok untuk gaya apapun.</span>}
                    </div>
                  </div>

                  {/* Diperbarui: TANK SIZE TAMPIL 3 BARIS */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Box className="h-4 w-4 text-orange-500"/>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Ukuran Aquarium</p>
                    </div>
                    <div className="flex flex-col gap-3 flex-1 justify-start text-center">
                      {plant.tank_size_recommendation && plant.tank_size_recommendation.length > 0 ? (
                        plant.tank_size_recommendation.map(size => (
                          <div key={size} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col shadow-inner">
                            <span className="text-[15px] font-black text-slate-200 uppercase tracking-wider mb-1.5">{size}</span>
                            <span className="text-[12px] text-slate-400 leading-relaxed font-medium whitespace-pre-line">{getTankSizeDesc(size)}</span>
                          </div>
                        ))
                      ) : <span className="text-sm text-slate-500 italic p-3">Bebas semua ukuran.</span>}
                    </div>
                  </div>

                </div>

                {/* Expert Notes */}
                {plant.expert_notes && (
                  <div className="mt-4 bg-teal-950/20 border border-teal-900/50 p-6 rounded-xl shadow-inner relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500"></div>
                    <p className="text-[15px] text-teal-100/90 leading-relaxed font-medium">
                      <span className="font-bold mr-2 text-teal-400 uppercase tracking-widest text-xs block mb-2">💡 Catatan Pakar</span> 
                      {plant.expert_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ENSIKLOPEDIA & BIOLOGI */}
            <Card className="border-slate-800 bg-slate-900/60 shadow-xl h-fit">
              <CardContent className="p-8 space-y-10">
                
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Info className="h-5 w-5 text-teal-500" /> Ensiklopedia Karakteristik
                  </h3>
                  <p className="text-slate-300 text-[15px] leading-relaxed text-justify bg-slate-950/50 p-5 rounded-xl border border-slate-800/50 whitespace-pre-line">
                    {plant.description || "Belum ada deskripsi untuk tanaman ini."}
                  </p>
                </div>

                {/* PARAMETER AIR (KOTAK RAPI DENGAN SEPARATOR) */}
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">Kebutuhan Lingkungan Optimal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="flex flex-col bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cahaya</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-800 pt-3 mt-1">
                        <span className="text-lg font-black text-slate-200 uppercase tracking-widest">{plant.light_requirement || "N/A"}</span>
                        <span className="text-[12px] text-yellow-500/80 font-medium mt-0.5">({getIndoLevelCore(plant.light_requirement)})</span>
                      </div>
                      <div className="bg-slate-900 rounded border border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-400 leading-tight flex items-center justify-center h-full">
                        💡 {getIndoLevelDetail(plant.light_requirement, "light")}
                      </div>
                    </div>
                    
                    <div className="flex flex-col bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Wind className="h-4 w-4 text-blue-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Injeksi CO2</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-800 pt-3 mt-1">
                        <span className="text-lg font-black text-slate-200 uppercase tracking-widest">{plant.co2_requirement || "N/A"}</span>
                        <span className="text-[12px] text-blue-400/80 font-medium mt-0.5">({getIndoLevelCore(plant.co2_requirement)})</span>
                      </div>
                      
                      {/* LENCANA CO2 MANDATORY */}
                      {plant.co2_mandatory === true && (
                        <div className="mt-2.5 rounded-md bg-red-950/40 border border-red-900/50 px-2 py-1.5 text-[11px] font-bold text-red-400">
                          🔴 WAJIB CO2
                        </div>
                      )}
                      {plant.co2_mandatory === false && (
                        <div className="mt-2.5 rounded-md bg-green-950/40 border border-green-900/50 px-2 py-1.5 text-[11px] font-bold text-green-400">
                          🟢 CO2 OPSIONAL
                        </div>
                      )}

                      <div className="bg-slate-900 rounded border border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-400 leading-tight flex items-center justify-center h-full">
                        💡 {getIndoLevelDetail(plant.co2_requirement, "co2")}
                      </div>
                    </div>

                    <div className="flex flex-col bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suhu Air</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-800 pt-3 mt-1">
                        <span className="text-lg font-black text-slate-200 tracking-wider">
                          {plant.temperature_min && plant.temperature_max ? `${plant.temperature_min}–${plant.temperature_max}` : "N/A"}
                        </span>
                        <span className="text-[12px] text-orange-400/80 font-medium mt-0.5">Celcius (°C)</span>
                      </div>
                      <div className="bg-slate-900 rounded border border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-400 leading-tight flex items-center justify-center h-full">
                        Suhu ideal untuk fotosintesis.
                      </div>
                    </div>

                    <div className="flex flex-col bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <FlaskConical className="h-4 w-4 text-purple-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kadar pH</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-800 pt-3 mt-1">
                        <span className="text-lg font-black text-slate-200 tracking-wider">
                          {plant.ph_min && plant.ph_max ? `${plant.ph_min}–${plant.ph_max}` : "N/A"}
                        </span>
                        <span className="text-[12px] text-purple-400/80 font-medium mt-0.5">Asam - Basa</span>
                      </div>
                      <div className="bg-slate-900 rounded border border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-400 leading-tight flex items-center justify-center h-full">
                        Tingkat keasaman air optimal.
                      </div>
                    </div>

                  </div>
                </div>

                {/* BAGIAN KARAKTERISTIK FISIK */}
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">Profil Biologi Tambahan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <Droplets className="h-4 w-4 text-teal-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pupuk</span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex flex-col">
                        <span className="text-base font-black text-slate-200 uppercase tracking-widest">{plant.fertilizer_requirement || "Unknown"}</span>
                        <span className="text-[11px] text-slate-400 mt-1">{getIndoLevelDetail(plant.fertilizer_requirement, "fert")}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <Leaf className="h-4 w-4 text-green-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kecepatan Tumbuh</span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex flex-col">
                        <span className="text-base font-black text-slate-200 uppercase tracking-widest">{plant.growth_rate || "Unknown"}</span>
                        <span className="text-[11px] text-slate-400 mt-1">{getIndoLevelDetail(plant.growth_rate, "growth")}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <Ruler className="h-4 w-4 text-blue-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tinggi Max</span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex flex-col items-center justify-center h-full">
                        <span className="text-lg font-black text-slate-200 block mt-1">{plant.max_height_cm ? `${plant.max_height_cm} cm` : "N/A"}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <MapPin className="h-4 w-4 text-orange-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Habitat Asli</span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex flex-col items-center justify-center h-full">
                        <span className="text-[14px] font-bold text-slate-200 block mt-1 leading-snug">{plant.origin_country || "Unknown"}</span>
                      </div>
                    </div>

                  </div>
                  
                  <div className="mt-8 border-t border-slate-800 pt-6">
                    <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-md border border-slate-700">
                          <BookOpen className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Sumber Referensi / Literatur</p>
                          <p className="text-xs text-slate-500 mt-0.5">Terverifikasi oleh Database AquaExpert</p>
                        </div>
                      </div>
                      
                      {plant.source_url ? (
                        <a 
                          href={plant.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-teal-400 hover:text-teal-300 text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Lihat Jurnal: {plant.source_name || "Link Eksternal"}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">Internal Knowledge Base</span>
                      )}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX NATIVE IMG */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 overflow-hidden select-none backdrop-blur-sm" onClick={closeLightbox}>
          <button className="absolute top-6 right-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 border border-slate-700 shadow-xl transition-all hover:bg-red-500 hover:text-white active:scale-95 cursor-pointer" onClick={(e) => { e.stopPropagation(); closeLightbox(); }}>
            <X className="h-6 w-6" />
          </button>

          {allImages.length > 1 && (
            <>
              <button className="absolute left-6 z-[110] flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 border border-slate-700 shadow-xl transition-all hover:bg-teal-500 hover:text-white active:scale-95" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <ChevronLeft className="h-8 w-8 -ml-1" />
              </button>
              <button className="absolute right-6 z-[110] flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 border border-slate-700 shadow-xl transition-all hover:bg-teal-500 hover:text-white active:scale-95" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <ChevronRight className="h-8 w-8 ml-1" />
              </button>
            </>
          )}

          <div 
            className="relative flex items-center justify-center w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => { e.stopPropagation(); if (!hasDragged) { if (scale > 1) resetZoom(); else setScale(2.5); } }}
            onWheel={(e) => {
              e.stopPropagation();
              const newScale = Math.max(1, Math.min(scale + (e.deltaY < 0 ? 0.15 : -0.15), 5));
              setScale(newScale);
              if (newScale === 1) setPosition({ x: 0, y: 0 });
            }}
            onMouseDown={(e) => {
              e.stopPropagation(); e.preventDefault(); 
              setIsDragging(true); setHasDragged(false);
              setClickStartPos({ x: e.clientX, y: e.clientY });
              setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
            }}
            onMouseMove={(e) => {
              if (!isDragging) return; e.stopPropagation();
              if (Math.abs(e.clientX - clickStartPos.x) > 5 || Math.abs(e.clientY - clickStartPos.y) > 5) setHasDragged(true); 
              setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }}
            onMouseUp={(e) => { e.stopPropagation(); setIsDragging(false); }}
            onMouseLeave={(e) => { if (isDragging) { e.stopPropagation(); setIsDragging(false); } }}
          >
            <img src={allImages[lightboxIndex]} alt="Detail Gambar" draggable={false} style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.2s ease-out', cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in') }} className="max-h-[85vh] w-auto max-w-[95vw] rounded-lg shadow-2xl object-contain border border-white/10" />
            
            {allImages.length > 1 && scale === 1 && (
              <div className="absolute top-6 left-6 text-white/80 text-sm font-bold bg-black/60 px-4 py-2 rounded-full border border-white/10 pointer-events-none">
                {lightboxIndex + 1} / {allImages.length}
              </div>
            )}
            {scale === 1 && (
              <p className="absolute bottom-10 text-white/80 text-sm font-medium tracking-wide animate-in fade-in duration-300 bg-black/60 px-6 py-2 rounded-full pointer-events-none border border-white/10 hidden md:block">
                Sekali Klik untuk Zoom | Scroll Mouse | Klik & Geser | Panah Keyboard
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}