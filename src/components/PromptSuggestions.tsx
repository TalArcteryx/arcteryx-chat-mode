"use client";

interface PromptSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  visible: boolean;
}

const suggestions = [
  "Vancouver's best neighborhoods",
  "Rent negotiation tips",
  "Home buying checklist"
];

export default function PromptSuggestions({ onSuggestionClick, visible }: PromptSuggestionsProps) {
  if (!visible) return null;

  return (
    <div className="mb-6">
      <div className="text-center mb-4">
        <p className="text-muted-foreground text-sm">Try asking about:</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
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
