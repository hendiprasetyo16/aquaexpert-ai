"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlantById } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import { useAuth } from "@/hooks/useAuth";

import { 
  Loader2, ArrowLeft, Leaf, Edit, Droplets, Wind, Sun, 
  Thermometer, FlaskConical, MapPin, Ruler, CheckCircle2, Maximize2, X, Info, ImageIcon
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
  
  // STATE MODAL LIGHTBOX
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  // STATE UNTUK PAN & ZOOM
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); 
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickStartPos, setClickStartPos] = useState({ x: 0, y: 0 });

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

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const openLightbox = (url: string) => {
    setSelectedImageUrl(url);
    setIsImageModalOpen(true);
  };

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
          <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white active:scale-95 active:bg-slate-700 transition-all"
          >
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
            
            {/* KARTU VISUAL (COVER + GALLERY) */}
            <Card className="border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              {/* COVER IMAGE UTAMA */}
              <div 
                className={`h-72 w-full bg-slate-800 flex items-center justify-center relative group ${plant.image_url ? 'cursor-pointer' : ''}`}
                onClick={() => plant.image_url && openLightbox(plant.image_url)}
              >
                {plant.image_url ? (
                  <>
                    <img src={plant.image_url} alt={`Cover ${plant.name}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
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

              {/* THUMBNAIL GALERI (MAKS 3) */}
              {plant.gallery_urls && plant.gallery_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950">
                  {plant.gallery_urls.slice(0, 3).map((url, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm bg-slate-800"
                      onClick={() => openLightbox(url)}
                    >
                      <img src={url} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
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
                        <span key={tag} className="flex items-center gap-1.5 rounded-md bg-teal-950/30 px-2.5 py-1.5 text-[11px] font-medium text-teal-300 border border-teal-900/50">
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
          <Card className="border-slate-800 bg-slate-900/60 lg:col-span-8 shadow-xl h-fit">
            <CardContent className="p-8 space-y-10">
              
              {/* BAGIAN DESKRIPSI BOTANI */}
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Info className="h-5 w-5 text-teal-500" /> Ensiklopedia Tanaman
                </h3>
                <p className="text-slate-300 text-[15px] leading-relaxed text-justify bg-slate-950/50 p-5 rounded-xl border border-slate-800/50">
                  {plant.description || "Belum ada deskripsi untuk tanaman ini."}
                </p>
              </div>

              {/* BAGIAN PARAMETER LINGKUNGAN (AIR & CAHAYA) */}
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">Parameter Air Optimal</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-teal-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <span className="text-xs font-semibold text-slate-400 uppercase">Cahaya</span>
                    </div>
                    <span className="text-base font-medium text-slate-200">{plant.light_requirement || "N/A"}</span>
                  </div>
                  
                  <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-teal-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="h-5 w-5 text-blue-400" />
                      <span className="text-xs font-semibold text-slate-400 uppercase">Kebutuhan CO2</span>
                    </div>
                    <span className="text-base font-medium text-slate-200">{plant.co2_requirement || "N/A"}</span>
                  </div>

                  <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-teal-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span className="text-xs font-semibold text-slate-400 uppercase">Suhu Air</span>
                    </div>
                    <span className="text-base font-medium text-slate-200">
                      {plant.temperature_min && plant.temperature_max ? `${plant.temperature_min}° - ${plant.temperature_max}°C` : "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-teal-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FlaskConical className="h-5 w-5 text-purple-400" />
                      <span className="text-xs font-semibold text-slate-400 uppercase">Kadar pH</span>
                    </div>
                    <span className="text-base font-medium text-slate-200">
                      {plant.ph_min && plant.ph_max ? `${plant.ph_min} - ${plant.ph_max}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* BAGIAN KARAKTERISTIK FISIK & SUMBER */}
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">Profil Biologi</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                  
                  <div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Droplets className="h-3.5 w-3.5"/> Serapan Nutrisi</span>
                    <span className="font-medium text-slate-300">{plant.fertilizer_requirement || "Unknown"}</span>
                  </div>
                  
                  <div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Leaf className="h-3.5 w-3.5"/> Laju Pertumbuhan</span>
                    <span className="font-medium text-slate-300">{plant.growth_rate || "Unknown"}</span>
                  </div>
                  
                  <div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Ruler className="h-3.5 w-3.5"/> Tinggi Maksimal</span>
                    <span className="font-medium text-slate-300">{plant.max_height_cm ? `${plant.max_height_cm} cm` : "Unknown"}</span>
                  </div>
                  
                  <div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><MapPin className="h-3.5 w-3.5"/> Habitat Asli</span>
                    <span className="font-medium text-slate-300">{plant.origin_country || "Cosmopolitan / Unknown"}</span>
                  </div>

                </div>
                
                {/* SUMBER REFERENSI */}
                <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Data di-verifikasi oleh Knowledge Base AquaExpert
                  </span>
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

      {/* MODAL LIGHTBOX DENGAN FITUR PAN & SCROLL ZOOM (TETAP SAMA) */}
      {isImageModalOpen && selectedImageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 overflow-hidden select-none backdrop-blur-sm"
          onClick={() => {
            setIsImageModalOpen(false);
            resetZoom();
          }}
        >
          <button 
            className="fixed top-6 right-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 border border-slate-700 shadow-xl transition-all hover:bg-red-500 hover:text-white hover:border-red-400 active:scale-95 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); 
              setIsImageModalOpen(false);
              resetZoom();
            }}
          >
            <X className="h-6 w-6" />
          </button>

          <div 
            className="relative flex items-center justify-center w-full h-full"
            onClick={(e) => {
              e.stopPropagation();
              if (!hasDragged) {
                if (scale > 1) {
                  resetZoom();
                } else {
                  setScale(2.5);
                }
              }
            }}
            onWheel={(e) => {
              e.stopPropagation();
              const zoomSensitivity = 0.15;
              const delta = e.deltaY < 0 ? zoomSensitivity : -zoomSensitivity;
              const newScale = Math.max(1, Math.min(scale + delta, 5));
              setScale(newScale);
              if (newScale === 1) setPosition({ x: 0, y: 0 });
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault(); 
              setIsDragging(true);
              setHasDragged(false);
              setClickStartPos({ x: e.clientX, y: e.clientY });
              setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              e.stopPropagation();
              if (Math.abs(e.clientX - clickStartPos.x) > 5 || Math.abs(e.clientY - clickStartPos.y) > 5) {
                setHasDragged(true); 
              }
              setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
              });
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              setIsDragging(false);
            }}
            onMouseLeave={(e) => {
              if (isDragging) {
                e.stopPropagation();
                setIsDragging(false);
              }
            }}
          >
            <img 
              src={selectedImageUrl} 
              alt="Detail Gambar" 
              draggable={false} 
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in')
              }}
              className="max-h-[85vh] w-auto max-w-[95vw] rounded-lg shadow-2xl object-contain border border-white/10" 
            />
            
            {scale === 1 && (
              <p className="absolute bottom-10 text-white/80 text-sm font-medium tracking-wide animate-in fade-in duration-300 bg-black/60 px-6 py-2 rounded-full pointer-events-none border border-white/10">
                Sekali Klik untuk Zoom | Scroll Mouse | Klik & Geser
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}