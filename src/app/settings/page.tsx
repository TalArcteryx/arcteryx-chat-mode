"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SidebarMenu from "@/components/SidebarMenu";
import { Settings, Bell, Globe, Moon, Shield, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getTranslation } from "@/lib/translations";
import { countries, languageNames, getCountryByName, getCountryByCode, getLanguagesForCountry } from "@/lib/countries";

export default function SettingsPage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const { theme, toggleTheme, isDark } = useTheme();
  const { country, language, languageCode, setPreferences } = useLanguage();
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>("");

  // Initialize selected values from context
  useEffect(() => {
    if (country && languageCode) {
      const countryData = getCountryByName(country);
      if (countryData) {
        setSelectedCountryCode(countryData.code);
        setSelectedLanguageCode(languageCode);
      }
    }
  }, [country, languageCode]);

  const availableLanguages = getLanguagesForCountry(selectedCountryCode);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const newCountryData = getCountryByCode(countryCode);

    // Auto-select first available language when country changes
    if (newCountryData && newCountryData.languages.length > 0) {
      const firstLanguage = newCountryData.languages[0];
      setSelectedLanguageCode(firstLanguage.code);
      setPreferences(newCountryData.name, firstLanguage.name, firstLanguage.code);
    } else {
      setSelectedLanguageCode("");
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguageCode(langCode);
    const langName = languageNames[langCode] || "";
    const countryData = getCountryByCode(selectedCountryCode);
    const countryName = countryData?.name || country;
    setPreferences(countryName, langName, langCode);
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <SidebarMenu
        isExpanded={isMenuExpanded}
        onToggle={() => setIsMenuExpanded(!isMenuExpanded)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back to Chat Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{getTranslation("nav.backToChat", languageCode)}</span>
            </Link>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.settings", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">Manage your preferences and account settings</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates about your orders and promotions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Language & Region</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Country/Region</label>
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a country</option>
                      {countries.map((countryOption) => (
                        <option key={countryOption.code} value={countryOption.code}>
                          {countryOption.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={selectedLanguageCode}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      disabled={!selectedCountryCode}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a language</option>
                      {availableLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Moon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Appearance</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDark}
                        onChange={toggleTheme}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Privacy & Security</h2>
                </div>
                <div className="space-y-4">
                  <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-left">
                    Change Password
                  </button>
                  <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-left">
                    Two-Factor Authentication
                  </button>
                  <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-left text-destructive">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

