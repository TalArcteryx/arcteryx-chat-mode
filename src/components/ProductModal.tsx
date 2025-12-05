"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { BaseProduct } from "@/types/product";

type Product = BaseProduct;

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get hex code from color name
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    gray: '#6b7280',
    grey: '#6b7280',
    navy: '#1e3a8a',
    brown: '#92400e',
    tan: '#d97706',
    orange: '#f97316',
    yellow: '#eab308',
    pink: '#ec4899',
    purple: '#a855f7',
    olive: '#84cc16',
    moss: '#65a30d',
    orca: '#1f2937',
    blaze: '#f97316',
    copper: '#b45309',
    sky: '#0ea5e9',
    solitude: '#e5e7eb',
    arctic: '#f3f4f6',
    silk: '#fafafa',
    nightscape: '#111827',
    glacial: '#e0e7ff',
    aster: '#a855f7',
    mars: '#dc2626',
    dynasty: '#fbbf24',
    euphoria: '#f0abfc',
    bliss: '#fce7f3',
  };

  const lowerColor = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(colorMap)) {
    if (lowerColor.includes(key)) {
      return hex;
    }
  }
  return '#d1d5db';
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    delivery: false,
    instore: false,
    details: false,
  });

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    // Convert ProductRating to CartContext expected format
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
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get the image to display based on selected color
  const getDisplayImage = () => {
    if (selectedColor && product.images?.colors?.[selectedColor]) {
      return product.images.colors[selectedColor];
    }
    return product.images?.main || '';
  };

  const displayImage = getDisplayImage();

  // Optimize imgix URLs for maximum quality
  let optimizedImage = displayImage;
  if (displayImage && displayImage.includes('imgix.net')) {
    try {
      const url = new URL(displayImage);
      url.searchParams.delete('w');
      url.searchParams.delete('h');
      url.searchParams.delete('width');
      url.searchParams.delete('height');
      url.searchParams.delete('dpr');
      url.searchParams.set('q', '92');
      url.searchParams.set('auto', 'format');
      if (!url.searchParams.has('fit')) {
        url.searchParams.set('fit', 'crop');
      }
      url.searchParams.set('sharp', '1');
      optimizedImage = url.toString();
    } catch {
      // If URL parsing fails, use original image
    }
  }

  // Calculate rating
  const rating = product.rating?.average
    ? (typeof product.rating.average === 'string' ? parseFloat(product.rating.average) : product.rating.average)
    : 0;
  const reviewCount = product.rating?.count || 0;

  // Calculate Klarna payment
  const klarnaPayment = (product.price / 4).toFixed(2);

  // Get selected color name
  const selectedColorName = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-gray-900" />
        </button>

        {/* Left Section - Product Image */}
        <div className="relative w-full md:w-1/2 bg-gray-50 flex items-center justify-center min-h-[400px] md:min-h-[600px]">
          {displayImage ? (
            displayImage.includes('imgix.net') || displayImage.includes('arcteryx.com') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={optimizedImage}
                alt={product.name}
                className="w-full h-full object-contain"
                loading="eager"
              />
            ) : (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={100}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
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
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Product Info */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
          {/* Product Name */}
          <h1
            className="uppercase text-left text-black mb-0"
            style={{
              fontFamily: 'var(--font-elan), "elan-itc-pro", sans-serif',
              fontSize: '1.625rem',
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            {product.name}
          </h1>

          {/* Badges */}
          {product.badges && product.badges.length > 0 && (
            <div className="flex items-center gap-2 mt-2 mb-4">
              <span className="w-px h-4 bg-gray-900"></span>
              {product.badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="text-sm text-gray-900 font-normal"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          {rating > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1;
                  const isFull = starValue <= Math.floor(rating);
                  const isHalf = !isFull && starValue - 0.5 <= rating;

                  return (
                    <span
                      key={i}
                      className={`text-sm ${isFull
                        ? 'text-yellow-400'
                        : isHalf
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                        }`}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
              {reviewCount > 0 && (
                <span className="text-sm text-gray-600">
                  ({reviewCount}) <span className="underline cursor-pointer hover:text-gray-900">Leave a review</span>
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-gray-700 mb-6 leading-relaxed">
            {product.description}
          </p>

          {/* Price */}
          <div className="mb-4">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* Klarna Payment Plan */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              4 payments of ${klarnaPayment} with Klarna{' '}
              <span className="underline cursor-pointer hover:text-gray-900">Learn more</span>
            </p>
          </div>

          {/* Colour Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-900">Colour: </span>
                <span className="text-sm text-gray-700">{selectedColorName}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color, idx) => {
                  const isSelected = selectedColor === color || (!selectedColor && idx === 0);
                  const colorHex = getColorHex(color);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className="relative"
                    >
                      <div
                        className={`w-12 h-12 border-2 transition-all ${isSelected
                          ? 'border-gray-900'
                          : 'border-gray-300 hover:border-gray-500'
                          }`}
                        style={{ backgroundColor: colorHex }}
                        title={color}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mb-6">
            {product.url && (
              <a
                href={`https://arcteryx.com${product.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-black text-white py-4 px-6 font-semibold text-center hover:bg-gray-900 transition-colors"
              >
                View on Arc&apos;teryx
              </a>
            )}
            <button
              onClick={handleAddToCart}
              className="w-full bg-gray-900 text-white py-4 px-6 font-semibold hover:bg-gray-800 transition-colors"
            >
              Add to cart
            </button>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-0 border-t border-gray-200 pt-4">
            {/* Delivery */}
            <button
              onClick={() => toggleSection('delivery')}
              className="w-full flex items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Delivery</span>
              {expandedSections.delivery ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {expandedSections.delivery && (
              <div className="py-4 border-b border-gray-200">
                <p className="text-sm text-gray-700">Free shipping & Free returns</p>
              </div>
            )}

            {/* In-store availability */}
            <button
              onClick={() => toggleSection('instore')}
              className="w-full flex items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">In-store availability</span>
              {expandedSections.instore ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {expandedSections.instore && (
              <div className="py-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Arc&apos;teryx Robson</span>
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    In stock
                  </span>
                </div>
                <a href="#" className="text-sm text-gray-600 underline hover:text-gray-900">
                  Pickup information
                </a>
              </div>
            )}

            {/* Product details */}
            <button
              onClick={() => toggleSection('details')}
              className="w-full flex items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Product details</span>
              {expandedSections.details ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {expandedSections.details && (
              <div className="py-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
