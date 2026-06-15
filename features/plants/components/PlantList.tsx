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
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

const ITEMS_PER_PAGE = 12;

export default function PlantList() {
  const { role } = useAuth();
  const { dict, language } = useLanguage(); // <-- PANGGIL KAMUS & SETTER BAHASA
  const lang = language as "id" | "en"; // <--- TAMBAHKAN BARIS INI DI SINI

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  
  const [carpetFilter, setCarpetFilter] = useState<"all" | "true">("all");
  const [shrimpFilter, setShrimpFilter] = useState<"all" | "true">("all");
  
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const handleQuickFilter = (type: "total" | "beginner" | "midground" | "carpet" | "shrimp") => {
    setCurrentPage(1);
    setSearchQuery("");
    if (type === "total") { setDifficultyFilter("all"); setPlacementFilter("all"); setCarpetFilter("all"); setShrimpFilter("all"); } 
    else if (type === "beginner") { setDifficultyFilter("easy"); setPlacementFilter("all"); setCarpetFilter("all"); setShrimpFilter("all"); } 
    else if (type === "midground") { setDifficultyFilter("all"); setPlacementFilter("midground"); setCarpetFilter("all"); setShrimpFilter("all"); } 
    else if (type === "carpet") { setDifficultyFilter("all"); setPlacementFilter("all"); setCarpetFilter("true"); setShrimpFilter("all"); } 
    else if (type === "shrimp") { setDifficultyFilter("all"); setPlacementFilter("all"); setCarpetFilter("all"); setShrimpFilter("true"); }
  };

  // LOGIKA PENCARIAN & PENGURUTAN BILINGUAL
  const processedPlants = plants
    .filter((plant) => {
      const searchLower = searchQuery.toLowerCase();
      // Cari teks di name_id ATAU name_en ATAU scientific_name
      const matchesSearch = 
        plant.name_id.toLowerCase().includes(searchLower) ||
        (plant.name_en && plant.name_en.toLowerCase().includes(searchLower)) ||
        (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchLower));

      const matchesDiff = difficultyFilter === "all" ? true : plant.difficulty?.toLowerCase() === difficultyFilter;
      const matchesPlace = placementFilter === "all" ? true : plant.placement?.toLowerCase() === placementFilter;
      const matchesCarpet = carpetFilter === "all" ? true : plant.carpet_potential === true;
      const matchesShrimp = shrimpFilter === "all" ? true : plant.shrimp_safe === true;

      return matchesSearch && matchesDiff && matchesPlace && matchesCarpet && matchesShrimp;
    })
    .sort((a, b) => {
      // Urutkan berdasarkan bahasa yang sedang dipilih
      const nameA = language === 'en' && a.name_en ? a.name_en : a.name_id;
      const nameB = language === 'en' && b.name_en ? b.name_en : b.name_id;
      
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
    });

  const totalPages = Math.max(1, Math.ceil(processedPlants.length / ITEMS_PER_PAGE));
  const displayedPlants = processedPlants.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const stats = {
    total: plants.length,
    beginner: plants.filter(p => p.difficulty?.toLowerCase() === 'easy').length,
    midground: plants.filter(p => p.placement?.toLowerCase() === 'midground').length,
    carpet: plants.filter(p => p.carpet_potential === true).length,
    shrimpSafe: plants.filter(p => p.shrimp_safe === true).length,
  };

  const isTotalActive = difficultyFilter === "all" && placementFilter === "all" && carpetFilter === "all" && shrimpFilter === "all";

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-500" /></div>;
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{dict.plantList.title}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">{dict.plantList.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div onClick={() => handleQuickFilter("total")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isTotalActive ? "bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400 border-transparent" : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.plantList.statTotal}</span>
          </div>
          <div onClick={() => handleQuickFilter("beginner")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${difficultyFilter === "easy" ? "bg-teal-50 dark:bg-teal-950/60 ring-2 ring-teal-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-teal-200 dark:border-teal-900/50 hover:bg-teal-50/50 dark:hover:bg-teal-950/30"}`}>
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400">{stats.beginner}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.plantList.statBeginner}</span>
          </div>
          <div onClick={() => handleQuickFilter("midground")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${placementFilter === "midground" ? "bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"}`}>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.midground}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.plantList.statMidground}</span>
          </div>
          <div onClick={() => handleQuickFilter("carpet")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${carpetFilter === "true" ? "bg-green-50 dark:bg-green-950/60 ring-2 ring-green-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-green-200 dark:border-green-900/50 hover:bg-green-50/50 dark:hover:bg-green-950/30"}`}>
            <span className="text-2xl font-black text-green-600 dark:text-green-400">{stats.carpet}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.plantList.statCarpet}</span>
          </div>
          <div onClick={() => handleQuickFilter("shrimp")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${shrimpFilter === "true" ? "bg-orange-50 dark:bg-orange-950/60 ring-2 ring-orange-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/30"}`}>
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.shrimpSafe}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.plantList.statShrimp}</span>
          </div>
        </div>
      </div>

{/* FILTER BAR - RESPONSIVE WRAP */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5 w-full">
        
        {/* PENCARIAN (SEARCH) */}
        <div className="relative flex-grow min-w-[200px] sm:min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input placeholder={dict.plantList.searchPlaceholder} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-12 h-12 rounded-xl text-base font-medium bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:border-teal-500 w-full transition-colors shadow-sm" />
        </div>

        {/* WRAPPER UNTUK FILTER & BUTTONS AGAR TETAP RAPI */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:flex-nowrap lg:justify-end">
          
          {/* TOMBOL URUTKAN */}
          <Button variant="outline" onClick={() => handleSort(sortOrder === "asc" ? "desc" : "asc")} className="flex-1 sm:flex-none shrink-0 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 rounded-xl font-bold shadow-sm px-5" title={sortOrder === "asc" ? dict.plantList.sortAsc : dict.plantList.sortDesc}>
            {sortOrder === "asc" ? <ArrowDownAZ className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-500" /> : <ArrowUpZA className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-500" />}
            {lang === 'id' ? "Urutkan" : "Sort"}
          </Button>

          {/* FILTER KESULITAN */}
          <div className="relative flex-1 sm:flex-none shrink-0 sm:w-44">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={difficultyFilter} onChange={(e) => handleDiffFilter(e.target.value)} className="w-full h-12 appearance-none rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-11 pr-8 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-teal-500 transition-colors shadow-sm cursor-pointer">
              <option value="all">{dict.plantList.allLevels}</option>
              <option value="easy">{dict.plantList.easy}</option>
              <option value="medium">{dict.plantList.medium}</option>
              <option value="hard">{dict.plantList.hard}</option>
            </select>
          </div>

          {/* FILTER POSISI */}
          <div className="relative flex-1 sm:flex-none shrink-0 sm:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={placementFilter} onChange={(e) => handlePlaceFilter(e.target.value)} className="w-full h-12 appearance-none rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-11 pr-8 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-teal-500 transition-colors shadow-sm cursor-pointer">
              <option value="all">{dict.plantList.placeAll || "Semua Posisi"}</option>
              <option value="foreground">{dict.plantList.placeForeground || "Foreground"}</option>
              <option value="midground">{dict.plantList.placeMidground || "Midground"}</option>
              <option value="background">{dict.plantList.placeBackground || "Background"}</option>
              <option value="epiphyte">{dict.plantList.placeEpiphyte || "Epiphyte"}</option>
              <option value="floating">{dict.plantList.placeFloating || "Floating"}</option>
            </select>
          </div>

          {/* TOMBOL AKSI */}
          {role !== "user" && (
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-1 lg:mt-0">
              <Link href="/dashboard/plants/archive" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full h-12 px-5 rounded-xl font-bold border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors active:scale-95">
                  <Archive className="mr-2 h-4 w-4" /> {dict.plantList.btnArchive}
                </Button>
              </Link>
              <Link href="/dashboard/plants/create" className="flex-1 sm:flex-none">
                <Button className="w-full h-12 px-5 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-500 transition-colors active:scale-95 shadow-lg shadow-teal-600/20">
                  <Plus className="mr-2 h-5 w-5" /> {dict.plantList.btnAdd}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {processedPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-20 text-center transition-colors">
          <Leaf className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">{dict.plantList.notFoundTitle}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dict.plantList.notFoundDesc}</p>
          <Button variant="link" onClick={() => handleQuickFilter("total")} className="mt-4 text-teal-600 dark:text-teal-400">{dict.plantList.btnReset}</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
            {displayedPlants.map((plant, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <div key={plant.id} className="relative group animate-in fade-in zoom-in duration-300">
                  <div className="absolute -left-3 -top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-lg shadow-black/20 dark:shadow-black border-2 border-white dark:border-slate-950 transition-all group-hover:scale-110">
                    {globalIndex}
                  </div>
                  <PlantCard plant={plant} />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 gap-4 transition-colors">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
                {dict.plantList.showing} <span className="font-medium text-gray-900 dark:text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {dict.plantList.to} <span className="font-medium text-gray-900 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, processedPlants.length)}</span> {dict.plantList.of} <span className="font-medium text-gray-900 dark:text-slate-200">{processedPlants.length}</span> {dict.plantList.data}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={dict.plantList.tooltipFirst}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={dict.plantList.tooltipPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map(num => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    onClick={() => setCurrentPage(num)}
                    className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium transition-all ${
                      currentPage === num 
                        ? 'bg-teal-600 hover:bg-teal-500 text-white border-teal-600 dark:border-teal-500 shadow-md shadow-teal-600/20 scale-105' 
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {num}
                  </Button>
                ))}

                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={dict.plantList.tooltipNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={dict.plantList.tooltipLast}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-2 sm:ml-4 border-l border-slate-300 dark:border-slate-700 pl-2 sm:pl-4 transition-colors">
                  <span className="hidden sm:inline">{dict.plantList.page}</span>
                  <Input 
                    type="number" min={1} max={totalPages} value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) setCurrentPage(val);
                    }}
                    className="w-14 h-8 text-center bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-teal-500 transition-colors"
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