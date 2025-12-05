"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

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

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  
  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addToCart(product);
    onClose(); // Close modal after adding to cart
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Product Image */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {product.images?.main ? (
              <Image
                src={product.images.main}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <svg
                    className="w-24 h-24 mx-auto mb-4"
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
                  <p className="text-sm">Product Image</p>
                  <p className="text-xs text-muted-foreground mt-1">Placeholder</p>
                </div>
              </div>
            )}
            
            {/* Badges */}
            {product.badges && product.badges.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            
            {/* Rating */}
            {product.rating?.average && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  <span className="text-lg">⭐</span>
                  <span className="font-semibold ml-1">{product.rating.average}</span>
                </div>
                {product.rating.count && (
                  <span className="text-sm text-muted-foreground">
                    ({product.rating.count} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-bold">
                ${product.price.toFixed(2)} {product.currency}
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Available Colors</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-12 h-12 rounded-full border-2 border-border cursor-pointer hover:scale-110 transition-transform"
                        title={color}
                        style={{
                          backgroundColor: 
                            color.toLowerCase().includes('black') ? '#000' :
                            color.toLowerCase().includes('white') ? '#fff' :
                            color.toLowerCase().includes('blue') ? '#3b82f6' :
                            color.toLowerCase().includes('red') ? '#ef4444' :
                            color.toLowerCase().includes('green') ? '#10b981' :
                            color.toLowerCase().includes('gray') || color.toLowerCase().includes('grey') ? '#6b7280' :
                            color.toLowerCase().includes('navy') ? '#1e3a8a' :
                            color.toLowerCase().includes('brown') ? '#92400e' :
                            color.toLowerCase().includes('tan') ? '#d97706' :
                            '#d1d5db'
                        }}
                      />
                      <span className="text-xs text-center max-w-[60px]">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto pt-6">
              {product.url && (
                <a
                  href={`https://arcteryx.com${product.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold text-center hover:bg-primary/90 transition-colors"
                >
                  View on Arc&apos;teryx
                </a>
              )}
              <button
                onClick={handleAddToCart}
                className="w-full bg-background border-2 border-primary text-primary py-3 px-6 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

