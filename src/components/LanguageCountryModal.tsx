"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { countries, languageNames, getCountryByName, getCountryByCode, getLanguagesForCountry } from "@/lib/countries";

interface LanguageCountryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LanguageCountryModal({ isOpen: controlledIsOpen, onClose }: LanguageCountryModalProps = {}) {
  const { setPreferences, hasSelectedPreferences, country, languageCode } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>("");

  // Pre-populate with current selections when modal opens
  useEffect(() => {
    if (controlledIsOpen !== undefined ? controlledIsOpen : !hasSelectedPreferences) {
      if (country && languageCode) {
        const countryData = getCountryByName(country);
        if (countryData) {
          setSelectedCountry(countryData.code);
          setSelectedLanguage(languageNames[languageCode] || "");
          setSelectedLanguageCode(languageCode);
        }
      } else {
        // Reset if no current selection
        setSelectedCountry("");
        setSelectedLanguage("");
        setSelectedLanguageCode("");
      }
    }
  }, [controlledIsOpen, hasSelectedPreferences, country, languageCode]);

  const availableLanguages = getLanguagesForCountry(selectedCountry);

  const handleContinue = () => {
    if (selectedCountry && selectedLanguage && selectedLanguageCode) {
      const countryData = getCountryByCode(selectedCountry);
      const countryName = countryData?.name || "";
      setPreferences(countryName, selectedLanguage, selectedLanguageCode);
      if (onClose) {
        onClose();
      }
    }
  };

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : !hasSelectedPreferences;

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Country and Language</DialogTitle>
          <DialogDescription>
            Please choose your country and preferred language to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Country Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedLanguage("");
                setSelectedLanguageCode("");
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selection */}
          {selectedCountry && (
            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <select
                value={selectedLanguageCode}
                onChange={(e) => {
                  const langCode = e.target.value;
                  const langName = languageNames[langCode] || "";
                  setSelectedLanguageCode(langCode);
                  setSelectedLanguage(langName);
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a language</option>
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedCountry || !selectedLanguage || !selectedLanguageCode}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

