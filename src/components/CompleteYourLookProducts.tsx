"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { BaseProduct } from "@/types/product";

interface Product extends BaseProduct {
  category?: string;
}

interface CompleteYourLookProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function CompleteYourLookProducts({ products, onProductClick }: CompleteYourLookProductsProps) {
  const { addToCart } = useCart();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3 mt-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 p-4 border border-border rounded-lg bg-background hover:border-primary/50 transition-all group"
        >
          {/* Product Image - Clickable */}
          <div 
            onClick={() => onProductClick(product)}
            className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden cursor-pointer"
          >
            {product.images?.main ? (
              <Image
                src={product.images.main}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Plus className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Product Info - Clickable */}
          <div 
            onClick={() => onProductClick(product)}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <h4 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h4>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {product.description}
            </p>
            <p className="text-base font-bold text-primary">
              ${product.price.toFixed(2)} {product.currency}
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Ensure rating format matches CartContext expectations
              const cartProduct = {
                ...product,
                rating: product.rating
                  ? {
                      average: typeof product.rating.average === 'number'
                        ? product.rating.average.toString()
                        : product.rating.average,
                      count: product.rating.count,
                    }
                  : undefined,
              };
              addToCart(cartProduct);
            }}
            className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0 shadow-sm hover:shadow-md cursor-pointer"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}

