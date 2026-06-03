"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlantById } from "@/features/plants/repositories/plant.repository";
import { Plant } from "@/features/plants/types/plant.types";
import { useAuth } from "@/hooks/useAuth";

import { Loader2, ArrowLeft, Leaf, Edit, Droplets, Wind, Sun, Thermometer, FlaskConical, MapPin, Ruler, CheckCircle2, Maximize2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

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

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  }

  if (!plant) {
    return <div className="text-center mt-20 text-slate-400">Data tanaman tidak ditemukan atau telah dinonaktifkan.</div>;
  }

  return (
    <>
      <div className="max-w-5xl space-y-6 pb-10">
        <div className="flex items-center justify-between">
          {/* PERBAIKAN: Tambahkan active:scale-95 dan active:bg-slate-700 agar terasa "diklik" */}
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

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/60 md:col-span-1 overflow-hidden h-fit">
            <div 
              className={`h-72 w-full bg-slate-800 flex items-center justify-center relative group ${plant.image_url ? 'cursor-pointer' : ''}`}
              onClick={() => plant.image_url && setIsImageZoomed(true)}
            >
              {plant.image_url ? (
                <>
                  <img src={plant.image_url} alt={plant.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <Maximize2 className="h-10 w-10 text-white drop-shadow-md" />
                  </div>
                </>
              ) : (
                <Leaf className="h-16 w-16 text-slate-600" />
              )}
            </div>

            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold text-teal-400">{plant.name}</h1>
              <p className="italic text-slate-400">{plant.scientific_name || "-"}</p>
              <div className="mt-4 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                {plant.difficulty} | {plant.placement}
              </div>
              
              {plant.recommended_for && plant.recommended_for.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {plant.recommended_for.map(tag => (
                    <span key={tag} className="flex items-center gap-1 rounded bg-teal-950/30 px-2 py-1 text-[10px] font-medium text-teal-400 border border-teal-900/50">
                      <CheckCircle2 className="h-3 w-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 md:col-span-2">
            <CardContent className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2 border-b border-slate-800 pb-2">Deskripsi</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {plant.description || "Belum ada deskripsi untuk tanaman ini."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-800 pb-2">Kebutuhan Parameter Air</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <div><span className="block text-xs text-slate-500">Cahaya</span>{plant.light_requirement || "-"}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <Wind className="h-5 w-5 text-blue-400" />
                    <div><span className="block text-xs text-slate-500">CO2</span>{plant.co2_requirement || "-"}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <Thermometer className="h-5 w-5 text-orange-500" />
                    <div><span className="block text-xs text-slate-500">Suhu (°C)</span>{plant.temperature_min ?? "-"} - {plant.temperature_max ?? "-"}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <FlaskConical className="h-5 w-5 text-purple-400" />
                    <div><span className="block text-xs text-slate-500">pH</span>{plant.ph_min ?? "-"} - {plant.ph_max ?? "-"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-800 pb-2">Karakteristik & Sumber</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-500"/> <span className="text-slate-400">Nutrisi:</span> {plant.fertilizer_requirement || "-"}</div>
                  <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-500"/> <span className="text-slate-400">Growth:</span> {plant.growth_rate || "-"}</div>
                  <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-slate-300"/> <span className="text-slate-400">Max T:</span> {plant.max_height_cm ? `${plant.max_height_cm} cm` : "-"}</div>
                  <div className="flex items-center gap-2 col-span-2"><MapPin className="h-4 w-4 text-red-400"/> <span className="text-slate-400">Asal Negara:</span> {plant.origin_country || "Global"}</div>
                  <div className="flex items-center gap-2 col-span-3 border-t border-slate-800 pt-2"><span className="text-slate-400 text-xs">Sumber Data:</span> <span className="text-xs italic text-slate-500">{plant.source_name || "Database AquaExpert"}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL LIGHTBOX */}
      {isImageZoomed && plant.image_url && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setIsImageZoomed(false)}
        >
          {/* PERBAIKAN: Tombol X dibuat FIXED di pojok kanan atas layar */}
          <button 
            className="fixed top-6 right-6 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 border border-slate-700 shadow-xl transition-all hover:bg-red-500 hover:text-white hover:border-red-400 active:scale-95 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Mencegah bentrok klik dengan background
              setIsImageZoomed(false);
            }}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative flex flex-col items-center">
            <img 
              src={plant.image_url} 
              alt={plant.name} 
              className="max-h-[85vh] w-auto max-w-full rounded-lg shadow-2xl object-contain border border-white/10" 
            />
            <p className="mt-6 text-white text-lg font-semibold tracking-wide">{plant.name}</p>
          </div>
        </div>
      )}
    </>
  );
}