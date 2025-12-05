import fs from 'fs';
import path from 'path';

export interface Product {
  id: string;
  name: string;
  description: string;
  category?: string;
  gender?: string;
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

export interface ProductData {
  metadata: {
    source: string;
    extractedAt: string;
    totalProducts: number;
  };
  products: Product[];
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface FAQData {
  metadata: {
    source: string;
    extractedAt: string;
    totalFAQs: number;
    categories: string[];
  };
  faqs: FAQ[];
}

// Cache for loaded data
let mensProductData: ProductData | null = null;
let womensProductData: ProductData | null = null;
let faqData: FAQData | null = null;

export function loadProductData(): { mens: ProductData | null; womens: ProductData | null } {
  if (mensProductData && womensProductData) {
    return { mens: mensProductData, womens: womensProductData };
  }

  try {
    const mensFilePath = path.join(process.cwd(), 'src', 'data', 'mens-products.json');
    const mensFileContents = fs.readFileSync(mensFilePath, 'utf8');
    mensProductData = JSON.parse(mensFileContents) as ProductData;
  } catch (error) {
    console.error('Error loading men\'s product data:', error);
  }

  try {
    const womensFilePath = path.join(process.cwd(), 'src', 'data', 'womens-products.json');
    const womensFileContents = fs.readFileSync(womensFilePath, 'utf8');
    womensProductData = JSON.parse(womensFileContents) as ProductData;
  } catch (error) {
    console.error('Error loading women\'s product data:', error);
  }

  return { mens: mensProductData, womens: womensProductData };
}

export function loadFAQData(): FAQData | null {
  if (faqData) {
    return faqData;
  }

  try {
    const faqFilePath = path.join(process.cwd(), 'src', 'data', 'faq.json');
    const faqFileContents = fs.readFileSync(faqFilePath, 'utf8');
    faqData = JSON.parse(faqFileContents) as FAQData;
  } catch (error) {
    console.error('Error loading FAQ data:', error);
  }

  return faqData;
}

export function getProductDataByGender(genderPreference: 'men' | 'women' | 'all' | null): Product[] {
  const { mens, womens } = loadProductData();
  
  if (genderPreference === 'all') {
    const mensProducts = mens?.products || [];
    const womensProducts = womens?.products || [];
    return [...mensProducts, ...womensProducts];
  } else if (genderPreference === 'women') {
    return womens?.products || [];
  } else if (genderPreference === 'men') {
    return mens?.products || [];
  }
  
  return [];
}

