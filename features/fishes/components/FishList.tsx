// features/fishes/components/FishList.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFishes } from "../repositories/fish.repository";
import { Fish as FishType } from "../types/fish.types";
import { useAuth } from "@/hooks/useAuth";
import FishCard from "./FishCard";

import { 
  Loader2, Plus, Archive, Search, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Fish, Filter, ArrowDownAZ, ArrowUpZA 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/providers/LanguageProvider"; 

const ITEMS_PER_PAGE = 12;

interface FishListDict {
  fishList?: {
    title: string; subtitle: string; statTotal: string; statEasy: string;
    statPeaceful: string; statAggressive: string; statSchooling: string;
    searchPlaceholder: string; sortAsc: string; sortDesc: string;
    allLevels: string; easy: string; medium: string; hard: string;
    allCompat: string; compatPeaceful: string; compatSemi: string; compatAggro: string;
    btnArchive: string; btnAdd: string; notFoundTitle: string; notFoundDesc: string;
    btnReset: string; showing: string; to: string; of: string; data: string;
    tooltipFirst: string; tooltipPrev: string; tooltipNext: string; tooltipLast: string; page: string;
  };
}

export default function FishList() {
  const { role } = useAuth();
  const { dict, language } = useLanguage(); 
  const lang = language as "id" | "en";

  const dictionary = dict as unknown as FishListDict;
  const listDict = dictionary.fishList || {
    title: "Database Ikan", subtitle: "Ensiklopedia fauna terintegrasi.",
    statTotal: "Total Spesies", statEasy: "Pemula", statPeaceful: "Damai",
    statAggressive: "Predator", statSchooling: "Schooling",
    searchPlaceholder: "Cari nama, spesies, latin...", sortAsc: "A - Z", sortDesc: "Z - A",
    allLevels: "Semua Perawatan", easy: "Mudah", medium: "Sedang", hard: "Sulit",
    allCompat: "Semua Sifat", compatPeaceful: "Damai", compatSemi: "Semi-Agresif", compatAggro: "Predator",
    btnArchive: "Arsip", btnAdd: "Tambah", notFoundTitle: "Ikan Tidak Ditemukan", notFoundDesc: "Tidak ada ikan yang cocok.",
    btnReset: "Reset Filter", showing: "Menampilkan", to: "hingga", of: "dari", data: "ikan",
    tooltipFirst: "Awal", tooltipPrev: "Sebelumnya", tooltipNext: "Selanjutnya", tooltipLast: "Akhir", page: "Hal"
  };

  const [fishes, setFishes] = useState<FishType[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [compatFilter, setCompatFilter] = useState("all");
  
  const [schoolingFilter, setSchoolingFilter] = useState<"all" | "true">("all");
  
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFishes();
        setFishes(data);
      } catch (error) {
        console.error("Gagal memuat daftar ikan:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const savedPage = sessionStorage.getItem("fishPage");
    if (savedPage) setCurrentPage(Number(savedPage));
    const savedSearch = sessionStorage.getItem("fishSearch");
    if (savedSearch) setSearchQuery(savedSearch);
    const savedDiff = sessionStorage.getItem("fishDiff");
    if (savedDiff) setDifficultyFilter(savedDiff);
    const savedType = sessionStorage.getItem("fishType");
    if (savedType) setTypeFilter(savedType);
    const savedCompat = sessionStorage.getItem("fishCompat");
    if (savedCompat) setCompatFilter(savedCompat);
    const savedSchooling = sessionStorage.getItem("fishSchooling");
    if (savedSchooling) setSchoolingFilter(savedSchooling as "all" | "true");
    const savedSort = sessionStorage.getItem("fishSort");
    if (savedSort) setSortOrder(savedSort as "asc" | "desc");

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("fishPage", currentPage.toString());
    sessionStorage.setItem("fishSearch", searchQuery);
    sessionStorage.setItem("fishDiff", difficultyFilter);
    sessionStorage.setItem("fishType", typeFilter);
    sessionStorage.setItem("fishCompat", compatFilter);
    sessionStorage.setItem("fishSchooling", schoolingFilter);
    sessionStorage.setItem("fishSort", sortOrder);
  }, [currentPage, searchQuery, difficultyFilter, typeFilter, compatFilter, schoolingFilter, sortOrder, isHydrated]);

  const handleSearch = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleDiffFilter = (val: string) => { setDifficultyFilter(val); setCurrentPage(1); };
  const handleCompatFilter = (val: string) => { setCompatFilter(val); setCurrentPage(1); };
  const handleSort = (val: "asc" | "desc") => { setSortOrder(val); setCurrentPage(1); };

  const handleQuickFilter = (type: "total" | "easy" | "peaceful" | "aggressive" | "schooling") => {
    setCurrentPage(1);
    setSearchQuery("");
    if (type === "total") { setDifficultyFilter("all"); setCompatFilter("all"); setSchoolingFilter("all"); } 
    else if (type === "easy") { setDifficultyFilter("easy"); setCompatFilter("all"); setSchoolingFilter("all"); } 
    else if (type === "peaceful") { setDifficultyFilter("all"); setCompatFilter("peaceful"); setSchoolingFilter("all"); } 
    else if (type === "aggressive") { setDifficultyFilter("all"); setCompatFilter("aggressive"); setSchoolingFilter("all"); } 
    else if (type === "schooling") { setDifficultyFilter("all"); setCompatFilter("all"); setSchoolingFilter("true"); }
  };

  const processedFishes = fishes
    .filter((fish) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        fish.name_id.toLowerCase().includes(searchLower) ||
        (fish.name_en && fish.name_en.toLowerCase().includes(searchLower)) ||
        (fish.scientific_name && fish.scientific_name.toLowerCase().includes(searchLower));

      const matchesDiff = difficultyFilter === "all" ? true : fish.difficulty?.toLowerCase() === difficultyFilter;
      const matchesType = typeFilter === "all" ? true : fish.fish_type?.toLowerCase() === typeFilter;
      const matchesCompat = compatFilter === "all" ? true : fish.compatibility?.toLowerCase() === compatFilter;
      const matchesSchooling = schoolingFilter === "all" ? true : fish.schooling === true;

      return matchesSearch && matchesDiff && matchesType && matchesCompat && matchesSchooling;
    })
    .sort((a, b) => {
      const nameA = language === 'en' && a.name_en ? a.name_en : a.name_id;
      const nameB = language === 'en' && b.name_en ? b.name_en : b.name_id;
      
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
    });

  const totalPages = Math.max(1, Math.ceil(processedFishes.length / ITEMS_PER_PAGE));
  const displayedFishes = processedFishes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const stats = {
    total: fishes.length,
    easy: fishes.filter(p => p.difficulty?.toLowerCase() === 'easy').length,
    peaceful: fishes.filter(p => p.compatibility?.toLowerCase() === 'peaceful').length,
    aggressive: fishes.filter(p => p.compatibility?.toLowerCase() === 'aggressive').length,
    schooling: fishes.filter(p => p.schooling === true).length,
  };

  const isTotalActive = difficultyFilter === "all" && compatFilter === "all" && schoolingFilter === "all" && typeFilter === "all";

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" /></div>;
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      
      {/* HEADER & QUICK STATS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{listDict.title}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">{listDict.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div onClick={() => handleQuickFilter("total")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isTotalActive ? "bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400 border-transparent" : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{listDict.statTotal}</span>
          </div>
          <div onClick={() => handleQuickFilter("easy")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${difficultyFilter === "easy" ? "bg-green-50 dark:bg-green-950/60 ring-2 ring-green-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-green-200 dark:border-green-900/50 hover:bg-green-50/50 dark:hover:bg-green-950/30"}`}>
            <span className="text-2xl font-black text-green-600 dark:text-green-400">{stats.easy}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{listDict.statEasy}</span>
          </div>
          <div onClick={() => handleQuickFilter("peaceful")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${compatFilter === "peaceful" ? "bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"}`}>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.peaceful}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{listDict.statPeaceful}</span>
          </div>
          <div onClick={() => handleQuickFilter("aggressive")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${compatFilter === "aggressive" ? "bg-red-50 dark:bg-red-950/60 ring-2 ring-red-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-red-200 dark:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/30"}`}>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.aggressive}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{listDict.statAggressive}</span>
          </div>
          <div onClick={() => handleQuickFilter("schooling")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${schoolingFilter === "true" ? "bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"}`}>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.schooling}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{listDict.statSchooling}</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5 w-full">
        
        <div className="relative flex-grow min-w-[200px] sm:min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input placeholder={listDict.searchPlaceholder} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-12 h-12 rounded-xl text-base font-medium bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:border-blue-500 w-full transition-colors shadow-sm" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:flex-nowrap lg:justify-end">
          
          <Button variant="outline" onClick={() => handleSort(sortOrder === "asc" ? "desc" : "asc")} className="flex-1 sm:flex-none shrink-0 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-12 rounded-xl font-bold shadow-sm px-5" title={sortOrder === "asc" ? listDict.sortAsc : listDict.sortDesc}>
            {sortOrder === "asc" ? <ArrowDownAZ className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-500" /> : <ArrowUpZA className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-500" />}
            {lang === 'id' ? "Urutkan" : "Sort"}
          </Button>

          <div className="relative flex-1 sm:flex-none shrink-0 sm:w-44">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={difficultyFilter} onChange={(e) => handleDiffFilter(e.target.value)} className="w-full h-12 appearance-none rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-11 pr-8 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer">
              <option value="all">{listDict.allLevels}</option>
              <option value="easy">{listDict.easy}</option>
              <option value="medium">{listDict.medium}</option>
              <option value="hard">{listDict.hard}</option>
            </select>
          </div>

          <div className="relative flex-1 sm:flex-none shrink-0 sm:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={compatFilter} onChange={(e) => handleCompatFilter(e.target.value)} className="w-full h-12 appearance-none rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-11 pr-8 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer">
              <option value="all">{listDict.allCompat}</option>
              <option value="peaceful">{listDict.compatPeaceful}</option>
              <option value="semi-aggressive">{listDict.compatSemi}</option>
              <option value="aggressive">{listDict.compatAggro}</option>
            </select>
          </div>

          {role !== "user" && (
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-1 lg:mt-0">
              <Link href="/dashboard/fishes/archive" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full h-12 px-5 rounded-xl font-bold border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors active:scale-95">
                  <Archive className="mr-2 h-4 w-4" /> {listDict.btnArchive}
                </Button>
              </Link>
              <Link href="/dashboard/fishes/create" className="flex-1 sm:flex-none">
                <Button className="w-full h-12 px-5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors active:scale-95 shadow-lg shadow-blue-600/20">
                  <Plus className="mr-2 h-5 w-5" /> {listDict.btnAdd}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {processedFishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-20 text-center transition-colors">
          <Fish className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">{listDict.notFoundTitle}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{listDict.notFoundDesc}</p>
          <Button variant="link" onClick={() => handleQuickFilter("total")} className="mt-4 text-blue-600 dark:text-blue-400">{listDict.btnReset}</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
            {displayedFishes.map((fish, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <div key={fish.id} className="relative group animate-in fade-in zoom-in duration-300">
                  <div className="absolute -left-3 -top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-lg shadow-black/20 dark:shadow-black border-2 border-white dark:border-slate-950 transition-all group-hover:scale-110">
                    {globalIndex}
                  </div>
                  <FishCard fish={fish} />
                </div>
              );
            })}
          </div>

          {/* ADVANCED PAGINATION UI (Matches PlantList exactly but in Blue) */}
          {totalPages > 1 && (
            <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 gap-4 transition-colors">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
                {listDict.showing} <span className="font-medium text-gray-900 dark:text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {listDict.to} <span className="font-medium text-gray-900 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, processedFishes.length)}</span> {listDict.of} <span className="font-medium text-gray-900 dark:text-slate-200">{processedFishes.length}</span> {listDict.data}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={listDict.tooltipFirst}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={listDict.tooltipPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map(num => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    onClick={() => setCurrentPage(num)}
                    className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium transition-all ${
                      currentPage === num 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md shadow-blue-600/20 scale-105' 
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {num}
                  </Button>
                ))}

                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={listDict.tooltipNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors" title={listDict.tooltipLast}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-2 sm:ml-4 border-l border-slate-300 dark:border-slate-700 pl-2 sm:pl-4 transition-colors">
                  <span className="hidden sm:inline">{listDict.page}</span>
                  <Input 
                    type="number" min={1} max={totalPages} value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) setCurrentPage(val);
                    }}
                    className="w-14 h-8 text-center bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 transition-colors"
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