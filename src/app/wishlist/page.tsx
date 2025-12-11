"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SidebarMenu from "@/components/SidebarMenu";
import Chat from "@/components/Chat";
import CartSidebar from "@/components/CartSidebar";
import { Heart, ArrowLeft, MessageCircle, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import { transformToProductCard } from "@/lib/productTransform";
import mensProductsData from "@/data/mens-products.json";
import womensProductsData from "@/data/womens-products.json";
import { Product as ProductCardType } from "@/types/productCard";
import { BaseProduct } from "@/types/product";

interface Product extends BaseProduct {
  category?: string;
}

export default function WishlistPage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { languageCode } = useLanguage();
  const { wishlistedIds, toggleWishlist, isWishlisted } = useWishlist();
  const { addToCart, toggleCart, getTotalItems } = useCart();

  // Combine all products and deduplicate by ID (keep first occurrence)
  const allProducts: Product[] = useMemo(() => {
    const mensProducts = ((mensProductsData as unknown) as { products: Product[] }).products || [];
    const womensProducts = ((womensProductsData as unknown) as { products: Product[] }).products || [];
    const combined = [...mensProducts, ...womensProducts];
    
    // Deduplicate by ID - use a Map to keep only the first occurrence of each ID
    const uniqueProducts = new Map<string, Product>();
    combined.forEach(product => {
      if (!uniqueProducts.has(product.id)) {
        uniqueProducts.set(product.id, product);
      }
    });
    
    return Array.from(uniqueProducts.values());
  }, []);

  // Filter to only wishlisted products
  const wishlistedProducts = useMemo(() => {
    return allProducts.filter(product => wishlistedIds.has(product.id));
  }, [allProducts, wishlistedIds]);

  const handleAddToCart = (product: ProductCardType) => {
    const simpleProduct = allProducts.find(p => p.id === product.id);
    if (simpleProduct) {
      // Ensure rating format matches CartContext expectations
      const cartProduct = {
        ...simpleProduct,
        rating: simpleProduct.rating
          ? {
              average: typeof simpleProduct.rating.average === 'number'
                ? simpleProduct.rating.average.toString()
                : simpleProduct.rating.average,
              count: simpleProduct.rating.count,
            }
          : undefined,
      };
      addToCart(cartProduct);
    }
  };

  const handleQuickView = (product: ProductCardType) => {
    // Convert ProductCardType back to BaseProduct format for the modal
    const simpleProduct = allProducts.find(p => p.id === product.id);
    if (simpleProduct) {
      setSelectedProduct(simpleProduct);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <SidebarMenu 
        isExpanded={isMenuExpanded} 
        onToggle={() => setIsMenuExpanded(!isMenuExpanded)} 
      />
      
      <div className="flex-1 flex min-w-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{getTranslation("nav.backToChat", languageCode)}</span>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowChat(!showChat)}
                className="relative p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Toggle Chat"
                title={showChat ? "Hide Chat" : "Show Chat"}
              >
                <MessageCircle className={`w-6 h-6 ${showChat ? 'text-primary' : ''}`} />
              </button>
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

          {/* Wishlist Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Heart className="w-8 h-8 text-primary fill-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{getTranslation("menu.wishlist", languageCode)}</h1>
                <p className="text-muted-foreground mt-1">
                  {wishlistedProducts.length === 0 
                    ? "No items in your wishlist yet"
                    : `${wishlistedProducts.length} ${wishlistedProducts.length === 1 ? 'item' : 'items'} saved`
                  }
                </p>
              </div>
            </div>

            {wishlistedProducts.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                  Your wishlist is empty
                </h2>
                <p className="text-muted-foreground">
                  Start adding items to your wishlist by clicking the heart icon on any product.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistedProducts.map((product, index) => {
                  const transformedProduct = transformToProductCard(product);
                  return (
                    <div key={`${product.id}-${product.gender || index}`} className="flex-shrink-0">
                      <ProductCard
                        product={{
                          ...transformedProduct,
                          subtitle: transformedProduct.subtitle ?? '',
                          description: transformedProduct.description ?? '',
                          rating: transformedProduct.rating ?? 0,
                          reviewCount: transformedProduct.reviewCount ?? 0,
                          sizes: transformedProduct.sizes ?? [],
                          features: transformedProduct.features ?? [],
                          activities: transformedProduct.activities ?? [],
                          collection: transformedProduct.collection ?? ''
                        }}
                        onAddToCart={handleAddToCart}
                        onQuickView={handleQuickView}
                        isWishlisted={isWishlisted(product.id)}
                        onToggleWishlist={toggleWishlist}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div
          className={`h-full bg-card border-l border-border shadow-lg flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
            showChat ? "w-96 opacity-100" : "w-0 opacity-0 border-0"
          }`}
        >
          <div className={`min-w-[384px] h-full flex flex-col transition-opacity duration-300 ${
            showChat ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Chat Assistant</h2>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Close Chat"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <Chat />
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <CartSidebar />
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

