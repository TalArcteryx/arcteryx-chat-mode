export const countryFlags: Record<string, string> = {
  "Canada": "🇨🇦",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Spain": "🇪🇸",
  "Italy": "🇮🇹",
  "Japan": "🇯🇵",
  "China": "🇨🇳",
  "South Korea": "🇰🇷",
};

export function getCountryFlag(countryName: string): string {
  return countryFlags[countryName] || "🌍";
}

