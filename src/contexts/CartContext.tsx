"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import mensProductsData from "@/data/mens-products.json";
import womensProductsData from "@/data/womens-products.json";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images?: {
    main?: string;
    hover?: string;
    colors?: Record<string, string>;
  };
  url?: string;
  rating?: {
    average?: string | null;
    count?: number;
  };
  colors?: string[];
  badges?: string[];
  category?: string;
  gender?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  suggestedProducts: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Get complementary products based on cart contents
  const suggestedProducts = useMemo(() => {
    if (items.length === 0) return [];

    // Determine gender from cart items (prefer first item's gender)
    const cartGender = items[0]?.gender || 'men';
    const productData = cartGender === 'women' ? womensProductsData : mensProductsData;
    // Cast through unknown first to handle type differences between JSON and Product interface
    const allProducts = productData.products as unknown as Product[];

    // Get categories already in cart
    const cartCategories = new Set(
      items.map(item => item.category?.toLowerCase() || '')
    );

    // Find what to suggest next
    let nextCategory: string | null = null;
    
    // Check if we have jacket → suggest pants
    if (cartCategories.has('jackets') || cartCategories.has('jacket')) {
      if (!cartCategories.has('pants') && !cartCategories.has('pant')) {
        nextCategory = 'pants';
      } else if (!cartCategories.has('footwear') && !cartCategories.has('shoe') && !cartCategories.has('shoes')) {
        nextCategory = 'footwear';
      } else if (!cartCategories.has('accessories')) {
        nextCategory = 'accessories';
      }
    }
    // Check if we have pants → suggest footwear
    else if (cartCategories.has('pants') || cartCategories.has('pant')) {
      if (!cartCategories.has('footwear') && !cartCategories.has('shoe') && !cartCategories.has('shoes')) {
        nextCategory = 'footwear';
      } else if (!cartCategories.has('accessories')) {
        nextCategory = 'accessories';
      }
    }
    // Check if we have footwear → suggest accessories
    else if (cartCategories.has('footwear') || cartCategories.has('shoe') || cartCategories.has('shoes')) {
      if (!cartCategories.has('accessories')) {
        nextCategory = 'accessories';
      }
    }

    if (!nextCategory) return [];

    // Filter products by category, exclude items already in cart
    const cartProductIds = new Set(items.map(item => item.id));
    const suggestions = allProducts
      .filter(product => {
        const productCategory = (product.category || '').toLowerCase();
        return (
          productCategory === nextCategory ||
          (nextCategory === 'pants' && (productCategory === 'pants' || productCategory === 'pant')) ||
          (nextCategory === 'footwear' && (productCategory === 'footwear' || productCategory === 'shoe' || productCategory === 'shoes')) ||
          (nextCategory === 'accessories' && productCategory === 'accessories')
        ) && !cartProductIds.has(product.id);
      })
      .slice(0, 3); // Limit to 3 suggestions

    return suggestions;
  }, [items]);

  const addToCart = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setIsOpen(true); // Open cart when item is added
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        suggestedProducts,
        addToCart,
        removeFromCart,
        updateQuantity,
        openCart,
        closeCart,
        toggleCart,
        getTotalItems,
        getTotalPrice,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

