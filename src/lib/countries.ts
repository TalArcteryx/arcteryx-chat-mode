export interface Country {
    code: string;
    name: string;
    languages: Language[];
}

export interface Language {
    code: string;
    name: string;
}

export const countries: Country[] = [
    { code: "CA", name: "Canada", languages: [{ code: "en", name: "English" }, { code: "fr", name: "Français" }] },
    { code: "US", name: "United States", languages: [{ code: "en", name: "English" }, { code: "es", name: "Español" }] },
    { code: "GB", name: "United Kingdom", languages: [{ code: "en", name: "English" }] },
    { code: "FR", name: "France", languages: [{ code: "fr", name: "Français" }] },
    { code: "DE", name: "Germany", languages: [{ code: "de", name: "Deutsch" }] },
    { code: "ES", name: "Spain", languages: [{ code: "es", name: "Español" }] },
    { code: "IT", name: "Italy", languages: [{ code: "it", name: "Italiano" }] },
    { code: "JP", name: "Japan", languages: [{ code: "ja", name: "日本語" }] },
    { code: "CN", name: "China", languages: [{ code: "zh", name: "中文" }] },
    { code: "KR", name: "South Korea", languages: [{ code: "ko", name: "한국어" }] },
];

export const languageNames: Record<string, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    ja: "日本語",
    zh: "中文",
    ko: "한국어",
};

/**
 * Get country data by country code
 */
export function getCountryByCode(code: string): Country | undefined {
    return countries.find((c) => c.code === code);
}

/**
 * Get country data by country name
 */
export function getCountryByName(name: string): Country | undefined {
    return countries.find((c) => c.name === name);
}

/**
 * Get language name by language code
 */
export function getLanguageName(code: string): string {
    return languageNames[code] || "";
}

/**
 * Get available languages for a country
 */
export function getLanguagesForCountry(countryCode: string): Language[] {
    const country = getCountryByCode(countryCode);
    return country?.languages || [];
}



