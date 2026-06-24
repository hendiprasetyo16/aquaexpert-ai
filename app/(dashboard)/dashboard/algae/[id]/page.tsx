// app/(dashboard)/dashboard/algae/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAlgaeList } from "@/features/algae/repositories/algae.repository";
import { Algae } from "@/features/algae/types/algae.types";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { useLanguage } from "@/providers/LanguageProvider";

import { 
  Loader2, ArrowLeft, ArrowRight, Edit, CheckCircle2, Maximize2, X, ImageIcon,
  ChevronLeft, ChevronRight, Share2, Link as LinkIcon, Check, Bug, AlertTriangle, Info, Skull, Tags
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { getAlgaeDifficultyDesc, getAlgaeTagDesc } from "@/features/algae/components/algae-helpers";

export default function AlgaeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  
  const [algae, setAlgae] = useState<Algae | null>(null);
  const [allAlgaeList, setAllAlgaeList] = useState<Algae[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [copied, setCopied] = useState(false);
  const [prevAlgaeId, setPrevAlgaeId] = useState<string | null>(null);
  const [nextAlgaeId, setNextAlgaeId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalAlgae, setTotalAlgae] = useState<number>(0);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const allImages = [algae?.image_url, ...(algae?.gallery_urls || [])].filter(Boolean) as string[];
  
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
          const supabase = createClient();
          const [algaeRes, allAlgaeData] = await Promise.all([
            supabase.from("algae").select("*").eq("id", params.id as string).single(),
            getAlgaeList()
          ]);
          
          setAlgae(algaeRes.data);
          setAllAlgaeList(allAlgaeData || []);

          if (allAlgaeData && allAlgaeData.length > 0) {
            setTotalAlgae(allAlgaeData.length);
            const index = allAlgaeData.findIndex(a => a.id === params.id);
            if (index !== -1) {
              setCurrentIndex(index + 1);
              setPrevAlgaeId(index > 0 ? allAlgaeData[index - 1].id : null);
              setNextAlgaeId(index < allAlgaeData.length - 1 ? allAlgaeData[index + 1].id : null);
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
    if (!algae) return;
    const shareName = language === 'en' && algae.name_en ? algae.name_en : algae.name_id;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AquaExpert: ${shareName}`,
          text: language === 'id' ? `Lihat info hama ${shareName} di AquaExpert!` : `Check out ${shareName} on AquaExpert!`,
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

  // --- LIGHTBOX LOGIC ---
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

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" /></div>;
  if (!algae) return <div className="text-center mt-20 text-slate-500 dark:text-slate-400">Data alga tidak ditemukan atau telah dinonaktifkan.</div>;

  const displayName = language === 'en' && algae.name_en ? algae.name_en : algae.name_id;
  const displayDesc = language === 'en' && algae.description_en ? algae.description_en : algae.description_id;
  const causes = language === 'en' && algae.causes_en?.length ? algae.causes_en : algae.causes_id || [];
  const solutions = language === 'en' && algae.solutions_en?.length ? algae.solutions_en : algae.solutions_id || [];

  const formDict = dict.algaeExpert?.algaeForm;

  // Helper Deskripsi Tambahan Severity
  const getSeverityHelper = (severity: number) => {
    if (severity >= 4) return language === 'id' ? "(Sangat Berbahaya)" : "(Highly Dangerous)";
    if (severity === 3) return language === 'id' ? "(Butuh Perhatian)" : "(Needs Attention)";
    return language === 'id' ? "(Mudah Ditangani)" : "(Easy to Handle)";
  };

  const relatedAlgae = allAlgaeList
    .filter(a => a.id !== algae.id && a.is_active)
    .map(a => {
      let score = 0;
      if (a.location_tags?.some(tag => algae.location_tags?.includes(tag))) score += 2;
      if (a.trigger_tags?.some(tag => algae.trigger_tags?.includes(tag))) score += 2;
      if (a.color_tags?.some(tag => algae.color_tags?.includes(tag))) score += 1;
      return { ...a, similarityScore: score };
    })
    .filter(a => a.similarityScore >= 1) 
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10 space-y-6 transition-colors duration-300">
        
        {/* NAVIGASI ATAS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              <Button 
                variant="outline" 
                onClick={() => {
                  if (window.history.length > 2) { router.back(); } 
                  else { router.push("/dashboard/algae"); }
                }} 
                className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> {language === 'id' ? "Kembali" : "Back"}
              </Button>
              
              <div className="flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden transition-colors">
                <Button variant="ghost" disabled={!prevAlgaeId} onClick={() => prevAlgaeId && router.push(`/dashboard/algae/${prevAlgaeId}`)} className="rounded-none border-r border-slate-300 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" disabled={!nextAlgaeId} onClick={() => nextAlgaeId && router.push(`/dashboard/algae/${nextAlgaeId}`)} className="rounded-none hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {totalAlgae > 0 && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700/50 w-full sm:w-auto text-center transition-colors">
                {language === 'id' ? "Data" : "Data"} <strong className="text-gray-900 dark:text-slate-200">{currentIndex}</strong> / <strong className="text-gray-900 dark:text-slate-200">{totalAlgae}</strong>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {role !== "user" && (
              <Link href={`/dashboard/algae/${algae.id}/edit`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/10 dark:shadow-teal-900/20 active:scale-95 transition-all">
                  <Edit className="mr-2 h-4 w-4" /> {language === 'id' ? "Edit Alga" : "Edit Algae"}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* KOLOM KIRI: FOTO & GALERI */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl transition-colors">
              <div 
                className={`h-72 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group transition-colors ${algae.image_url ? 'cursor-pointer' : ''}`}
                onClick={() => algae.image_url && openLightbox(algae.image_url)}
              >
                {algae.image_url ? (
                  <>
                    <Image src={algae.image_url} alt={`Cover ${displayName}`} fill priority sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                      <Maximize2 className="h-10 w-10 text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-slate-200 uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" /> Cover
                    </div>
                  </>
                ) : (
                  <Bug className="h-20 w-20 text-slate-300 dark:text-slate-600" />
                )}
              </div>

              {algae.gallery_urls && algae.gallery_urls.length > 0 && (
                <div className={`grid gap-1 p-1 bg-slate-50 dark:bg-slate-950 transition-colors ${algae.gallery_urls.length > 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {algae.gallery_urls.map((url, idx) => (
                    <div key={idx} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800 transition-colors" onClick={() => openLightbox(url)}>
                      <Image src={url} alt={`Gallery ${idx + 1}`} fill sizes="(max-width: 768px) 25vw, 15vw" className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/20 transition-colors duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}

              <CardContent className="p-6 flex flex-col items-center text-center border-t border-slate-200 dark:border-slate-800 relative transition-colors">
                
                <div className="flex gap-2 justify-end w-full mb-2">
                   <button onClick={handleShare} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-md transition-colors">
                     <Share2 className="h-4 w-4" />
                   </button>
                   <button onClick={handleCopyLink} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-md transition-colors">
                     {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                   </button>
                </div>

                <h1 className="text-3xl font-extrabold text-teal-700 dark:text-teal-400 tracking-tight leading-tight w-full px-2">{displayName}</h1>
                <p className="italic text-slate-500 dark:text-slate-400 mt-2 font-serif">{algae.scientific_name || (language === 'id' ? "Spesies tidak diketahui" : "Unknown species")}</p>
                
                {algae.alias && (
                  <span className="inline-block mt-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md text-sm font-bold border border-slate-200 dark:border-slate-700">
                    Alias: {algae.alias}
                  </span>
                )}

                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                  {/* TINGKAT KESULITAN */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[90px]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">{language === 'id' ? "Kesulitan" : "Difficulty"}</span>
                    <span className={`font-black uppercase text-sm text-center leading-tight ${algae.difficulty === 'Hard' ? 'text-red-600' : algae.difficulty === 'Medium' ? 'text-amber-600' : 'text-green-600'}`}>
                      {getAlgaeDifficultyDesc(algae.difficulty, language)}
                    </span>
                  </div>
                  
                  {/* TINGKAT BAHAYA */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[90px]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">{language === 'id' ? "Tingkat Bahaya" : "Severity"}</span>
                    <span className={`font-black uppercase text-sm flex items-center gap-1 ${algae.severity >= 4 ? 'text-red-600' : algae.severity === 3 ? 'text-amber-600' : 'text-green-600'}`}>
                      {algae.severity >= 4 ? <Skull className="w-3 h-3" /> : algae.severity === 3 ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      Level {algae.severity} / 5
                    </span>
                    <span className={`text-[10px] mt-1 text-center leading-tight font-medium ${algae.severity >= 4 ? 'text-red-500/80' : algae.severity === 3 ? 'text-amber-500/80' : 'text-green-600/80'}`}>
                      {getSeverityHelper(algae.severity)}
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* RELATED ALGAE CARD (DENGAN EFEK NEON) */}
            {relatedAlgae.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl overflow-hidden mt-6 transition-colors">
                <div className="bg-slate-50 dark:bg-slate-900/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-colors">
                  <Bug className="h-5 w-5 text-teal-600 dark:text-teal-500" />
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-slate-200 uppercase tracking-wider">{language === 'id' ? "Alga Serupa" : "Related Algae"}</h3>
                </div>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 gap-4">
                    {relatedAlgae.map(related => {
                      const relatedName = language === 'en' && related.name_en ? related.name_en : related.name_id;
                      return (
                      <Link href={`/dashboard/algae/${related.id}`} key={related.id}>
                        {/* EFEK NEON DITAMBAHKAN DI SINI */}
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 p-2.5 rounded-lg transition-all duration-300 cursor-pointer relative overflow-hidden group">
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-500/20 group-hover:bg-teal-500/50 transition-colors"></div>
                          <div className="h-16 w-16 relative rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                            {related.image_url ? (
                              <Image src={related.image_url} alt={relatedName} fill sizes="64px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600">
                                <Bug className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <p className="font-bold text-gray-900 dark:text-slate-200 text-sm truncate">{relatedName}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                               <span className="text-[9px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-900/50 uppercase font-semibold">Lvl {related.severity}</span>
                               {related.alias && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 uppercase font-semibold">{related.alias}</span>}
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
            
            {algae.severity >= 4 && (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-4 transition-colors">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full shrink-0 mt-0.5 transition-colors">
                  <Skull className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800 dark:text-red-300">{language === 'id' ? "Peringatan Ekosistem" : "Ecosystem Warning"}</h4>
                  <p className="text-[13px] text-red-700 dark:text-red-400/90 mt-1 leading-relaxed">
                    {language === 'id' ? "Alga ini tergolong sangat invasif dan dapat merusak ekosistem akuarium jika tidak segera ditangani. Segera lakukan tindakan pencegahan." : "This algae is highly invasive and can destroy the aquarium ecosystem if left untreated. Take action immediately."}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900/80 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">{language === 'id' ? "Deskripsi Alga" : "Algae Description"}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap">
                {displayDesc || (language === 'id' ? "Deskripsi belum tersedia." : "Description not available.")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* PENYEBAB */}
              <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                <h3 className="font-bold text-amber-800 dark:text-amber-500 mb-4 flex items-center gap-2 border-b border-amber-200 dark:border-amber-900/50 pb-2">
                  <AlertTriangle className="h-5 w-5" /> {language === 'id' ? "Penyebab Tumbuh" : "Root Causes"}
                </h3>
                <ul className="space-y-3 pl-1">
                  {causes.length > 0 ? causes.map((c, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-amber-500 mr-2.5 font-bold mt-0.5">•</span> 
                      <span className="leading-snug">{c}</span>
                    </li>
                  )) : <li className="text-sm text-slate-500 italic">-</li>}
                </ul>
              </div>

              {/* SOLUSI */}
              <div className="bg-teal-50 dark:bg-teal-950/20 p-5 rounded-xl border border-teal-200 dark:border-teal-900/50 shadow-sm">
                <h3 className="font-bold text-teal-800 dark:text-teal-500 mb-4 flex items-center gap-2 border-b border-teal-200 dark:border-teal-900/50 pb-2">
                  <CheckCircle2 className="h-5 w-5" /> {language === 'id' ? "Cara Mengatasi" : "Treatment Solutions"}
                </h3>
                <ul className="space-y-3 pl-1">
                  {solutions.length > 0 ? solutions.map((s, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-teal-500 mr-2.5 font-bold mt-0.5">✓</span> 
                      <span className="leading-snug">{s}</span>
                    </li>
                  )) : <li className="text-sm text-slate-500 italic">-</li>}
                </ul>
              </div>
            </div>

            {/* AI EXPERT TAGS */}
            <div className="bg-white dark:bg-slate-900/80 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mt-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Tags className="h-5 w-5 text-teal-600 dark:text-teal-500" /> {language === 'id' ? "Tag Identifikasi AI" : "AI Identification Tags"}
                </h3>
                {formDict?.expertEngineHint && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formDict.expertEngineHint}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase">{language === 'id' ? "Warna" : "Colors"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {algae.color_tags && algae.color_tags.length > 0 ? algae.color_tags.map(t => (
                      <span key={t} className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{getAlgaeTagDesc(t, language)}</span>
                    )) : <span className="text-xs italic text-slate-400">-</span>}
                  </div>
                </div>
                
                <div>
                  <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase">{language === 'id' ? "Tekstur" : "Textures"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {algae.texture_tags && algae.texture_tags.length > 0 ? algae.texture_tags.map(t => (
                      <span key={t} className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{getAlgaeTagDesc(t, language)}</span>
                    )) : <span className="text-xs italic text-slate-400">-</span>}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase">{language === 'id' ? "Lokasi Tumbuh" : "Locations"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {algae.location_tags && algae.location_tags.length > 0 ? algae.location_tags.map(t => (
                      <span key={t} className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{getAlgaeTagDesc(t, language)}</span>
                    )) : <span className="text-xs italic text-slate-400">-</span>}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase">{language === 'id' ? "Pemicu" : "Triggers"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {algae.trigger_tags && algae.trigger_tags.length > 0 ? algae.trigger_tags.map(t => (
                      <span key={t} className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{getAlgaeTagDesc(t, language)}</span>
                    )) : <span className="text-xs italic text-slate-400">-</span>}
                  </div>
                </div>

                {/* --- BLOK BARU: AFFECTED CONDITIONS --- */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                  <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">
                    {language === 'id' ? "Dampak Ekosistem" : "Affected Ecosystem"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2 leading-tight">
                    {language === 'id' ? "Kerusakan sekunder yang diakibatkan oleh alga ini." : "Secondary damages caused by this algae."}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {algae.affected_conditions && algae.affected_conditions.length > 0 ? algae.affected_conditions.map(t => (
                      <span key={t} className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-medium text-xs px-2.5 py-1 rounded border border-rose-200 dark:border-rose-800/60 shadow-sm">
                        {getAlgaeTagDesc(t, language)}
                      </span>
                    )) : <span className="text-xs italic text-slate-400">-</span>}
                  </div>
                </div>
                {/* ------------------------------------- */}

              </div>
            </div>

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
                {language === 'en' ? "Use arrows ◀ / ▶ or drag to navigate" : "Gunakan panah ◀ / ▶ atau geser untuk berpindah"}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}