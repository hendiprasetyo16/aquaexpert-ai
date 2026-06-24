// app/(dashboard)/dashboard/fishes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFishById, getFishes } from "@/features/fishes/repositories/fish.repository";
import { Fish as FishType } from "@/features/fishes/types/fish.types";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";

import { 
  Loader2, ArrowLeft, ArrowRight, Fish, Edit, Droplets, Thermometer, MapPin, 
  Ruler, CheckCircle2, Maximize2, X, Info, ImageIcon, ChevronLeft, ChevronRight, 
  Brain, ShieldCheck, Activity, Target, Box, BookOpen, Share2, Link as LinkIcon, 
  Check, CheckSquare, Waves, AlertTriangle, Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// IMPORT FISH HELPERS
import { 
  getDifficultyDesc, getDifficultySubtitle, getFishTypeDesc, 
  getCompatibilityDesc, getCompatibilityBadgeStyle, 
  getSchoolingDesc, formatTankSize, formatWaterParams
} from "@/features/fishes/components/fish-helpers";

// INTERFACE KAMUS FISH DETAIL
interface FishDetailDict {
  btnBack: string;
  tooltipPrev: string;
  tooltipNext: string;
  fishLabel: string;
  of: string;
  btnEdit: string;
  btnShare: string;
  btnCopyLink: string;
  noScientificName: string;
  famLabel: string;
  waterReqTitle: string;
  tempTitle: string;
  phTitle: string;
  tankMinTitle: string;
  adultSizeTitle: string;
  schoolingTitle: string;
  bioloadTitle: string;
  encyclopediaTitle: string;
  expertNotesTitle: string;
  noDesc: string;
  warningPredator: string;
  warningPredatorDesc: string;
  relatedFishesTitle: string;
}

export default function FishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  
  const [fish, setFish] = useState<FishType | null>(null);
  const [allFishesList, setAllFishesList] = useState<FishType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [copied, setCopied] = useState(false);
  const [prevFishId, setPrevFishId] = useState<string | null>(null);
  const [nextFishId, setNextFishId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalFishes, setTotalFishes] = useState<number>(0);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allImages = [fish?.image_url, ...(fish?.gallery_urls || [])].filter(Boolean) as string[];
  
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
          const [fishData, allFishes] = await Promise.all([
            getFishById(params.id as string),
            getFishes()
          ]);
          setFish(fishData);
          setAllFishesList(allFishes || []);

          if (allFishes && allFishes.length > 0) {
            setTotalFishes(allFishes.length);
            const index = allFishes.findIndex(p => p.id === params.id);
            if (index !== -1) {
              setCurrentIndex(index + 1);
              setPrevFishId(index > 0 ? allFishes[index - 1].id : null);
              setNextFishId(index < allFishes.length - 1 ? allFishes[index + 1].id : null);
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
    if (!fish) return;
    const shareName = language === 'en' && fish.name_en ? fish.name_en : fish.name_id;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AquaExpert: ${shareName}`,
          text: language === 'id' ? `Lihat data ${shareName} di AquaExpert!` : `Check out ${shareName} on AquaExpert!`,
          url: window.location.href,
        });
      } catch (err) {}
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

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" /></div>;
  if (!fish) return <div className="text-center mt-20 text-slate-500 dark:text-slate-400">{language === 'id' ? "Data ikan tidak ditemukan." : "Fish data not found."}</div>;

  // DICTIONARY RESOLVER
  const rootDict = dict as unknown as { fishDetail: FishDetailDict };
  const detailDict = rootDict.fishDetail;
  if (!detailDict) return null;

  const displayName = language === 'en' && fish.name_en ? fish.name_en : fish.name_id;
  const displayDesc = language === 'en' && fish.description_en ? fish.description_en : fish.description_id;
  const displayExpertNotes = language === 'en' && fish.expert_notes_en ? fish.expert_notes_en : fish.expert_notes_id;

  const relatedFishes = allFishesList
    .filter(p => p.id !== fish.id && p.is_active)
    .map(p => {
      let score = 0;
      if (p.fish_type === fish.fish_type) score += 4;
      if (p.compatibility === fish.compatibility) score += 3;
      if (p.difficulty === fish.difficulty) score += 2;
      return { ...p, similarityScore: score };
    })
    .filter(p => p.similarityScore >= 3) 
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10 space-y-6 transition-colors duration-300">
        
        {/* TOP NAVIGATION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (window.history.length > 2) { router.back(); } 
                  else { router.push("/dashboard/fishes"); }
                }} 
                className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> {detailDict.btnBack}
              </Button>
              
              <div className="flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden transition-colors">
                <Button variant="ghost" disabled={!prevFishId} onClick={() => prevFishId && router.push(`/dashboard/fishes/${prevFishId}`)} title={detailDict.tooltipPrev} className="rounded-none border-r border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" disabled={!nextFishId} onClick={() => nextFishId && router.push(`/dashboard/fishes/${nextFishId}`)} title={detailDict.tooltipNext} className="rounded-none hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {totalFishes > 0 && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700/50 w-full sm:w-auto text-center transition-colors">
                {detailDict.fishLabel} <strong className="text-gray-900 dark:text-slate-200">{currentIndex}</strong> {detailDict.of} <strong className="text-gray-900 dark:text-slate-200">{totalFishes}</strong>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {role !== "user" && (
              <Link href={`/dashboard/fishes/${fish.id}/edit`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/10 dark:shadow-blue-900/20 active:scale-95 transition-all">
                  <Edit className="mr-2 h-4 w-4" /> {detailDict.btnEdit}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* KOLOM KIRI (Visual & Info Cepat) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl transition-colors">
              
              {/* GAMBAR UTAMA */}
              <div 
                className={`h-72 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group transition-colors ${fish.image_url ? 'cursor-pointer' : ''}`}
                onClick={() => fish.image_url && openLightbox(fish.image_url)}
              >
                {fish.image_url ? (
                  <>
                    <Image src={fish.image_url} alt={`Cover ${displayName}`} fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                      <Maximize2 className="h-10 w-10 text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                    
                    {/* Badge Compatibility di dalam Foto */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/90 shadow-sm ${getCompatibilityBadgeStyle(fish.compatibility)}`}>
                      {getCompatibilityDesc(fish.compatibility, language as "id" | "en")}
                    </div>
                  </>
                ) : (
                  <Fish className="h-20 w-20 text-slate-300 dark:text-slate-600" />
                )}
              </div>

              {/* GALERI */}
              {fish.gallery_urls && fish.gallery_urls.length > 0 && (
                <div className={`grid gap-1 p-1 bg-slate-50 dark:bg-slate-950 transition-colors ${fish.gallery_urls.length > 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {fish.gallery_urls.map((url, idx) => (
                    <div key={idx} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800 transition-colors" onClick={() => openLightbox(url)}>
                      <Image src={url} alt={`Gallery ${idx + 1}`} fill sizes="(max-width: 768px) 25vw, 15vw" className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition-colors duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}

              <CardContent className="p-6 flex flex-col items-center text-center border-t border-slate-200 dark:border-slate-800 relative transition-colors">
                
                {/* SHARE & COPY */}
                <div className="flex gap-2 justify-end w-full mb-2">
                   <button onClick={handleShare} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors" title={detailDict.btnShare}>
                     <Share2 className="h-4 w-4" />
                   </button>
                   <button onClick={handleCopyLink} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors" title={detailDict.btnCopyLink}>
                     {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                   </button>
                </div>

                <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight leading-tight w-full px-2">{displayName}</h1>
                <p className="italic text-slate-500 dark:text-slate-400 mt-2 font-serif">{fish.scientific_name || detailDict.noScientificName}</p>
                
                <div className="mt-6 flex flex-col items-center justify-center gap-3 w-full">
                  
                  {/* BADGE TIPE IKAN */}
                  <div className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 w-full sm:w-auto transition-colors">
                    <span className="text-base font-black uppercase text-blue-700 dark:text-blue-400 text-center">
                      {detailDict.famLabel} {getFishTypeDesc(fish.fish_type, language as "id" | "en")}
                    </span>
                  </div>
                  
                  {/* BADGE KESULITAN & SIFAT */}
                  <div className="flex flex-row gap-3 w-full justify-center">
                    <div className={`flex flex-col items-center justify-center flex-1 max-w-[150px] px-2 py-2 rounded-lg border shadow-sm transition-colors ${
                      fish.difficulty?.toLowerCase() === 'easy' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50' :
                      fish.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50' :
                      fish.difficulty?.toLowerCase() === 'hard' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' :
                      'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}>
                      <span className={`text-sm font-black uppercase text-center transition-colors ${
                        fish.difficulty?.toLowerCase() === 'easy' ? 'text-green-700 dark:text-green-400' :
                        fish.difficulty?.toLowerCase() === 'medium' ? 'text-yellow-700 dark:text-yellow-400' :
                        fish.difficulty?.toLowerCase() === 'hard' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {getDifficultyDesc(fish.difficulty, language as "id" | "en").split(" ")[0]}
                      </span>
                      <span className="text-[10px] opacity-80 font-medium text-center mt-1">
                        {getDifficultySubtitle(fish.difficulty, language as "id" | "en")}
                      </span>
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>

            {/* RELATED FISHES */}
            {relatedFishes.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl overflow-hidden mt-6 transition-colors">
                <div className="bg-slate-50 dark:bg-slate-900/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-colors">
                  <Fish className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-slate-200 uppercase tracking-wider">{detailDict.relatedFishesTitle}</h3>
                </div>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 gap-4">
                    {relatedFishes.map(related => {
                      const relatedName = language === 'en' && related.name_en ? related.name_en : related.name_id;
                      return (
                      <Link href={`/dashboard/fishes/${related.id}`} key={related.id}>
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-900/50 p-2.5 rounded-lg transition-colors cursor-pointer relative overflow-hidden group">
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500/20 group-hover:bg-blue-500/50 transition-colors"></div>
                          <div className="h-16 w-16 relative rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                            {related.image_url ? (
                              <Image src={related.image_url} alt={relatedName} fill sizes="64px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600">
                                <Fish className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <p className="font-bold text-gray-900 dark:text-slate-200 text-sm truncate">{relatedName}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                               <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 uppercase font-semibold">
                                 {getFishTypeDesc(related.fish_type, language as "id" | "en").split(" ")[0]}
                               </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )})}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* KOLOM KANAN (DATA UTAMA) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ALERT JIKA AGGRESIF */}
            {fish.compatibility === "Aggressive" && (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-4 transition-colors">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full shrink-0 mt-0.5 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-300">{detailDict.warningPredator}</h4>
                  <p className="text-[13px] text-red-700 dark:text-red-400/90 mt-1 leading-relaxed">
                    {detailDict.warningPredatorDesc}
                  </p>
                </div>
              </div>
            )}

            {/* TABEL PARAMETER LINGKUNGAN */}
            <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="bg-slate-50 dark:bg-slate-950/50 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-slate-200 uppercase tracking-wider">{detailDict.waterReqTitle}</h3>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                  <Thermometer className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                  <p className="text-[11px] uppercase text-slate-500 font-bold mb-1">{detailDict.tempTitle}</p>
                  <span className="text-base font-black text-gray-900 dark:text-slate-200">
                    {formatWaterParams(fish.ideal_temp_min, fish.ideal_temp_max, "°C")}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                  <Droplets className="h-5 w-5 text-cyan-500 mx-auto mb-2" />
                  <p className="text-[11px] uppercase text-slate-500 font-bold mb-1">{detailDict.phTitle}</p>
                  <span className="text-base font-black text-gray-900 dark:text-slate-200">
                    {formatWaterParams(fish.ideal_ph_min, fish.ideal_ph_max, "pH")}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                  <Waves className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-[11px] uppercase text-slate-500 font-bold mb-1">{detailDict.tankMinTitle}</p>
                  <span className="text-base font-black text-gray-900 dark:text-slate-200">
                    {formatTankSize(fish.min_tank_size, language as "id" | "en")}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
                  <Ruler className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                  <p className="text-[11px] uppercase text-slate-500 font-bold mb-1">{detailDict.adultSizeTitle}</p>
                  <span className="text-base font-black text-gray-900 dark:text-slate-200">
                    {fish.estimated_adult_size_cm ? `${fish.estimated_adult_size_cm} cm` : "N/A"}
                  </span>
                </div>

              </div>
            </div>

            {/* FISH EXPERT INFO */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                <Users className="h-8 w-8 text-indigo-500 mb-3" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200 mb-1">{detailDict.schoolingTitle}</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {getSchoolingDesc(fish.schooling, fish.min_group_size, language as "id" | "en")}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                <Activity className="h-8 w-8 text-amber-500 mb-3" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200 mb-1">{detailDict.bioloadTitle}</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {fish.bioload_factor ? `${fish.bioload_factor} / 10` : "N/A"}
                </p>
              </div>
            </div>

            {/* DESKRIPSI & CATATAN PAKAR */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl h-fit transition-colors">
              <CardContent className="p-8 space-y-8">
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-500" /> {detailDict.encyclopediaTitle}
                  </h3>

                  {displayExpertNotes && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm transition-colors">
                      <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2 transition-colors">
                        <Brain className="h-4 w-4" /> {detailDict.expertNotesTitle}
                      </h4>
                      <p className="text-slate-700 dark:text-blue-100/80 text-sm leading-relaxed whitespace-pre-wrap italic transition-colors">
                        "{displayExpertNotes}"
                      </p>
                    </div>
                  )}

                  <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed text-justify whitespace-pre-line transition-colors">
                    {displayDesc || detailDict.noDesc}
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* LIGHTBOX UNTUK GALERI TETAP DIPERTAHANKAN */}
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
          <button onClick={closeLightbox} className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>

          {allImages.length > 1 && scale === 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-4 text-white/50 hover:bg-black/80 hover:text-white border border-white/10 transition-all active:scale-95 hidden sm:block">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-4 text-white/50 hover:bg-black/80 hover:text-white border border-white/10 transition-all active:scale-95 hidden sm:block">
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
          </div>
        </div>
      )}
    </>
  );
}