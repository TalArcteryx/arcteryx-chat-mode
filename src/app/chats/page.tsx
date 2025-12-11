"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SidebarMenu from "@/components/SidebarMenu";
import { MessageCircle, ArrowLeft, Trash2, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import { getTranslation } from "@/lib/translations";

export default function ChatsPage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { languageCode } = useLanguage();
  const { messages, clearMessages } = useChat();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Check if there's actual conversation (more than just initial message)
    const hasConversation = messages.length > 1 || 
      (messages.length === 1 && messages[0]?.role === "user");
    setHasHistory(hasConversation);
  }, [messages]);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      clearMessages();
      setHasHistory(false);
    }
  };

  const getChatPreview = () => {
    // Get the first user message as preview
    const firstUserMessage = messages.find(m => m.role === "user");
    if (firstUserMessage) {
      return firstUserMessage.content.length > 100 
        ? firstUserMessage.content.substring(0, 100) + "..."
        : firstUserMessage.content;
    }
    // Or get the first assistant message
    const firstAssistantMessage = messages.find(m => m.role === "assistant");
    if (firstAssistantMessage) {
      return firstAssistantMessage.content.length > 100
        ? firstAssistantMessage.content.substring(0, 100) + "..."
        : firstAssistantMessage.content;
    }
    return "Chat conversation";
  };

  const getMessageCount = () => {
    return messages.filter(m => m.role === "user").length;
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
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{getTranslation("menu.chats", languageCode)}</h1>
                  <p className="text-muted-foreground mt-1">View and manage your chat history</p>
                </div>
              </div>
              {hasHistory && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </button>
              )}
            </div>

            <div className="space-y-4">
              {hasHistory ? (
                <Link
                  href="/"
                  className="block border border-border rounded-lg p-6 bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <h3 className="font-semibold text-lg">Current Chat</h3>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {getChatPreview()}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getMessageCount()} {getMessageCount() === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Continue →
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="border border-border rounded-lg p-6 bg-card">
                  <p className="text-muted-foreground text-center py-12">
                    No chat history yet. Start a new chat to see your conversations here.
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

