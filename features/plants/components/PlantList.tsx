"use client";

import { useEffect, useState } from "react";
import { getPlants } from "../repositories/plant.repository";
import { Plant } from "../types/plant.types";
import EmptyPlantState from "./EmptyPlantState";
import PlantCard from "./PlantCard";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PlantList() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getPlants();
      setPlants(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Database Tanaman</h2>
          <p className="text-sm text-slate-400">Kelola master data tanaman untuk Plant Expert System</p>
        </div>
        
        {/* Tombol Tambah Tanaman yang sudah diperbaiki */}
        <Link href="/dashboard/plants/create">
          <Button className="bg-teal-600 text-white hover:bg-teal-500">
            <Plus className="mr-2 h-4 w-4" /> Tambah Tanaman
          </Button>
        </Link>
      </div>

      {/* Area Konten */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : plants.length === 0 ? (
        <EmptyPlantState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}