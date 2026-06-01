import { Plant } from "../types/plant.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Sun, Wind, Droplets, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  return (
    <Card className="relative overflow-hidden border-slate-800 bg-slate-900/60 transition-all hover:border-teal-900/50 hover:bg-slate-800/60 group">
      
      {/* Tombol Edit - Hanya muncul saat kartu di-hover */}
      <Link 
        href={`/plants/${plant.id}/edit`}
        className="absolute right-2 top-2 z-10 hidden rounded-md bg-teal-600/90 p-2 text-white backdrop-blur-sm transition-all hover:bg-teal-500 group-hover:block"
      >
        <Edit className="h-4 w-4" />
      </Link>

      {/* Area Gambar */}
      <div className="relative h-40 w-full bg-slate-800 flex items-center justify-center overflow-hidden">
        {plant.image_url ? (
          <Image 
            src={plant.image_url} 
            alt={plant.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <Leaf className="h-10 w-10 text-slate-600 opacity-50" />
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg text-teal-400 line-clamp-1">{plant.name}</CardTitle>
        <p className="text-xs italic text-slate-400 line-clamp-1">{plant.scientific_name || "-"}</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="mt-2 space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-teal-500 shrink-0" />
            <span className="font-medium">Posisi:</span> {plant.placement || "-"}
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            <span className="font-medium">Cahaya:</span> {plant.light_requirement || "-"}
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="font-medium">CO2:</span> {plant.co2_requirement || "-"}
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="font-medium">Perawatan:</span> 
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              plant.difficulty === 'Mudah' ? 'bg-green-900/50 text-green-400' : 
              plant.difficulty === 'Sedang' ? 'bg-yellow-900/50 text-yellow-400' : 
              'bg-red-900/50 text-red-400'
            }`}>
              {plant.difficulty || "-"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}