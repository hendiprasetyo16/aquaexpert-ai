"use client";

import { Plant } from "../types/plant.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Sun, Wind, Droplets, Edit } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const { role } = useAuth(); 

  return (
    <Card className="group relative overflow-hidden border-slate-800 bg-slate-900/60 transition-all duration-300 hover:border-teal-700 hover:shadow-lg hover:shadow-teal-900/20">

      {/* TOMBOL EDIT KECIL DI POJOK KANAN ATAS (Hanya untuk Admin/Super Admin) */}
      {role !== "user" && (
        <Link
          href={`/dashboard/plants/${plant.id}/edit`}
          className="absolute right-3 top-3 z-20 rounded-lg bg-teal-600 p-2 text-white opacity-0 transition-all hover:bg-teal-500 group-hover:opacity-100 shadow-md"
          title="Edit Tanaman"
        >
          <Edit className="h-4 w-4" />
        </Link>
      )}

      {/* BUNGKUS GAMBAR & JUDUL DENGAN LINK MENUJU HALAMAN DETAIL */}
      <Link href={`/dashboard/plants/${plant.id}`} className="block cursor-pointer">
        <div className="h-52 w-full overflow-hidden bg-slate-800 relative">
          {plant.image_url ? (
            <img
              src={plant.image_url}
              alt={plant.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Leaf className="h-12 w-12 text-slate-600" />
            </div>
          )}
          {/* Efek overlay gelap tipis saat di-hover agar terasa bisa diklik */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
        </div>

        <CardHeader>
          <CardTitle className="text-xl text-teal-400 transition-colors group-hover:text-teal-300 truncate" title={plant.name}>
            {plant.name}
          </CardTitle>
          <p className="italic text-slate-400 truncate" title={plant.scientific_name}>{plant.scientific_name || "-"}</p>
        </CardHeader>
      </Link>

      <CardContent>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal-500 shrink-0" />
            <span className="font-medium shrink-0">Posisi:</span>
            <span className="truncate">{plant.placement || "Unknown"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="font-medium shrink-0">Cahaya:</span>
            <span className="truncate">{plant.light_requirement || "Unknown"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="font-medium shrink-0">CO₂:</span>
            <span className="truncate">{plant.co2_requirement || "Unknown"}</span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 mt-2">
            <Droplets className="h-4 w-4 text-cyan-500 shrink-0" />
            <span className="font-medium shrink-0">Tingkat Kesulitan:</span>
            {/* PERBAIKAN: LOGIKA WARNA YANG SINKRON DENGAN CSV TROPICA ("Easy", "Medium", "Hard") */}
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${
                plant.difficulty?.toLowerCase() === 'easy' ? 'bg-green-950/40 text-green-400 border-green-900/50' :
                plant.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50' :
                plant.difficulty?.toLowerCase() === 'hard' ? 'bg-red-950/40 text-red-400 border-red-900/50' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {plant.difficulty || "Unknown"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}