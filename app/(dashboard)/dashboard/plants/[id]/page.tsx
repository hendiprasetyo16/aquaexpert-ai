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
  Zap, Sprout, Share2, Link as LinkIcon, Check, CheckSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { 
  getCO2DisplayStatus, renderStars, getIndoLevelDetail, getPlacementBadgeStyle, 
  getPlacementDesc, getTankSizeDetails, getStyleDesc, getPlantTypeDesc, 
  getRecommendedDesc, getRecommendationBadgeColor, getIndoLevelCore 
} from "./plant-helpers";

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  
  const [plant, setPlant] = useState<Plant | null>(null);
  const [allPlantsList, setAllPlantsList] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [copied, setCopied] = useState(false);
  const [prevPlantId, setPrevPlantId] = useState<string | null>(null);
  const [nextPlantId, setNextPlantId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalPlants, setTotalPlants] = useState<number>(0);

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
            getPlants()
          ]);
          setPlant(plantData);
          setAllPlantsList(allPlants || []);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AquaExpert: ${plant?.name}`,
          text: `Lihat profil botani ${plant?.name} untuk aquascape!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const uniqueRecommendedTags = Array.from(
    new Set(
      (plant?.recommended_for || []).map(tag => 
        tag.toLowerCase() === "pemula" ? "Beginner" : tag
      )
    )
  );

  const cocokUntukTags = uniqueRecommendedTags.filter(tag => ["beginner", "aquascape contest"].includes(tag.toLowerCase()));
  const setupRekomendasiTags = uniqueRecommendedTags.filter(tag => ["low tech", "high tech", "low light setup", "co2 setup"].includes(tag.toLowerCase()));
  const ekosistemSpesifikTags = uniqueRecommendedTags.filter(tag => ![
    "beginner", "low tech", "high tech", "low light setup", "co2 setup", "aquascape contest"
  ].includes(tag.toLowerCase()));

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" /></div>;
  if (!plant) return <div className="text-center mt-20 text-slate-500 dark:text-slate-400">Data tanaman tidak ditemukan atau telah dinonaktifkan.</div>;

  const co2Status = getCO2DisplayStatus(plant.co2_requirement, plant.co2_mandatory);

  const relatedPlants = allPlantsList
    .filter(p => p.id !== plant.id && p.is_active)
    .map(p => {
      let score = 0;
      if (p.plant_type === plant.plant_type) score += 4;
      if (p.placement === plant.placement) score += 3;
      if (p.difficulty === plant.difficulty) score += 2;
      if (p.light_requirement === plant.light_requirement) score += 2;
      if (p.co2_requirement === plant.co2_requirement) score += 2;
      if (p.origin_country === plant.origin_country) score += 1;
      return { ...p, similarityScore: score };
    })
    .filter(p => p.similarityScore >= 5) 
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);

  return (
    <>
      {/* PENAMBAHAN CLASS px-4 sm:px-6 lg:px-8 mx-auto DI SINI */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10 space-y-6 transition-colors duration-300">
        
{/* HEADER TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              {/* TOMBOL KEMBALI YANG SUDAH DIPERBAIKI */}
              <Button 
                variant="outline" 
                onClick={() => {
                  if (window.history.length > 2) {
                    router.back(); // Kembali ke halaman sebelumnya (misal: Plant Expert AI)
                  } else {
                    router.push("/dashboard/plants"); // Fallback jika buka dari link WhatsApp
                  }
                }} 
                className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Button>
              
              <div className="flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden transition-colors">
                <Button variant="ghost" disabled={!prevPlantId} onClick={() => prevPlantId && router.push(`/dashboard/plants/${prevPlantId}`)} className="rounded-none border-r border-slate-300 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300" title="Tanaman Sebelumnya">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" disabled={!nextPlantId} onClick={() => nextPlantId && router.push(`/dashboard/plants/${nextPlantId}`)} className="rounded-none hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300" title="Tanaman Berikutnya">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {totalPlants > 0 && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700/50 w-full sm:w-auto text-center transition-colors">
                Tanaman <strong className="text-gray-900 dark:text-slate-200">{currentIndex}</strong> dari <strong className="text-gray-900 dark:text-slate-200">{totalPlants}</strong>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {role !== "user" && (
              <Link href={`/dashboard/plants/${plant.id}/edit`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/10 dark:shadow-teal-900/20 active:scale-95 transition-all">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* KOLOM KIRI */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl transition-colors">
              <div 
                className={`h-72 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group transition-colors ${plant.image_url ? 'cursor-pointer' : ''}`}
                onClick={() => plant.image_url && openLightbox(plant.image_url)}
              >
                {plant.image_url ? (
                  <>
                    <Image src={plant.image_url} alt={`Cover ${plant.name}`} fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                      <Maximize2 className="h-10 w-10 text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-slate-200 uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" /> Cover
                    </div>
                  </>
                ) : (
                  <Leaf className="h-20 w-20 text-slate-300 dark:text-slate-600" />
                )}
              </div>

              {plant.gallery_urls && plant.gallery_urls.length > 0 && (
                <div className={`grid gap-1 p-1 bg-slate-50 dark:bg-slate-950 transition-colors ${plant.gallery_urls.length > 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {plant.gallery_urls.map((url, idx) => (
                    <div key={idx} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800 transition-colors" onClick={() => openLightbox(url)}>
                      <Image src={url} alt={`Gallery ${idx + 1}`} fill sizes="(max-width: 768px) 25vw, 15vw" className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/20 transition-colors duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}

              <CardContent className="p-6 flex flex-col items-center text-center border-t border-slate-200 dark:border-slate-800 relative transition-colors">
                
                <div className="flex gap-2 justify-end w-full mb-2">
                   <button onClick={handleShare} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-md transition-colors" title="Bagikan">
                     <Share2 className="h-4 w-4" />
                   </button>
                   <button onClick={handleCopyLink} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-md transition-colors" title="Salin Tautan">
                     {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                   </button>
                </div>

                <h1 className="text-3xl font-extrabold text-teal-700 dark:text-teal-400 tracking-tight leading-tight w-full px-2">{plant.name}</h1>
                <p className="italic text-slate-500 dark:text-slate-400 mt-2 font-serif">{plant.scientific_name || "Scientific name unknown"}</p>
                
                <div className="mt-6 flex flex-col items-center justify-center gap-3 w-full">
                  <span className="px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50 w-full sm:w-auto transition-colors">
                    Tipe: {plant.plant_type || "N/A"}
                  </span>
                  
                  <div className="flex flex-row gap-3 w-full sm:w-auto justify-center">
                    <div className={`flex flex-col items-center justify-center w-[120px] px-2 py-2 rounded-lg border shadow-sm transition-colors ${
                      plant.difficulty?.toLowerCase() === 'easy' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50' :
                      plant.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50' :
                      plant.difficulty?.toLowerCase() === 'hard' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' :
                      'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}>
                      <span className={`text-sm font-black uppercase tracking-widest transition-colors ${
                        plant.difficulty?.toLowerCase() === 'easy' ? 'text-green-700 dark:text-green-400' :
                        plant.difficulty?.toLowerCase() === 'medium' ? 'text-yellow-700 dark:text-yellow-400' :
                        plant.difficulty?.toLowerCase() === 'hard' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {plant.difficulty || "Unknown"}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{getIndoLevelCore(plant.difficulty)}</span>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center w-[120px] px-2 py-2 rounded-lg border shadow-sm transition-colors ${getPlacementBadgeStyle(plant.placement)}`}>
                      <span className="text-base font-black uppercase tracking-widest">
                        {plant.placement || "Unknown"}
                      </span>
                      <span className="text-[11px] opacity-80 mt-0.5 font-medium text-center">{getPlacementDesc(plant.placement)}</span>
                    </div>
                  </div>
                </div>

                {/* KECOCOKAN EKOSISTEM DENGAN EMPTY STATE */}
                <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-5 w-full transition-colors">
                  <div className="flex items-center gap-2 justify-center mb-6">
                    <CheckSquare className="h-4 w-4 text-teal-600 dark:text-teal-500" />
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      Analisis Kecocokan
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400 mb-3">
                      Cocok Untuk
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {cocokUntukTags.length > 0 ? (
                        cocokUntukTags.map(tag => (
                          <div key={tag} className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] transition-colors ${getRecommendationBadgeColor(tag)}`} >
                            <span className="text-[12px] font-bold uppercase tracking-widest text-center">{tag}</span>
                            <span className="text-[10px] opacity-80 mt-1 text-center">{getRecommendedDesc(tag)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-500 italic py-2">- Belum ada data spesifik -</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400 mb-3">
                      Setup Rekomendasi
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {setupRekomendasiTags.length > 0 ? (
                        setupRekomendasiTags.map(tag => (
                          <div key={tag} className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] transition-colors ${getRecommendationBadgeColor(tag)}`} >
                            <span className="text-[12px] font-bold uppercase tracking-widest text-center">{tag}</span>
                            <span className="text-[10px] opacity-80 mt-1 text-center">{getRecommendedDesc(tag)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-500 italic py-2">- Belum ada setup spesifik -</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-3">
                      Ekosistem Spesifik
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] transition-colors ${
                        co2Status.variant === 'danger' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' : 
                        co2Status.variant === 'warning' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' : 
                        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                      }`}>
                        <span className="text-[12px] font-bold uppercase tracking-widest text-center">
                          {co2Status.label === "Wajib Injeksi" ? "CO2 Wajib" : co2Status.label === "Disarankan" ? "CO2 Disarankan" : "Tanpa CO2"}
                        </span>
                        <span className="text-[10px] opacity-80 mt-1 text-center">
                          {co2Status.variant === 'danger' ? 'Butuh injeksi' : co2Status.variant === 'warning' ? 'Lebih baik dgn CO2' : 'Aman tanpa CO2'}
                        </span>
                      </div>
                      
                      {plant.carpet_potential && (
                        <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50 transition-colors">
                          <span className="text-[12px] font-bold uppercase tracking-widest text-center">Karpet</span>
                          <span className="text-[10px] opacity-80 mt-1 text-center">Bisa merayap</span>
                        </div>
                      )}
                      
                      {plant.shrimp_safe && (
                        <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 transition-colors">
                          <span className="text-[12px] font-bold uppercase tracking-widest text-center">Shrimp Safe</span>
                          <span className="text-[10px] opacity-80 mt-1 text-center">Aman bagi udang</span>
                        </div>
                      )}

                      {plant.emersed_capable && (
                        <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] bg-lime-50 dark:bg-lime-950/40 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900/50 transition-colors">
                          <span className="text-[12px] font-bold uppercase tracking-widest text-center">Emersed</span>
                          <span className="text-[10px] opacity-80 mt-1 text-center">Tumbuh darat</span>
                        </div>
                      )}

                      {ekosistemSpesifikTags.map(tag => (
                        <div key={tag} className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm flex-1 min-w-[110px] sm:min-w-[120px] transition-colors ${getRecommendationBadgeColor(tag)}`} >
                          <span className="text-[12px] font-bold uppercase tracking-widest text-center">{tag}</span>
                          <span className="text-[10px] opacity-80 mt-1 text-center">{getRecommendedDesc(tag)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RELATED PLANTS CARD */}
            {relatedPlants.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl overflow-hidden mt-6 transition-colors">
                <div className="bg-slate-50 dark:bg-slate-900/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-colors">
                  <Leaf className="h-5 w-5 text-teal-600 dark:text-teal-500" />
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-slate-200 uppercase tracking-wider">Tanaman Serupa</h3>
                </div>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 gap-4">
                    {relatedPlants.map(related => (
                      <Link href={`/dashboard/plants/${related.id}`} key={related.id}>
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-900/50 p-2.5 rounded-lg transition-colors cursor-pointer relative overflow-hidden group">
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-500/20 group-hover:bg-teal-500/50 transition-colors"></div>
                          <div className="h-16 w-16 relative rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                            {related.image_url ? (
                              <Image src={related.image_url} alt={related.name} fill sizes="64px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600">
                                <Leaf className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <p className="font-bold text-gray-900 dark:text-slate-200 text-sm truncate">{related.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                               <span className="text-[9px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-900/50 uppercase font-semibold">{related.plant_type}</span>
                               <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 uppercase font-semibold">{related.placement}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* KOLOM KANAN (DATA UTAMA - TIDAK DIBUNGKUS CARD LAGI) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Peringatan CO2 Engine */}
            {plant.co2_mandatory && (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-4 transition-colors">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full shrink-0 mt-0.5 transition-colors">
                  <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Peringatan Expert Engine</h4>
                  <p className="text-[13px] text-red-700 dark:text-red-400/90 mt-1 leading-relaxed">
                    Tanaman ini <strong>wajib menggunakan injeksi CO2</strong> agar bisa bertahan hidup dan tumbuh optimal. Tidak disarankan untuk setup Low-Tech.
                  </p>
                </div>
              </div>
            )}

            {/* Karakteristik Tanam */}
            <div className="bg-white dark:bg-slate-900/80 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-4 shadow-sm transition-colors">
               <div className="bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-md border border-teal-200 dark:border-teal-900/50 shrink-0 mt-0.5 transition-colors">
                  <Leaf className="h-6 w-6 text-teal-600 dark:text-teal-400" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200 flex items-center gap-2 mb-1.5 transition-colors">
                     Karakteristik Tanam: <span className="text-teal-700 dark:text-teal-400 uppercase tracking-widest">{plant.plant_type || "N/A"}</span>
                  </h4>
                  <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                     {getPlantTypeDesc(plant.plant_type || "")}
                  </p>
               </div>
            </div>

            {/* 4 GRID STATS: Beginner, Perawatan, Aman Udang, Bisa Karpet */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center shadow-sm relative transition-colors">
                <p className="text-[11px] uppercase text-slate-500 font-bold mb-2 text-center">Beginner Score</p>
                {renderStars(plant.beginner_score || null)}
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-sm transition-colors">
                {/* UBAH NAMA DI SINI */}
                <p className="text-[11px] uppercase text-slate-500 font-bold mb-2 text-center">Tingkat Perawatan</p>
                <div className="flex flex-col items-center justify-center mt-1">
                  <span className="text-lg font-black text-gray-900 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 transition-colors"><Scissors className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />{plant.maintenance_level || "Medium"}</span>
                  <span className="text-[12px] text-slate-600 dark:text-slate-400 font-medium mt-1 transition-colors">{getIndoLevelCore(plant.maintenance_level)}</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center shadow-sm transition-colors ${plant.shrimp_safe ? "bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30" : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"}`}>
                <p className="text-[11px] uppercase text-slate-500 font-bold mb-2 text-center">Aman Untuk Udang</p>
                <div className="flex flex-col items-center justify-center mt-1">
                  <span className={`text-lg font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${plant.shrimp_safe ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-slate-200"}`}>
                    {plant.shrimp_safe ? <ShieldCheck className="h-5 w-5" /> : <X className="h-5 w-5 text-slate-400" />}
                    {plant.shrimp_safe ? "Aman" : "Tidak"}
                  </span>
                </div>
              </div>
              <div className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center shadow-sm transition-colors ${plant.carpet_potential ? "bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30" : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800"}`}>
                <p className="text-[11px] uppercase text-slate-500 font-bold mb-2 text-center">Bisa Jadi Karpet?</p>
                <div className="flex flex-col items-center justify-center mt-1">
                  <span className={`text-lg font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${plant.carpet_potential ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-slate-200"}`}>
                    {plant.carpet_potential ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5 text-slate-400" />}
                    {plant.carpet_potential ? "Bisa" : "Tidak"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 GRID: Kontrol Pertumbuhan, Style & Tank (Rasio 3 : 3 : 6) */}
            <div className="grid lg:grid-cols-12 gap-4 mt-4 transition-colors">
              
              {/* KOTAK 1: Kontrol Pertumbuhan (Kolom 3) */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                <div className="flex flex-col items-center justify-center gap-1.5 mb-4 sm:flex-row">
                  <Activity className="h-4 w-4 text-teal-600 dark:text-teal-500 shrink-0"/>
                  {/* PENAMBAHAN TEXT-CENTER DI SINI */}
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center leading-tight">Kontrol<br className="hidden sm:block lg:hidden" /> Pertumbuhan</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col flex-1 justify-center items-center shadow-inner text-center transition-colors min-h-[70px]">
                  <span className="text-base font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-1.5">{plant.growth_control || "N/A"}</span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">{getIndoLevelDetail(plant.growth_control, "growth")}</span>
                </div>
              </div>

              {/* KOTAK 2: Gaya Aquascape (Kolom 3) */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                <div className="flex flex-col items-center justify-center gap-1.5 mb-4 sm:flex-row">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-500 shrink-0"/>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center leading-tight">Gaya<br className="hidden sm:block lg:hidden" /> Aquascape</p>
                </div>
                <div className="flex flex-col gap-3 flex-1 justify-center">
                  {plant.aquascape_style && plant.aquascape_style.length > 0 ? (
                    plant.aquascape_style.map(style => (
                      <div key={style} className="bg-slate-50 dark:bg-slate-950 px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col flex-1 shadow-inner items-center justify-center text-center transition-colors min-h-[70px]">
                        <span className="text-[14px] font-black text-gray-900 dark:text-slate-200 uppercase tracking-wider mb-1">{style}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{getStyleDesc(style)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col flex-1 shadow-inner items-center justify-center text-center transition-colors min-h-[70px]">
                      <span className="text-sm text-slate-500 italic">Cocok untuk gaya apapun.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KOTAK 3: Ukuran Aquarium (Kolom 6) */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                <div className="flex flex-col items-center justify-center gap-1.5 mb-4 sm:flex-row">
                  <Box className="h-4 w-4 text-orange-600 dark:text-orange-500 shrink-0"/>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide text-center leading-tight">Ukuran Aquarium</p>
                </div>
                <div className="flex flex-col gap-2 flex-1 justify-center">
                  {plant.tank_size_recommendation && plant.tank_size_recommendation.length > 0 ? (
                    plant.tank_size_recommendation.map(size => {
                      const details = getTankSizeDetails(size);
                      return (
                        <div 
                          key={size} 
                          className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-inner transition-colors"
                        >
                          <span className="text-[12px] font-black text-gray-900 dark:text-slate-200 uppercase tracking-wider shrink-0 mr-2">
                            {size}
                          </span>
                          <div className="flex items-center justify-end gap-1.5 sm:gap-2 text-right whitespace-nowrap">
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">📏 {details.size_cm}</span>
                            <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-medium">💧 {details.liter}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col flex-1 shadow-inner items-center justify-center text-center transition-colors">
                      <span className="text-sm text-slate-500 italic">Bebas semua ukuran.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ENSIKLOPEDIA BOTANI (Sesuai Gambar Referensi 1) */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl h-fit transition-colors">
              <CardContent className="p-8 space-y-10">
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors">
                    <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-500" /> Ensiklopedia Botani
                  </h3>

                  {plant.expert_notes && (
                    <div className="mb-6 bg-teal-50 dark:bg-teal-950/30 border-l-4 border-teal-500 p-5 rounded-r-xl shadow-sm transition-colors">
                      <h4 className="text-sm font-bold text-teal-800 dark:text-teal-400 flex items-center gap-2 mb-2 transition-colors">
                        <Brain className="h-4 w-4" /> Catatan Khusus Expert
                      </h4>
                      <p className="text-slate-700 dark:text-teal-100/80 text-sm leading-relaxed whitespace-pre-wrap italic transition-colors">
                        "{plant.expert_notes}"
                      </p>
                    </div>
                  )}

                  <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed text-justify whitespace-pre-line transition-colors">
                    {plant.description || "Belum ada deskripsi untuk tanaman ini."}
                  </p>
                </div>

                {/* PARAMETER LINGKUNGAN */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors">Kebutuhan Lingkungan Optimal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cahaya</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 transition-colors">
                        <span className="text-lg font-black text-gray-900 dark:text-slate-200 uppercase tracking-widest">{plant.light_requirement || "N/A"}</span>
                        <span className="text-[12px] text-yellow-600 dark:text-yellow-500/80 font-medium mt-0.5">({getIndoLevelCore(plant.light_requirement)})</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-600 dark:text-slate-400 leading-tight flex items-center justify-center h-full transition-colors">
                        💡 {getIndoLevelDetail(plant.light_requirement, "light")}
                      </div>
                    </div>
                    
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Wind className={`h-4 w-4 ${co2Status.variant === "danger" ? "text-red-500 dark:text-red-400" : co2Status.variant === "warning" ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Injeksi CO2</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 transition-colors">
                        <span className={`text-sm font-black uppercase tracking-widest ${co2Status.variant === "danger" ? "text-red-600 dark:text-red-400" : co2Status.variant === "warning" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {co2Status.label}
                        </span>
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">(Kebutuhan: {plant.co2_requirement || "Low"})</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-600 dark:text-slate-400 leading-tight flex items-center justify-center h-full transition-colors">
                         💡 {co2Status.variant === "danger" ? "Wajib pakai tabung CO2" : co2Status.variant === "warning" ? "Disarankan untuk tumbuh maksimal" : "Bisa hidup subur tanpa injeksi CO2"}
                      </div>
                    </div>

                    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suhu Air</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 transition-colors">
                        <span className="text-lg font-black text-gray-900 dark:text-slate-200 tracking-wider">
                          {plant.temperature_min && plant.temperature_max ? `${plant.temperature_min}–${plant.temperature_max}` : "N/A"}
                        </span>
                        <span className="text-[12px] text-orange-600 dark:text-orange-400/80 font-medium mt-0.5">Celcius (°C)</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-600 dark:text-slate-400 leading-tight flex items-center justify-center h-full transition-colors">
                        Suhu ideal untuk fotosintesis.
                      </div>
                    </div>

                    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <FlaskConical className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kadar pH</span>
                      </div>
                      <div className="flex flex-col border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 transition-colors">
                        <span className="text-lg font-black text-gray-900 dark:text-slate-200 tracking-wider">
                          {plant.ph_min && plant.ph_max ? `${plant.ph_min}–${plant.ph_max}` : "N/A"}
                        </span>
                        <span className="text-[12px] text-purple-600 dark:text-purple-400/80 font-medium mt-0.5">Asam - Basa</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 px-2 py-2 mt-3 text-[11px] text-slate-600 dark:text-slate-400 leading-tight flex items-center justify-center h-full transition-colors">
                        Tingkat keasaman air optimal.
                      </div>
                    </div>

                  </div>
                </div>

                {/* BAGIAN KARAKTERISTIK FISIK */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors">Profil Biologi Tambahan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between transition-colors">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <Droplets className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Pupuk</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex flex-col transition-colors">
                        <span className="text-base font-black text-gray-900 dark:text-slate-200 uppercase tracking-widest">{plant.fertilizer_requirement || "Unknown"}</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{getIndoLevelDetail(plant.fertilizer_requirement, "fert")}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between transition-colors">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <Leaf className="h-4 w-4 text-green-600 dark:text-green-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Kecepatan Tumbuh</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex flex-col transition-colors">
                        <span className="text-base font-black text-gray-900 dark:text-slate-200 uppercase tracking-widest">{plant.growth_rate || "Unknown"}</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{getIndoLevelDetail(plant.growth_rate, "growth")}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between transition-colors">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Tinggi Max</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex flex-col items-center justify-center h-full transition-colors">
                        <span className="text-lg font-black text-gray-900 dark:text-slate-200 block mt-1">{plant.max_height_cm ? `${plant.max_height_cm} cm` : "N/A"}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between transition-colors">
                      <div className="flex flex-col items-center justify-center mb-3">
                        <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider">Habitat Asli</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex flex-col items-center justify-center h-full transition-colors">
                        <span className="text-[14px] font-bold text-gray-900 dark:text-slate-200 block mt-1 leading-snug">{plant.origin_country || "Unknown"}</span>
                      </div>
                    </div>

                  </div>
                  
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6 transition-colors">
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                          <BookOpen className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-200">Sumber Referensi / Literatur</p>
                          <p className="text-xs text-slate-500 mt-0.5">Terverifikasi oleh Database AquaExpert</p>
                        </div>
                      </div>
                      
                      {plant.source_url ? (
                        <a 
                          href={plant.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full sm:w-auto bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Lihat Jurnal: {plant.source_name || "Link Eksternal"}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 transition-colors">Internal Knowledge Base</span>
                      )}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX FOTO */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onWheel={(e) => {
            if (e.deltaY < 0) setScale(s => Math.min(s + 0.25, 5));
            else setScale(s => Math.max(s - 0.25, 1));
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button onClick={closeLightbox} className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white transition-colors" title="Tutup (Esc)">
            <X className="h-6 w-6" />
          </button>

          {allImages.length > 1 && scale === 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-4 text-white/50 hover:bg-black/80 hover:text-white border border-white/10 transition-all active:scale-95 hidden sm:block" title="Sebelumnya (Kiri)">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-4 text-white/50 hover:bg-black/80 hover:text-white border border-white/10 transition-all active:scale-95 hidden sm:block" title="Selanjutnya (Kanan)">
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div 
            className={`relative flex h-full w-full items-center justify-center ${scale > 1 ? 'overflow-hidden' : ''}`}
            onClick={(e) => {
              if (hasDragged) return;
              if (e.target === e.currentTarget && scale === 1) closeLightbox();
            }}
            onMouseDown={(e) => {
              if (scale > 1) {
                e.preventDefault(); setIsDragging(true); setHasDragged(false);
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                setClickStartPos({ x: e.clientX, y: e.clientY });
              }
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              const moveDist = Math.hypot(e.clientX - clickStartPos.x, e.clientY - clickStartPos.y);
              if (moveDist > 5) setHasDragged(true); 
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
              <p className="absolute bottom-10 text-white/80 text-sm font-medium tracking-wide animate-in fade-in duration-300 bg-black/60 px-6 py-2 rounded-full pointer-events-none hidden sm:block">
                Gunakan panah ◀ / ▶ atau geser untuk berpindah
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}