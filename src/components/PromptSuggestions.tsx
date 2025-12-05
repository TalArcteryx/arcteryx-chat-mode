"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

interface PromptSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  visible: boolean;
}

const firstLineKeys = [
  "suggestions.browseOutlet",
  "suggestions.veilance",
  "suggestions.rebird",
];

const secondLineKeys = [
  "suggestions.top10JacketsWomen",
  "suggestions.top10JacketsMen",
  "suggestions.top10Pants",
  "suggestions.top10Shoes"
];

export default function PromptSuggestions({ onSuggestionClick, visible }: PromptSuggestionsProps) {
  const { languageCode } = useLanguage();
  
  if (!visible) return null;

  const firstLineSuggestions = firstLineKeys.map(key => getTranslation(key, languageCode));
  const secondLineSuggestions = secondLineKeys.map(key => getTranslation(key, languageCode));

  return (
    <div className="mb-6">
      {/* First Line */}
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto mb-3">
        {firstLineSuggestions.map((suggestion, index) => (
          <button
            key={`first-${index}`}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm rounded-full border border-border transition-all duration-200 hover:scale-105 hover:border-primary cursor-pointer"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animation: `fadeInUp 0.6s ease-out ${index * 100}ms both`
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
      
      {/* Second Line */}
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
        {secondLineSuggestions.map((suggestion, index) => (
          <button
            key={`second-${index}`}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm rounded-full border border-border transition-all duration-200 hover:scale-105 hover:border-primary cursor-pointer"
            style={{ 
              animationDelay: `${(firstLineSuggestions.length + index) * 100}ms`,
              animation: `fadeInUp 0.6s ease-out ${(firstLineSuggestions.length + index) * 100}ms both`
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
