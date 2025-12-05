"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LanguageContextType {
  country: string;
  language: string;
  languageCode: string;
  setPreferences: (country: string, language: string, languageCode: string) => void;
  hasSelectedPreferences: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [languageCode, setLanguageCode] = useState<string>("en");
  const [hasSelectedPreferences, setHasSelectedPreferences] = useState<boolean>(false);

  useEffect(() => {
    // Load preferences from localStorage on mount
    const savedCountry = localStorage.getItem("userCountry");
    const savedLanguage = localStorage.getItem("userLanguage");
    const savedLanguageCode = localStorage.getItem("userLanguageCode");

    if (savedCountry && savedLanguage && savedLanguageCode) {
      setCountry(savedCountry);
      setLanguage(savedLanguage);
      setLanguageCode(savedLanguageCode);
      setHasSelectedPreferences(true);
    }
  }, []);

  const setPreferences = (newCountry: string, newLanguage: string, newLanguageCode: string) => {
    setCountry(newCountry);
    setLanguage(newLanguage);
    setLanguageCode(newLanguageCode);
    setHasSelectedPreferences(true);
    
    // Save to localStorage
    localStorage.setItem("userCountry", newCountry);
    localStorage.setItem("userLanguage", newLanguage);
    localStorage.setItem("userLanguageCode", newLanguageCode);
  };

  return (
    <LanguageContext.Provider
      value={{
        country,
        language,
        languageCode,
        setPreferences,
        hasSelectedPreferences,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

