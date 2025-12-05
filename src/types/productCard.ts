export interface ProductColor {
    name: string;
    hex: string;
    imageUrl?: string;
}

export interface Product {
    id: string;
    name: string;
    subtitle?: string;
    description?: string;
    price: number;
    rating?: number;
    reviewCount?: number;
    badges: string[];
    category: string;
    image: string;
    colors: ProductColor[];
    sizes?: string[];
    features?: string[];
    activities?: string[];
    collection?: string;
}

