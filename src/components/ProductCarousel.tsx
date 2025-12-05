"use client";

import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { Product as ProductCardType } from "@/types/productCard";
import { transformToProductCard } from "@/lib/productTransform";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { BaseProduct } from "@/types/product";

interface Product extends BaseProduct {
  category?: string;
}

interface ProductCarouselProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

export default function ProductCarousel({ products, onProductClick }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comparedIds, setComparedIds] = useState<Set<string>>(new Set());
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const itemsToShow = 3; // Number of products visible at once
  const maxIndex = Math.max(0, products.length - itemsToShow);


  const handleAddToCart = (product: ProductCardType) => {
    // Transform back to simple product format for cart
    const simpleProduct = products.find(p => p.id === product.id);
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
    if (onProductClick) {
      const simpleProduct = products.find(p => p.id === product.id);
      if (simpleProduct) {
        onProductClick(simpleProduct);
      }
    }
  };

  const handleToggleWishlist = (id: string) => {
    toggleWishlist(id);
  };

  const handleToggleCompare = (id: string) => {
    setComparedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!products || products.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Calculate transform for smooth sliding animation
  // Each card takes up 1/3 of the container (100% / itemsToShow)
  // We translate by the currentIndex * (card width + gap)
  // gap-4 = 1rem = 16px, so we calculate based on percentage
  const cardWidthPercent = 100 / itemsToShow;
  // For 3 items: each card is ~33.33%, gap is ~1.33% (16px out of ~1200px viewport)
  // Simplified: translate by currentIndex * (cardWidthPercent + small gap adjustment)
  const translateX = -(currentIndex * cardWidthPercent);

  return (
    <div className="my-6 w-full">
      <div className="relative">
        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all"
            aria-label="Previous products"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {currentIndex < maxIndex && (
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all"
            aria-label="Next products"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Product Cards Container with Animation */}
        <div className="overflow-hidden px-10">
          <div
            className="flex gap-4 transition-transform duration-700 ease-in-out will-change-transform"
            style={{
              transform: `translateX(calc(${translateX}% + ${currentIndex * 16}px))`,
            }}
          >
            {products.map((product) => {
              const productCard = transformToProductCard(product);

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0"
                  style={{
                    width: `calc((100% - ${(itemsToShow - 1) * 16}px) / ${itemsToShow})`,
                    minWidth: `calc((100% - ${(itemsToShow - 1) * 16}px) / ${itemsToShow})`
                  }}
                >
                  <ProductCard
                    product={{
                      ...productCard,
                      subtitle: productCard.subtitle ?? '',
                      description: productCard.description ?? '',
                      rating: productCard.rating ?? 0,
                      reviewCount: productCard.reviewCount ?? 0,
                      sizes: productCard.sizes ?? [],
                      features: productCard.features ?? [],
                      activities: productCard.activities ?? [],
                      collection: productCard.collection ?? ''

                    }}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleQuickView}
                    isWishlisted={isWishlisted(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    isCompared={comparedIds.has(product.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots Indicator */}
        {products.length > itemsToShow && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${currentIndex === idx
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
                  }`}
                aria-label={`Go to position ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

