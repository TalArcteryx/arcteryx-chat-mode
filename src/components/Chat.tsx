"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatInput from "@/components/ui/chat-input";
import ReactMarkdown from "react-markdown";
import ProductCarousel from "@/components/ProductCarousel";
import ProductModal from "@/components/ProductModal";
import CompleteYourLookProducts from "@/components/CompleteYourLookProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useChat } from "@/contexts/ChatContext";
import { getTranslation } from "@/lib/translations";
import { BaseProduct } from "@/types/product";

interface Product extends BaseProduct {}

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  products?: Product[];
}

interface ChatProps {
  initialMessage?: string;
}

// Helper function to add delay for more realistic streaming
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Chat({ initialMessage }: ChatProps) {
  const { languageCode } = useLanguage();
  const { items: cartItems, suggestedProducts } = useCart();
  const { messages, addMessage, setMessages } = useChat();
  const [genderPreference, setGenderPreference] = useState<"men" | "women" | null>(null);
  const prevCartItemsRef = useRef<string[]>([]);
  const prevSuggestedProductsRef = useRef<string[]>([]);
  const isInitialMountRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Initialize messages with translated initial message only if no messages exist AND no saved history
  useEffect(() => {
    if (languageCode && messages.length === 0 && !hasInitializedRef.current) {
      // Check if there's saved history in localStorage before adding initial message
      if (typeof window !== 'undefined') {
        try {
          const savedMessages = localStorage.getItem('chatHistory');
          if (savedMessages) {
            const parsed = JSON.parse(savedMessages);
            // If there's saved history, don't add initial message - let ChatContext handle it
            if (parsed.length > 0) {
              hasInitializedRef.current = true;
              return;
            }
          }
        } catch (error) {
          console.error('Failed to check chat history:', error);
        }
      }
      
      // Only add initial message if there's truly no history
      hasInitializedRef.current = true;
      const initialMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: getTranslation("chat.initialMessage", languageCode),
      };
      setMessages([initialMessage]);
    }
  }, [languageCode, messages.length, setMessages]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Watch for cart additions and add chat message
  useEffect(() => {
    // Skip on initial mount to avoid showing messages for items already in cart
    if (isInitialMountRef.current) {
      prevCartItemsRef.current = cartItems.map(item => item.id);
      isInitialMountRef.current = false;
      return;
    }

    if (cartItems.length === 0) {
      prevCartItemsRef.current = [];
      return;
    }

    const currentCartIds = cartItems.map(item => item.id);
    const prevCartIds = prevCartItemsRef.current;

    // Find newly added items
    const newItems = cartItems.filter(item => !prevCartIds.includes(item.id));
    
    if (newItems.length > 0) {
      // Show message for any newly added item
      const newestItem = newItems[newItems.length - 1];
      const message = getTranslation("chat.itemAddedToCart", languageCode || 'en')
        .replace('{productName}', newestItem.name);
      
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: message,
      };

      addMessage(assistantMessage);
    }

    prevCartItemsRef.current = currentCartIds;
  }, [cartItems, languageCode, addMessage]);

  // Watch for suggested products and add "Complete Your Look" message
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      prevSuggestedProductsRef.current = suggestedProducts.map(p => p.id);
      return;
    }

    // Only show if we have suggested products and cart has items
    if (suggestedProducts.length > 0 && cartItems.length > 0) {
      const currentSuggestedIds = suggestedProducts.map(p => p.id).sort();
      const prevSuggestedIds = prevSuggestedProductsRef.current.sort();
      
      // Check if suggested products changed (new suggestions appeared or changed)
      const idsChanged = currentSuggestedIds.length !== prevSuggestedIds.length ||
                         currentSuggestedIds.some((id, idx) => id !== prevSuggestedIds[idx]);
      
      if (idsChanged) {
        const message = getTranslation("chat.completeYourLook", languageCode || 'en');
        
        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: message,
          products: suggestedProducts.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            images: p.images,
            url: p.url,
            rating: p.rating,
            colors: p.colors,
            badges: p.badges,
            category: p.category,
            gender: p.gender,
          })),
        };

        addMessage(assistantMessage);
        prevSuggestedProductsRef.current = suggestedProducts.map(p => p.id);
      }
    } else if (suggestedProducts.length === 0) {
      prevSuggestedProductsRef.current = [];
    }
  }, [suggestedProducts, cartItems.length, languageCode, addMessage]);

  const handleInitialMessage = useCallback(async (message: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: message,
    };

    addMessage(userMessage);
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
          languageCode: languageCode,
          genderPreference: genderPreference,
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
      let extractedProducts: Product[] = [];
      let productsAdded = false;
      let shouldStopStreaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done || shouldStopStreaming) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (shouldStopStreaming) break;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream finished, add the complete message with products
              // If products exist, only add message with products (no text content)
              if (extractedProducts.length > 0 && !productsAdded) {
                const assistantMessage: Message = {
                  id: generateId(),
                  role: "assistant",
                  content: "",
                  products: extractedProducts,
                };
                addMessage(assistantMessage);
                productsAdded = true;
              } else if (accumulatedContent.trim() && !productsAdded) {
                // Only add text message if no products and there's content
                const assistantMessage: Message = {
                  id: generateId(),
                  role: "assistant",
                  content: accumulatedContent,
                };
                addMessage(assistantMessage);
              }
              // Add a small delay before hiding streaming message for smoother transition
              setTimeout(() => setStreamingMessage(""), 100);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              
              // CRITICAL: Check for products FIRST, before processing any text content
              // If products are received, handle them IMMEDIATELY and skip ALL text content
              if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
                extractedProducts = parsed.products;
                // Immediately add products and stop streaming text completely
                if (!productsAdded) {
                  const assistantMessage: Message = {
                    id: generateId(),
                    role: "assistant",
                    content: "", // NO text content when products are shown
                    products: extractedProducts,
                  };
                  addMessage(assistantMessage);
                  productsAdded = true;
                  accumulatedContent = "";
                  setStreamingMessage(""); // Clear any streaming text immediately
                  setIsLoading(false); // Stop loading immediately when products are shown
                  // Stop reading the stream - we have products, no need for text
                  shouldStopStreaming = true;
                  reader.cancel().catch(() => {}); // Cancel stream, ignore errors
                  break;
                }
                // Skip processing content when products are present
                continue;
              }
              
              // Only process text content if no products have been added
              // CRITICAL: If products were found, we should have already exited above
              if (!productsAdded && !shouldStopStreaming && parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingMessage(accumulatedContent);
                // Add a small delay to make streaming more visible
                await delay(50); // 50ms delay between chunks
              }
              
              if (parsed.genderPreference) {
                setGenderPreference(parsed.genderPreference);
              }
            } catch {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
      
      // Log final state
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
    }
  }, [messages, languageCode, genderPreference, addMessage]);

  // Auto-send initial message if provided (only once)
  useEffect(() => {
    if (initialMessage && messages.length === 1) {
      // Add a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        handleInitialMessage(initialMessage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, messages.length, handleInitialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleProductClick = (product: Product) => {
    // Open modal with product details
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: inputValue.trim(),
    };

    addMessage(userMessage);
    setInputValue("");
    setIsLoading(true);
    setStreamingMessage("");
    
    // Trigger smooth scroll to bottom when sending
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    let productsAdded = false; // Declare outside try block for error handling

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          languageCode: languageCode,
          genderPreference: genderPreference,
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
      let extractedProducts: Product[] = [];
      let shouldStopStreaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done || shouldStopStreaming) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (shouldStopStreaming) break;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream finished, add the complete message with products
              // If products exist, only add message with products (no text content)
              if (extractedProducts.length > 0 && !productsAdded) {
                const assistantMessage: Message = {
                  id: generateId(),
                  role: "assistant",
                  content: "",
                  products: extractedProducts,
                };
                addMessage(assistantMessage);
                productsAdded = true;
              } else if (accumulatedContent.trim() && !productsAdded) {
                // Only add text message if no products and there's content
                const assistantMessage: Message = {
                  id: generateId(),
                  role: "assistant",
                  content: accumulatedContent,
                };
                addMessage(assistantMessage);
              }
              // Add a small delay before hiding streaming message for smoother transition
              setTimeout(() => setStreamingMessage(""), 100);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              
              // CRITICAL: Check for products FIRST, before processing any text content
              // If products are received, handle them IMMEDIATELY and skip ALL text content
              if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
                extractedProducts = parsed.products;
                // Immediately add products and stop streaming text completely
                if (!productsAdded) {
                  const assistantMessage: Message = {
                    id: generateId(),
                    role: "assistant",
                    content: "", // NO text content when products are shown
                    products: extractedProducts,
                  };
                  addMessage(assistantMessage);
                  productsAdded = true;
                  accumulatedContent = "";
                  setStreamingMessage(""); // Clear any streaming text immediately
                  setIsLoading(false); // Stop loading immediately when products are shown
                  // Stop reading the stream - we have products, no need for text
                  shouldStopStreaming = true;
                  reader.cancel().catch(() => {}); // Cancel stream, ignore errors
                  break;
                }
                // Skip processing content when products are present
                continue;
              }
              
              // Only process text content if no products have been added
              // CRITICAL: If products were found, we should have already exited above
              if (!productsAdded && !shouldStopStreaming && parsed.content) {
                // Only accumulate content if we haven't found products
                accumulatedContent += parsed.content;
                setStreamingMessage(accumulatedContent);
                // Add a small delay to make streaming more visible
                await delay(50); // 50ms delay between chunks
              }
              
              if (parsed.genderPreference) {
                setGenderPreference(parsed.genderPreference);
              }
            } catch {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Only show error if products weren't already shown
      if (!productsAdded) {
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      addMessage(errorMessage);
      }
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
          <div key={message.id} className="w-full">
            {message.role === "assistant" && index === 0 ? null : (
              // Only show message bubble if there's content (skip if only products)
              message.content.trim() && (
                <div
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
                </div>
              )
            )}
            {/* Product display for assistant messages - outside the message bubble */}
            {message.role === "assistant" && message.products && message.products.length > 0 && (
              <div className="w-full mb-6">
                {/* Check if this is a "Complete Your Look" message by checking message content */}
                {(() => {
                  // Only show CompleteYourLookProducts if message content explicitly contains "complete your look" text
                  // For all other product messages (including empty content), show ProductCarousel
                  const messageContentLower = (message.content || '').toLowerCase().trim();
                  
                  // Check for "complete your look" in multiple languages
                  const completeYourLookPatterns = [
                    'complete your look',
                    'completez votre look',
                    'completa tu look',
                    'completa il tuo look',
                    'vervollständigen sie ihr outfit',
                    'ルックを完成',
                    '完善您的造型',
                    '룩을 완성'
                  ];
                  
                  const isCompleteYourLook = messageContentLower.length > 0 && 
                    completeYourLookPatterns.some(pattern => messageContentLower.includes(pattern));
                  
                  // If message content is empty or doesn't match "complete your look", show carousel
                  // This ensures ALL product results show carousel by default
                  return isCompleteYourLook ? (
                    <CompleteYourLookProducts 
                      products={message.products} 
                      onProductClick={handleProductClick}
                    />
                  ) : (
                <ProductCarousel 
                  products={message.products} 
                  onProductClick={handleProductClick}
                />
                  );
                })()}
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

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
