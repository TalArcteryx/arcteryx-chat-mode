"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, SquarePen } from "lucide-react";
import Chat from "@/components/Chat";
import ChatInput from "@/components/ui/chat-input";
import PromptSuggestions from "@/components/PromptSuggestions";
import SuggestionCard from "@/components/SuggestionCard";
import CartSidebar from "@/components/CartSidebar";
import SidebarMenu from "@/components/SidebarMenu";
import LanguageCountryModal from "@/components/LanguageCountryModal";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import { getTranslation } from "@/lib/translations";
import { getCountryFlag } from "@/lib/countryFlags";

function HomeContent() {
  const { messages } = useChat();
  const [isChatStarted, setIsChatStarted] = useState(() => {
    // Auto-start chat if there's existing history (more than just the initial message)
    if (typeof window !== 'undefined') {
      try {
        const savedMessages = localStorage.getItem('chatHistory');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          // If there are more than 1 message (initial + at least one user/assistant exchange), show chat
          return parsed.length > 1;
        }
      } catch (error) {
        console.error('Failed to check chat history:', error);
      }
    }
    return false;
  });
  const [inputValue, setInputValue] = useState("");
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const { toggleCart, getTotalItems } = useCart();
  const { country, language, languageCode, hasSelectedPreferences } = useLanguage();

  // Update isChatStarted when messages change (e.g., when navigating back with history)
  // Only show chat if there's actual conversation (more than just the initial welcome message)
  useEffect(() => {
    const hasConversation = messages.length > 1 ||
      (messages.length === 1 && messages[0]?.role === "user");
    if (hasConversation && !isChatStarted) {
      setIsChatStarted(true);
    }
  }, [messages, isChatStarted]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsChatStarted(true);
    }
  };

  const handleNewChat = () => {
    setIsChatStarted(false);
    setInputValue("");
  };

  if (isChatStarted) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Sidebar */}
        <SidebarMenu
          isExpanded={isMenuExpanded}
          onToggle={() => setIsMenuExpanded(!isMenuExpanded)}
        />

        {/* Main Content Area with Cart Sidebar */}
        <div className="flex-1 flex min-w-0">
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header with New Chat button, Country/Language, and Cart */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 text-foreground hover:bg-muted px-4 py-2 rounded-md transition-colors"
              >
                <SquarePen className="w-4 h-4" />
                {getTranslation("chat.newChat", languageCode)}
              </button>
              <div className="flex items-center gap-4">
                {country && language && (
                  <button
                    onClick={() => setIsLanguageModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="text-lg">{getCountryFlag(country)}</span>
                    <span>{country}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{language}</span>
                  </button>
                )}
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-md hover:bg-muted transition-colors"
                  aria-label={getTranslation("nav.cart", languageCode)}
                >
                  <ShoppingBag className="w-6 h-6" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <Chat initialMessage={inputValue} />
          </div>

          {/* Cart Sidebar - within main area, slides from right */}
          <CartSidebar />
        </div>

        <LanguageCountryModal
          isOpen={isLanguageModalOpen || !hasSelectedPreferences}
          onClose={() => setIsLanguageModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <SidebarMenu
        isExpanded={isMenuExpanded}
        onToggle={() => setIsMenuExpanded(!isMenuExpanded)}
      />

      {/* Main Content Area with Cart Sidebar */}
      <div className="flex-1 flex min-w-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with Country/Language and Cart */}
          <div className="p-4 border-b border-border flex items-center justify-end gap-4">
            {country && language && (
              <button
                onClick={() => setIsLanguageModalOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <span className="text-lg">{getCountryFlag(country)}</span>
                <span>{country}</span>
                <span className="text-muted-foreground">•</span>
                <span>{language}</span>
              </button>
            )}
            <button
              onClick={toggleCart}
              className="relative p-2 rounded-md hover:bg-muted transition-colors"
              aria-label={getTranslation("nav.cart", languageCode)}
            >
              <ShoppingBag className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <Link href="/" className="mb-8 cursor-pointer hover:opacity-80 transition-opacity">
              <Image
                src="/logo.svg"
                alt="Arc'teryx Logo"
                width={120}
                height={120}
                priority
              />
            </Link>

            {/* Logo/Title */}
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-lg">
                {getTranslation("home.subtitle", languageCode)}
              </p>
            </div>

            {/* Large Input Area */}
            <div className="w-full max-w-3xl">
              <PromptSuggestions
                onSuggestionClick={(suggestion) => {
                  setInputValue(suggestion);
                  // Auto-start chat with the suggestion
                  setIsChatStarted(true);
                }}
                visible={true}
              />

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <SuggestionCard
                  imageUrl="https://cdn.sanity.io/images/inkbj32c/production/f913be212c5309b4fe6fd98536040cd6378c93ea-3840x2160.jpg?rect=292,0,2958,2160&w=953&h=696&q=100&auto=format&dpr=2"
                  title={getTranslation("card.newWinterKits.title", languageCode)}
                  description={getTranslation("card.newWinterKits.description", languageCode)}
                  onClick={() => {
                    setInputValue(getTranslation("card.newWinterKits.title", languageCode));
                    setIsChatStarted(true);
                  }}
                />
                <SuggestionCard
                  imageUrl="https://cdn.sanity.io/images/inkbj32c/production/fb2e46f0455efaecf2e901dba6fc1e49fc9db0c1-1920x1080.png?rect=221,0,1479,1080&w=953&h=696&q=100&auto=format&dpr=1"
                  title={getTranslation("card.grottoflage.title", languageCode)}
                  description={getTranslation("card.grottoflage.description", languageCode)}
                  onClick={() => {
                    setInputValue(getTranslation("card.grottoflage.title", languageCode));
                    setIsChatStarted(true);
                  }}
                />
              </div>

              <ChatInput
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onSubmit={handleStartChat}
                placeholder={getTranslation("home.input.placeholder", languageCode)}
              />
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl">
              <p>
                {getTranslation("home.description", languageCode)}
              </p>
            </div>
          </div>
        </div>

        {/* Cart Sidebar - within main area, slides from right */}
        <CartSidebar />
      </div>

      <LanguageCountryModal
        isOpen={isLanguageModalOpen || !hasSelectedPreferences}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
