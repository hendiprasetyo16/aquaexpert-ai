"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlants } from "../repositories/plant.repository";
import { Plant } from "../types/plant.types";
import { useAuth } from "@/hooks/useAuth";
import PlantCard from "./PlantCard";

import { Loader2, Plus, Archive, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Leaf, Filter, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 12;

export default function PlantList() {
  const { role } = useAuth();
  
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // STATES: Pencarian, Filter, Sorting, Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  
  // V2: STATES TAMBAHAN UNTUK QUICK FILTER KARTU STATISTIK
  const [carpetFilter, setCarpetFilter] = useState<"all" | "true">("all");
  const [shrimpFilter, setShrimpFilter] = useState<"all" | "true">("all");
  
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // FLAG GEMBOK MEMORI
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. MENGAMBIL DATA DARI DATABASE
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

  // 2. MENGAMBIL "INGATAN" HALAMAN (SESSION STORAGE)
  useEffect(() => {
    const savedPage = sessionStorage.getItem("plantPage");
    if (savedPage) setCurrentPage(Number(savedPage));

    const savedSearch = sessionStorage.getItem("plantSearch");
    if (savedSearch) setSearchQuery(savedSearch);

    const savedDiff = sessionStorage.getItem("plantDiff");
    if (savedDiff) setDifficultyFilter(savedDiff);

    const savedPlace = sessionStorage.getItem("plantPlace");
    if (savedPlace) setPlacementFilter(savedPlace);

    const savedCarpet = sessionStorage.getItem("plantCarpet");
    if (savedCarpet) setCarpetFilter(savedCarpet as "all" | "true");

    const savedShrimp = sessionStorage.getItem("plantShrimp");
    if (savedShrimp) setShrimpFilter(savedShrimp as "all" | "true");

    const savedSort = sessionStorage.getItem("plantSort");
    if (savedSort) setSortOrder(savedSort as "asc" | "desc");

    setIsHydrated(true);
  }, []);

  // 3. MENYIMPAN "INGATAN"
  useEffect(() => {
    if (!isHydrated) return;

    sessionStorage.setItem("plantPage", currentPage.toString());
    sessionStorage.setItem("plantSearch", searchQuery);
    sessionStorage.setItem("plantDiff", difficultyFilter);
    sessionStorage.setItem("plantPlace", placementFilter);
    sessionStorage.setItem("plantCarpet", carpetFilter);
    sessionStorage.setItem("plantShrimp", shrimpFilter);
    sessionStorage.setItem("plantSort", sortOrder);
  }, [currentPage, searchQuery, difficultyFilter, placementFilter, carpetFilter, shrimpFilter, sortOrder, isHydrated]);

  const handleSearch = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleDiffFilter = (val: string) => { setDifficultyFilter(val); setCurrentPage(1); };
  const handlePlaceFilter = (val: string) => { setPlacementFilter(val); setCurrentPage(1); };
  const handleSort = (val: "asc" | "desc") => { setSortOrder(val); setCurrentPage(1); };

  // HANDLER: QUICK FILTER UNTUK KARTU STATISTIK
  const handleQuickFilter = (type: "total" | "beginner" | "midground" | "carpet" | "shrimp") => {
    setCurrentPage(1);
    
    // Reset pencarian jika menggunakan quick filter
    setSearchQuery("");

    if (type === "total") {
      setDifficultyFilter("all");
      setPlacementFilter("all");
      setCarpetFilter("all");
      setShrimpFilter("all");
    } else if (type === "beginner") {
      setDifficultyFilter("easy");
      setPlacementFilter("all");
      setCarpetFilter("all");
      setShrimpFilter("all");
    } else if (type === "midground") {
      setDifficultyFilter("all");
      setPlacementFilter("midground");
      setCarpetFilter("all");
      setShrimpFilter("all");
    } else if (type === "carpet") {
      setDifficultyFilter("all");
      setPlacementFilter("all");
      setCarpetFilter("true");
      setShrimpFilter("all");
    } else if (type === "shrimp") {
      setDifficultyFilter("all");
      setPlacementFilter("all");
      setCarpetFilter("all");
      setShrimpFilter("true");
    }
  };

  // 4. LOGIKA FILTERING & SORTING GABUNGAN
  const processedPlants = plants
    .filter((plant) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        plant.name.toLowerCase().includes(searchLower) ||
        (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchLower));

      const matchesDiff = difficultyFilter === "all" ? true : plant.difficulty?.toLowerCase() === difficultyFilter;
      const matchesPlace = placementFilter === "all" ? true : plant.placement?.toLowerCase() === placementFilter;
      const matchesCarpet = carpetFilter === "all" ? true : plant.carpet_potential === true;
      const matchesShrimp = shrimpFilter === "all" ? true : plant.shrimp_safe === true;

      return matchesSearch && matchesDiff && matchesPlace && matchesCarpet && matchesShrimp;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name); // A ke Z
      } else {
        return b.name.localeCompare(a.name); // Z ke A
      }
    });

  // 5. LOGIKA PAGINATION
  const totalPages = Math.max(1, Math.ceil(processedPlants.length / ITEMS_PER_PAGE));
  const displayedPlants = processedPlants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  // --- STATISTIK KNOWLEDGE BASE ---
  const stats = {
    total: plants.length,
    beginner: plants.filter(p => p.difficulty?.toLowerCase() === 'easy').length,
    midground: plants.filter(p => p.placement?.toLowerCase() === 'midground').length,
    carpet: plants.filter(p => p.carpet_potential === true).length,
    shrimpSafe: plants.filter(p => p.shrimp_safe === true).length,
  };

  // KONDISI AKTIF KARTU
  const isTotalActive = difficultyFilter === "all" && placementFilter === "all" && carpetFilter === "all" && shrimpFilter === "all";

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* HEADER TITLE & STATS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Database Tanaman</h2>
          <p className="mt-1 text-slate-400 text-sm">
            Knowledge Base tersinkronisasi untuk AquaExpert Inference Engine.
          </p>
        </div>

        {/* KARTU STATISTIK (SEKARANG BISA DIKLIK) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div 
            onClick={() => handleQuickFilter("total")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
              isTotalActive ? "bg-slate-800 ring-2 ring-slate-400 border-transparent" : "bg-slate-900/80 border border-slate-800 hover:bg-slate-800"
            }`}
          >
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-xs text-slate-400 uppercase font-semibold mt-1">Total Plant</span>
          </div>

          <div 
            onClick={() => handleQuickFilter("beginner")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
              difficultyFilter === "easy" ? "bg-teal-950/60 ring-2 ring-teal-500 border-transparent" : "bg-slate-900/80 border border-teal-900/50 hover:bg-teal-950/30"
            }`}
          >
            <span className="text-2xl font-black text-teal-400">{stats.beginner}</span>
            <span className="text-xs text-slate-400 uppercase font-semibold mt-1">Beginner</span>
          </div>

          <div 
            onClick={() => handleQuickFilter("midground")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
              placementFilter === "midground" ? "bg-blue-950/60 ring-2 ring-blue-500 border-transparent" : "bg-slate-900/80 border border-blue-900/50 hover:bg-blue-950/30"
            }`}
          >
            <span className="text-2xl font-black text-blue-400">{stats.midground}</span>
            <span className="text-xs text-slate-400 uppercase font-semibold mt-1">Midground</span>
          </div>

          <div 
            onClick={() => handleQuickFilter("carpet")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
              carpetFilter === "true" ? "bg-green-950/60 ring-2 ring-green-500 border-transparent" : "bg-slate-900/80 border border-green-900/50 hover:bg-green-950/30"
            }`}
          >
            <span className="text-2xl font-black text-green-400">{stats.carpet}</span>
            <span className="text-xs text-slate-400 uppercase font-semibold mt-1">Carpet</span>
          </div>

          <div 
            onClick={() => handleQuickFilter("shrimp")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
              shrimpFilter === "true" ? "bg-orange-950/60 ring-2 ring-orange-500 border-transparent" : "bg-slate-900/80 border border-orange-900/50 hover:bg-orange-950/30"
            }`}
          >
            <span className="text-2xl font-black text-orange-400">{stats.shrimpSafe}</span>
            <span className="text-xs text-slate-400 uppercase font-semibold mt-1">Shrimp Safe</span>
          </div>
        </div>
      </div>

      {/* BILAH KONTROL TERPADU (SEMUA KUMPUL DI SINI) */}
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-6 xl:flex-row xl:items-center xl:justify-between">
        
        {/* Search Bar (Kiri) */}
        <div className="relative w-full xl:max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari nama, ilmiah..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 focus:border-teal-500 w-full"
          />
        </div>

        {/* Filters, Sort, Archive, Add (Kanan) */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Sorting Abjad */}
          <Button 
            variant="outline"
            onClick={() => handleSort(sortOrder === "asc" ? "desc" : "asc")}
            className="flex-1 sm:flex-none border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            title="Urutkan Abjad"
          >
            {sortOrder === "asc" ? <ArrowDownAZ className="mr-2 h-4 w-4 text-teal-500" /> : <ArrowUpZA className="mr-2 h-4 w-4 text-teal-500" />}
            {sortOrder === "asc" ? "A - Z" : "Z - A"}
          </Button>

          {/* Filter Difficulty */}
          <div className="relative flex-1 sm:flex-none sm:w-36">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <select
              value={difficultyFilter}
              onChange={(e) => handleDiffFilter(e.target.value)}
              className="w-full h-10 appearance-none rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-300 outline-none focus:border-teal-500"
            >
              <option value="all">Semua Level</option>
              <option value="easy">Easy (Mudah)</option>
              <option value="medium">Medium (Sedang)</option>
              <option value="hard">Hard (Sulit)</option>
            </select>
          </div>

          {/* Filter Placement */}
          <div className="relative flex-1 sm:flex-none sm:w-36">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <select
              value={placementFilter}
              onChange={(e) => handlePlaceFilter(e.target.value)}
              className="w-full h-10 appearance-none rounded-md border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-300 outline-none focus:border-teal-500"
            >
              <option value="all">Semua Posisi</option>
              <option value="foreground">Foreground</option>
              <option value="midground">Midground</option>
              <option value="background">Background</option>
              <option value="epiphyte">Epiphyte</option>
              <option value="floating">Floating</option>
            </select>
          </div>

          {/* Tombol Admin */}
          {role !== "user" && (
            <>
              <Link href="/dashboard/plants/archive" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95">
                  <Archive className="mr-2 h-4 w-4" /> Arsip
                </Button>
              </Link>
              <Link href="/dashboard/plants/create" className="flex-1 sm:flex-none">
                <Button className="w-full bg-teal-600 text-white hover:bg-teal-500 transition-all active:scale-95 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" /> Tambah
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {processedPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center">
          <Leaf className="mb-4 h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-200">Tidak Ditemukan</h3>
          <p className="mt-2 text-sm text-slate-400">
            Tidak ada tanaman yang cocok dengan kriteria pencarian & filter Anda.
          </p>
          <Button 
            variant="link" 
            onClick={() => handleQuickFilter("total")}
            className="mt-4 text-teal-400"
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
                <div key={plant.id} className="relative group animate-in fade-in zoom-in duration-300">
                  <div className="absolute -left-3 -top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-lg shadow-black border-2 border-slate-950 transition-transform group-hover:scale-110">
                    {globalIndex}
                  </div>
                  <PlantCard plant={plant} />
                </div>
              );
            })}
          </div>

          {/* KONTROL PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-800 pt-6 mt-6 gap-4">
              <p className="text-sm text-slate-400 text-center xl:text-left w-full xl:w-auto">
                Menampilkan <span className="font-medium text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="font-medium text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, processedPlants.length)}</span> dari <span className="font-medium text-slate-200">{processedPlants.length}</span> data
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50" title="Halaman Awal">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50" title="Sebelumnya">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map(num => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    onClick={() => setCurrentPage(num)}
                    className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium transition-all ${
                      currentPage === num 
                        ? 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-md scale-105' 
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {num}
                  </Button>
                ))}

                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50" title="Selanjutnya">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50" title="Halaman Akhir">
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 text-sm text-slate-300 ml-2 sm:ml-4 border-l border-slate-700 pl-2 sm:pl-4">
                  <span className="hidden sm:inline">Hal</span>
                  <Input 
                    type="number" min={1} max={totalPages} value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) setCurrentPage(val);
                    }}
                    className="w-14 h-8 text-center bg-slate-950 border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-teal-500"
                    title="Ketik angka halaman"
                  />
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