"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getPlants } from "../repositories/plant.repository";
import { Plant } from "../types/plant.types";
import { useAuth } from "@/hooks/useAuth";
import PlantCard from "./PlantCard";

import { 
  Loader2, Plus, Archive, Search, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Leaf, Filter, ArrowDownAZ, ArrowUpZA 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 12;

export default function PlantList() {
  const { role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // MENGAMBIL STATE DARI URL (Agar kembali ke halaman yang sama)
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "az";
  const initialDifficulty = searchParams.get("diff") || "all";
  const initialPlacement = searchParams.get("place") || "all";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSort);
  const [difficultyFilter, setDifficultyFilter] = useState(initialDifficulty);
  const [placementFilter, setPlacementFilter] = useState(initialPlacement);

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

  // UPDATE URL SETIAP KALI ADA PERUBAHAN STATE (PENTING UNTUK UX)
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy !== "az") params.set("sort", sortBy);
    if (difficultyFilter !== "all") params.set("diff", difficultyFilter);
    if (placementFilter !== "all") params.set("place", placementFilter);

    // Replace agar tidak menumpuk history di browser
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentPage, searchQuery, sortBy, difficultyFilter, placementFilter, pathname, router]);

  // Reset ke halaman 1 jika ada filter atau pencarian baru
  const handleSearchChange = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleSortChange = (val: string) => { setSortBy(val); setCurrentPage(1); };
  const handleDiffChange = (val: string) => { setDifficultyFilter(val); setCurrentPage(1); };
  const handlePlaceChange = (val: string) => { setPlacementFilter(val); setCurrentPage(1); };

  // =========================================================
  // LOGIKA FILTERING & SORTING GANDA
  // =========================================================
  const processedPlants = useMemo(() => {
    let result = [...plants];

    // 1. FILTERING
    result = result.filter((plant) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        plant.name.toLowerCase().includes(searchLower) ||
        (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchLower));
      
      const matchesDiff = difficultyFilter === "all" || plant.difficulty === difficultyFilter;
      const matchesPlace = placementFilter === "all" || plant.placement === placementFilter;

      return matchesSearch && matchesDiff && matchesPlace;
    });

    // 2. SORTING (PENGURUTAN ABJAD)
    result.sort((a, b) => {
      if (sortBy === "az") return a.name.localeCompare(b.name);
      if (sortBy === "za") return b.name.localeCompare(a.name);
      return 0;
    });

    return result;
  }, [plants, searchQuery, difficultyFilter, placementFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedPlants.length / ITEMS_PER_PAGE));
  const displayedPlants = processedPlants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // LOGIKA WINDOWING PAGINATION
  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  }
  if (endPage === totalPages) {
    startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // MENGAMBIL DAFTAR UNIK UNTUK DROPDOWN FILTER
  const uniquePlacements = useMemo(() => {
    const places = new Set(plants.map(p => p.placement).filter(Boolean));
    return Array.from(places).sort();
  }, [plants]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Database Tanaman</h2>
          <p className="mt-1 text-slate-400 text-sm">
            Total {plants.length} tanaman terdaftar dalam sistem pakar.
          </p>
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

      {/* FILTER & SEARCH SECTION (BARU) */}
      <div className="flex flex-col xl:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari nama atau nama ilmiah..." 
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-700 text-slate-200 focus:border-teal-500 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Sorting */}
          <div className="relative w-full sm:w-40">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              {sortBy === "az" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpZA className="h-4 w-4" />}
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full appearance-none rounded-md border border-slate-700 bg-slate-950 py-2 pl-9 pr-8 text-sm text-slate-200 outline-none focus:border-teal-500"
            >
              <option value="az">Abjad (A - Z)</option>
              <option value="za">Abjad (Z - A)</option>
            </select>
          </div>

          {/* Filter Difficulty */}
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={difficultyFilter}
              onChange={(e) => handleDiffChange(e.target.value)}
              className="w-full appearance-none rounded-md border border-slate-700 bg-slate-950 py-2 pl-9 pr-8 text-sm text-slate-200 outline-none focus:border-teal-500"
            >
              <option value="all">Semua Kesulitan</option>
              <option value="Easy">Easy (Mudah)</option>
              <option value="Medium">Medium (Sedang)</option>
              <option value="Hard">Hard (Sulit)</option>
            </select>
          </div>

          {/* Filter Placement */}
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={placementFilter}
              onChange={(e) => handlePlaceChange(e.target.value)}
              className="w-full appearance-none rounded-md border border-slate-700 bg-slate-950 py-2 pl-9 pr-8 text-sm text-slate-200 outline-none focus:border-teal-500"
            >
              <option value="all">Semua Posisi</option>
              {uniquePlacements.map(place => (
                <option key={place} value={place}>{place}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* HASIL KARTU TANAMAN */}
      {processedPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center">
          <Leaf className="mb-4 h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-200">Tidak Ditemukan</h3>
          <p className="mt-2 text-sm text-slate-400">
            Tidak ada tanaman yang cocok dengan kriteria pencarian atau filter Anda.
          </p>
          <Button 
            variant="link" 
            onClick={() => { handleSearchChange(""); handleDiffChange("all"); handlePlaceChange("all"); handleSortChange("az"); }}
            className="mt-4 text-teal-500"
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
            {displayedPlants.map((plant, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <div key={plant.id} className="relative group">
                  <div className="absolute -left-3 -top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-lg shadow-black border-2 border-slate-950 transition-transform group-hover:scale-110">
                    {globalIndex}
                  </div>
                  <PlantCard plant={plant} />
                </div>
              );
            })}
          </div>

          {/* KONTROL PAGINATION (TETAP SAMA) */}
          {totalPages > 1 && (
            <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-800 pt-6 mt-6 gap-4">
              <p className="text-sm text-slate-400 text-center xl:text-left w-full xl:w-auto">
                Menampilkan <span className="font-medium text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-medium text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, processedPlants.length)}</span> dari <span className="font-medium text-slate-200">{processedPlants.length}</span> data
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map(num => (
                  <Button key={num} variant={currentPage === num ? "default" : "outline"} onClick={() => setCurrentPage(num)} className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium transition-all ${currentPage === num ? 'bg-teal-600 text-white shadow-md scale-105' : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}>
                    {num}
                  </Button>
                ))}

                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 text-sm text-slate-300 ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
                  <span className="hidden sm:inline">Hal</span>
                  <Input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const val = parseInt(e.target.value); if (val >= 1 && val <= totalPages) setCurrentPage(val); }} className="w-14 h-8 text-center bg-slate-950 border-slate-700 focus:border-teal-500" />
                  <span className="hidden sm:inline">/ {totalPages}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}