import { BaseDocument } from './base';

// Products Collection
export interface Product extends BaseDocument {
  sku: string;
  name: string;
  category: 'jackets' | 'pants' | 'shirts' | 'footwear' | 'accessories' | 'packs' | 'equipment';
  subcategory: string; // e.g., 'hard_shell', 'soft_shell', 'insulated', 'base_layer'
  gender: 'men' | 'women' | 'unisex';
  
  description: string;
  shortDescription: string;
  features: string[];
  specifications: {
    materials: string[];
    weight?: string;
    fit?: 'regular' | 'slim' | 'relaxed';
    careInstructions: string[];
    sustainability?: {
      recycledContent?: number;
      bluesign?: boolean;
      fairTrade?: boolean;
    };
  };
  
  pricing: {
    current: number;
    original?: number;
    currency: string;
    onSale: boolean;
    saleEndDate?: Date;
  };
  
  inventory: {
    totalStock: number;
    availableStock: number;
    lowStockThreshold: number;
    backorderAvailable: boolean;
  };
  
  variants: ProductVariant[];
  images: string[];
  videos?: string[];
  
  tags: string[];
  collections?: string[]; // e.g., 'Veilance', 'System A'
  
  ratings: {
    average: number;
    count: number;
  };
  
  relatedProducts: string[]; // Product IDs
  frequentlyBoughtTogether: string[];
  
  isActive: boolean;
  isFeatured: boolean;
  launchDate?: Date;
  discontinuedDate?: Date;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  colorCode: string;
  sizes: SizeAvailability[];
  images: string[];
  isAvailable: boolean;
}

export interface SizeAvailability {
  size: string;
  available: boolean;
  stock: number;
}

// Orders Collection
export interface Order extends BaseDocument {
  orderNumber: string;
  userId: string;
  
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial_refund';
  
  items: OrderItem[];
  
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
  };
  
  shipping: {
    method: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
  };
  
  billing: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    paymentMethod: string;
  };
  
  notes?: string;
  cancelledAt?: Date;
  cancelledReason?: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  total: number;
}

// Cart Collection
export interface Cart extends BaseDocument {
  userId: string;
  sessionId?: string; // For guest carts
  
  items: CartItem[];
  
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  
  couponCode?: string;
  expiresAt?: Date;
  abandonedAt?: Date;
}

export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

// Recommendations Collection
export interface Recommendation extends BaseDocument {
  userId: string;
  type: 'product' | 'outfit' | 'activity' | 'size';
  
  context: {
    activity?: string; // e.g., 'skiing', 'climbing', 'hiking'
    weather?: string;
    season?: string;
    budget?: {
      min: number;
      max: number;
    };
    preferences?: string[];
  };
  
  products: string[]; // Product IDs
  confidence: number; // 0-1
  reasoning: string;
  
  viewed: boolean;
  clicked: boolean;
  purchased: boolean;
}

// Reviews Collection
export interface Review extends BaseDocument {
  productId: string;
  userId: string;
  orderId?: string; // Verified purchase
  
  rating: number; // 1-5
  title: string;
  content: string;
  
  activity: string; // What they used it for
  conditions: string; // Weather/conditions tested in
  size: string;
  fit: 'too_small' | 'perfect' | 'too_large';
  
  pros: string[];
  cons: string[];
  
  images?: string[];
  videos?: string[];
  
  helpful: number;
  verifiedPurchase: boolean;
  
  isApproved: boolean;
  isFeatured: boolean;
}

// Wishlist Collection
export interface Wishlist extends BaseDocument {
  userId: string;
  name: string;
  isPublic: boolean;
  
  items: WishlistItem[];
  
  sharedWith?: string[]; // User IDs
}

export interface WishlistItem {
  productId: string;
  variantId: string;
  addedAt: Date;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

