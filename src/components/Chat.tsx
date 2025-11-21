"use client";

import { useState, useRef, useEffect } from "react";
import ChatInput from "@/components/ui/chat-input";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface ChatProps {
  initialMessage?: string;
}

// Helper function to add delay for more realistic streaming
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Chat({ initialMessage }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: "assistant",
      content: "Hello! I'm your AI assistant powered by GPT-4o mini. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [hasUserMessage, setHasUserMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-send initial message if provided (only once)
  useEffect(() => {
    if (initialMessage && messages.length === 1) {
      // Add a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        handleInitialMessage(initialMessage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleInitialMessage = async (message: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: message,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "assistant", content: messages[0].content }, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream finished, add the complete message
              const assistantMessage: Message = {
                id: generateId(),
                role: "assistant",
                content: accumulatedContent,
              };
              setMessages(prev => [...prev, assistantMessage]);
              // Add a small delay before hiding streaming message for smoother transition
              setTimeout(() => setStreamingMessage(""), 100);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingMessage(accumulatedContent);
                // Add a small delay to make streaming more visible
                await delay(50); // 50ms delay between chunks
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setStreamingMessage("");
    
    // Set hasUserMessage to true immediately to hide suggestions
    setHasUserMessage(true);
    
    // Trigger smooth scroll to bottom when sending
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream finished, add the complete message
              const assistantMessage: Message = {
                id: generateId(),
                role: "assistant",
                content: accumulatedContent,
              };
              setMessages(prev => [...prev, assistantMessage]);
              // Add a small delay before hiding streaming message for smoother transition
              setTimeout(() => setStreamingMessage(""), 100);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingMessage(accumulatedContent);
                // Add a small delay to make streaming more visible
                await delay(50); // 50ms delay between chunks
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-background overflow-hidden">
      {/* Messages Area - Full width to window */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-8 space-y-12">
        {/* Chat content wrapper - centered with max width matching input */}
        <div className="max-w-3xl mx-auto w-full">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } ${message.role === "user" ? "opacity-0 animate-fade-in-up" : ""} mb-6`}
            style={{ 
              ...(message.role === "user" && {
                animationDelay: `${index * 100}ms`,
                animation: `fadeInUp 0.6s ease-out ${index * 100}ms forwards`
              })
            }}
          >
            {message.role === "assistant" && index === 0 ? null : (
              <div
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-sm"
                    : "text-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                ) : (
                  <div className="text-sm prose max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* Streaming message */}
        {streamingMessage && (
          <div className="flex justify-start mb-6">
            <div className="text-foreground">
              <div className="text-sm prose max-w-none">
                <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                <span className="inline animate-pulse ml-1">▋</span>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && !streamingMessage && (
          <div className="flex justify-start mb-6">
            <div className="text-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleSubmit}
            placeholder="Ask anything..."
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
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
        
        /* Custom styling for lists in markdown */
        :global(.prose ul) {
          list-style-type: disc !important;
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        
        :global(.prose ol) {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        
        :global(.prose li) {
          margin: 0.25rem 0 !important;
          line-height: 1.5 !important;
          display: list-item !important;
        }
        
        :global(.prose ul li) {
          display: list-item !important;
          list-style-position: outside !important;
        }
        
        :global(.prose ol li) {
          display: list-item !important;
          list-style-position: outside !important;
        }
        
        /* Force proper list display */
        :global(.prose ol > li) {
          display: list-item !important;
          list-style-position: outside !important;
        }
        
        :global(.prose ul > li) {
          display: list-item !important;
          list-style-position: outside !important;
        }
        
        :global(.prose ul li::marker) {
          color: var(--foreground) !important;
        }
        
        :global(.prose ol li::marker) {
          color: var(--foreground) !important;
        }
      `}</style>
    </div>
  );
}
