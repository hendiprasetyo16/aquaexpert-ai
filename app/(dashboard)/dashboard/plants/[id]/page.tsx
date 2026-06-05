"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlantById } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

import { 
  Loader2, ArrowLeft, Leaf, Edit, Droplets, Wind, Sun, 
  Thermometer, FlaskConical, MapPin, Ruler, CheckCircle2, Maximize2, X, Info, ImageIcon,
  ChevronLeft, ChevronRight, Brain, ShieldCheck, Scissors, Activity, Target, Box
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
  
  // --- STATE MODAL LIGHTBOX & NAVIGATION ---
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allImages = [plant?.image_url, ...(plant?.gallery_urls || [])].filter(Boolean) as string[];
  
  // STATE UNTUK PAN & ZOOM
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); 
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickStartPos, setClickStartPos] = useState({ x: 0, y: 0 });

  // STATE UNTUK SWIPE & PINCH MOBILE
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Menyimpan jarak awal antara dua jari saat mencubit
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null); 

  useEffect(() => {
    async function loadData() {
      try {
        if (params.id) {
          const data = await getPlantById(params.id as string);
          setPlant(data);
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
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const openLightbox = (url: string) => {
    const idx = allImages.indexOf(url);
    if (idx !== -1) setLightboxIndex(idx);
  };

  const closeLightbox = () => { 
    setLightboxIndex(null); 
    resetZoom(); 
  };

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

  // --- MOBILE TOUCH HANDLERS (DISEMPURNAKAN UNTUK PINCH & SWIPE) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Usapan satu jari (Mulai Swipe)
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
      setInitialPinchDistance(null);
    } else if (e.touches.length === 2) {
      // Sentuhan dua jari (Mulai Pinch/Cubit)
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setInitialPinchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale === 1) {
      // Menggeser satu jari HANYA jika tidak di-zoom (Merekam gerakan Swipe)
      setTouchEnd(e.targetTouches[0].clientX);
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
      // Menggeser dua jari (Mengeksekusi Pinch-to-Zoom)
      // Mencegah browser melakukan scroll default
      if (e.cancelable) e.preventDefault(); 
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      
      // Menghitung rasio perbesaran berdasarkan rentang jari
      const pinchRatio = currentDistance / initialPinchDistance;
      // Membatasi zoom maksimal 5x, minimal 1x
      const newScale = Math.min(Math.max(1, scale * pinchRatio), 5);
      
      setScale(newScale);
      setInitialPinchDistance(currentDistance); // Update titik awal untuk iterasi berikutnya
      if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset posisi jika zoom out habis
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setInitialPinchDistance(null); // Selesai mencubit
    }

    if (scale === 1 && touchStart !== null && touchEnd !== null) {
      // Mengevaluasi hasil Swipe
      const distance = touchStart - touchEnd;
      const minSwipeDistance = 50; 
      
      if (distance > minSwipeDistance) nextImage(); // Swipe Kiri = Lanjut
      if (distance < -minSwipeDistance) prevImage(); // Swipe Kanan = Mundur
      
      // Reset state swipe
      setTouchStart(null);
      setTouchEnd(null);
    }
  };

  // KEYBOARD SUPPORT
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

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  }

  if (!plant) {
    return <div className="text-center mt-20 text-slate-400">Data tanaman tidak ditemukan atau telah dinonaktifkan.</div>;
  }

  return (
    <>
      <div className="max-w-6xl space-y-6 pb-10">
        {/* HEADER TOOLBAR */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()} className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          
          {role !== "user" && (
            <Link href={`/dashboard/plants/${plant.id}/edit`}>
              <Button className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg active:scale-95 transition-all">
                <Edit className="mr-2 h-4 w-4" /> Edit Tanaman
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* KOLOM KIRI: FOTO COVER, GALERI & IDENTITAS */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              
              {/* COVER IMAGE MENGGUNAKAN NEXT/IMAGE */}
              <div 
                className={`h-72 w-full bg-slate-800 flex items-center justify-center relative group ${plant.image_url ? 'cursor-pointer' : ''}`}
                onClick={() => plant.image_url && openLightbox(plant.image_url)}
              >
                {plant.image_url ? (
                  <>
                    <Image src={plant.image_url} alt={`Cover ${plant.name}`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" priority />
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

              {/* THUMBNAIL GALERI MENGGUNAKAN NEXT/IMAGE */}
              {plant.gallery_urls && plant.gallery_urls.length > 0 && (
                <div className={`grid gap-1 p-1 bg-slate-950 ${plant.gallery_urls.length > 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {plant.gallery_urls.map((url, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm bg-slate-800"
                      onClick={() => openLightbox(url)}
                    >
                      <Image src={url} alt={`Gallery ${idx + 1}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" sizes="(max-width: 768px) 33vw, 25vw" />
                      <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/20 transition-colors duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* IDENTITAS UTAMA */}
              <CardContent className="p-6 text-center border-t border-slate-800">
                <h1 className="text-3xl font-extrabold text-teal-400 tracking-tight">{plant.name}</h1>
                <p className="italic text-slate-400 mt-1 font-serif">{plant.scientific_name || "Scientific name unknown"}</p>
                
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-950/40 text-teal-400 border border-teal-900/50">
                    {plant.plant_type || "Unknown Type"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    plant.difficulty?.toLowerCase() === 'easy' ? 'bg-green-950/40 text-green-400 border-green-900' :
                    plant.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-950/40 text-yellow-400 border-yellow-900' :
                    plant.difficulty?.toLowerCase() === 'hard' ? 'bg-red-950/40 text-red-400 border-red-900' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {plant.difficulty || "Unknown Difficulty"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {plant.placement || "Unknown Placement"}
                  </span>
                </div>
                
                {plant.recommended_for && plant.recommended_for.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Rekomendasi Setup</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {plant.recommended_for.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 border border-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" /> {tag}
                        </span>
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
                
                {/* 4 Expert Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Beginner Score</p>
                    <p className="text-xl font-black text-white">{plant.beginner_score ? `${plant.beginner_score}/10` : "N/A"}</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Maintenance</p>
                    <div className="flex items-center gap-1">
                      <Scissors className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm font-bold text-slate-200">{plant.maintenance_level || "Medium"}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border text-center ${plant.shrimp_safe ? "bg-orange-950/20 border-orange-900/30" : "bg-slate-900/80 border-slate-800"}`}>
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Shrimp Safe</p>
                    <div className="flex items-center justify-center gap-1">
                      {plant.shrimp_safe ? <ShieldCheck className="h-4 w-4 text-orange-400" /> : <X className="h-4 w-4 text-red-500" />}
                      <span className="text-sm font-bold text-slate-200">{plant.shrimp_safe ? "Ya" : "Berisiko"}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border text-center ${plant.carpet_potential ? "bg-green-950/20 border-green-900/30" : "bg-slate-900/80 border-slate-800"}`}>
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Carpet Potential</p>
                    <div className="flex items-center justify-center gap-1">
                      {plant.carpet_potential ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <X className="h-4 w-4 text-slate-500" />}
                      <span className="text-sm font-bold text-slate-200">{plant.carpet_potential ? "Ya" : "Tidak"}</span>
                    </div>
                  </div>
                </div>

                {/* Tags, Growth, and Tank Size */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> Growth Control</p>
                    <span className="inline-block bg-slate-900 px-3 py-1.5 rounded text-sm text-slate-300 border border-slate-800">
                      {plant.growth_control || "Moderate"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5"/> Aquascape Style</p>
                    <div className="flex flex-wrap gap-2">
                      {plant.aquascape_style && plant.aquascape_style.length > 0 ? (
                        plant.aquascape_style.map(style => (
                          <span key={style} className="bg-slate-900 px-2.5 py-1 rounded text-xs text-slate-300 border border-slate-800">{style}</span>
                        ))
                      ) : <span className="text-sm text-slate-500">Universal</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Box className="h-3.5 w-3.5"/> Tank Size</p>
                    <div className="flex flex-wrap gap-2">
                      {plant.tank_size_recommendation && plant.tank_size_recommendation.length > 0 ? (
                        plant.tank_size_recommendation.map(size => (
                          <span key={size} className="bg-slate-900 px-2.5 py-1 rounded text-xs text-slate-300 border border-slate-800">{size}</span>
                        ))
                      ) : <span className="text-sm text-slate-500">Semua Ukuran</span>}
                    </div>
                  </div>
                </div>

                {/* Expert Notes */}
                {plant.expert_notes && (
                  <div className="mt-4 bg-teal-950/30 border-l-4 border-teal-500 p-4 rounded-r-lg">
                    <p className="text-sm text-teal-100/90 italic leading-relaxed">
                      💡 {plant.expert_notes}
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
                    <Info className="h-5 w-5 text-teal-500" /> Ensiklopedia Tanaman
                  </h3>
                  <p className="text-slate-300 text-[15px] leading-relaxed text-justify bg-slate-950/50 p-5 rounded-xl border border-slate-800/50 whitespace-pre-line">
                    {plant.description || "Belum ada deskripsi untuk tanaman ini."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">Parameter Lingkungan Optimal</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2"><Sun className="h-5 w-5 text-yellow-500" /><span className="text-xs font-semibold text-slate-400 uppercase">Cahaya</span></div>
                      <span className="text-base font-medium text-slate-200">{plant.light_requirement || "N/A"}</span>
                    </div>
                    <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2"><Wind className="h-5 w-5 text-blue-400" /><span className="text-xs font-semibold text-slate-400 uppercase">Kebutuhan CO2</span></div>
                      <span className="text-base font-medium text-slate-200">{plant.co2_requirement || "N/A"}</span>
                    </div>
                    <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2"><Thermometer className="h-5 w-5 text-orange-500" /><span className="text-xs font-semibold text-slate-400 uppercase">Suhu Air</span></div>
                      <span className="text-base font-medium text-slate-200">{plant.temperature_min && plant.temperature_max ? `${plant.temperature_min}° - ${plant.temperature_max}°C` : "N/A"}</span>
                    </div>
                    <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 mb-2"><FlaskConical className="h-5 w-5 text-purple-400" /><span className="text-xs font-semibold text-slate-400 uppercase">Kadar pH</span></div>
                      <span className="text-base font-medium text-slate-200">{plant.ph_min && plant.ph_max ? `${plant.ph_min} - ${plant.ph_max}` : "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">Profil Biologi</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                    <div><span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Droplets className="h-3.5 w-3.5"/> Serapan Nutrisi</span><span className="font-medium text-slate-300">{plant.fertilizer_requirement || "Unknown"}</span></div>
                    <div><span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Leaf className="h-3.5 w-3.5"/> Laju Pertumbuhan</span><span className="font-medium text-slate-300">{plant.growth_rate || "Unknown"}</span></div>
                    <div><span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Ruler className="h-3.5 w-3.5"/> Tinggi Maksimal</span><span className="font-medium text-slate-300">{plant.max_height_cm ? `${plant.max_height_cm} cm` : "Unknown"}</span></div>
                    <div><span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><MapPin className="h-3.5 w-3.5"/> Habitat Asli</span><span className="font-medium text-slate-300">{plant.origin_country || "Unknown"}</span></div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span className="text-xs text-slate-500">Data di-verifikasi oleh Knowledge Base AquaExpert</span>
                    {plant.source_url && (
                      <a href={plant.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-500 hover:text-teal-400 hover:underline transition-colors">
                        Referensi Data: {plant.source_name || "Sumber Eksternal"}
                      </a>
                    )}
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
            {/* Native img untuk interaktifitas zoom/pan yang ringan */}
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