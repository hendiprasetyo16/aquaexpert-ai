"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import PlantForm from "@/features/plants/components/PlantForm";

import {
  getPlantById,
} from "@/features/plants/repositories/plant.repository";

import { Plant } from "@/features/plants/types/plant.types";

export default function EditPlantPage() {
  const params = useParams();

  const [plant, setPlant] =
    useState<Plant | null>(null);

  useEffect(() => {
    async function loadData() {
      const data =
        await getPlantById(
          params.id as string
        );

      setPlant(data);
    }

    loadData();
  }, [params.id]);

  if (!plant) {
    return (
      <div className="p-6 text-slate-300">
        Memuat data tanaman...
      </div>
    );
  }

  return (
    <div className="p-6">
      <PlantForm
        mode="edit"
        plant={plant}
      />
    </div>
  );
}