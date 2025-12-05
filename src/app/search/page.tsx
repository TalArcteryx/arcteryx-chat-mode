"use client";

import { useState } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

export default function SearchPage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { languageCode } = useLanguage();

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <SidebarMenu 
        isExpanded={isMenuExpanded} 
        onToggle={() => setIsMenuExpanded(!isMenuExpanded)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.search", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">Search for products, orders, and more</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, orders, or anything..."
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {searchQuery && (
                <div className="border border-border rounded-lg p-6 bg-card">
                  <p className="text-muted-foreground text-center py-8">
                    No results found for &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

