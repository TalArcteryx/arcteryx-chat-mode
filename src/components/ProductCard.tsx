import React from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';


export interface ColorVariant {
    name: string;
    hex: string;
    imageUrl?: string; // Optional override for specific color image
}

export interface Product {
    id: string;
    name: string;
    subtitle: string; // e.g., "Sabre SV Jacket Men's" vs "Men's Shell"
    description: string;
    price: number;
    rating: number;
    reviewCount: number;
    badges: string[]; // "New Colour", "Exclusive", "Best Seller"
    category: string; // "Shell", "Insulated", "Pants", etc.
    image: string;
    colors: ColorVariant[];
    sizes: string[]; // Available sizes e.g. ["S", "M", "L"]
    features: string[];
    activities: string[]; // e.g. ["Hiking", "Skiing"]
    collection: string; // e.g. "Beta Series", "Atom Series"
}

export interface CartItem extends Product {
    selectedColor: string;
    selectedSize: string;
    quantity: number;
}

export interface AISearchResult {
    productIds: string[];
    reasoning: string;
}

export interface TripItem {
    itemName: string;
    description: string;
    isEssential: boolean;
    matchedProductId?: string; // ID of a product we sell
}

export interface TripCategory {
    categoryName: string;
    items: TripItem[];
}

export interface TripPlan {
    destination: string;
    advice: string;
    categories: TripCategory[];
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product, color: string) => void;
    onQuickView: (product: Product) => void;
    isWishlisted: boolean;
    onToggleWishlist: (id: string) => void;
    isCompared?: boolean;
    onToggleCompare?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onQuickView,
    isWishlisted,
    onToggleWishlist,
}) => {
    const [selectedColor, setSelectedColor] = React.useState(product.colors[0]);
    const [isHovered, setIsHovered] = React.useState(false);

    // Determine which image to show: specific color image or default product image
    let displayImage = selectedColor.imageUrl || product.image;

    // Optimize imgix URLs for maximum quality and clarity
    if (displayImage && displayImage.includes('imgix.net')) {
        try {
            const url = new URL(displayImage);

            // Remove ALL size restrictions to get full resolution
            url.searchParams.delete('w');
            url.searchParams.delete('h');
            url.searchParams.delete('width');
            url.searchParams.delete('height');
            url.searchParams.delete('dpr');

            // Remove any existing quality params
            url.searchParams.delete('q');
            url.searchParams.delete('quality');
            url.searchParams.delete('compress');

            // Set high quality
            url.searchParams.set('q', '92');

            // Use format only, no compression
            url.searchParams.set('auto', 'format');

            // Set fit mode
            if (!url.searchParams.has('fit')) {
                url.searchParams.set('fit', 'crop');
            }

            // Add sharpening
            url.searchParams.set('sharp', '1');

            displayImage = url.toString();
        } catch {
            // If URL parsing fails, use original image
        }
    }

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart(product, selectedColor.name);
    };
    return (
        <div
            className="group flex flex-col h-full cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onQuickView(product)}
        >
            {/* Image Area */}
            <div className="relative aspect-square bg-muted dark:bg-muted/50 overflow-hidden mb-4" style={{ isolation: 'isolate' }}>

                {/* Wishlist Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                    }}
                    className="absolute top-4 right-4 z-20 p-2 bg-card/90 dark:bg-card/90 backdrop-blur-sm rounded-full hover:bg-card dark:hover:bg-card transition-colors shadow-sm"
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-foreground text-foreground' : 'text-foreground/70'}`} />
                </button>

                {/* Main Image */}
                {displayImage.includes('imgix.net') || displayImage.includes('arcteryx.com') ? (
                    // Use regular img for imgix/arcteryx (already optimized, Next.js re-optimization causes blur)
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={displayImage}
                        src={displayImage}
                        alt={`${product.name} - ${selectedColor.name}`}
                        className="w-full h-full object-cover"
                        style={{
                            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 0.3s ease-out',
                        }}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    // Use Next.js Image for other images
                    <Image
                        key={displayImage}
                        src={displayImage}
                        alt={`${product.name} - ${selectedColor.name}`}
                        fill
                        quality={100}
                        priority={false}
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
                        style={{
                            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 0.3s ease-out',
                        }}
                    />
                )}

                {/* Badges at bottom of image - always visible */}
                {product.badges && product.badges.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-2 z-10">
                        {product.badges.map((badge) => (
                            <span
                                key={badge}
                                className="bg-card dark:bg-card border border-border dark:border-border text-foreground dark:text-foreground whitespace-nowrap cursor-pointer text-sm uppercase"
                                style={{
                                    borderRadius: '3px',
                                    padding: '0.25rem 0.625rem',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                )}

                {/* Add to Cart Overlay Button - appears on hover, positioned above badges */}
                <div className={`absolute left-4 right-4 transition-all duration-300 transform z-20 ${isHovered ? 'opacity-100 translate-y-0 bottom-16' : 'opacity-0 translate-y-4 bottom-4 pointer-events-none'}`}>
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-card dark:bg-card text-foreground dark:text-foreground py-3 text-xs font-bold uppercase tracking-widest hover:bg-muted dark:hover:bg-muted transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        Add to Cart - ${product.price.toLocaleString()}
                    </button>
                </div>
            </div>

            {/* Color Thumbnails */}
            {product.colors && product.colors.length > 0 && (
                <div className="flex gap-2 mb-4 px-4">
                    {product.colors.slice(0, 4).map((color) => {
                        const isSelected = selectedColor.name === color.name;
                        const colorImage = color.imageUrl || product.image;
                        return (
                            <button
                                key={color.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedColor(color);
                                }}
                                className={`relative w-16 h-16 rounded border overflow-hidden transition-all ${isSelected
                                    ? 'border-foreground dark:border-foreground'
                                    : 'border-border dark:border-border hover:border-foreground/50 dark:hover:border-foreground/50'
                                    }`}
                                title={color.name}
                                aria-label={`Select ${color.name} color`}
                            >
                                {colorImage.includes('imgix.net') || colorImage.includes('arcteryx.com') ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={colorImage}
                                        alt={color.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <Image
                                        src={colorImage}
                                        alt={color.name}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                )}
                            </button>
                        );
                    })}
                    {product.colors.length > 4 && (
                        <div className="w-16 h-16 flex items-center justify-center text-xs text-muted-foreground border border-border rounded">
                            +{product.colors.length - 4}
                        </div>
                    )}
                </div>
            )}

            {/* Content Area */}
            <div className="flex flex-col flex-grow p-4 space-y-2">
                {/* Product Name - Bold and larger */}
                <h3 className="font-bold text-base text-foreground leading-tight">
                    {product.name}
                </h3>

                {/* Star Rating with review count */}
                {product.rating > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const starValue = i + 1;
                                const isFull = starValue <= Math.floor(product.rating);
                                const isHalf = !isFull && starValue - 0.5 <= product.rating;

                                return (
                                    <span
                                        key={i}
                                        className={`text-sm ${isFull
                                            ? 'text-red-500 dark:text-red-400'
                                            : isHalf
                                                ? 'text-red-500 dark:text-red-400'
                                                : 'text-muted-foreground'
                                            }`}
                                    >
                                        ★
                                    </span>
                                );
                            })}
                        </div>
                        {product.reviewCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                                ({product.reviewCount}) <span className="underline cursor-pointer hover:text-foreground">Leave a review</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <p className="text-sm text-muted-foreground leading-snug">
                        {product.description}
                    </p>
                )}

                {/* Price */}
                <div className="pt-1">
                    <span className="font-bold text-lg text-foreground">
                        ${product.price.toFixed(2)}
                    </span>
                </div>

            </div>
        </div>
    );
};