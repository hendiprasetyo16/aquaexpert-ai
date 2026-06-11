"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import id from '@/dictionaries/id.json';
import en from '@/dictionaries/en.json';

type Language = 'id' | 'en';
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
    if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('aquaexpert_lang', lang); // Simpan ke memori
  };

  // Mencegah error "Hydration Mismatch" di Next.js saat memuat dari memori
  if (!mounted) return <div className="hidden">Memuat Bahasa...</div>;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      dict: language === 'id' ? id : en 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage harus digunakan di dalam LanguageProvider');
  }
  return context;
};