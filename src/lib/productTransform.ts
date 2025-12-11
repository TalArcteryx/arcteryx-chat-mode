import { Product, ProductColor } from "@/types/productCard";

/**
 * Helper function to get hex code from color name
 * Used for generating color swatches in product displays
 */
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
    };

    const lowerColor = colorName.toLowerCase();
    for (const [key, hex] of Object.entries(colorMap)) {
        if (lowerColor.includes(key)) {
            return hex;
        }
    }
    return '#d1d5db';
}

/**
 * Transforms a simplified product object to the ProductCard format
 * Handles both old format (nested rating) and new format (direct rating/reviewCount)
 * 
 * @param product - The simplified product object to transform
 * @returns A Product object compatible with ProductCard component
 */
type SimpleProduct = {
    id?: string;
    name?: string;
    description?: string;
    shortDescription?: string;
    subtitle?: string;
    price?: number;
    currency?: string;
    category?: string;
    gender?: string;
    url?: string;
    // Old format: nested rating object
    rating?: {
        average?: number | string | null;
        count?: number;
    } | number; // New format: direct number
    reviewCount?: number; // New format: direct property
    isNew?: boolean;
    isPro?: boolean;
    badges?: string[];
    // Old format: array of color strings
    colors?: string[] | Array<{ name: string; hex: string; imageUrl?: string }>;
    images?: {
        main?: string;
        hover?: string;
        colors?: Record<string, string>;
    };
    image?: string; // New format: direct image property
    sizes?: string[];
    features?: string[];
    activities?: string[];
    collection?: string;
};

export function transformToProductCard(product: SimpleProduct): Product {
    // Build badges array
    const badges: string[] = [];
    if (product.isNew) badges.push('NEW');
    if (product.isPro) badges.push('PRO EXCLUSIVE');
    if (product.badges) {
        badges.push(...product.badges);
    }

    // Build colors array - handle both string array and object array
    let colors: ProductColor[] = [];

    if (product.colors && product.colors.length > 0) {
        // Check if colors is array of objects (new format)
        if (typeof product.colors[0] === 'object' && 'name' in product.colors[0]) {
            colors = (product.colors as Array<{ name: string; hex: string; imageUrl?: string }>).map(color => ({
                name: color.name,
                hex: color.hex,
                imageUrl: color.imageUrl,
            }));
        } else {
            // Old format: array of color strings
            colors = (product.colors as string[]).map((colorName: string) => ({
                name: colorName,
                hex: getColorHex(colorName),
                imageUrl: product.images?.colors?.[colorName] || product.images?.main,
            }));
        }
    }

    // If no colors, add a default one
    if (colors.length === 0) {
        colors.push({
            name: 'default',
            hex: '#000000',
            imageUrl: product.image || product.images?.main,
        });
    }

    // Calculate rating - handle both old (nested) and new (direct) formats
    let rating: number | undefined = undefined;
    let reviewCount: number | undefined = undefined;

    if (typeof product.rating === 'number') {
        // New format: direct number
        rating = product.rating;
        reviewCount = product.reviewCount;
    } else if (product.rating && typeof product.rating === 'object') {
        // Old format: nested rating object
        if (product.rating.average) {
            if (typeof product.rating.average === 'string') {
                rating = parseFloat(product.rating.average);
            } else {
                rating = product.rating.average;
            }
        }
        reviewCount = product.rating.count;
    }

    // Get image - prefer direct image property, fallback to images.main
    const image = product.image || product.images?.main || '';

    return {
        id: product.id || '',
        name: product.name || '',
        subtitle: product.subtitle,
        description: product.description || product.shortDescription,
        price: product.price || 0,
        rating: rating, // Can be undefined if not provided
        reviewCount: reviewCount, // Can be undefined if not provided
        badges: badges,
        category: product.category || '',
        image: image,
        colors: colors,
        sizes: product.sizes,
        features: product.features,
        activities: product.activities,
        collection: product.collection,
    };
}

