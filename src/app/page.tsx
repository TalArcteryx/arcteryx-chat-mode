"use client";

import { useState } from "react";
import Image from "next/image";
import Chat from "@/components/Chat";
import ChatInput from "@/components/ui/chat-input";
import PromptSuggestions from "@/components/PromptSuggestions";

export default function Home() {
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [inputValue, setInputValue] = useState("");

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
      <div className="min-h-screen bg-background">
        {/* Header with New Chat button */}
        <div className="p-4 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={handleNewChat}
              className="text-foreground hover:bg-muted px-4 py-2 rounded-md transition-colors"
            >
              ← New Chat
            </button>
          </div>
        </div>
        
        <Chat initialMessage={inputValue} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.jpg"
            alt="Arc'teryx Logo"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Logo/Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2 -mt-6">
            Arc'teryx Chat
          </h1>
          <p className="text-muted-foreground text-lg">
            your personal assistant
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
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleStartChat}
            placeholder="Ask anything..."
          />
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl">
          <p>
            Arc'teryx Chat is your intelligent assistant, ready to help you with any questions or tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
