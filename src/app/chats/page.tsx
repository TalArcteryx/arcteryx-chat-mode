"use client";

import { useState } from "react";
import Link from "next/link";
import SidebarMenu from "@/components/SidebarMenu";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";

export default function ChatsPage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
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
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.chats", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">View and manage your chat history</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-border rounded-lg p-6 bg-card">
                <p className="text-muted-foreground text-center py-12">
                  No chat history yet. Start a new chat to see your conversations here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

