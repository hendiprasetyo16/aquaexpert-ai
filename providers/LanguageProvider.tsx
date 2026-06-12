// providers/LanguageProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// IMPORT MODULAR DICTIONARIES
import idCommon from '@/dictionaries/id/common.json';
import idPlants from '@/dictionaries/id/plants.json';
import enCommon from '@/dictionaries/en/common.json';
import enPlants from '@/dictionaries/en/plants.json';

// IMPORT ALGAE DICTIONARIES
import idAlgae from '@/dictionaries/id/algae.json';
import enAlgae from '@/dictionaries/en/algae.json';

// GABUNGKAN SECARA OTOMATIS
// Menggabungkan object dari berbagai file ke dalam 1 object raksasa secara "On the Fly"
// Dengan cara ini, UI lama Bapak (seperti dict.plantForm, dict.dashboard) tetap bekerja tanpa perlu refactoring komponen sama sekali!
// Kita bungkus idAlgae ke dalam key "algaeExpert" agar aman dan rapi
const id = { ...idCommon, ...idPlants, algaeExpert: idAlgae };
const en = { ...enCommon, ...enPlants, algaeExpert: enAlgae };

type Language = 'id' | 'en';
// Mengambil struktur data dari penggabungan objek agar TypeScript (IntelliSense) mendeteksi otomatis
type Dictionary = typeof id;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Baca memori browser saat aplikasi pertama dibuka
    const savedLang = localStorage.getItem('aquaexpert_lang') as Language;
    
    // Validasi agar terhindar dari manipulasi local storage yang tidak valid
    if (savedLang === 'id' || savedLang === 'en') {
      setLanguage(savedLang);
    } else {
      setLanguage('id'); 
    }
    
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('aquaexpert_lang', lang); 
  };

  // Mencegah error "Hydration Mismatch" (ketidaksesuaian HTML server dan client di Next.js)
  if (!mounted) return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-50 flex items-center justify-center">
       <span className="text-sm font-medium text-slate-500 animate-pulse">Menyiapkan Preferensi Bahasa...</span>
    </div>
  );

  const currentDict = language === 'id' ? id : en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, dict: currentDict }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook kustom untuk dipanggil di semua komponen
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('🔥 FATAL ERROR: useLanguage harus digunakan di dalam <LanguageProvider>');
  }
  
  return context;
};