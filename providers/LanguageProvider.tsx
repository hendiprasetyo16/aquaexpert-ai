"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import idDict from "@/dictionaries/id.json";
import enDict from "@/dictionaries/en.json";

interface LanguageContextType {
  lang: string;
  setLang: (l: string) => void;
  dict: any;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "id",
  setLang: () => {},
  dict: idDict,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<string>("id");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored) setLang(stored);
    } catch (e) {
      // ignore (SSR safety)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch (e) {}
  }, [lang]);

  const dict = lang === "en" ? enDict : idDict;

  return (
    <LanguageContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
