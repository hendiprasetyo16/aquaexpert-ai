import { Plant } from "../types/plant.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Leaf,
  Sun,
  Wind,
  Droplets,
  Edit,
} from "lucide-react";

import Link from "next/link";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({
  plant,
}: PlantCardProps) {
  return (
    <Card className="group relative overflow-hidden border-slate-800 bg-slate-900/60 transition-all duration-300 hover:border-teal-700 hover:shadow-lg hover:shadow-teal-900/20">

      <Link
        href={`/dashboard/plants/${plant.id}/edit`}
        className="absolute right-3 top-3 z-20 rounded-lg bg-teal-600 p-2 text-white opacity-0 transition-all hover:bg-teal-500 group-hover:opacity-100"
      >
        <Edit className="h-4 w-4" />
      </Link>

      <div className="h-52 w-full overflow-hidden bg-slate-800">
        {plant.image_url ? (
          <img
            src={plant.image_url}
            alt={plant.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-12 w-12 text-slate-600" />
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="text-xl text-teal-400">
          {plant.name}
        </CardTitle>

        <p className="italic text-slate-400">
          {plant.scientific_name || "-"}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 text-sm text-slate-300">

          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal-500" />
            <span className="font-medium">
              Posisi:
            </span>
            {plant.placement}
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">
              Cahaya:
            </span>
            {plant.light_requirement}
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-400" />
            <span className="font-medium">
              CO₂:
            </span>
            {plant.co2_requirement}
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-500" />

            <span className="font-medium">
              Perawatan:
            </span>

            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                plant.difficulty === "Mudah"
                  ? "bg-green-900/40 text-green-400"
                  : plant.difficulty === "Sedang"
                  ? "bg-yellow-900/40 text-yellow-400"
                  : "bg-red-900/40 text-red-400"
              }`}
            >
              {plant.difficulty}
            </span>
          </div>

        </div>
      </CardContent>

    </Card>
  );
}