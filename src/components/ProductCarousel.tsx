"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

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
}

interface ProductCarouselProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductCarousel({ products, onProductClick }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsToShow = 3; // Number of products visible at once
  const maxIndex = Math.max(0, products.length - itemsToShow);

  // Debug logging
  useEffect(() => {
    console.log('🎠 ProductCarousel rendered with products:', products.length);
    if (products.length > 0) {
      console.log('Product names:', products.map(p => p.name));
    } else {
      console.log('⚠️ ProductCarousel: No products provided');
    }
  }, [products]);

  if (!products || products.length === 0) {
    console.log('⚠️ ProductCarousel: Returning null - no products');
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
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="flex-shrink-0 cursor-pointer group"
              style={{
                width: `calc((100% - ${(itemsToShow - 1) * 16}px) / ${itemsToShow})`,
                minWidth: `calc((100% - ${(itemsToShow - 1) * 16}px) / ${itemsToShow})`
              }}
            >
              <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {product.images?.main ? (
                    <Image
                      src={product.images.main}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Badges */}
                  {product.badges && product.badges.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1 truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2 min-h-[2.5rem]">
                    {product.description}
                  </p>
                  
                  {/* Rating */}
                  {product.rating?.average && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-muted-foreground">
                        ⭐ {product.rating.average}
                      </span>
                      {product.rating.count && (
                        <span className="text-xs text-muted-foreground">
                          ({product.rating.count})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">
                      ${product.price.toFixed(2)} {product.currency}
                    </span>
                  </div>

                  {/* Colors */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Colors:</span>
                      <div className="flex gap-1">
                        {product.colors.slice(0, 4).map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-border"
                            title={color}
                            style={{
                              backgroundColor: color.toLowerCase().includes('black') ? '#000' :
                                              color.toLowerCase().includes('white') ? '#fff' :
                                              color.toLowerCase().includes('blue') ? '#3b82f6' :
                                              color.toLowerCase().includes('red') ? '#ef4444' :
                                              color.toLowerCase().includes('green') ? '#10b981' :
                                              '#d1d5db'
                            }}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{product.colors.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Dots Indicator */}
        {products.length > itemsToShow && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx
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

