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
    <Card className="relative overflow-hidden border-slate-800 bg-slate-900/60">

      <Link
        href={`/dashboard/plants/${plant.id}/edit`}
        className="absolute right-3 top-3 z-20 rounded-md bg-teal-600 p-2 text-white hover:bg-teal-500"
      >
        <Edit className="h-4 w-4" />
      </Link>

      <div className="h-48 w-full overflow-hidden bg-slate-800">
        {plant.image_url ? (
          <img
            src={plant.image_url}
            alt={plant.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              console.log("IMAGE ERROR:", plant.image_url);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-12 w-12 text-slate-600" />
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="text-teal-400">
          {plant.name}
        </CardTitle>

        <p className="text-xs italic text-slate-400">
          {plant.scientific_name || "-"}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-slate-300">

          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal-500" />
            <span>Posisi:</span>
            {plant.placement}
          </div>

          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span>Cahaya:</span>
            {plant.light_requirement}
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-400" />
            <span>CO2:</span>
            {plant.co2_requirement}
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span>Perawatan:</span>
            {plant.difficulty}
          </div>

        </div>
      </CardContent>

    </Card>
  );
}