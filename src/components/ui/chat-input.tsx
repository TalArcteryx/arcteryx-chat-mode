"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask anything...",
  disabled = false,
  isLoading = false,
  className = ""
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="h-16 text-lg px-6 py-4 bg-card border-border hover:border-foreground/20 focus:border-border focus:ring-0 focus:outline-none focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-[0px] focus-visible:ring-ring/0 hover:outline-none transition-colors"
          autoFocus={!isLoading}
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className="absolute right-2 top-2 h-12 w-12 p-0 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
            </div>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            >
              <path d="m12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
        </Button>
      </div>
    </form>
  );
}
