"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlants } from "../repositories/plant.repository";
import { Plant } from "../types/plant.types";
import { useAuth } from "@/hooks/useAuth"; // <-- IMPORT USEAUTH

import EmptyPlantState from "./EmptyPlantState";
import PlantCard from "./PlantCard";

import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PlantList() {
  const { role } = useAuth(); // <-- PANGGIL ROLE

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPlants();
        setPlants(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesSearch =
        plant.name?.toLowerCase().includes(search.toLowerCase()) ||
        plant.scientific_name?.toLowerCase().includes(search.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === "all" ? true : plant.difficulty === difficultyFilter;

      const matchesPlacement =
        placementFilter === "all" ? true : plant.placement === placementFilter;

      return matchesSearch && matchesDifficulty && matchesPlacement;
    });
  }, [plants, search, difficultyFilter, placementFilter]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Database Tanaman</h2>
          <p className="mt-1 text-slate-400">Kelola master data Plant Expert</p>
        </div>

        {/* HANYA TAMPIL JIKA BUKAN USER BIASA */}
        {role !== "user" && (
          <Link href="/dashboard/plants/create">
            <Button className="bg-teal-600 text-white hover:bg-teal-500">
              <Plus className="mr-2 h-4 w-4" /> Tambah Tanaman
            </Button>
          </Link>
        )}
      </div>

      {/* FILTER AREA */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari tanaman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-slate-200 outline-none focus:border-teal-500"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
          >
            <option value="all">Semua Difficulty</option>
            <option value="Mudah">Mudah</option>
            <option value="Sedang">Sedang</option>
            <option value="Sulit">Sulit</option>
          </select>

          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
          >
            <option value="all">Semua Posisi</option>
            <option value="Foreground">Foreground</option>
            <option value="Midground">Midground</option>
            <option value="Background">Background</option>
          </select>
        </div>
      </div>

      {/* COUNTER */}
      <div className="text-sm text-slate-400">
        Menampilkan <span className="font-semibold text-teal-400">{filteredPlants.length}</span> dari <span className="font-semibold text-slate-200">{plants.length}</span> tanaman
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filteredPlants.length === 0 ? (
        <EmptyPlantState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}