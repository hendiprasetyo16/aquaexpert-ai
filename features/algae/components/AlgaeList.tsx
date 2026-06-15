// features/algae/components/AlgaeList.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAlgaeList } from "../repositories/algae.repository";
import { Algae } from "../types/algae.types";
import { useAuth } from "@/hooks/useAuth";
import AlgaeCard from "./AlgaeCard";

import { Loader2, Plus, Archive, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, ArrowDownAZ, ArrowUpZA, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/providers/LanguageProvider";

const ITEMS_PER_PAGE = 12;

export default function AlgaeList() {
  const { role } = useAuth();
  const { dict, language } = useLanguage();
  
  const [algaeData, setAlgaeData] = useState<Algae[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all"); // all, low, medium, high
  
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAlgaeList();
        setAlgaeData(data);
      } catch (error) {
        console.error("Gagal memuat daftar alga:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const savedPage = sessionStorage.getItem("algaePage");
    if (savedPage) setCurrentPage(Number(savedPage));
    const savedSearch = sessionStorage.getItem("algaeSearch");
    if (savedSearch) setSearchQuery(savedSearch);
    const savedDiff = sessionStorage.getItem("algaeDiff");
    if (savedDiff) setDifficultyFilter(savedDiff);
    const savedSev = sessionStorage.getItem("algaeSev");
    if (savedSev) setSeverityFilter(savedSev);
    const savedSort = sessionStorage.getItem("algaeSort");
    if (savedSort) setSortOrder(savedSort as "asc" | "desc");

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("algaePage", currentPage.toString());
    sessionStorage.setItem("algaeSearch", searchQuery);
    sessionStorage.setItem("algaeDiff", difficultyFilter);
    sessionStorage.setItem("algaeSev", severityFilter);
    sessionStorage.setItem("algaeSort", sortOrder);
  }, [currentPage, searchQuery, difficultyFilter, severityFilter, sortOrder, isHydrated]);

  const handleSearch = (val: string) => { setSearchQuery(val); setCurrentPage(1); };
  const handleSort = (val: "asc" | "desc") => { setSortOrder(val); setCurrentPage(1); };

  const handleQuickFilter = (type: "total" | "high" | "medium" | "low") => {
    setCurrentPage(1);
    setSearchQuery("");
    if (type === "total") { setDifficultyFilter("all"); setSeverityFilter("all"); } 
    else if (type === "high") { setDifficultyFilter("all"); setSeverityFilter("high"); } 
    else if (type === "medium") { setDifficultyFilter("all"); setSeverityFilter("medium"); } 
    else if (type === "low") { setDifficultyFilter("all"); setSeverityFilter("low"); } 
  };

  const processedAlgae = algaeData
    .filter((algae) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        algae.name_id.toLowerCase().includes(searchLower) ||
        (algae.name_en && algae.name_en.toLowerCase().includes(searchLower)) ||
        (algae.alias && algae.alias.toLowerCase().includes(searchLower)) ||
        (algae.scientific_name && algae.scientific_name.toLowerCase().includes(searchLower));

      const matchesDiff = difficultyFilter === "all" ? true : algae.difficulty?.toLowerCase() === difficultyFilter;
      
      let matchesSev = true;
      if (severityFilter === "high") matchesSev = algae.severity >= 4;
      else if (severityFilter === "medium") matchesSev = algae.severity === 3;
      else if (severityFilter === "low") matchesSev = algae.severity <= 2;

      return matchesSearch && matchesDiff && matchesSev;
    })
    .sort((a, b) => {
      const nameA = language === 'en' && a.name_en ? a.name_en : a.name_id;
      const nameB = language === 'en' && b.name_en ? b.name_en : b.name_id;
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
    });

  const totalPages = Math.max(1, Math.ceil(processedAlgae.length / ITEMS_PER_PAGE));
  const displayedAlgae = processedAlgae.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const maxVisiblePages = 4;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const stats = {
    total: algaeData.length,
    high: algaeData.filter(a => a.severity >= 4).length,
    medium: algaeData.filter(a => a.severity === 3).length,
    low: algaeData.filter(a => a.severity <= 2).length,
  };

  const isTotalActive = difficultyFilter === "all" && severityFilter === "all";

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{dict.algaeExpert?.listTitle}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">{dict.algaeExpert?.listSubtitle}</p>
        </div>

        {/* QUICK FILTERS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div onClick={() => handleQuickFilter("total")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isTotalActive ? "bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400 border-transparent" : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.algaeExpert?.statTotal}</span>
          </div>
          <div onClick={() => handleQuickFilter("high")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${severityFilter === "high" ? "bg-red-50 dark:bg-red-950/60 ring-2 ring-red-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-red-200 dark:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/30"}`}>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.high}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.algaeExpert?.statHighRisk}</span>
          </div>
          <div onClick={() => handleQuickFilter("medium")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${severityFilter === "medium" ? "bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30"}`}>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.medium}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.algaeExpert?.statMediumRisk}</span>
          </div>
          <div onClick={() => handleQuickFilter("low")} className={`p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${severityFilter === "low" ? "bg-green-50 dark:bg-green-950/60 ring-2 ring-green-500 border-transparent" : "bg-white dark:bg-slate-900/80 border border-green-200 dark:border-green-900/50 hover:bg-green-50/50 dark:hover:bg-green-950/30"}`}>
            <span className="text-2xl font-black text-green-600 dark:text-green-400">{stats.low}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">{dict.algaeExpert?.statLowRisk}</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-6 xl:flex-row xl:items-center xl:justify-between transition-colors">
        <div className="relative w-full xl:max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder={dict.algaeExpert?.searchPlaceholder} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:border-teal-500 w-full" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <Button variant="outline" onClick={() => handleSort(sortOrder === "asc" ? "desc" : "asc")} className="flex-1 sm:flex-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            {sortOrder === "asc" ? <ArrowDownAZ className="mr-2 h-4 w-4 text-teal-600" /> : <ArrowUpZA className="mr-2 h-4 w-4 text-teal-600" />}
            Urutkan
          </Button>

          <div className="relative w-full sm:w-56 shrink-0">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }} className="w-full h-12 appearance-none rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-11 pr-8 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-teal-500 transition-all cursor-pointer shadow-sm">
              <option value="all">{dict.algaeExpert?.allSeverities}</option>
              <option value="high">{dict.algaeExpert?.statHighRisk}</option>
              <option value="medium">{dict.algaeExpert?.statMediumRisk}</option>
              <option value="low">{dict.algaeExpert?.statLowRisk}</option>
            </select>
          </div>

          {role !== "user" && (
            <>
              <Link href="/dashboard/algae/archive" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <Archive className="mr-2 h-4 w-4" /> {dict.algaeExpert?.btnArchive}
                </Button>
              </Link>
              <Link href="/dashboard/algae/create" className="flex-1 sm:flex-none">
                <Button className="w-full bg-teal-600 text-white hover:bg-teal-500">
                  <Plus className="mr-2 h-4 w-4" /> {dict.algaeExpert?.btnAdd}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {processedAlgae.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 py-20 text-center transition-colors">
          <Bug className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200">{dict.algaeExpert?.notFoundTitle}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dict.algaeExpert?.notFoundDesc}</p>
          <Button variant="link" onClick={() => handleQuickFilter("total")} className="mt-4 text-teal-600 dark:text-teal-400">{dict.algaeExpert?.btnReset}</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-2">
            {displayedAlgae.map((algae, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <div key={algae.id} className="relative group animate-in fade-in zoom-in duration-300">
                  <div className="absolute -left-3 -top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-lg border-2 border-white dark:border-slate-950 transition-all group-hover:scale-110">
                    {globalIndex}
                  </div>
                  <AlgaeCard algae={algae} />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col xl:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 gap-4 transition-colors">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center xl:text-left w-full xl:w-auto">
                {dict.algaeExpert?.showing} <span className="font-medium text-gray-900 dark:text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {dict.algaeExpert?.to} <span className="font-medium text-gray-900 dark:text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, processedAlgae.length)}</span> {dict.algaeExpert?.of} <span className="font-medium text-gray-900 dark:text-slate-200">{processedAlgae.length}</span> {dict.algaeExpert?.data}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map(num => (
                  <Button key={num} variant={currentPage === num ? "default" : "outline"} onClick={() => setCurrentPage(num)} className={`h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm font-medium ${currentPage === num ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-900'}`}>
                    {num}
                  </Button>
                ))}

                <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
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