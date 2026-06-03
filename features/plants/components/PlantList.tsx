"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlants } from "../repositories/plant.repository";
import { Plant } from "../types/plant.types";
import { useAuth } from "@/hooks/useAuth";
import PlantCard from "./PlantCard";

// TAMBAHAN IMPORT: ChevronsLeft & ChevronsRight untuk Awal/Akhir
import { Loader2, Plus, Archive, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 12;

export default function PlantList() {
  const { role } = useAuth();
  
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPlants();
        setPlants(data);
      } catch (error) {
        console.error("Gagal memuat daftar tanaman:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredPlants = plants.filter((plant) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      plant.name.toLowerCase().includes(searchLower) ||
      (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchLower)) ||
      (plant.difficulty && plant.difficulty.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPlants.length / ITEMS_PER_PAGE));
  const displayedPlants = filteredPlants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // LOGIKA WINDOWING PAGINATION (Menampilkan maksimal 3 angka halaman)
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, currentPage + 1);

  if (currentPage === 1) {
    endPage = Math.min(totalPages, 3);
  } else if (currentPage === totalPages) {
    startPage = Math.max(1, totalPages - 2);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Database Tanaman</h2>
          <p className="mt-1 text-slate-400 text-sm">
            Total {plants.length} tanaman terdaftar dalam sistem pakar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Cari nama, ilmiah, kesulitan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200 focus:border-teal-500 w-full"
            />
          </div>

          {role !== "user" && (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard/plants/archive">
                <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95 w-full sm:w-auto">
                  <Archive className="mr-2 h-4 w-4" /> Arsip
                </Button>
              </Link>
              <Link href="/dashboard/plants/create">
                <Button className="bg-teal-600 text-white hover:bg-teal-500 transition-all active:scale-95 shadow-lg w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Tambah
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {filteredPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center">
          <Leaf className="mb-4 h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-200">Tidak Ditemukan</h3>
          <p className="mt-2 text-sm text-slate-400">
            Tidak ada tanaman yang cocok dengan pencarian "{searchQuery}".
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>

          {/* KONTROL PAGINATION LANJUTAN (3 Angka & Awal/Akhir) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-6 mt-6 gap-4">
              <p className="text-sm text-slate-400 text-center sm:text-left w-full sm:w-auto">
                Menampilkan <span className="font-medium text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-medium text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPlants.length)}</span> dari <span className="font-medium text-slate-200">{filteredPlants.length}</span> data
              </p>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Tombol Halaman Awal */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  title="Halaman Awal"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Tombol Sebelumnya */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Looping 3 Angka Halaman Dinamis */}
                {pageNumbers.map(num => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    onClick={() => setCurrentPage(num)}
                    className={`h-8 w-8 p-0 text-sm font-medium transition-colors ${
                      currentPage === num 
                        ? 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-md' 
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {num}
                  </Button>
                ))}

                {/* Tombol Selanjutnya */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  title="Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Tombol Halaman Akhir */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  title="Halaman Akhir"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}