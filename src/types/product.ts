/**
 * Shared product type definitions used across the application
 */

export interface ProductImageSet {
  main?: string;
  hover?: string;
  colors?: Record<string, string>;
}

export interface ProductRating {
  average?: string | null | number;
  count?: number;
}

/**
 * Base product interface used in components and transformations
 */
export interface BaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images?: ProductImageSet;
  url?: string;
  rating?: ProductRating;
  colors?: string[];
  badges?: string[];
  category?: string;
  gender?: string;
  isNew?: boolean;
  isPro?: boolean;
}
