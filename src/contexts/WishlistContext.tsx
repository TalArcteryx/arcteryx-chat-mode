"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface WishlistContextType {
  wishlistedIds: Set<string>;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  getWishlistCount: () => number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setWishlistedIds(new Set(ids));
      }
    } catch (error) {
      console.error('Failed to load wishlist from localStorage:', error);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(Array.from(wishlistedIds)));
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error);
    }
  }, [wishlistedIds]);

  const addToWishlist = (productId: string) => {
    setWishlistedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlistedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const isWishlisted = (productId: string) => {
    return wishlistedIds.has(productId);
  };

  const getWishlistCount = () => {
    return wishlistedIds.size;
  };

  const clearWishlist = () => {
    setWishlistedIds(new Set());
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistedIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isWishlisted,
        getWishlistCount,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}



